import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useValuationStore } from '@/stores/valuationStore';
import { valuationService } from '@/utils/valuationService';
import MultiplierSettings from '@/components/valuation/MultiplierSettings';
import { MultiplierSettings as MultiplierSettingsType } from "@/types/multipliers";

import ValuationDashboard from '@/components/valuation/ValuationDashboard';
import ImprovedValuationTabs from '@/components/valuation/ImprovedValuationTabs';
import EnhancedValuationSummary from '@/components/valuation/EnhancedValuationSummary';
import EnhancedValuationReport from '@/components/valuation/EnhancedValuationReport';
import ValuationPrinciples from '@/components/valuation/ValuationPrinciples';
import EmptyValuationState from '@/components/valuation/EmptyValuationState';
import ValuationLoadingStep from '@/components/valuation/ValuationLoadingStep';
import ValuationPathQuestionForm from "@/components/valuation/ValuationPathQuestionForm";
import ValuationsList from "@/components/valuation/ValuationsList";
import ValuationNextSteps from "@/components/valuation/ValuationNextSteps";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { FileText, X, Upload, PlusCircle, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fi-FI');
};

const Valuation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { 
    latestValuationId, setLatestValuationId,
    currentStep, setCurrentStep,
    analysisStage, analysisProgress, setAnalysisProgress,
    resetValuationState, resetFileState, resetAnalysisState, resetAllState,
    financialQuestions, setFinancialQuestions, 
    financialAnswers, setFinancialAnswers,
    uploadedFiles, setUploadedFiles, addUploadedFile, removeUploadedFile,
    selectedDocuments, setSelectedDocuments,
    companyInfo, setCompanyInfo, 
    financialAnalysis, setFinancialAnalysis,
    valuationReport, setValuationReport, 
    rawApiData, setRawApiData,
    requiresUserInput, setRequiresUserInput,
    initialFindings, setInitialFindings,
    isLoading, setIsLoading,
    isProcessing, setIsProcessing,
    error, setError,
    showNewValuationForm, setShowNewValuationForm,
    selectedValuationId, setSelectedValuationId
  } = useValuationStore();

  const [savedValuations, setSavedValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(true);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);
  const [multiplierSettings, setMultiplierSettings] = useState<MultiplierSettingsType>({
    method: 'ai'
  });

  const latestPeriod = React.useMemo(() => {
    if (!financialAnalysis?.documents?.[0]) return null;

    const doc = financialAnalysis.documents[0];
    
    // PRIORISOI sortedPeriods (uudempi, laskettu data)
    if (doc.sortedPeriods && doc.sortedPeriods.length > 0) {
      return doc.sortedPeriods[0]; // Ensimmäinen = uusin
    }
    
    // FALLBACK financial_periods (raakadata)
    const financialPeriods = doc.financial_periods || [];
    if (financialPeriods.length === 0) return null;

    return financialPeriods.reduce((latest: any, current: any) => {
      const latestEndDate = latest?.period?.end_date ? new Date(latest.period.end_date) : null;
      const currentEndDate = current?.period?.end_date ? new Date(current.period.end_date) : null;
      if (!currentEndDate) return latest;
      if (!latestEndDate) return current;
      return currentEndDate > latestEndDate ? current : latest;
    }, financialPeriods[0]);
  }, [financialAnalysis]);

  const companyInfoAnalysis = React.useMemo(() => {
    return companyInfo?.analysisText ? JSON.parse(companyInfo.analysisText) : {};
  }, [companyInfo]);

  const swotData = React.useMemo(() => {
    if (!companyInfoAnalysis?.swot) return null;
    return {
      strengths: typeof companyInfoAnalysis.swot.vahvuudet === 'string' ? companyInfoAnalysis.swot.vahvuudet : '',
      weaknesses: typeof companyInfoAnalysis.swot.heikkoudet === 'string' ? companyInfoAnalysis.swot.heikkoudet : '',
      opportunities: typeof companyInfoAnalysis.swot.mahdollisuudet === 'string' ? companyInfoAnalysis.swot.mahdollisuudet : '',
      threats: typeof companyInfoAnalysis.swot.uhat === 'string' ? companyInfoAnalysis.swot.uhat : '',
    };
  }, [companyInfoAnalysis]);

  const valuationDate = React.useMemo(() => {
    return valuationReport?.created_at || new Date().toISOString();
  }, [valuationReport]);

  useEffect(() => {
    if (latestValuationId && currentStep > 1) {
      valuationService.saveValuationProgress(latestValuationId, {
        current_step: currentStep,
        analysis_stage: analysisStage,
        analysis_progress: analysisProgress
      }).catch(err => console.error("Error saving valuation state:", err));
    }
  }, [currentStep, analysisStage, analysisProgress, latestValuationId]);

  const handleError = useCallback((message: string, err: any) => {
    const errMsg = err?.message || "Tuntematon virhe";
    console.error(`${message}:`, err);
    setError(`${message}: ${errMsg}`);
    toast({ 
      title: "Virhe", 
      description: `${message}: ${errMsg}`, 
      variant: "destructive" 
    });
    return errMsg;
  }, [toast, setError]);

  useEffect(() => {
    if (user) {
      fetchSavedValuations(); 
      if (showNewValuationForm && activeCompany) {
        fetchSavedDocuments();
      } else if (!showNewValuationForm) {
        setSavedDocuments([]); 
      }
    } else {
      setSavedValuations([]);
      setSavedDocuments([]);
    }
  }, [user, activeCompany, showNewValuationForm]);

  const createProgressHandler = useCallback(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    const start = (stage: string) => {
      if (progressInterval) clearInterval(progressInterval);

      setAnalysisProgress(stage, 0);
      progressInterval = setInterval(() => {
        setAnalysisProgress(
          stage, 
          Math.min(analysisProgress + 1, 90)
        );
      }, 300);
    };

    return {
      start,
      update: (stage: string, value: number) => {
        setAnalysisProgress(stage, value);
      },
      complete: (stage: string) => {
        if (progressInterval) clearInterval(progressInterval);
        setAnalysisProgress(stage, 100);
      },
      cleanup: () => {
        if (progressInterval) clearInterval(progressInterval);
      }
    };
  }, [setAnalysisProgress, analysisProgress]);

  const handleAnswersSubmit = async (answers: Record<string, string>, originalQuestions: any[]) => {
    if (!activeCompany) {
      toast({ title: "Virhe", description: "Valitse ensin yritys", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setError("");
    setCurrentStep(2);

    const progress = createProgressHandler();
    progress.start("processing-questions");

    try {
      progress.update("processing-questions", 70); // Jatka siitä mihin analyzing jäi
      progress.update("generating-report", 85);

      const data = await valuationService.processQuestionAnswers(
        activeCompany.name,
        uploadedFiles,
        answers,
        originalQuestions,
        activeCompany.company_type,
        latestValuationId // Analysis ID toiseen vaiheeseen
      );

      progress.update("generating-report", 95);

      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      if (data.financialAnalysis) setFinancialAnalysis(data.financialAnalysis);
      setRawApiData(data);

      if (data.finalAnalysis) {
        setValuationReport(data.finalAnalysis);

        if (!data.finalAnalysis.error && user && activeCompany) {
          setTimeout(() => {
            saveValuationToDatabase(
              data.finalAnalysis,
              data.financialAnalysis,
              data.companyInfo,
              data.requiresUserInput,
              data.financialQuestions,
              data.initialFindings
            );
          }, 500);
        }
      }

      setRequiresUserInput(false);
      progress.update("generating-report", 95);
      progress.complete("generating-report");
      setCurrentStep(4);

      toast({
        title: "Analyysi valmis", 
        description: "Yrityksen arvonmääritys on suoritettu onnistuneesti."
      });
    } catch (err: any) {
      handleError("Vastausten käsittely epäonnistui", err);
    } finally {
      progress.cleanup();
      setIsProcessing(false);
    }
  };

  const fetchValuationById = async (id: string) => {
    if (!user) return;

    setIsLoading(true);

    try {
      const data = await valuationService.fetchValuationById(id);

      setLatestValuationId(data.id);
      setSelectedValuationId(data.id);

      if (data.progress_data) {
        if (data.progress_data.current_step) {
          setCurrentStep(data.progress_data.current_step);
        }

        if (data.progress_data.analysis_stage) {
          setAnalysisProgress(
            data.progress_data.analysis_stage, 
            data.progress_data.analysis_progress || 100
          );
        }

        if (data.progress_data.financial_questions && 
            data.progress_data.financial_questions.length > 0) {
          setFinancialQuestions(data.progress_data.financial_questions);
        }

        if (data.progress_data.financial_answers && 
            Object.keys(data.progress_data.financial_answers).length > 0) {
          setFinancialAnswers(data.progress_data.financial_answers);

          if (data.progress_data.current_step === 3 || data.progress_data.current_step === 2.5) {
            toast({
              title: "Tallennetut vastaukset palautettu",
              description: "Voit jatkaa siitä mihin jäit"
            });
          }
        }
      }

      loadValuation(data);
    } catch (err) {
      handleError("Arvonmäärityksen hakeminen epäonnistui", err);
      navigate('/valuation');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedValuations = async () => {
    if (!user) return;

    setLoadingValuations(true);
    setIsContentReady(false); // Aseta sisältö ei-valmiiksi ennen hakua

    try {
      const data = await valuationService.fetchSavedValuations();
      setSavedValuations(data || []);
    } catch (err) {
      console.error("Error fetching valuations:", err);
    } finally {
      setLoadingValuations(false);
      // Aseta pieni viive ennen kuin sisältö näytetään
      setTimeout(() => {
        setIsContentReady(true);
      }, 100);
    }
  };

  const fetchSavedDocuments = async () => {
    if (!user || !activeCompany) {
      setSavedDocuments([]);
      return;
    }

    setLoadingDocuments(true);

    try {
      const data = await valuationService.fetchSavedDocuments(activeCompany.id);
      setSavedDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setSavedDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const toggleDocument = async (documentId: string, documentName: string) => {
    if (!user) return;

    if (selectedDocuments.includes(documentId)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
      setUploadedFiles(uploadedFiles.filter(file => file.id !== documentId));
      return;
    }

    setIsLoading(true);

    try {
      const content = await valuationService.getDocumentContent(documentId);
      if (!content) throw new Error("Tiedoston sisällön hakeminen epäonnistui");

      const newFile = {
        id: documentId,
        name: content.name,
        data: content.text,
        base64: content.base64,
        mimeType: content.mimeType,
        object: null
      };

      addUploadedFile(newFile);
      setSelectedDocuments([...selectedDocuments, documentId]);

      toast({
        title: "Dokumentti valittu",
        description: `Tiedosto ${content.name} valittu.`
      });
    } catch (err) {
      handleError("Tiedoston valinta epäonnistui", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const newFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          return await valuationService.processFile(file);
        })
      );

      newFiles.forEach(file => addUploadedFile(file));

      toast({
        title: "Tiedostot ladattu",
        description: `${newFiles.length} tiedostoa ladattu.`
      });

      e.target.value = '';
    } catch (err) {
      handleError("Tiedostojen lukeminen epäonnistui", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveValuationToDatabase = async (
    reportToSave = null,
    passedFinancialAnalysis = null,
    passedCompanyInfo = null,
    passedRequiresUserInput = false,
    passedFinancialQuestions = [],
    passedInitialFindings = null
  ) => {
    if (!user || !activeCompany) return null;

    const finalReport = reportToSave || valuationReport;
    if (!finalReport) return null;

    try {
      const result = await valuationService.saveValuationToDatabase(
        user,
        activeCompany,
        uploadedFiles,
        selectedDocuments,
        currentStep,
        analysisStage,
        analysisProgress,
        passedFinancialQuestions || financialQuestions || [],
        financialAnswers || {},
        finalReport,
        passedFinancialAnalysis || financialAnalysis,
        passedCompanyInfo || companyInfo,
        passedRequiresUserInput || requiresUserInput,
        passedInitialFindings || initialFindings
      );

      toast({ title: "Tallennettu", description: "Arvonmääritys tallennettu." });

      if (result && result[0]?.id) {
        setLatestValuationId(result[0].id);
        setSelectedValuationId(result[0].id);
      }

      await fetchSavedValuations();
      return result;
    } catch (err) {
      handleError("Arvonmäärityksen tallennus epäonnistui", err);
      return null;
    }
  };

const analyzeCompany = async () => {
  if (!activeCompany) {
    toast({ title: "Virhe", description: "Valitse ensin yritys", variant: "destructive" });
    return;
  }

  if (uploadedFiles.length === 0) {
    toast({ title: "Virhe", description: "Lataa tai valitse vähintään yksi tiedosto", variant: "destructive" });
    return;
  }

  setIsLoading(true);
  setError("");
  setCurrentStep(2);

  const progress = createProgressHandler();
  progress.start("analyzing");

  try {
    console.log("Starting queue-based valuation analysis...");
    console.log("DEBUG: multiplierSettings =", multiplierSettings);

    // VAIHE 1: Queue ensimmäinen raskas analyysi
    const analysisId = await valuationService.queueDocumentAnalysis(
      activeCompany.name, 
      uploadedFiles, 
      activeCompany.company_type,
      activeCompany.id,
      multiplierSettings.method,
      multiplierSettings.customMultipliers
    );

    setLatestValuationId(analysisId);
    console.log(`Analysis queued with ID: ${analysisId}`);

    toast({
      title: "Analyysi käynnistetty",
      description: "Dokumenttianalyysi käsitellään taustalla.",
      variant: "default"
    });

    // VAIHE 2: Pollaa kunnes ensimmäinen vaihe valmis
    let attempts = 0;
    const maxAttempts = 120; // 10 minuuttia

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const status = await valuationService.pollAnalysisStatus(analysisId);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          progress.update("analyzing", 95);

          // Tarkista onko kysymyksiä
          if (status.questions && status.questions.length > 0) {
            setFinancialQuestions(status.questions);
            setInitialFindings(status.initial_findings);
            setRequiresUserInput(true);
            setCurrentStep(3);

            toast({
              title: "Dokumenttianalyysi valmis",
              description: "Vastaa kysymyksiin tarkemman analyysin saamiseksi."
            });
          } else {
            // Tämä ei pitäisi koskaan tapahtua, koska Gemini luo aina kysymyksiä
            console.error("UNEXPECTED: No questions generated by Gemini");
            handleError("Odottamaton virhe", new Error("Kysymyksiä ei luotu"));
          }

          progress.complete("analyzing");
          setIsLoading(false);

        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          handleError("Dokumenttianalyysi epäonnistui", new Error(status.error_message));
          setCurrentStep(1);

        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          handleError("Analyysi kesti liian kauan", new Error("Timeout"));
          setCurrentStep(1);
        }

      } catch (pollError) {
        console.error("Polling error:", pollError);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          handleError("Tilan tarkistus epäonnistui", pollError);
          setCurrentStep(1);
        }
      }
    }, 5000);

  } catch (err) {
    handleError("Analyysin aloitus epäonnistui", err);
    setCurrentStep(1);
  } finally {
    progress.cleanup();
    setIsLoading(false);
  }
};

  const loadValuation = async (valuation: any) => {
    if (!valuation?.results) {
      handleError("Arvonmäärityksen dataa ei löydy", new Error("Missing data"));
      return;
    }

    const results = valuation.results;

    setValuationReport(results.valuationReport || null);
    setFinancialAnalysis(results.financialAnalysis || null);
    setCompanyInfo(results.companyInfo || null);
    setRawApiData(results.rawApiData || null);
    setRequiresUserInput(results.requiresUserInput || false);
    setInitialFindings(results.initialFindings || null);

    resetFileState();

    const documentIds = valuation.document_ids || [];
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      const fileInfos = documentIds.map(id => ({
        id,
        name: typeof id === 'string' 
          ? (id.includes('/') ? id.split('/').pop() : `Dokumentti: ${id.substring(0,8)}...`) 
          : 'Tuntematon dokumentti',
        data: '',
        object: null
      }));

      setUploadedFiles(fileInfos);
      setSelectedDocuments(documentIds.filter(id => typeof id === 'string'));
    }

    setCurrentStep(4);
    setShowNewValuationForm(true);

    toast({
      title: "Arvonmääritys ladattu",
      description: `${valuation.company_name || 'Tuntematon yritys'} arvonmääritys on ladattu.`
    });
  };

  const startNewValuation = useCallback(() => {
    setShowNewValuationForm(true);
    resetValuationState();
    setLatestValuationId(null);
    setSelectedValuationId(null);
    setCurrentStep(1);
    resetFileState();
    resetAnalysisState();

    if (activeCompany) {
      fetchSavedDocuments();
    }
  }, [resetValuationState, setCurrentStep, setLatestValuationId, setSelectedValuationId, 
      setShowNewValuationForm, resetFileState, resetAnalysisState, activeCompany]);

  const handleBackToList = useCallback(() => {
    setShowNewValuationForm(false);
    resetValuationState();
    setSelectedValuationId(null);
  }, [setShowNewValuationForm, resetValuationState, setSelectedValuationId]);

  const handleShare = async () => {
    if (!latestValuationId && !selectedValuationId) {
      toast({
        title: "Virhe",
        description: "Arvonmääritystä ei löydy jaettavaksi",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    
    try {
      const valuationId = selectedValuationId || latestValuationId;
      const { data, error } = await supabase
        .from('valuations')
        .update({ is_public: true })
        .eq('id', valuationId)
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared/valuation/${valuationId}`;
      setShareUrl(url);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Linkki kopioitu!",
        description: "Jaettava linkki on kopioitu leikepöydälle",
      });
    } catch (error) {
      console.error('Error sharing valuation:', error);
      toast({
        title: "Virhe",
        description: "Jakaminen epäonnistui. Yritä uudelleen.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const renderDocumentSelection = () => (
    <div className="space-y-2 mt-4">
      <h3 className="text-md font-medium">Analysoitavat tiedostot ({uploadedFiles.length} kpl)</h3>
      <div className="space-y-2">
        {uploadedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
              {selectedDocuments.includes(file.id) && !file.id.startsWith('upload-') && (
                <Badge variant="success" className="text-xs bg-success/10 text-success">Tallennettu</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeUploadedFile(file.id)}
              className="h-7 w-7 p-0 flex-shrink-0 ml-2"
              aria-label={`Poista tiedosto ${file.name}`}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderValuationsList = () => {
    if (!isContentReady) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (savedValuations.length === 0 && !loadingValuations) {
      return (
        <EmptyValuationState 
          startNewValuation={startNewValuation}
          hasActiveCompany={!!activeCompany}
        />
      );
    }

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Arvonmääritykset</h2>
          <Button
            onClick={startNewValuation}
            className="gap-2 text-white"
            disabled={!activeCompany} 
          >
            <PlusCircle className="h-4 w-4 text-white" />
            Uusi arvonmääritys
          </Button>
        </div>

        {!activeCompany && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Yritystä ei valittu</AlertTitle>
            <AlertDescription>
              Valitse tai luo yritys profiilissa aloittaaksesi.
              <Button
                onClick={() => navigate("/profile")}
                className="mt-2 ml-2"
                size="sm"
                variant="outline"
              >
                Siirry profiiliin
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <ValuationsList
          valuations={savedValuations}
          isLoading={loadingValuations}
          onSelect={(valuation) => fetchValuationById(valuation.id)}
          onRefresh={fetchSavedValuations}
        />
      </div>
    );
  };

  const renderStep = () => {
    if (selectedValuationId && currentStep !== 4 && isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <span className="ml-4 text-lg">Ladataan arvonmääritystä...</span>
        </div>
      );
    }

    if (!selectedValuationId && !showNewValuationForm) {
      return renderValuationsList();
    }

    switch(currentStep) {
      case 1:
        return (
          <>
            <ValuationPrinciples />
            <div className="mb-6">
              <div className="border p-6 rounded-lg shadow-neumorphic">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 w-fit rounded-full flex items-center gap-1 text-xs py-1">
                      <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">1</div>
                      <span>/ 4</span>
                    </Badge>
                    <h2 className="text-xl font-bold">Yritystiedot ja dokumentit</h2>
                    {activeCompany ? (
                      <p className="text-muted-foreground mt-1">
                        Valitse analysoitavat tilinpäätöstiedostot yritykselle: {activeCompany.name} {activeCompany.company_type && `- ${activeCompany.company_type}`}
                      </p>
                    ) : (
                      <p className="text-warning mt-1">
                        Ei aktiivista yritystä valittuna. Siirry profiiliin luomaan tai valitsemaan yritys.
                      </p>
                    )}
                  </div>
                </div>

                {!activeCompany ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Yritystä ei valittu</AlertTitle>
                    <AlertDescription>
                      <p>Sinulla ei ole vielä valittua yritystä. Siirry profiilisivulle luomaan uusi yritys.</p>
                      <Button onClick={() => navigate("/profile")} className="mt-2">
                        Siirry profiiliin
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                      <h3 className="font-medium text-info mb-1">Aktiivinen yritys</h3>
                      <p className="text-info">
                        <span className="font-semibold">{activeCompany.name}</span>
                        {activeCompany.company_type && <span> ({activeCompany.company_type})</span>}
                      </p>
                      {activeCompany.business_id && (
                        <p className="text-sm text-info mt-1">Y-tunnus: {activeCompany.business_id}</p>
                      )}
                    </div>

                    {uploadedFiles.length > 0 && renderDocumentSelection()}

                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <MultiplierSettings 
                          onSettingsChange={setMultiplierSettings}
                        />
                      </div>
                    )}

                    <div className="space-y-4 mt-6">
                      <h3 className="text-md font-medium border-t pt-4">Valitse tilinpäätökset alta, tai lisää tässä uusia tilinpäätöksiä analyysiin</h3>

                      <div className="border-dashed border-2 border-muted rounded-md p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-medium">Lataa uusi tiedosto</h4>
                        <p className="text-sm text-muted-foreground">
                          Valitse yksi tai useampi PDF, CSV tai TXT-tiedosto.
                        </p>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileUpload}
                          multiple
                          accept=".pdf,.csv,.xls,.xlsx,.txt"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={isLoading}
                          className="mt-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Käsitellään...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Selaa tiedostoja
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-md font-medium">Tai valitse tallennetuista</h3>
                        {loadingDocuments ? (
                          <div className="flex items-center text-info">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ladataan dokumentteja...
                          </div>
                        ) : savedDocuments.length === 0 ? (
                          <Alert>
                            <AlertTitle>Ei tallennettuja dokumentteja</AlertTitle>
                            <AlertDescription>
                              Voit ladata dokumentteja yrityksellesi profiilisivulla.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                            {savedDocuments.map((doc) => (
                              <Button
                                key={doc.id}
                                variant={selectedDocuments.includes(doc.id) ? "secondary" : "outline"}
                                className={`w-full justify-start text-left h-auto py-2 ${
                                  selectedDocuments.includes(doc.id) ? 'border-primary ring-1 ring-primary' : ''
                                }`}
                                onClick={() => toggleDocument(doc.id, doc.name)}
                              >
                                <FileText
                                  className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                    selectedDocuments.includes(doc.id) ? 'text-primary' : 'text-muted-foreground'
                                  }`}
                                />
                                <div className="flex-grow overflow-hidden">
                                  <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Ladattu: {formatDate(doc.created_at)}
                                  </p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/profile")}
                          className="w-full mt-2 flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Hallinnoi dokumentteja profiilissa
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Virhe</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end pt-6 border-t mt-6">
                      <Button
                        onClick={analyzeCompany}
                        disabled={!activeCompany || isLoading || uploadedFiles.length === 0}
                        size="lg"
                        className="rounded-full text-white"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                            Analysoidaan...
                          </>
                        ) : (
                          <>
                            Analysoi yritys
                            <ArrowRight className="ml-2 h-4 w-4 text-white" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <ValuationLoadingStep
            stage={analysisStage}
            progress={analysisProgress}
            error={error}
            currentStep={2}
            totalSteps={4}
          />
        );

      case 2.5:
      case 3:
        return (
          <ValuationPathQuestionForm
            questions={financialQuestions}
            initialFindings={initialFindings}
            companyName={activeCompany?.name || ""}
            companyType={activeCompany?.company_type}
            onSubmit={handleAnswersSubmit}
            isProcessing={isProcessing}
            currentStep={3}
            totalSteps={4}
          />
        );

      case 4:
        return (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <Button onClick={handleBackToList} variant="outline">
                ← Takaisin listaan
              </Button>
              {financialAnalysis?.company?.name && (
                <h2 className="text-lg font-semibold text-center flex-grow">
                  Arvonmääritys: {financialAnalysis.company.name}
                </h2>
              )}
              <Button
                onClick={() => navigate('/assessment')}
                className="gap-2 text-white"
                disabled={!activeCompany} 
              >
                <PlusCircle className="h-4 w-4 text-white" />
                Siirry myyntikunnon analysointiin
              </Button>
            </div>

            {/* Step indicator for the final step */}
            <Badge variant="outline" className="mb-4 w-fit rounded-full flex items-center gap-1 text-xs py-1">
              <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">4</div>
              <span>/ 4</span>
            </Badge>

            {financialAnalysis?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Analyysivirhe</AlertTitle>
                <AlertDescription>{financialAnalysis.error}</AlertDescription>
              </Alert>
            )}

            {valuationReport?.error && !financialAnalysis?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Raportointivirhe</AlertTitle>
                <AlertDescription>{valuationReport.error}</AlertDescription>
              </Alert>
            )}

            {valuationReport && !valuationReport.error && financialAnalysis && !financialAnalysis.error ? (
              <>
                <ValuationDashboard
                  companyName={financialAnalysis?.company?.name || companyInfo?.structuredData?.company_name || companyInfoAnalysis?.yrityksenNimi || ""}
                  companyType={activeCompany?.company_type}
                  businessId={financialAnalysis?.company?.business_id || companyInfo?.structuredData?.business_id}
                  valuationDate={valuationDate}
                  mostLikelyValue={
                    valuationReport?.valuation_numbers?.most_likely_value || 
                    latestPeriod?.valuation_metrics?.average_equity_valuation || 
                    0
                  }
                  minValue={
                    valuationReport?.valuation_numbers?.range?.low || 
                    latestPeriod?.valuation_metrics?.equity_valuation_range?.low || 
                    0
                  }
                  maxValue={
                    valuationReport?.valuation_numbers?.range?.high || 
                    latestPeriod?.valuation_metrics?.equity_valuation_range?.high || 
                    0
                  }
                  bookValue={valuationReport?.valuation_numbers?.book_value}
                  netDebt={valuationReport?.valuation_numbers?.calculated_net_debt}
                  ebitda={latestPeriod?.calculated_fields?.ebitda_estimated || latestPeriod?.income_statement?.ebitda}
                  ebit={latestPeriod?.income_statement?.ebit}
                  revenue={latestPeriod?.income_statement?.revenue}
                  netProfit={latestPeriod?.income_statement?.net_income}
                  methodsCount={valuationReport?.valuation_numbers?.valuation_methods_in_average}
                />

                <ImprovedValuationTabs
                  valuationReport={valuationReport}
                  financialAnalysis={financialAnalysis}
                  companyInfo={companyInfo}
                  latestPeriod={latestPeriod}
                  companyInfoAnalysis={companyInfoAnalysis}
                  swotData={swotData}
                />
              </>
            ) : (
              <>
                {financialAnalysis && !financialAnalysis.error && (
                  <EnhancedValuationSummary 
                    financialAnalysis={financialAnalysis} 
                    companyInfo={companyInfo} 
                  />
                )}

                {valuationReport && !valuationReport.error && (
                  <EnhancedValuationReport report={valuationReport} />
                )}
              </>
            )}

            {/* Next Steps Section - Always show when valuation is complete */}
            {valuationReport && !valuationReport.error && (
              <ValuationNextSteps 
                onShare={handleShare}
                valuationId={selectedValuationId || latestValuationId}
                companyName={financialAnalysis?.company?.name || activeCompany?.name}
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      pageTitle=""
      pageDescription=""
      showBackButton={showNewValuationForm || !!selectedValuationId}
      onBackButtonClick={handleBackToList}
    >
      <div className="space-y-6">
        {renderStep()}
      </div>
    </DashboardLayout>
  );
};

export default Valuation;