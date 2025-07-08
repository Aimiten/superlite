import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AssessmentResults } from "@/components/AssessmentResults";
import QuestionsStep from "@/components/assessment/QuestionsStep";
import { useAuth } from "@/contexts/AuthContext";
import { usePersistentStorage } from "@/hooks/use-persistent-storage";
import { 
  CompanyData, 
  Question, 
  AnswerOption, 
  AnalysisResults,
  Document,
  QuestionType
} from "@/components/assessment/types";
import InitialSelectionStep from "./InitialSelectionStep";
import ProcessingAndLoadingStep from "./ProcessingAndLoadingStep";

interface AssessmentContainerProps {
  onAssessmentComplete?: () => void;
  preselectedCompany?: string | null;
}

const AssessmentContainer: React.FC<AssessmentContainerProps> = ({ 
  onAssessmentComplete,
  preselectedCompany
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep, refreshStep] = usePersistentStorage<
    "initial-selection" | "processing" | "questions" | "results"
  >("assessment-step", "initial-selection", { debug: true });
  
  const [processingStage, setProcessingStage] = usePersistentStorage<"company-info" | "questions" | "analysis">(
    "assessment-processing-stage", 
    "company-info",
    { debug: true }
  );
  
  const [processingProgress, setProcessingProgress] = usePersistentStorage<number>(
    "assessment-processing-progress", 
    0,
    { debug: true }
  );
  
  const [companyName, setCompanyName] = usePersistentStorage<string>(
    "assessment-company-name", 
    preselectedCompany || "",
    { debug: true }
  );
  
  const [companyInfo, setCompanyInfo] = usePersistentStorage<string>(
    "assessment-company-info", 
    "",
    { debug: true }
  );
  
  const [companyId, setCompanyId] = usePersistentStorage<string | null>(
    "assessment-company-id", 
    null,
    { debug: true }
  );
  
  const [structuredCompanyData, setStructuredCompanyData] = usePersistentStorage<CompanyData | null>(
    "assessment-structured-company-data", 
    null,
    { debug: true }
  );
  
  const [readinessForSaleData, setReadinessForSaleData] = usePersistentStorage<any>(
    "assessment-readiness-for-sale-data", 
    null,
    { debug: true }
  );
  
  const [selectedDocuments, setSelectedDocuments] = usePersistentStorage<Document[]>(
    "assessment-selected-documents", 
    [],
    { debug: true }
  );
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = usePersistentStorage<number>(
    "assessment-current-question-index", 
    0,
    { debug: true }
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressInterval, setProgressInterval] = useState<number | null>(null);
  
  const defaultAnswerOptions: AnswerOption[] = [
    { value: 1, label: "Heikko" },
    { value: 2, label: "Välttävä" },
    { value: 3, label: "Tyydyttävä" },
    { value: 4, label: "Hyvä" },
    { value: 5, label: "Erinomainen" }
  ];

  const [questions, setQuestions] = usePersistentStorage<Question[]>(
    "assessment-questions",
    [{
      id: "1",
      question: "Odota hetki...",
      description: "Kysymyksiä ladataan...",
      questionType: 'scale',
      answerOptions: defaultAnswerOptions
    }],
    { debug: true }
  );
  
  const [answers, setAnswers] = usePersistentStorage<Record<string, any>>(
    "assessment-answers",
    {},
    { debug: true }
  );
  
  const [analysisResults, setAnalysisResults] = usePersistentStorage<AnalysisResults | null>(
    "assessment-analysis-results",
    null,
    { debug: true }
  );
  
  const totalQuestions = questions.length;

  useEffect(() => {
    console.log("[AssessmentContainer] Forcing refresh of all storage values on mount");
    refreshStep();
    
    const storedStep = localStorage.getItem("assessment-step");
    
    if (storedStep) {
      try {
        const parsedStep = JSON.parse(storedStep) as "initial-selection" | "processing" | "questions" | "results";
        console.log("[AssessmentContainer] Found stored step:", parsedStep);
        
        if (parsedStep !== step) {
          console.log("[AssessmentContainer] Restoring step from localStorage:", parsedStep);
          setStep(parsedStep);
        }
      } catch (e) {
        console.error("[AssessmentContainer] Error parsing stored step:", e);
      }
    }
    
    if (step === "processing" && (!questions || questions.length <= 1)) {
      console.log("[AssessmentContainer] Detected potentially stuck state, checking...");
      
      const storedTime = localStorage.getItem("assessment-processing-start-time");
      if (storedTime) {
        const startTime = parseInt(storedTime, 10);
        const currentTime = new Date().getTime();
        
        if ((currentTime - startTime) > 5 * 60 * 1000) {
          console.log("[AssessmentContainer] Assessment appears to be stuck, resetting");
          resetAssessment();
          toast({
            title: "Arviointi nollattu",
            description: "Aiempi arviointi näytti jumiutuneen ja se on nollattu automaattisesti.",
            variant: "default"
          });
        }
      }
    }
  }, []);

  const saveCompanyInfo = async (companyId: string, companyInfo: any, readinessForSaleData: any) => {
    if (!user || !companyId) return;
    
    try {
      const { data: existingInfo, error: fetchError } = await supabase
        .from('company_info')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      const infoData: any = {
        company_id: companyId,
        business_description: companyInfo.structuredData?.description || '',
        employees_count: companyInfo.structuredData?.employees || '',
        customer_and_market: companyInfo.structuredData?.market_position || '',
        competition: '',
        strategy_and_future: '',
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: '',
        risks_and_regulation: '',
        brand_and_reputation: '',
        sources: '',
        raw_response: companyInfo.rawResponse || null
      };
      
      if (readinessForSaleData && !readinessForSaleData.error) {
        infoData.readiness_for_sale_data = readinessForSaleData.structuredData || readinessForSaleData.rawResponse || null;
      }
      
      if (existingInfo) {
        const { error: updateError } = await supabase
          .from('company_info')
          .update(infoData)
          .eq('id', existingInfo.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('company_info')
          .insert(infoData);
        
        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error("Error saving company info:", err);
    }
  };

  const handleStartAssessment = async () => {
    console.log("Starting assessment with company:", companyName, "companyId:", companyId);
    
    if (!companyName || !companyId) {
      toast({
        title: "Virhe",
        description: "Valitse tai lisää yritys ennen jatkamista.",
        variant: "destructive"
      });
      return;
    }
    
    setStep("processing");
    setProcessingStage("company-info");
    setProcessingProgress(5);
    setError("");
    setIsLoading(true);
    
    localStorage.setItem("assessment-processing-start-time", new Date().getTime().toString());
    
    try {
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      const interval = window.setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval);
              setProgressInterval(null);
            }
            return 90;
          }
          return prev + 0.5;
        });
      }, 800);
      
      setProgressInterval(interval);
      
      const { data, error: apiError } = await supabase.functions.invoke("assessment", {
        body: { companyName }
      });
      
      if (apiError) {
        throw new Error(apiError.message || "Error from assessment function");
      }
      
      if (data.companyInfo?.error) {
        throw new Error(data.companyInfo.error);
      }
      
      setCompanyInfo(data.companyInfo?.analysisText || "Tietoja ei löytynyt.");
      
      if (data.companyInfo?.structuredData) {
        setStructuredCompanyData(data.companyInfo.structuredData);
      }
      
      if (data.readinessForSaleInfo) {
        setReadinessForSaleData(data.readinessForSaleInfo);
      }
      
      if (data.companyInfo && companyId) {
        await saveCompanyInfo(companyId, data.companyInfo, data.readinessForSaleInfo);
      }

      setProcessingStage("questions");
      setProcessingProgress(40);

      const documentData = selectedDocuments.length > 0 
        ? await Promise.all(selectedDocuments.map(async (doc) => {
            if (doc.file_path) {
              try {
                const { data, error } = await supabase.storage
                  .from("company_files")
                  .download(doc.file_path);
                
                if (error) throw error;
                
                let docText = "";
                let docBase64 = "";
                
                try {
                  docText = await data.text();
                } catch (e) {
                  console.log("Could not get text content, using base64 instead");
                  const buffer = await data.arrayBuffer();
                  docBase64 = btoa(
                    new Uint8Array(buffer).reduce(
                      (data, byte) => data + String.fromCharCode(byte),
                      ''
                    )
                  );
                }
                
                return {
                  id: doc.id,
                  name: doc.name,
                  documentType: doc.document_type,
                  text: docText || undefined,
                  base64: docBase64 || undefined,
                  mimeType: doc.file_type
                };
              } catch (error) {
                console.error(`Error fetching document ${doc.name}:`, error);
                return {
                  id: doc.id,
                  name: doc.name,
                  documentType: doc.document_type,
                  error: "Could not fetch document content"
                };
              }
            }
            
            return {
              id: doc.id,
              name: doc.name,
              documentType: doc.document_type
            };
          }))
        : [];
      
      console.log("About to call assessment with generateQuestions:", {
        companyName,
        companyDataLength: companyInfo?.length,
        hasReadinessData: !!readinessForSaleData,
        documentCount: documentData.length
      });
      
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke("assessment", {
        body: {
          companyName,
          companyData: companyInfo,
          generateQuestions: true,
          readinessForSaleData: readinessForSaleData,
          documents: documentData
        }
      });
      
      if (questionsError) {
        throw new Error(questionsError.message);
      }
      
      console.log("Received questions response:", questionsData);
      
      if (!questionsData.questions || !Array.isArray(questionsData.questions) || questionsData.questions.length === 0) {
        console.error("No questions returned from API:", questionsData);
        throw new Error("Kysymysten generointi epäonnistui: Ei kysymyksiä palautettu");
      }
      
      const customQuestions = questionsData.questions.map((q: any, index: number) => {
        console.log(`Processing question ${index}:`, q);
        
        const questionType = q.questionType || 'scale';
        
        let answerOpts;
        if (['scale', 'select', 'multiselect'].includes(questionType)) {
          answerOpts = q.answerOptions && Array.isArray(q.answerOptions) && q.answerOptions.length > 0
            ? q.answerOptions.map((opt: any) => ({
                value: opt.value,
                label: opt.label
              }))
            : defaultAnswerOptions;
        }
        
        return {
          id: q.id || `generated-${index + 1}`,
          question: q.question,
          description: q.description || "Vastaa kysymykseen",
          questionType: questionType as QuestionType,
          answerOptions: answerOpts,
          min: q.min,
          max: q.max,
          placeholder: q.placeholder,
          context: q.context,
          amount: q.amount,
          period: q.period
        };
      });
      
      console.log("Processed questions:", customQuestions);
      
      // Tarkistetaan että kysymyksiä on vähintään yksi ennen asetusta
      if (customQuestions.length > 0) {
        setQuestions(customQuestions);
      } else {
        console.error("Empty questions array after processing:", customQuestions);
        throw new Error("Kysymysten prosessointi epäonnistui: Ei kysymyksiä jäljellä prosessoinnin jälkeen");
      }
      
      setProcessingProgress(100);
      
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      setTimeout(() => {
        setStep("questions");
      }, 500);
    } catch (err: any) {
      console.error("Error in assessment process:", err);
      setError(err.message || "Virhe arviointiprosessissa. Yritä uudelleen.");
      toast({
        title: "Virhe",
        description: err.message || "Virhe arviointiprosessissa. Yritä uudelleen.",
        variant: "destructive"
      });
      
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      
      setProcessingProgress(0);
    } finally {
      setIsLoading(false);
      
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
    }
  };

  const handleNext = async () => {
    if (step === "questions") {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setStep("processing");
        setProcessingStage("analysis");
        setProcessingProgress(0);
        await performAnalysis();
      }
    }
  };

  const handlePrevious = () => {
    if (step === "questions") {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        // Kun palataan alkuun, varmistetaan nollaus
        resetAssessment();
      }
    }
  };

  const handleDocumentsSelected = (documents: Document[]) => {
    setSelectedDocuments(documents);
  };

  const handleAnswer = (questionId: string, value: any, questionType: QuestionType) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const saveAssessmentToDatabase = async () => {
    if (!user || !analysisResults) return;
    
    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          company_name: companyName,
          results: analysisResults,
          answers: answers,
          company_id: companyId
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Arviointi tallennettu",
        description: "Myyntikuntoisuuden arviointi on tallennettu onnistuneesti.",
      });
      
      if (onAssessmentComplete) {
        onAssessmentComplete();
      }
      
      return data;
    } catch (err: any) {
      console.error("Error saving assessment:", err);
      toast({
        title: "Virhe",
        description: "Arvioinnin tallentaminen epäonnistui.",
        variant: "destructive"
      });
    }
  };

  const performAnalysis = async () => {
    setIsLoading(true);
    setError("");
    
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    
    try {
      const interval = window.setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval);
              setProgressInterval(null);
            }
            return 90;
          }
          return prev + 1;
        });
      }, 200);
      
      setProgressInterval(interval);
      
      const documentData = selectedDocuments.length > 0 
        ? await Promise.all(selectedDocuments.map(async (doc) => {
            if (doc.file_path) {
              try {
                const { data, error } = await supabase.storage
                  .from("company_files")
                  .download(doc.file_path);
                
                if (error) throw error;
                
                let docText = "";
                let docBase64 = "";
                
                try {
                  docText = await data.text();
                } catch (e) {
                  console.log("Could not get text content, using base64 instead");
                  const buffer = await data.arrayBuffer();
                  docBase64 = btoa(
                    new Uint8Array(buffer).reduce(
                      (data, byte) => data + String.fromCharCode(byte),
                      ''
                    )
                  );
                }
                
                return {
                  id: doc.id,
                  name: doc.name,
                  documentType: doc.document_type,
                  text: docText || undefined,
                  base64: docBase64 || undefined,
                  mimeType: doc.file_type
                };
              } catch (error) {
                console.error(`Error fetching document ${doc.name}:`, error);
                return {
                  id: doc.id,
                  name: doc.name,
                  documentType: doc.document_type,
                  error: "Could not fetch document content"
                };
              }
            }
            
            return {
              id: doc.id,
              name: doc.name,
              documentType: doc.document_type
            };
          }))
        : [];
      
      const { data, error: apiError } = await supabase.functions.invoke("assessment", {
        body: {
          companyName,
          companyData: companyInfo,
          answers,
          readinessForSaleData: readinessForSaleData,
          documents: documentData
        }
      });
      
      if (apiError) {
        throw new Error(apiError.message);
      }
      
      if (data.finalAnalysis?.error) {
        throw new Error(data.finalAnalysis.error);
      }
      
      clearInterval(progressInterval);
      setProgressInterval(null);
      setProcessingProgress(100);
      
      setAnalysisResults(data.finalAnalysis);
      setStep("results");
      
      if (user) {
        await saveAssessmentToDatabase();
      }
    } catch (err: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
      console.error("Error performing analysis:", err);
      setError(err.message || "Virhe analyysin suorittamisessa. Yritä uudelleen.");
      toast({
        title: "Virhe",
        description: err.message || "Virhe analyysin suorittamisessa. Yritä uudelleen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      if (progressInterval) {
        clearInterval(progressInterval);
        setProgressInterval(null);
      }
    }
  };

  const resetAssessment = () => {
    // Poistetaan KAIKKI assessment-alkuiset arvot localStoragesta
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('assessment-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Nollataan kaikki tilat
    setStep("initial-selection");
    setProcessingStage("company-info");
    setProcessingProgress(0);
    setCompanyName(preselectedCompany || "");
    setCompanyInfo("");
    setCompanyId(null);
    setStructuredCompanyData(null);
    setReadinessForSaleData(null);
    setSelectedDocuments([]);
    setCurrentQuestionIndex(0);
    setQuestions([{
      id: "1",
      question: "Odota hetki...",
      description: "Kysymyksiä ladataan...",
      questionType: 'scale',
      answerOptions: defaultAnswerOptions
    }]);
    setAnswers({});
    setAnalysisResults(null);
    setError("");
    
    toast({
      title: "Arviointi nollattu",
      description: "Voit aloittaa uuden myyntikuntoisuuden arvioinnin.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Myyntikuntoisuus-arviointi</h1>
      
      {step === "initial-selection" && (
        <InitialSelectionStep
          companyName={companyName}
          setCompanyName={setCompanyName}
          companyId={companyId}
          setCompanyId={setCompanyId}
          selectedDocuments={selectedDocuments}
          onDocumentsSelected={handleDocumentsSelected}
          handleStart={handleStartAssessment}
          isLoading={isLoading}
          error={error}
          preselectedCompany={preselectedCompany}
          onReset={resetAssessment}
        />
      )}

      {step === "processing" && (
        <ProcessingAndLoadingStep
          stage={processingStage}
          progress={processingProgress}
          error={error}
          onReset={resetAssessment}
        />
      )}

      {step === "questions" && questions && questions.length > 0 && (
        <QuestionsStep
          questions={questions}
          answers={answers}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          handleAnswer={handleAnswer}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      )}

      {step === "results" && (
        <AssessmentResults analysisResults={analysisResults} answers={answers} />
      )}
    </div>
  );
};

export default AssessmentContainer;
