
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBarChart, TrendingUp, Calculator, ArrowRight, Upload, Check, Loader2, AlertTriangle, FileText, Info, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ValuationReport from "@/components/valuation/ValuationReport";
import ValuationSummary from "@/components/valuation/ValuationSummary";
import ValuationsList from "@/components/valuation/ValuationsList";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { readFileAsText, readFileAsBase64 } from "@/components/assessment/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import ValuationQuestionForm from "@/components/free-valuation/ValuationQuestionForm";
import { callEdgeFunction } from "@/utils/edge-function";

const Valuation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [companyInfo, setCompanyInfo] = useState(null);
  const [financialAnalysis, setFinancialAnalysis] = useState(null);
  const [valuationReport, setValuationReport] = useState(null);
  const [rawApiData, setRawApiData] = useState(null);
  const [savedValuations, setSavedValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showNewValuationForm, setShowNewValuationForm] = useState(false);
  const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
  const [requiresUserInput, setRequiresUserInput] = useState(false);
  const [financialQuestions, setFinancialQuestions] = useState<any[]>([]);
  const [initialFindings, setInitialFindings] = useState<any>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const valuationId = searchParams.get('id');
    
    if (valuationId) {
      setSelectedValuationId(valuationId);
      fetchValuationById(valuationId);
    } else {
      setShowNewValuationForm(false);
      setStep(1);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      fetchSavedValuations();
      fetchSavedDocuments();
    }
  }, [user, activeCompany]);

  const handleAnswersSubmit = async (answers: Record<string, string>) => {
    if (!activeCompany) {
      toast({
        title: "Virhe",
        description: "Valitse ensin yritys",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError("");
    
    try {
      console.log("Processing answers:", answers);
      
      // Define the request body with a proper type that includes all possible properties
      const requestBody: {
        companyName: string;
        fileData: string;
        financialQuestionAnswers: Record<string, string>;
        fileBase64?: string;
        fileMimeType?: string;
        companyType?: string;
      } = {
        companyName: activeCompany.name,
        fileData: fileData,
        financialQuestionAnswers: answers
      };
      
      // Always include fileBase64 and fileMimeType if they exist, regardless of file type
      if (fileBase64) {
        requestBody.fileBase64 = fileBase64;
        requestBody.fileMimeType = fileMimeType || "text/plain";
      }
      
      if (activeCompany.company_type) {
        requestBody.companyType = activeCompany.company_type;
      }
      
      console.log("Sending complete answers to backend:", {
        companyName: requestBody.companyName,
        hasFileData: !!requestBody.fileData,
        hasFileBase64: !!requestBody.fileBase64,
        fileMimeType: requestBody.fileMimeType || "not provided",
        companyType: requestBody.companyType || "not provided",
        answerCount: Object.keys(answers).length
      });
      
      // Use the new callEdgeFunction utility with retry logic
      const { data, error: apiError } = await callEdgeFunction('valuation', requestBody, {
        maxRetries: 3,
        showToasts: true
      });
      
      if (apiError) {
        console.error("Supabase function error:", apiError);
        throw new Error(apiError.message);
      }
      
      console.log("Analysis results after answers:", data);
      
      setRawApiData(data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.companyInfo) {
        setCompanyInfo(data.companyInfo);
      }
      
      if (data.financialAnalysis) {
        setFinancialAnalysis(data.financialAnalysis);
      }
      
      if (data.finalAnalysis) {
        console.log("Setting valuation report:", data.finalAnalysis);
        setValuationReport(data.finalAnalysis);
        
        setTimeout(async () => {
          if (data.finalAnalysis && !data.finalAnalysis.error && user && activeCompany) {
            const savedResult = await saveValuationToDatabase(data.finalAnalysis);
            if (savedResult) {
              console.log("Valuation saved with report:", savedResult);
            }
          }
        }, 500);
      }
      
      setRequiresUserInput(false);
      setStep(3);
      
      toast({
        title: "Analyysi valmis",
        description: "Yrityksen arvonmääritys on suoritettu onnistuneesti.",
      });
    } catch (err) {
      console.error("Error processing answers:", err);
      setError("Vastausten käsittely epäonnistui: " + (err.message || "Tuntematon virhe"));
      toast({
        title: "Virhe",
        description: "Vastausten käsittely epäonnistui: " + (err.message || "Tuntematon virhe"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchValuationById = async (id: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log(`Fetching valuation with ID: ${id}`);
      
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching valuation:", error);
        toast({
          title: "Virhe",
          description: "Arvonmäärityksen hakeminen epäonnistui",
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        console.log(`Loading valuation: ${data.company_name}`);
        loadValuation(data);
      }
    } catch (err) {
      console.error("Error in fetchValuationById:", err);
      toast({
        title: "Virhe",
        description: "Arvonmäärityksen hakeminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedValuations = async () => {
    if (!user) return;
    
    try {
      setLoadingValuations(true);
      console.log("Fetching valuations for Valuation page");
      
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching valuations:", error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} valuations`);
        setSavedValuations(data);
      } else {
        console.log("No valuations found");
        setSavedValuations([]);
      }
    } catch (err) {
      console.error("Error in fetchSavedValuations:", err);
    } finally {
      setLoadingValuations(false);
    }
  };

  const fetchSavedDocuments = async () => {
    if (!user || !activeCompany) return;
    
    try {
      setLoadingDocuments(true);
      console.log(`Fetching documents for company ID: ${activeCompany.id}`);
      
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', activeCompany.id);
      
      if (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Virhe",
          description: "Dokumenttien hakeminen epäonnistui: " + error.message,
          variant: "destructive",
        });
        setSavedDocuments([]);
        return;
      }
      
      console.log(`Found ${data?.length || 0} documents for company ${activeCompany.name}:`, data);
      
      if (data && data.length > 0) {
        setSavedDocuments(data);
      } else {
        setSavedDocuments([]);
      }
    } catch (err) {
      console.error("Error in fetchSavedDocuments:", err);
      toast({
        title: "Virhe",
        description: "Dokumenttien hakeminen epäonnistui",
        variant: "destructive",
      });
      setSavedDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user || !file) return null;
    
    try {
      const filePath = `${user.id}/${file.name}`;
      
      const { data, error } = await supabase
        .storage
        .from('valuation_documents')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
      
      if (error) {
        console.error("Error uploading document:", error);
        return null;
      }
      
      return filePath;
    } catch (err) {
      console.error("Error in uploadDocument:", err);
      return null;
    }
  };

  const getDocumentContent = async (filePath: string) => {
    try {
      console.log(`Fetching document content for path: ${filePath}`);
      
      if (!filePath.includes('/')) {
        console.log("Path appears to be a document ID, fetching document details first");
        const { data: document, error: docError } = await supabase
          .from('company_documents')
          .select('*')
          .eq('id', filePath)
          .single();
          
        if (docError || !document) {
          console.error("Error fetching document details:", docError);
          toast({
            title: "Virhe",
            description: "Dokumentin tietojen hakeminen epäonnistui",
            variant: "destructive",
          });
          return null;
        }
        
        if (document && document.file_path) {
          console.log(`Using document file path: ${document.file_path}`);
          filePath = document.file_path;
        }
      }
      
      const bucketName = filePath.startsWith('valuation_documents/') 
        ? 'valuation_documents' 
        : 'company_documents';
      
      console.log(`Downloading from bucket: ${bucketName}`);
      
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from(bucketName)
        .download(filePath);
      
      if (fileError) {
        console.error("Error downloading document:", fileError);
        toast({
          title: "Virhe",
          description: "Dokumentin lataaminen epäonnistui: " + fileError.message,
          variant: "destructive",
        });
        return null;
      }
      
      const fileName = filePath.split('/').pop() || 'unnamed_file';
      const file = new File([fileData], fileName, { 
        type: fileData.type,
        lastModified: new Date().getTime()
      });
      
      console.log(`Successfully downloaded file ${fileName}, mime type: ${file.type}`);
      
      const text = await readFileAsText(file);
      let base64 = null;
      
      if (file.type === "application/pdf") {
        base64 = await readFileAsBase64(file);
      }
      
      return {
        text,
        base64,
        mimeType: file.type,
        name: fileName
      };
    } catch (err) {
      console.error("Error retrieving document content:", err);
      toast({
        title: "Virhe",
        description: "Dokumentin sisällön hakeminen epäonnistui",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setFileUploaded(true);
    setIsLoading(true);
    setError("");
    setFileMimeType(file.type);
    setFileObject(file);
    
    try {
      const text = await readFileAsText(file);
      setFileData(text);
      
      if (file.type === "application/pdf") {
        const base64 = await readFileAsBase64(file);
        setFileBase64(base64);
      }
      
      toast({
        title: "Tiedosto ladattu",
        description: "Tilinpäätöstiedosto on ladattu onnistuneesti.",
      });
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Tiedoston lukeminen epäonnistui");
      toast({
        title: "Virhe",
        description: "Tiedoston lukeminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectSavedDocument = async (documentId: string, documentName: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      console.log(`Selecting document ${documentId} (${documentName})`);
      
      const { data: document } = await supabase
        .from('company_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (!document || !document.file_path) {
        throw new Error("Tiedoston hakeminen epäonnistui");
      }
      
      console.log("Document data:", document);
      
      const documentContent = await getDocumentContent(document.file_path);
      
      if (!documentContent) {
        throw new Error("Tiedoston sisällön hakeminen epäonnistui");
      }
      
      setFileName(documentName);
      setFileData(documentContent.text);
      setFileUploaded(true);
      setFileMimeType(documentContent.mimeType);
      
      if (documentContent.base64) {
        setFileBase64(documentContent.base64);
      }
      
      setSelectedDocument(document.id);
      
      toast({
        title: "Tallennettu tiedosto valittu",
        description: "Aiemmin tallennettu tiedosto on valittu onnistuneesti.",
      });
    } catch (err) {
      console.error("Error selecting saved document:", err);
      setError("Tiedoston valinta epäonnistui: " + (err instanceof Error ? err.message : String(err)));
      toast({
        title: "Virhe",
        description: "Tiedoston valinta epäonnistui: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveValuationToDatabase = async (reportData = null) => {
    const reportToSave = reportData || valuationReport;
    
    if (!user || !reportToSave || !activeCompany) {
      console.log("Cannot save valuation - missing required data:", { 
        hasUser: !!user, 
        hasValuationReport: !!reportToSave, 
        hasActiveCompany: !!activeCompany 
      });
      return null;
    }
    
    try {
      console.log("Starting to save valuation to database for company:", activeCompany.name);
      let documentPath = null;
      
      if (fileObject && !selectedDocument) {
        console.log("Uploading new document...");
        documentPath = await uploadDocument(fileObject);
        console.log("Document uploaded, path:", documentPath);
      } else if (selectedDocument) {
        console.log("Using existing document:", selectedDocument);
        documentPath = selectedDocument;
      }
      
      const valuationData = {
        user_id: user.id,
        company_id: activeCompany.id,
        company_name: activeCompany.name,
        document_path: documentPath,
        results: {
          valuationReport: reportToSave,
          financialAnalysis,
          companyInfo,
          rawApiData
        }
      };
      
      console.log("Saving valuation data to Supabase:", valuationData);
      
      const { data, error } = await supabase
        .from('valuations')
        .insert(valuationData)
        .select();
      
      if (error) {
        console.error("Error saving valuation:", error);
        toast({
          title: "Virhe",
          description: "Arvonmäärityksen tallentaminen epäonnistui: " + error.message,
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Valuation saved successfully:", data);
      
      toast({
        title: "Tallennettu",
        description: "Arvonmääritys on tallennettu onnistuneesti.",
      });
      
      await fetchSavedValuations();
      
      return data;
    } catch (err) {
      console.error("Error in saveValuationToDatabase:", err);
      toast({
        title: "Virhe",
        description: "Arvonmäärityksen tallentaminen epäonnistui: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      });
      return null;
    }
  };

  const analyzeCompany = async () => {
    if (!activeCompany) {
      toast({
        title: "Virhe",
        description: "Valitse ensin yritys",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDocument && !fileUploaded) {
      toast({
        title: "Virhe",
        description: "Valitse tilinpäätöstiedosto ennen analysointia",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError("");
    setStep(2);
    
    try {
      const requestBody: {
        companyName: string;
        fileData: string;
        fileBase64?: string;
        fileMimeType?: string;
        companyType?: string;
      } = { 
        companyName: activeCompany.name,
        fileData: fileData
      };
      
      // Always include fileBase64 and fileMimeType if they exist, regardless of file type
      if (fileBase64) {
        requestBody.fileBase64 = fileBase64;
        requestBody.fileMimeType = fileMimeType || "text/plain";
      }
      
      if (activeCompany.company_type) {
        requestBody.companyType = activeCompany.company_type;
      }
      
      console.log("Sending initial analysis request with:", {
        companyName: requestBody.companyName,
        hasFileData: !!requestBody.fileData,
        hasFileBase64: !!requestBody.fileBase64,
        fileMimeType: requestBody.fileMimeType || "not provided",
        companyType: requestBody.companyType || "not provided"
      });
      
      // Use the new callEdgeFunction utility with retry logic
      const { data, error: apiError } = await callEdgeFunction('valuation', requestBody, {
        maxRetries: 3,
        showToasts: true
      });
      
      if (apiError) {
        console.error("Supabase function error:", apiError);
        throw new Error(apiError.message);
      }
      
      console.log("Analysis results:", data);
      
      setRawApiData(data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.requiresUserInput && data.financialQuestions && data.financialQuestions.length > 0) {
        console.log("Questions identified, requiring user input:", data.financialQuestions);
        setRequiresUserInput(true);
        setFinancialQuestions(data.financialQuestions);
        setInitialFindings(data.initialFindings || null);
        setStep(2.5); // Special step for questions
        setIsProcessing(false);
        
        toast({
          title: "Tarkennusta tarvitaan",
          description: "Ole hyvä ja vastaa kysymyksiin tarkemman analyysin saamiseksi",
        });
        
        return;
      }
      
      if (data.companyInfo) {
        if (data.companyInfo.error) {
          console.warn("Company info error:", data.companyInfo.error);
          toast({
            title: "Varoitus",
            description: "Yrityksen taustatietojen haussa oli ongelmia: " + data.companyInfo.error,
            variant: "warning",
          });
        } else {
          setCompanyInfo(data.companyInfo);
        }
      }
      
      if (data.financialAnalysis) {
        if (data.financialAnalysis.error) {
          console.warn("Financial analysis error:", data.financialAnalysis.error);
          toast({
            title: "Varoitus",
            description: "Tilinpäätöstietojen analysoinnissa oli ongelmia: " + data.financialAnalysis.error,
            variant: "warning",
          });
        } else {
          setFinancialAnalysis(data.financialAnalysis);
        }
      }
      
      if (data.finalAnalysis) {
        if (data.finalAnalysis.error) {
          console.warn("Final analysis error:", data.finalAnalysis.error);
          throw new Error(data.finalAnalysis.error);
        } else {
          console.log("Setting valuation report:", data.finalAnalysis);
          setValuationReport(data.finalAnalysis);
          
          setTimeout(async () => {
            if (data.finalAnalysis && !data.finalAnalysis.error && user && activeCompany) {
              const savedResult = await saveValuationToDatabase(data.finalAnalysis);
              if (savedResult) {
                console.log("Valuation saved with report:", savedResult);
              }
            }
          }, 500);
        }
      } else {
        console.warn("No final analysis data received");
        throw new Error("Kokonaisanalyysia ei voitu suorittaa");
      }
      
      setStep(3);
      
      toast({
        title: "Analyysi valmis",
        description: "Yrityksen arvonmääritys on suoritettu onnistuneesti.",
      });
    } catch (err) {
      console.error("Error analyzing company:", err);
      setError("Yrityksen analysointi epäonnistui: " + (err.message || "Tuntematon virhe"));
      toast({
        title: "Virhe",
        description: "Yrityksen analysointi epäonnistui: " + (err.message || "Tuntematon virhe"),
        variant: "destructive",
      });
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const loadValuation = async (valuation) => {
    if (!valuation || !valuation.results) return;
    
    const results = valuation.results;
    
    setValuationReport(results.valuationReport || null);
    setFinancialAnalysis(results.financialAnalysis || null);
    setCompanyInfo(results.companyInfo || null);
    setRawApiData(results.rawApiData || null);
    
    if (valuation.document_path) {
      setSelectedDocument(valuation.document_path);
      setFileUploaded(true);
      setFileName(valuation.document_path.split('/').pop());
      
      try {
        const documentContent = await getDocumentContent(valuation.document_path);
        if (documentContent) {
          setFileData(documentContent.text);
          setFileMimeType(documentContent.mimeType);
          if (documentContent.base64) {
            setFileBase64(documentContent.base64);
          }
        }
      } catch (err) {
        console.error("Error loading document:", err);
      }
    }
    
    setStep(3);
    setShowNewValuationForm(true);
    
    toast({
      title: "Arvonmääritys ladattu",
      description: `${valuation.company_name} arvonmääritys on ladattu.`,
    });
  };

  const startNewValuation = () => {
    navigate('/valuation');
    
    setShowNewValuationForm(true);
    setStep(1);
    setFileUploaded(false);
    setFileName("");
    setFileData("");
    setFileBase64("");
    setFileMimeType("");
    setFileObject(null);
    setError("");
    setCompanyInfo(null);
    setFinancialAnalysis(null);
    setValuationReport(null);
    setRawApiData(null);
    setSelectedDocument(null);
    setSelectedValuationId(null);
  };

  const navigateToProfile = () => {
    navigate("/profile");
  };

  const handleBackToList = () => {
    navigate('/valuation');
    setShowNewValuationForm(false);
    setSelectedValuationId(null);
    setTimeout(() => {
      fetchSavedValuations();
    }, 100);
  };

  const renderValuationsList = () => {
    return (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Arvonmääritykset</CardTitle>
            <CardDescription>
              Aiemmat yrityksesi arvonmääritykset
            </CardDescription>
          </div>
          <Button 
            onClick={startNewValuation}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Uusi arvonmääritys
          </Button>
        </CardHeader>
        <CardContent>
          <ValuationsList 
            valuations={savedValuations} 
            isLoading={loadingValuations}
            onSelect={(valuation) => navigate(`/valuation?id=${valuation.id}`)}
            onRefresh={fetchSavedValuations}
          />
        </CardContent>
      </Card>
    );
  };

  const renderStep = () => {
    if (!showNewValuationForm && step !== 3) {
      return renderValuationsList();
    }
    
    switch(step) {
      case 1:
        return (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-indigo-600" />
                  Arvonmäärityksen toimintaperiaate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">
                    Arvonmääritys perustuu yrityksestä ladattuihin tilinpäätöstietoihin ja tekoälyanalyysiin. 
                    Järjestelmä tekee seuraavat vaiheet:
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">1</div>
                      <p>Analysoi tilinpäätöstiedot ja tunnusluvut</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">2</div>
                      <p>Hakee tietoa yrityksestä ja sen toimialasta</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">3</div>
                      <p>Laskee arviot yrityksen arvosta eri menetelmillä (mm. substanssiarvo, tuottoarvo)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-medium">4</div>
                      <p>Muodostaa kokonaisanalyysin yrityksen vahvuuksista, heikkouksista ja arvosta</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Huom: Arvio on suuntaa-antava ja se perustuu saatavilla oleviin tietoihin. Tarkan arvonmäärityksen 
                    tekemiseksi suositellaan yhteydenottoa asiantuntijaan.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit rounded-full flex items-center gap-1 text-xs py-1">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">1</div>
                  <span>/ 3</span>
                </Badge>
                <CardTitle className="flex items-center">
                  <FileBarChart className="h-5 w-5 mr-2 text-indigo-600" />
                  Yritystiedot
                </CardTitle>
                {activeCompany ? (
                  <CardDescription>
                    {activeCompany.name} {activeCompany.company_type && `- ${activeCompany.company_type}`}
                  </CardDescription>
                ) : (
                  <CardDescription className="text-amber-600">
                    Ei aktiivista yritystä valittuna. Siirry profiiliin luomaan tai valitsemaan yritys.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!activeCompany ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Yritystä ei valittu</AlertTitle>
                      <AlertDescription>
                        <p>Sinulla ei ole vielä valittua yritystä. Siirry profiilisivulle luomaan uusi yritys.</p>
                        <Button 
                          onClick={navigateToProfile} 
                          className="mt-2"
                        >
                          Siirry profiiliin
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-1">Aktiivinen yritys</h3>
                        <p className="text-blue-700">
                          <span className="font-semibold">{activeCompany.name}</span>
                          {activeCompany.company_type && <span> ({activeCompany.company_type})</span>}
                        </p>
                        {activeCompany.business_id && (
                          <p className="text-sm text-blue-600 mt-1">Y-tunnus: {activeCompany.business_id}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium">Valitse tilinpäätöstiedosto</h3>
                        </div>

                        {savedDocuments.length === 0 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle>Ei dokumentteja</AlertTitle>
                            <AlertDescription>
                              <p>Sinulla ei ole vielä ladattuja tilinpäätöstiedostoja. Lataa ensin dokumentit profiilisivulla.</p>
                              <Button 
                                onClick={navigateToProfile} 
                                className="mt-2"
                                variant="outline"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Lataa lisää dokumentteja profiilissa
                              </Button>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-2">
                            {loadingDocuments ? (
                              <div className="flex items-center text-blue-600">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Haetaan dokumentteja...</span>
                              </div>
                            ) : (
                              <>
                                {savedDocuments.map((doc) => (
                                  <Button
                                    key={doc.id}
                                    variant={selectedDocument === doc.id ? "default" : "outline"}
                                    className={`w-full justify-start text-left`}
                                    onClick={() => selectSavedDocument(doc.id, doc.name)}
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div>{doc.name}</div>
                                    {selectedDocument === doc.id && <Check className="ml-auto h-4 w-4" />}
                                  </Button>
                                ))}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={navigateToProfile}
                                  className="w-full mt-2 flex items-center"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Lataa lisää dokumentteja profiilissa
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Virhe</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={analyzeCompany} 
                          disabled={!activeCompany || isLoading || (!fileUploaded && !selectedDocument)}
                          className="rounded-full"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Käsitellään...
                            </>
                          ) : (
                            <>
                              Analysoi yritys
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      case 2:
        return (
          <Card className="mb-6">
            <CardHeader>
              <Badge variant="outline" className="mb-2 w-fit rounded-full flex items-center gap-1 text-xs py-1">
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center font-medium">2</div>
                <span>/ 3</span>
              </Badge>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
                Analysointi käynnissä
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-xl font-medium mb-2">Analysoidaan yritystä</h3>
              <p className="text-slate-600 text-center max-w-md">
                Tekoäly analysoi yrityksen tietoja ja tilinpäätöstä. Tämä voi kestää muutaman minuutin.
              </p>
            </CardContent>
          </Card>
        );
        
      case 2.5:
        return (
          <Card className="mb-6">
            <CardHeader>
              <Badge variant="outline" className="mb-2 w-fit rounded-full flex items-center gap-1 text-xs py-1">
                <div className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center font-medium">2</div>
                <span>/ 3</span>
              </Badge>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
                Tarkenna tilinpäätöstietoja
              </CardTitle>
              <CardDescription>
                Tekoäly tunnisti seuraavat kysymykset tilinpäätöksestäsi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValuationQuestionForm
                questions={financialQuestions}
                initialFindings={initialFindings}
                fileBase64={fileBase64}
                fileMimeType={fileMimeType}
                companyName={activeCompany?.name || ""}
                companyType={activeCompany?.company_type}
                onSubmit={handleAnswersSubmit}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        );
        
      case 3:
        return (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={handleBackToList} variant="outline" className="mr-2">
                Takaisin listaan
              </Button>
              <Button onClick={startNewValuation} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Uusi arvonmääritys
              </Button>
            </div>
            
            {financialAnalysis && (
              <ValuationSummary financialAnalysis={financialAnalysis} companyInfo={companyInfo} />
            )}
            
            {valuationReport && (
              <ValuationReport 
                report={valuationReport} 
                rawData={rawApiData} 
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
      pageTitle="Automaattinen yrityksenarvonmääritys" 
      pageDescription="Saat valmiit arvonmääritysraportit yrityksestäsi, jotka perustuvat analysoituun dataan."
      showBackButton={true}
    >
      <div className="space-y-6">
        {renderStep()}
      </div>
    </DashboardLayout>
  );
};

export default Valuation;
