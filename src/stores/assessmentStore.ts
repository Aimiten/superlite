// src/stores/assessmentStore.ts
import { create } from 'zustand';
import { assessmentService } from '@/utils/assessmentService';
import { valuationService } from '@/utils/valuationService';
import { DocumentWithContent, Question, AnalysisResults } from '@/components/assessment/types';
import { supabase } from "@/integrations/supabase/client";

export type AssessmentStep = 'initial-selection' | 'processing' | 'questions' | 'results';
export type ProcessingStage = 'company-info' | 'questions' | 'analysis';
export type AssessmentStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AssessmentSession {
  id: string;
  user_id: string;
  company_id: string | null;
  company_name: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'processing' | 'completed';
  current_step: AssessmentStep;
  current_question_index?: number;
  processing_stage?: ProcessingStage;
  processing_progress?: number;
  answers?: Record<string, any>;
  results?: any;
  company_info?: string;
  structured_company_data?: any;
  readiness_for_sale_data?: any;
  questions?: Question[];
  last_activity: string;
  documents_metadata?: Array<{id: string, name: string, document_type?: string}> | null;
}

interface AssessmentState {
  // Session state
  sessionStatus: AssessmentStatus;
  sessionError: string | null;
  session: AssessmentSession | null;

  // Document state
  documentsStatus: AssessmentStatus;
  documentsError: string | null;
  documents: DocumentWithContent[];

  // Valuation ID reference
  valuationId: string | null;

  // Questions state
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, any>;

  // Results state
  results: AnalysisResults | null;

  // Global loading indicator
  isLoading: boolean;

  // Actions
  fetchOrCreateSession: (companyId: string, companyName?: string) => Promise<string | null>;
  uploadDocuments: (files: FileList, companyId: string) => Promise<void>;
  getDocumentsFromValuation: (valuationId: string) => Promise<boolean>;
  removeDocument: (documentId: string) => void;
  setDocuments: (documents: DocumentWithContent[]) => void;
  startAssessment: () => Promise<void>;
  saveAnswer: (questionId: string, value: any, questionType: string) => Promise<void>;
  updateQuestionIndex: (index: number) => void;
  updateStep: (step: AssessmentStep) => Promise<void>;
  updateProcessingStage: (stage: ProcessingStage, progress?: number) => Promise<void>;
  analyzeAnswers: () => Promise<void>;
  fetchValuationData: (valuationId: string) => Promise<any>;
  resetAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  // Initial state
  sessionStatus: 'idle',
  sessionError: null,
  session: null,

  documentsStatus: 'idle',
  documentsError: null,
  documents: [],

  valuationId: null, // Added valuationId

  questions: [],
  currentQuestionIndex: 0,
  answers: {},

  results: null,

  isLoading: false,

  // Actions
  fetchOrCreateSession: async (companyId, companyName) => {
    set({ sessionStatus: 'loading', sessionError: null, isLoading: true });
    try {
      const sessionId = await assessmentService.fetchOrCreateSession(companyId, companyName);
      const session = await assessmentService.getSession(sessionId);

      // Pre-load documents if they exist in session
      if (session?.documents_metadata && session.documents_metadata.length > 0) {
        set({ documentsStatus: 'loading' });
        try {
          const docs = await Promise.all(
            session.documents_metadata.map(doc => 
              assessmentService.getDocumentContent(doc.id)
            )
          );
          set({ 
            documents: docs.filter(Boolean) as DocumentWithContent[],
            documentsStatus: 'success'
          });
        } catch (error) {
          set({ 
            documentsError: error.message, 
            documentsStatus: 'error' 
          });
        }
      }

      // KORJAUS: Parannettu kysymysten lataus sessiosta
      if (session?.questions && Array.isArray(session.questions) && session.questions.length > 0) {
        console.log(`[fetchOrCreateSession] Ladataan ${session.questions.length} kysymystä sessiosta storeen`, 
          session.questions[0]?.id ? `(ensimmäinen ID: ${session.questions[0].id})` : '');

        set({ 
          questions: session.questions,
          currentQuestionIndex: session.current_question_index || 0,
          answers: session.answers || {}
        });
      } else {
        // Jos sessiossa on 'questions' mutta se ei ole oikeassa muodossa
        if (session?.questions) {
          console.warn('[fetchOrCreateSession] Sessiossa on questions-kenttä, mutta sen rakenne ei ole oikea:', 
            typeof session.questions, Array.isArray(session.questions) ? 'array' : 'not array');

          // Yritetään korjata kysymysten rakenne, jos se on merkkijono (JSON-stringinä)
          if (typeof session.questions === 'string') {
            try {
              const parsedQuestions = JSON.parse(session.questions);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log(`[fetchOrCreateSession] Kysymykset parsettu merkkijonosta: ${parsedQuestions.length} kpl`);
                set({ 
                  questions: parsedQuestions,
                  currentQuestionIndex: session.current_question_index || 0,
                  answers: session.answers || {}
                });
              }
            } catch (parseError) {
              console.error('[fetchOrCreateSession] Kysymysten parsinta epäonnistui:', parseError);
            }
          }
        } else {
          console.log('[fetchOrCreateSession] Sessiossa ei ole questions-kenttää');
        }
      }

      // Pre-load results if they exist
      if (session?.results) {
        set({ results: session.results });
      }

      set({ 
        session, 
        sessionStatus: 'success',
        isLoading: false
      });

      return sessionId;
    } catch (error) {
      set({ 
        sessionError: error.message, 
        sessionStatus: 'error',
        isLoading: false
      });
      return null;
    }
  },

  uploadDocuments: async (files, companyId) => {
    set({ documentsStatus: 'loading', documentsError: null, isLoading: true });
    try {
      const result = await assessmentService.uploadDocuments(files, companyId);
      set(state => ({ 
        documents: [...state.documents, ...result.documents],
        documentsStatus: 'success',
        isLoading: false
      }));
    } catch (error) {
      set({ 
        documentsError: error.message, 
        documentsStatus: 'error',
        isLoading: false
      });
    }
  },

  getDocumentsFromValuation: async (valuationId: string) => {
    if (!valuationId) return false;

    set({ documentsStatus: 'loading', documentsError: null, isLoading: true });
    try {
      console.log(`Haetaan dokumentteja valuationId:llä: ${valuationId}`);

      // Käytetään service-tason metodia dokumenttien hakuun
      const result = await assessmentService.getValuationDocuments(valuationId);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.documents && result.documents.length > 0) {
        console.log(`Saatiin ${result.documents.length} dokumenttia arvonmäärityksestä`);
        set({ 
          documents: result.documents,
          documentsStatus: 'success',
          isLoading: false
        });

        return true;
      } else {
        console.log("Dokumentteja ei löytynyt arvonmäärityksestä");
        set({ 
          documentsStatus: 'success',
          isLoading: false
        });

        return false;
      }
    } catch (error) {
      console.error("Virhe dokumenttien haussa:", error);
      set({ 
        documentsError: error.message, 
        documentsStatus: 'error',
        isLoading: false
      });

      return false;
    }
  },

  removeDocument: (documentId) => {
    set(state => ({
      documents: state.documents.filter(doc => doc.id !== documentId)
    }));

    // Also update in session if needed
    const session = get().session;
    if (session?.documents_metadata) {
      const updatedMetadata = session.documents_metadata.filter(doc => doc.id !== documentId);
      assessmentService.updateSession(session.id, {
        documents_metadata: updatedMetadata
      });
    }
  },

  setDocuments: (documents) => {
    set({ documents });

    // Also update in session if needed
    const session = get().session;
    if (session) {
      const documentsMetadata = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        document_type: doc.document_type || doc.file_type
      }));

      assessmentService.updateSession(session.id, {
        documents_metadata: documentsMetadata
      });
    }
  },

  startAssessment: async () => {
    set({ isLoading: true });

    const { session, documents } = get();
    if (!session || !session.company_id) {
      set({
        sessionError: "No active session or company",
        isLoading: false
      });
      return;
    }

    if (documents.length === 0) {
      set({
        documentsError: "No documents selected",
        isLoading: false
      });
      return;
    }

    // Määritellään polling intervalli muuttujaksi, jotta se voidaan tyhjentää myöhemmin
    let progressPollId: number | undefined;

    try {
      // Varmistetaan käyttäjätiedot RLS:ää varten - KORJATTU
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update session step
      await assessmentService.updateSession(session.id, { 
        current_step: 'processing',
        processing_stage: 'company-info',
        processing_progress: 5
      });

      set(state => ({
        session: state.session ? {
          ...state.session,
          current_step: 'processing',
          processing_stage: 'company-info',
          processing_progress: 5
        } : null
      }));

      // KORJAUS: Lisätään polling-mekanismi, joka simuloi edistymistä
      let progress = 5;
      progressPollId = window.setInterval(async () => {
        // Kasvata edistymistä vähitellen, kunnes saavutetaan 95%
        // Todellinen lopputulos tulee erikseen kun prosessointi valmistuu
        if (progress < 95) {
          // Satunnainen lisäys 2-6% välillä
          const increment = Math.floor(Math.random() * 5) + 2;
          progress = Math.min(95, progress + increment);

          // Päivitetään session edistyminen
          await assessmentService.updateSession(session.id, { 
            processing_progress: progress 
          });

          // Päivitetään store
          set(state => ({
            session: state.session ? {
              ...state.session,
              processing_progress: progress
            } : null
          }));
        }
      }, 2000); // 2 sekunnin välein

      // Fetch valuation data if valuationId is available
      let valuationData = null;
      if (get().valuationId) {
        valuationData = await get().fetchValuationData(get().valuationId);
      }

      // Start assessment
      const result = await assessmentService.startAssessment(
        session.company_name,
        documents,
        valuationData
      );

      // Tyhjää polling intervalli prosessin valmistuttua
      if (progressPollId) {
        window.clearInterval(progressPollId);
        progressPollId = undefined;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Save company info
      if (result.companyInfo?.analysisText) {
        await assessmentService.updateSession(session.id, {
          company_info: result.companyInfo.analysisText,
          structured_company_data: result.companyInfo.structuredData
        });

        set(state => ({
          session: state.session ? {
            ...state.session,
            company_info: result.companyInfo.analysisText,
            structured_company_data: result.companyInfo.structuredData
          } : null
        }));
      }

      // Save readiness data
      if (result.readinessForSaleInfo && !result.readinessForSaleInfo.error) {
        await assessmentService.updateSession(session.id, {
          readiness_for_sale_data: result.readinessForSaleInfo
        });

        set(state => ({
          session: state.session ? {
            ...state.session,
            readiness_for_sale_data: result.readinessForSaleInfo
          } : null
        }));
      }

      // Save and set questions - KORJATTU
      if (result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
        // Varmuuden vuoksi loggaus, jotta näemme että kysymykset palautuvat edge functionilta
        console.log(`Received ${result.questions.length} questions from edge function. First question ID: ${result.questions[0]?.id}`);

        // Tallennetaan kysymykset tietokantaan
        await assessmentService.updateSession(session.id, {
          questions: result.questions,
          current_step: 'questions',
          current_question_index: 0
        });

        // Päivitetään storeen
        set({
          questions: result.questions,
          currentQuestionIndex: 0,
          session: {
            ...session,
            questions: result.questions,
            current_step: 'questions',
            current_question_index: 0
          }
        });

        // KORJAUS: Tarkistetaan puolen sekunnin päästä, että kysymykset päätyvät varmasti storeen
        setTimeout(() => {
          const { questions } = get();
          if (!questions || questions.length === 0) {
            console.warn('[startAssessment] Tarkistus: Kysymykset eivät päätyneet storeen, yritetään uudelleen');
            set({
              questions: result.questions,
              currentQuestionIndex: 0
            });
          }
        }, 500);
      } else {
        throw new Error("No valid questions generated");
      }
    } catch (error) {
      // Tyhjää polling intervalli virheen sattuessa
      if (progressPollId) {
        window.clearInterval(progressPollId);
        progressPollId = undefined;
      }

      // Revert to initial selection on error
      await assessmentService.updateSession(session.id, { 
        current_step: 'initial-selection'
      });

      set(state => ({
        sessionError: error.message,
        session: state.session ? {
          ...state.session,
          current_step: 'initial-selection'
        } : null
      }));
    } finally {
      // Varmista että polling intervalli on tyhjennetty
      if (progressPollId) {
        window.clearInterval(progressPollId);
      }
      set({ isLoading: false });
    }
  },

  saveAnswer: async (questionId, value, questionType) => {
    const { session, answers } = get();
    if (!session) return;

    // Update local state
    const newAnswers = { ...answers, [questionId]: value };
    set({ answers: newAnswers });

    // Update in database
    await assessmentService.updateSession(session.id, {
      answers: newAnswers
    });
  },

  updateQuestionIndex: (index) => {
    set({ currentQuestionIndex: index });

    const { session } = get();
    if (session) {
      assessmentService.updateSession(session.id, {
        current_question_index: index
      });
    }
  },

  updateStep: async (step) => {
    const { session } = get();
    if (!session) return;

    await assessmentService.updateSession(session.id, {
      current_step: step
    });

    set(state => ({
      session: state.session ? {
        ...state.session,
        current_step: step
      } : null
    }));
  },

  updateProcessingStage: async (stage, progress = 0) => {
    const { session } = get();
    if (!session) return;

    await assessmentService.updateSession(session.id, {
      processing_stage: stage,
      processing_progress: progress
    });

    set(state => ({
      session: state.session ? {
        ...state.session,
        processing_stage: stage,
        processing_progress: progress
      } : null
    }));
  },

  analyzeAnswers: async () => {
    set({ isLoading: true });

    const { session, documents, answers } = get();
    if (!session) {
      set({ isLoading: false });
      return;
    }

    // Määritellään polling intervalli muuttujaksi, jotta se voidaan tyhjentää myöhemmin
    let progressPollId: number | undefined;

    try {
      await get().updateStep('processing');
      await get().updateProcessingStage('analysis', 0);

      // KORJAUS: Lisätään polling-mekanismi myös analysointivaiheeseen
      let progress = 0;
      progressPollId = window.setInterval(async () => {
        if (progress < 95) {
          // Satunnainen lisäys 3-7% välillä
          const increment = Math.floor(Math.random() * 5) + 3;
          progress = Math.min(95, progress + increment);

          // Päivitetään edistyminen
          await assessmentService.updateSession(session.id, { 
            processing_progress: progress 
          });

          // Päivitetään store
          set(state => ({
            session: state.session ? {
              ...state.session,
              processing_progress: progress
            } : null
          }));
        }
      }, 1500); // 1.5 sekunnin välein

      // Fetch valuation data if valuationId is available
      let valuationData = null;
      if (get().valuationId) {
        valuationData = await get().fetchValuationData(get().valuationId);
      }

      const result = await assessmentService.analyzeAssessment(
        session.company_name,
        session.structured_company_data || session.company_info,
        answers,
        documents,
        session.readiness_for_sale_data,
        valuationData
      );

      // Tyhjää polling intervalli prosessin valmistuttua
      if (progressPollId) {
        window.clearInterval(progressPollId);
        progressPollId = undefined;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.finalAnalysis) {
        throw new Error("No analysis results returned");
      }

      // Päivitetään progress 100% analysoinnin valmistuttua
      await assessmentService.updateSession(session.id, {
        processing_progress: 100
      });

      // Save results
      await assessmentService.updateSession(session.id, {
        results: result.finalAnalysis,
        status: 'completed',
        current_step: 'results'
      });

      set({
        results: result.finalAnalysis,
        session: {
          ...session,
          processing_progress: 100,
          results: result.finalAnalysis,
          status: 'completed',
          current_step: 'results'
        }
      });

      await get().updateStep('results');
    } catch (error) {
      // Tyhjää polling intervalli virheen sattuessa
      if (progressPollId) {
        window.clearInterval(progressPollId);
        progressPollId = undefined;
      }

      set({
        sessionError: error.message
      });

      await get().updateStep('questions');
    } finally {
      // Varmista että polling intervalli on tyhjennetty
      if (progressPollId) {
        window.clearInterval(progressPollId);
      }
      set({ isLoading: false });
    }
  },

  // Helper function to fetch and format valuation data for assessment
  fetchValuationData: async (valuationId: string) => {
    try {
      console.log(`[AssessmentStore] Fetching valuation data for ID: ${valuationId}`);
      const valuation = await valuationService.fetchValuationById(valuationId);
      
      if (!valuation || !valuation.results) {
        console.log(`[AssessmentStore] No valuation results found for ID: ${valuationId}`);
        return null;
      }

      // Extract and format data for assessment edge functions
      const valuationData = {
        normalization_summary: valuation.results.normalization_summary || null,
        applied_normalizations: valuation.results.applied_normalizations || [],
        user_answers: valuation.results.financialAnswers || {},
        valuation_rationale: valuation.results.valuationReport?.valuation_numbers?.valuation_rationale || null,
        key_points: valuation.results.valuationReport?.key_points || null,
        valuation_range: valuation.results.valuationReport?.valuation_numbers?.range || null,
        most_likely_value: valuation.results.valuationReport?.valuation_numbers?.most_likely_value || null
      };

      console.log(`[AssessmentStore] Successfully formatted valuation data:`, valuationData);
      return valuationData;
    } catch (error) {
      console.error(`[AssessmentStore] Error fetching valuation data:`, error);
      return null;
    }
  },

  resetAssessment: () => {
    set({
      sessionStatus: 'idle',
      sessionError: null,
      session: null,
      documentsStatus: 'idle',
      documentsError: null,
      documents: [],
      valuationId: null, // Added valuationId
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      results: null,
      isLoading: false
    });
  }
}))