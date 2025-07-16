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
  setCompanyId: (id: string) => void;
  inputMethod: "upload" | "manual";
  setInputMethod: (method: "upload" | "manual") => void;
  file: File | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  financialData: Record<string, any> | null;
  setFinancialData: (data: Record<string, any> | null) => void;
  setCalculationStatus: (status: CalculationStatus) => void;
  setValuationResults: (results: ValuationResults | null) => void;
  companyName?: string;
  onQuestionsVisibilityChange?: (isShowingQuestions: boolean) => void;
  originalQuestions?: any[]; // Added originalQuestions prop
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
  onQuestionsVisibilityChange,
  originalQuestions, // Use originalQuestions prop
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
  //const MAX_RETRIES = 3; // Removed MAX_RETRIES

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  // New function to call edge function with retry logic
  const callEdgeFunctionWithRetry = async (functionName: string, payload: any, currentRetry = 0): Promise<any> => {
    try {
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
      //if (currentRetry < MAX_RETRIES) { // Removed MAX_RETRIES check
      if (currentRetry < 3) { //Added a hardcoded limit for testing.  This should be configurable.
        return callEdgeFunctionWithRetry(functionName, payload, currentRetry + 1);
      }

      // If we've exhausted our retries, propagate the error
      throw error;
    }
  };

  const handleCalculate = async () => {
    setError(null);

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

    setIsProcessing(true);
    setCalculationStatus("loading");

    try {
      if (inputMethod === "manual") {
        // Parse manual inputs for the edge function
        const parsedInputs = {
          revenue: parseFloat(values.revenue.replace(/\s/g, "").replace(",", ".")) || 0,
          profit: parseFloat(values.profit.replace(/\s/g, "").replace(",", ".")) || 0,
          assets: parseFloat(values.assets.replace(/\s/g, "").replace(",", ".")) || 0,
          liabilities: parseFloat(values.liabilities.replace(/\s/g, "").replace(",", ".")) || 0
        };

        // Call the free-valuation edge function with manual inputs using retry logic
        const data = await callEdgeFunctionWithRetry('free-valuation', {
          companyName,
          companyId, // Lisätty companyId tietokantaan tallentamista varten
          manualInputs: parsedInputs
        });

        // Ensure the company name is included in the results
        const resultsWithCompanyName = {
          companyName,
          finalAnalysis: data
        };

        setValuationResults(resultsWithCompanyName);
        setCalculationStatus("complete");

        toast({
          title: "Arvonmääritys valmis",
          description: "Tarkastele tuloksia",
        });
      } else if (inputMethod === "upload" && file) {
        try {
          const fileBase64 = await fileToBase64(file);

          // For file uploads we use the free-valuation endpoint (changed from valuation)
          const data = await callEdgeFunctionWithRetry('free-valuation', {
            companyName,
            fileBase64,
            fileMimeType: file.type
          });

          // Check if questions were identified and user input is required
          if (data.requiresUserInput && data.financialQuestions && data.financialQuestions.length > 0) {
            setRequiresUserInput(true);
            setFinancialQuestions(data.financialQuestions);
            setInitialFindings(data.initialFindings || null);

            // Cache the file data for the second phase
            setCachedFileBase64(fileBase64);
            setCachedFileMimeType(file.type);

            setCalculationStatus("idle");
            setIsProcessing(false);

            // Notify parent about questions visibility change
            onQuestionsVisibilityChange && onQuestionsVisibilityChange(true);

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
    }
  };

  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
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
        financialQuestionAnswers: answers,
        originalQuestions: originalQuestions // Added originalQuestions
      });

      // Process the results with proper error handling
      try {
        const resultsWithCompanyName = {
          companyName,
          finalAnalysis: data
        };

        // Varmistetaan, että data on saatavilla ennen tilojen päivitystä
        setValuationResults(resultsWithCompanyName);

        // Asetetaan tila suoraan complete-tilaan ilman timeoutia
        setCalculationStatus("complete");
      } catch (error) {
        console.error("Error processing API results:", error);
        setError("Vastauksen käsittelyssä tapahtui virhe: " + (error instanceof Error ? error.message : "Tuntematon virhe"));
        setCalculationStatus("error");
      }


      // Reset the question form
      setRequiresUserInput(false);
      setFinancialQuestions([]);
      setInitialFindings(null);

      // Notify parent about questions visibility change
      onQuestionsVisibilityChange && onQuestionsVisibilityChange(false);

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
        originalQuestions={originalQuestions} // Pass originalQuestions to ValuationQuestionForm
      />
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-secondary mb-4">
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
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
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
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>

              <div className="text-sm">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                >
                  <span>Lataa tilinpäätös</span>
                </label>
                <p className="text-muted-foreground mt-1">PDF-tiedosto, maks. 10 MB</p>
              </div>

              {file && (
                <div className="mt-2 text-secondary bg-muted px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-xl text-info">
            <p className="text-base font-medium mb-2">PDF-muotoisen tilinpäätöksen käsittely</p>
            <p className="text-base">PDF-tiedostot analysoidaan tekoälyä hyödyntäen. Arvento AI ymmärtää tilinpäätösdokumentit kokonaisuutena, mukaan lukien taulukot, kaaviot ja visuaalisen sisällön.</p>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="revenue" className="block text-base font-medium text-secondary">
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
              <label htmlFor="profit" className="block text-base font-medium text-secondary">
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
              <label htmlFor="assets" className="block text-base font-medium text-secondary">
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
              <label htmlFor="liabilities" className="block text-base font-medium text-secondary">
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
        className="w-full text-white"
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