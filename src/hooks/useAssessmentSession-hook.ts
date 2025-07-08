// src/hooks/useAssessmentSession.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question, DocumentWithContent, AnalysisResults, CompanyData } from '@/components/assessment/types';

// Tyypit
export type AssessmentStep = 'initial-selection' | 'processing' | 'questions' | 'results';
export type ProcessingStage = 'company-info' | 'questions' | 'analysis';

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
  structured_company_data?: CompanyData | null;
  readiness_for_sale_data?: any;
  questions?: Question[];
  last_activity: string;
  documents_metadata?: Array<{id: string, name: string, document_type?: string}> | null; // Lisätty tuki dokumenttimetadatalle
}

export function useAssessmentSession(assessmentId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentsList, setDocumentsList] = useState<DocumentWithContent[]>([]);

  // Haetaan tai luodaan sessio
  const fetchOrCreateSession = useCallback(async (companyId: string, companyName: string) => {
    if (!user) return null;
    setLoading(true);
    setError(null);

    try {
      // Jos on assessmentId, haetaan olemassa oleva
      if (assessmentId) {
        const { data, error: fetchError } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error("Virhe haettaessa arviointia:", fetchError);
          throw new Error("Arvioinnin hakeminen epäonnistui");
        }

        if (data) {
          console.log("Olemassa oleva arviointi löytyi:", data.id);
          setSession(data as AssessmentSession);
          setLoading(false);
          return data.id;
        }
      }

      console.log("Luodaan uusi arviointi-istunto:");

      // Luodaan uusi draft-tila
      const { data, error: createError } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          company_id: companyId,
          company_name: companyName,
          status: 'draft',
          current_step: 'initial-selection',
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Virhe luotaessa arviointia:", createError);
        throw createError;
      }

      console.log("Uusi arviointi luotu:", data.id);
      setSession(data as AssessmentSession);
      setLoading(false);
      return data.id;
    } catch (err: any) {
      console.error("Arvioinnin alustusvirhe:", err);
      setError(err.message || "Arvioinnin alustus epäonnistui");
      setLoading(false);
      toast({
        title: "Virhe", 
        description: "Arvioinnin alustus epäonnistui: " + (err.message || "Tuntematon virhe"),
        variant: "destructive"
      });
      return null;
    }
  }, [user, assessmentId, toast]);

  // Päivitetään sessio
  const updateSession = useCallback(async (updates: Partial<AssessmentSession>) => {
    if (!session?.id) return false;

    try {
      console.log("Päivitetään arviointi-istuntoa:", session.id, updates);

      const { error } = await supabase
        .from('assessments')
        .update({
          ...updates,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) {
        console.error("Virhe päivitettäessä arviointia:", error);
        toast({
          title: "Virhe", 
          description: "Arvioinnin päivitys epäonnistui: " + error.message,
          variant: "destructive"
        });
        return false;
      }

      // Päivitetään paikallinen tila
      setSession(prev => prev ? {
        ...prev, 
        ...updates, 
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null);

      return true;
    } catch (err: any) {
      console.error("Päivitysvirhe:", err);
      toast({
        title: "Virhe", 
        description: "Arvioinnin päivitys epäonnistui: " + (err.message || "Tuntematon virhe"),
        variant: "destructive"
      });
      return false;
    }
  }, [session, toast]);

  // Vaihdetaan stepiä
  const updateStep = useCallback(async (step: AssessmentStep) => {
    return await updateSession({ current_step: step });
  }, [updateSession]);

  // Päivitetään käsittelyvaihetta
  const updateProcessingStage = useCallback(async (stage: ProcessingStage, progress: number = 0) => {
    return await updateSession({ 
      processing_stage: stage, 
      processing_progress: progress 
    });
  }, [updateSession]);

  // Päivitetään kysymysindeksiä
  const updateQuestionIndex = useCallback(async (index: number) => {
    return await updateSession({ current_question_index: index });
  }, [updateSession]);

  // Tallennetaan vastaus
  const saveAnswer = useCallback(async (questionId: string, value: any) => {
    if (!session) return false;

    const updatedAnswers = { 
      ...(session.answers || {}), 
      [questionId]: value 
    };

    return await updateSession({ answers: updatedAnswers });
  }, [session, updateSession]);

  // Tallennetaan kysymykset
  const saveQuestions = useCallback(async (questions: Question[]) => {
    return await updateSession({ questions });
  }, [updateSession]);

  // Tallennetaan analyysin tulokset
  const saveResults = useCallback(async (results: any) => {
    return await updateSession({ 
      results,
      status: 'completed',
      current_step: 'results'
    });
  }, [updateSession]);

  // Tallennetaan yritystiedot
  const saveCompanyInfo = useCallback(async (companyInfo: string, structuredData?: CompanyData | null) => {
    return await updateSession({ 
      company_info: companyInfo,
      structured_company_data: structuredData || null
    });
  }, [updateSession]);

  // Tallennetaan myyntikuntoisuustiedot
  const saveReadinessData = useCallback(async (data: any) => {
    return await updateSession({ readiness_for_sale_data: data });
  }, [updateSession]);

  // Asetetaan istunnon tila (draft/processing/completed)
  const setSessionStatus = useCallback(async (status: 'draft' | 'processing' | 'completed') => {
    return await updateSession({ status });
  }, [updateSession]);

  // Dokumenttien hallinta - päivitetty tallennus myös tietokantaan
  const setDocuments = useCallback((documents: DocumentWithContent[]) => {
    console.log(`[useAssessmentSession] Tallennetaan ${documents.length} dokumenttia`);

    // Päivitä paikallinen tila
    setDocumentsList(documents);

    // Jos sessio on olemassa, tallenna dokumenttien metadata tietokantaan
    if (session?.id) {
      // Luodaan kevyt metadata-versio dokumenteista tietokantaa varten
      const documentsMetadata = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        document_type: doc.document_type || doc.file_type
      }));

      updateSession({ documents_metadata: documentsMetadata })
        .catch(err => {
          console.error("[useAssessmentSession] Virhe dokumenttien tallennuksessa:", err);
        });
    }
  }, [session, updateSession]);

  // Haetaan dokumentit
  const getDocuments = useCallback(() => {
    return documentsList;
  }, [documentsList]);

  // Ladataan mahdolliset aiemmin tallennetut dokumentit sessiosta
  useEffect(() => {
    if (session?.documents_metadata && session.documents_metadata.length > 0 && documentsList.length === 0) {
      console.log("[useAssessmentSession] Ladataan dokumenttimetadata sessiosta:", session.documents_metadata);

      // Metadata löytyi, mutta tarvitaan sisältö - haetaan se erikseen
      // Tämä on vain peruskoodi, yleensä sisältöä ei ladata automaattisesti vaan käyttäjän toimesta
    }
  }, [session, documentsList]);

  // Ladataan olemassa oleva sessio
  useEffect(() => {
    if (assessmentId && user && !session) {
      const loadSession = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', assessmentId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          console.log("Ladattu arviointi-istunto:", data.id);
          setSession(data as AssessmentSession);
        } catch (err: any) {
          console.error("Arvioinnin latausvirhe:", err);
          setError("Arvioinnin lataus epäonnistui: " + (err.message || "Tuntematon virhe"));
          toast({
            title: "Virhe", 
            description: "Arvioinnin lataus epäonnistui",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };

      loadSession();
    }
  }, [assessmentId, user, toast, session]);

  // Palauta keskeytetty arviointi tietokannasta
  const resumeDraftAssessment = useCallback(async (companyId?: string) => {
    if (!user) return null;
    setLoading(true);

    try {
      const query = supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('last_activity', { ascending: false });

      // Lisää companyId filteröinti jos annettu
      const { data, error } = companyId 
        ? await query.eq('company_id', companyId).limit(1) 
        : await query.limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const draftSession = data[0] as AssessmentSession;
        console.log("Löydettiin keskeytetty arviointi:", draftSession.id);
        setSession(draftSession);

        // Jos sessiossa on dokumenttimetadata, päivitä UI-tila
        if (draftSession.documents_metadata && draftSession.documents_metadata.length > 0) {
          // Tähän voisi lisätä dokumenttien latauslogiikan tarvittaessa
          console.log("Sessiossa on dokumenttimetadata:", draftSession.documents_metadata.length, "dokumenttia");
        }

        setLoading(false);
        return draftSession.id;
      }

      console.log("Ei löytynyt keskeytettyä arviointia");
      setLoading(false);
      return null;
    } catch (err: any) {
      console.error("Virhe haettaessa keskeytettyä arviointia:", err);
      setError("Keskeytetyn arvioinnin haku epäonnistui");
      setLoading(false);
      return null;
    }
  }, [user]);

  // Arvioinnin poistaminen
  const deleteAssessment = useCallback(async () => {
    if (!session?.id) return false;

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      setSession(null);
      return true;
    } catch (err) {
      console.error("Virhe poistettaessa arviointia:", err);
      return false;
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    documents: documentsList,
    fetchOrCreateSession,
    updateSession,
    updateStep,
    updateProcessingStage,
    updateQuestionIndex,
    saveAnswer,
    saveQuestions,
    saveResults,
    saveCompanyInfo,
    saveReadinessData,
    setSessionStatus,
    setDocuments,
    getDocuments,
    resumeDraftAssessment,
    deleteAssessment
  };
}