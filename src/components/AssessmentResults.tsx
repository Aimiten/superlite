
import { useEffect, useState } from "react";
import { AnalysisResults } from "./assessment/types";
import AssessmentResultsContainer from "./results/AssessmentResultsContainer";
import { usePersistentStorage } from "@/hooks/use-persistent-storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { RefreshCcw, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface AssessmentResultsProps {
  analysisResults?: AnalysisResults | null;
  answers?: Record<string, any>;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const AssessmentResults = ({ 
  analysisResults, 
  answers = {},
  showBackButton = true,
  onBack
}: AssessmentResultsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log("[AssessmentResults] Component rendering with props:", { 
    hasResults: analysisResults ? true : false, 
    answersCount: Object.keys(answers).length,
    showBackButton
  });
  console.log("[AssessmentResults] Current location:", location.pathname, location.search);

  const [savedResults, setSavedResults] = usePersistentStorage<AnalysisResults | null>(
    'assessment-analysis-results',
    analysisResults || null,
    { debug: true }
  );

  const [savedAnswers, setSavedAnswers] = usePersistentStorage<Record<string, any>>(
    'assessment-answers',
    answers,
    { debug: true }
  );

  useEffect(() => {
    try {
      console.log("[AssessmentResults] useEffect - savedResults:", savedResults);
      console.log("[AssessmentResults] useEffect - analysisResults:", analysisResults);
      
      if (analysisResults) {
        console.log("[AssessmentResults] Updating saved results");
        setSavedResults(analysisResults);
      }
      
      if (Object.keys(answers).length > 0) {
        console.log("[AssessmentResults] Updating saved answers");
        setSavedAnswers(answers);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("[AssessmentResults] Error in effect:", err);
      setError("Tulosten käsittelyssä tapahtui virhe.");
      setIsLoading(false);
    }
  }, [analysisResults, answers, setSavedResults, setSavedAnswers]);

  const finalResults = analysisResults || savedResults;
  const finalAnswers = Object.keys(answers).length > 0 ? answers : savedAnswers || {};

  const handleReset = () => {
    console.log("[AssessmentResults] Resetting assessment");
    setIsResetting(true);
    
    try {
      // Clear all assessment-related localStorage items
      localStorage.removeItem("assessment-step");
      localStorage.removeItem("assessment-processing-stage");
      localStorage.removeItem("assessment-processing-progress");
      localStorage.removeItem("assessment-company-name");
      localStorage.removeItem("assessment-company-info");
      localStorage.removeItem("assessment-company-id");
      localStorage.removeItem("assessment-structured-company-data");
      localStorage.removeItem("assessment-readiness-for-sale-data");
      localStorage.removeItem("assessment-selected-documents");
      localStorage.removeItem("assessment-current-question-index");
      localStorage.removeItem("assessment-questions");
      localStorage.removeItem("assessment-answers");
      localStorage.removeItem("assessment-analysis-results");
      localStorage.removeItem("assessment-processing-start-time");
      localStorage.removeItem("active-assessment-session");
      
      toast({
        title: "Arviointi nollattu",
        description: "Myyntikuntoisuusarviointi nollattu onnistuneesti. Sivu latautuu uudelleen."
      });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("[AssessmentResults] Error resetting assessment:", error);
      setIsResetting(false);
      toast({
        title: "Virhe",
        description: "Arvioinnin nollaaminen epäonnistui. Ole hyvä ja yritä uudelleen.",
        variant: "destructive"
      });
    }
  };

  const handleBackToList = () => {
    console.log("[AssessmentResults] Navigating back to assessment list");
    
    if (onBack) {
      onBack();
    } else {
      navigate('/assessment', { replace: true });
      
      // Add a small delay to ensure the navigation completes before additional operations
      setTimeout(() => {
        // Force URL to be clean without any parameters
        if (window.history && location.search) {
          window.history.replaceState({}, '', '/assessment');
        }
      }, 50);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        <h2 className="text-2xl font-bold text-center text-red-600">Virhe tulosten näyttämisessä</h2>
        <p className="text-center text-muted-foreground max-w-md">
          {error}
        </p>
        <Button 
          variant="destructive"
          onClick={handleReset}
          disabled={isResetting}
          className="mt-4 flex gap-2 items-center"
        >
          <RefreshCcw className="w-4 h-4" />
          {isResetting ? "Nollataan..." : "Nollaa arviointi"}
        </Button>
      </div>
    );
  }

  if (!finalResults) {
    console.log("[AssessmentResults] No results to display - showing reset option");
    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        <h2 className="text-2xl font-bold text-center">Arvioinnin tuloksia ei löytynyt</h2>
        <p className="text-center text-muted-foreground max-w-md">
          Aiempi arviointisi saattaa olla keskeneräinen tai jokin meni vikaan. 
          Voit nollata arvioinnin ja aloittaa uudelleen.
        </p>
        <Button 
          variant="destructive"
          onClick={handleReset}
          disabled={isResetting}
          className="mt-4 flex gap-2 items-center"
        >
          <RefreshCcw className="w-4 h-4" />
          {isResetting ? "Nollataan..." : "Nollaa arviointi"}
        </Button>
      </div>
    );
  }

  return (
    <>
      {showBackButton && (
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("[AssessmentResults] Top back button clicked");
              handleBackToList();
            }}
            className="flex items-center gap-2"
            style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
          >
            <ArrowLeft className="h-4 w-4" /> 
            Takaisin arviointeihin
          </Button>
        </div>
      )}
      <AssessmentResultsContainer 
        analysisResults={finalResults} 
        answers={finalAnswers}
        onBack={onBack}
      />
    </>
  );
};
