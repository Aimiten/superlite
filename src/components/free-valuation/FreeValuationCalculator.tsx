
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Upload, PenLine, ChevronRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinancialValues } from "./types";
import ValuationQuestionForm from "./ValuationQuestionForm";

interface FreeValuationCalculatorProps {
  companyId: string;
  setCompanyId: (value: string) => void;
  inputMethod: string;
  setInputMethod: (value: "upload" | "manual") => void;
  file: File | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  financialData: any;
  setFinancialData: (data: any) => void;
  setCalculationStatus: (status: "idle" | "loading" | "complete" | "error") => void;
  setValuationResults: (results: any) => void;
  companyName?: string;
}

const FreeValuationCalculator: React.FC<FreeValuationCalculatorProps> = ({
  companyId,
  setCompanyId,
  inputMethod,
  setInputMethod,
  file,
  handleFileUpload,
  financialData,
  setFinancialData,
  setCalculationStatus,
  setValuationResults,
  companyName = "",
}) => {
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<FinancialValues>({
    revenue: "",
    profit: "",
    assets: "",
    liabilities: "",
  });
  
  // States for two-phase analysis
  const [requiresUserInput, setRequiresUserInput] = useState(false);
  const [financialQuestions, setFinancialQuestions] = useState<any[]>([]);
  const [initialFindings, setInitialFindings] = useState<any>(null);
  const [cachedFileBase64, setCachedFileBase64] = useState<string>("");
  const [cachedFileMimeType, setCachedFileMimeType] = useState<string>("");
  
  // New state for retries
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  // New function to call edge function with retry logic
  const callEdgeFunctionWithRetry = async (functionName: string, payload: any, currentRetry = 0): Promise<any> => {
    try {
      console.log(`Calling ${functionName} edge function (attempt ${currentRetry + 1}/${MAX_RETRIES + 1})`);
      
      // Pre-warm the function with a simple OPTIONS request
      if (currentRetry === 0) {
        try {
          // Create a very simple fetch request just to warm up the function
          const warmupUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
          const warmupResponse = await fetch(warmupUrl, {
            method: 'OPTIONS',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          });
          console.log(`Warmup request for ${functionName} responded with status:`, warmupResponse.status);
        } catch (warmupError) {
          console.log(`Warmup request failed, but continuing with main request:`, warmupError);
          // Intentionally not failing here, just continue with the main request
        }
      }
      
      // Small delay between retries
      if (currentRetry > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * currentRetry));
      }
      
      // Actual request
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        console.error(`Error from ${functionName} edge function:`, error);
        throw new Error(error.message || `${functionName} function call failed`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error calling ${functionName} (attempt ${currentRetry + 1}):`, error);
      
      // Check if we should retry
      if (currentRetry < MAX_RETRIES) {
        console.log(`Retrying ${functionName} call (${currentRetry + 1}/${MAX_RETRIES})...`);
        return callEdgeFunctionWithRetry(functionName, payload, currentRetry + 1);
      }
      
      // If we've exhausted our retries, propagate the error
      throw error;
    }
  };

  const handleCalculate = async () => {
    setError(null);
    console.log("=== STARTING FREE VALUATION CALCULATION ===");
    console.log("Input method:", inputMethod);
    console.log("Company name:", companyName);
    
    if (inputMethod === "upload" && !file) {
      setError("Valitse tilinpäätöstiedosto ennen jatkamista.");
      return;
    }
    
    if (inputMethod === "manual") {
      const requiredFields = Object.entries(values);
      const missingFields = requiredFields.filter(([_, value]) => !value.trim());
      
      if (missingFields.length > 0) {
        setError("Täytä kaikki taloudelliset tiedot ennen jatkamista.");
        return;
      }
      
      const invalidFields = Object.entries(values).filter(([_, value]) => isNaN(Number(value.replace(/\s/g, "").replace(",", "."))));
      if (invalidFields.length > 0) {
        setError("Syötä vain numeroita taloudellisiin tietoihin.");
        return;
      }
    }
    
    if (!companyName) {
      setError("Yritystiedot puuttuvat. Hae yritys Y-tunnuksella ensin.");
      return;
    }
    
    console.log("Starting free valuation calculation with company name:", companyName);
    setIsProcessing(true);
    setCalculationStatus("loading");
    
    try {
      if (inputMethod === "manual") {
        console.log("=== MANUAL INPUT CALCULATION PATH ===");
        console.log("Manual input values:", values);
        
        // Parse manual inputs for the edge function
        const parsedInputs = {
          revenue: parseFloat(values.revenue.replace(/\s/g, "").replace(",", ".")) || 0,
          profit: parseFloat(values.profit.replace(/\s/g, "").replace(",", ".")) || 0,
          assets: parseFloat(values.assets.replace(/\s/g, "").replace(",", ".")) || 0,
          liabilities: parseFloat(values.liabilities.replace(/\s/g, "").replace(",", ".")) || 0
        };
        
        console.log("Parsed manual inputs:", parsedInputs);
        
        // Call the free-valuation edge function with manual inputs using retry logic
        console.log("Calling free-valuation edge function with manual data");
        const data = await callEdgeFunctionWithRetry('free-valuation', {
          companyName,
          manualInputs: parsedInputs
        });
        
        console.log("Free valuation response from edge function:", JSON.stringify(data, null, 2));
        
        // Ensure the company name is included in the results
        const resultsWithCompanyName = {
          companyName,
          finalAnalysis: data
        };
        
        console.log("Final results with company name:", JSON.stringify(resultsWithCompanyName, null, 2));
        setValuationResults(resultsWithCompanyName);
        setCalculationStatus("complete");
        
        toast({
          title: "Arvonmääritys valmis",
          description: "Tarkastele tuloksia",
        });
      } else if (inputMethod === "upload" && file) {
        console.log("=== FILE UPLOAD CALCULATION PATH ===");
        console.log("File details:", file.name, file.type, file.size, "bytes");
        
        try {
          const fileBase64 = await fileToBase64(file);
          console.log("File converted to base64 for processing, length:", fileBase64.length);
          console.log("File MIME type:", file.type);
          
          // For file uploads we use the free-valuation endpoint (changed from valuation)
          console.log("Calling free-valuation edge function with file data");
          const data = await callEdgeFunctionWithRetry('free-valuation', {
            companyName,
            fileBase64,
            fileMimeType: file.type
          });
          
          console.log("Free valuation response from edge function:", JSON.stringify(data, null, 2));
          
          // Check if questions were identified and user input is required
          if (data.requiresUserInput && data.financialQuestions && data.financialQuestions.length > 0) {
            console.log("Questions identified, user input required:", data.financialQuestions.length, "questions");
            
            setRequiresUserInput(true);
            setFinancialQuestions(data.financialQuestions);
            setInitialFindings(data.initialFindings || null);
            
            // Cache the file data for the second phase
            setCachedFileBase64(fileBase64);
            setCachedFileMimeType(file.type);
            
            setCalculationStatus("idle");
            setIsProcessing(false);
            
            toast({
              title: "Tarkennusta tarvitaan",
              description: "Ole hyvä ja vastaa kysymyksiin tarkemman analyysin saamiseksi",
            });
            
            return;
          }
          
          // If no user input required, proceed with the results
          const resultsWithCompanyName = {
            companyName,
            finalAnalysis: data.financialAnalysis || data
          };
          
          console.log("Final results with company name:", JSON.stringify(resultsWithCompanyName, null, 2));
          setValuationResults(resultsWithCompanyName);
          setCalculationStatus("complete");
          
          toast({
            title: "Arvonmääritys valmis",
            description: "Tarkastele tuloksia ja suosituksia",
          });
        } catch (fileError) {
          console.error("Error processing file:", fileError);
          throw new Error("Tiedoston käsittely epäonnistui");
        }
      } else {
        throw new Error("Valitse tiedosto tai syötä tiedot manuaalisesti");
      }
    } catch (error) {
      console.error("Free valuation calculation error:", error);
      
      setError(error instanceof Error ? error.message : "Arvonmäärityksen laskeminen epäonnistui");
      setCalculationStatus("error");
      
      toast({
        title: "Virhe",
        description: "Arvonmäärityksen laskeminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      console.log("=== FREE VALUATION CALCULATION COMPLETE ===");
    }
  };

  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
    console.log("=== SUBMITTING ANSWERS TO QUESTIONS ===");
    console.log("Answers:", answers);
    
    if (!companyName || !cachedFileBase64) {
      setError("Yritystiedot tai tiedosto puuttuu.");
      return;
    }
    
    setIsProcessing(true);
    setCalculationStatus("loading");
    
    try {
      // Call the free-valuation edge function with user's answers using retry logic
      const data = await callEdgeFunctionWithRetry('free-valuation', {
        companyName,
        fileBase64: cachedFileBase64,
        fileMimeType: cachedFileMimeType,
        financialQuestionAnswers: answers
      });
      
      console.log("Free valuation response after answers:", JSON.stringify(data, null, 2));
      
      // Reset the question form
      setRequiresUserInput(false);
      setFinancialQuestions([]);
      setInitialFindings(null);
      
      // Process the results
      const resultsWithCompanyName = {
        companyName,
        finalAnalysis: data
      };
      
      console.log("Final results with company name:", JSON.stringify(resultsWithCompanyName, null, 2));
      setValuationResults(resultsWithCompanyName);
      setCalculationStatus("complete");
      
      toast({
        title: "Arvonmääritys valmis",
        description: "Tarkastele tuloksia ja suosituksia",
      });
    } catch (answerError) {
      console.error("Error processing answers:", answerError);
      
      setError(answerError instanceof Error ? answerError.message : "Vastausten käsittely epäonnistui");
      setCalculationStatus("error");
      
      toast({
        title: "Virhe",
        description: "Vastausten käsittely epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      console.log("=== ANSWERS PROCESSING COMPLETE ===");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject("Tiedoston muunto base64-muotoon epäonnistui");
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // If questions are active, show the question form instead of the normal calculator
  if (requiresUserInput && financialQuestions.length > 0) {
    return (
      <ValuationQuestionForm
        questions={financialQuestions}
        initialFindings={initialFindings}
        fileBase64={cachedFileBase64}
        fileMimeType={cachedFileMimeType}
        companyName={companyName}
        onSubmit={handleQuestionsSubmit}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-800 mb-4">
        Syötä taloudelliset tiedot
      </h3>
      
      <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as "upload" | "manual")} className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>Lataa tilinpäätös</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            <span>Syötä manuaalisesti</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".pdf"
              className="sr-only"
              onChange={handleFileUpload}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              
              <div className="text-sm">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <span>Lataa tilinpäätös</span>
                </label>
                <p className="text-gray-500 mt-1">PDF-tiedosto, maks. 10 MB</p>
              </div>
              
              {file && (
                <div className="mt-2 text-gray-900 bg-gray-50 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
            <p className="font-medium mb-2">Gemini-tekoälyn PDF-käsittely</p>
            <p>PDF-tiedostot analysoidaan Geminin natiivin kuva- ja tekstikäsittelyn avulla. 
            Tekoäly pystyy ymmärtämään tilinpäätösdokumentteja kokonaisuutena, 
            mukaan lukien taulukot, kaaviot ja visuaalisen sisällön.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="revenue" className="block text-sm font-medium text-gray-700">
                Liikevaihto (€)
              </label>
              <Input
                id="revenue"
                name="revenue"
                placeholder="esim. 350000"
                value={values.revenue}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="profit" className="block text-sm font-medium text-gray-700">
                Tulos (€)
              </label>
              <Input
                id="profit"
                name="profit"
                placeholder="esim. 45000"
                value={values.profit}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="assets" className="block text-sm font-medium text-gray-700">
                Varat yhteensä (€)
              </label>
              <Input
                id="assets"
                name="assets"
                placeholder="esim. 120000"
                value={values.assets}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="liabilities" className="block text-sm font-medium text-gray-700">
                Velat yhteensä (€)
              </label>
              <Input
                id="liabilities"
                name="liabilities"
                placeholder="esim. 70000"
                value={values.liabilities}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleCalculate} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <span className="mr-2">Lasketaan arvonmääritystä...</span>
            <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
          </>
        ) : (
          <>
            <span>Laske arvonmääritys</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};

export default FreeValuationCalculator;
