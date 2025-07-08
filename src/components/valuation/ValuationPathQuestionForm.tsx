// src/components/valuation/ValuationPathQuestionForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calculator, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { FinancialQuestion } from "../free-valuation/types";
import { useValuationStore } from "@/stores/valuationStore"; // Import the store
import { valuationService } from "@/utils/valuationService"; // Import the service
import { useToast } from "@/hooks/use-toast";

interface ValuationPathQuestionFormProps {
  questions: FinancialQuestion[];
  initialFindings: any;
  fileBase64?: string;
  fileMimeType?: string;
  companyName: string;
  companyType?: string;
  onSubmit: (answers: Record<string, string>, originalQuestions: FinancialQuestion[]) => void;
  isProcessing: boolean;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Komponentti, joka näyttää tekoälyn tunnistamia kysymyksiä tilinpäätöksestä
 * ja kerää käyttäjän vastaukset arvonmäärityksen tarkentamiseksi
 */
const ValuationPathQuestionForm: React.FC<ValuationPathQuestionFormProps> = ({
  questions,
  initialFindings,
  fileBase64,
  fileMimeType,
  companyName,
  companyType,
  onSubmit,
  isProcessing,
  currentStep = 2,
  totalSteps = 3
}) => {
  // Use the store instead of local state
  const { 
    latestValuationId,
    financialQuestions: storeQuestions, 
    setFinancialQuestions,
    financialAnswers: storeAnswers,
    setFinancialAnswers,
    updateFinancialAnswer 
  } = useValuationStore();

  const { toast } = useToast();

  // We still need some local state for validation and UI
  const [allAnswered, setAllAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [originalQuestions, setOriginalQuestions] = useState<FinancialQuestion[]>([]);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  // Sync the questions to store when they are provided from props
  useEffect(() => {
    if (questions.length > 0) {
      setOriginalQuestions(questions);

      // Only set questions in store if it's empty
      if (storeQuestions.length === 0) {
        setFinancialQuestions(questions);
        console.log(`[ValuationPathQuestionForm] Set ${questions.length} questions to store`);
      }
    }
  }, [questions, storeQuestions.length, setFinancialQuestions]);

  // Try to restore saved answers from the database when component initializes
  useEffect(() => {
    if (!latestValuationId) return;

    const loadSavedAnswers = async () => {
      try {
        const progressData = await valuationService.loadValuationProgress(latestValuationId);

        if (progressData.error) {
          console.warn(`[ValuationPathQuestionForm] Error loading answers: ${progressData.error}`);
          return;
        }

        if (progressData.financial_answers && Object.keys(progressData.financial_answers).length > 0) {
          console.log(`[ValuationPathQuestionForm] Loaded ${Object.keys(progressData.financial_answers).length} answers from database`);
          setFinancialAnswers(progressData.financial_answers);

          // Notify the user that answers were restored
          toast({
            title: "Tallennetut vastaukset palautettu",
            description: "Voit jatkaa siitä mihin jäit"
          });
        }
      } catch (error) {
        console.error("[ValuationPathQuestionForm] Failed to load saved answers:", error);
      }
    };

    loadSavedAnswers();
  }, [latestValuationId, setFinancialAnswers, toast]);

  // Update allAnswered status when answers change
  useEffect(() => {
    if (questions.length === 0) return;

    const questionsToCheck = storeQuestions.length > 0 ? storeQuestions : questions;

    const unansweredQuestions = questionsToCheck.filter(q => 
      !storeAnswers[`${q.category}_${q.id}`] || storeAnswers[`${q.category}_${q.id}`].trim() === ""
    );

    setAllAnswered(unansweredQuestions.length === 0);

    // Reset validation errors when answers change
    setValidationErrors({});
  }, [storeAnswers, questions, storeQuestions]);

  // Save answers to database (debounced)
  const saveAnswersToDatabase = useCallback(async () => {
    if (!latestValuationId || Object.keys(storeAnswers).length === 0) return;

    try {
      await valuationService.saveValuationProgress(latestValuationId, {
        financial_answers: storeAnswers
      });
      console.log(`[ValuationPathQuestionForm] Saved answers to database`);
    } catch (error) {
      console.error("[ValuationPathQuestionForm] Failed to save answers:", error);
    }
  }, [latestValuationId, storeAnswers]);

  // Save answers to database when they change (with debounce)
  useEffect(() => {
    if (!latestValuationId || Object.keys(storeAnswers).length === 0) return;

    const timer = setTimeout(() => {
      saveAnswersToDatabase();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [storeAnswers, latestValuationId, saveAnswersToDatabase]);

  // Updated handleInputChange to use the store
  const handleInputChange = (questionId: string, category: string, value: string) => {
    // Update the store
    updateFinancialAnswer(questionId, category, value);

    // Clear validation error for this field if it exists
    if (validationErrors[`${category}_${questionId}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${category}_${questionId}`];
        return newErrors;
      });
    }
  };

  const validateAnswers = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate each answer
    const questionsToValidate = storeQuestions.length > 0 ? storeQuestions : questions;

    questionsToValidate.forEach(question => {
      const answerKey = `${question.category}_${question.id}`;
      const answer = storeAnswers[answerKey];

      // Check if answer exists
      if (!answer || answer.trim() === "") {
        newErrors[answerKey] = "Vastaus vaaditaan";
        isValid = false;
        return;
      }
    });

    setValidationErrors(newErrors);
    return isValid;
  };

  // Updated handleSubmit to use the store
  const handleSubmit = () => {
    if (!allAnswered) {
      setError("Vastaa kaikkiin kysymyksiin ennen jatkamista.");
      return;
    }

    if (!validateAnswers()) {
      setError("Tarkista syöttämäsi arvot.");
      return;
    }

    setError(null);

    // Use the questions from the store if available, otherwise use the original ones
    const questionsToSubmit = storeQuestions.length > 0 ? storeQuestions : originalQuestions;

    // Call the onSubmit callback with the answers from the store
    onSubmit(storeAnswers, questionsToSubmit);
  };

  // Handle skipping all questions
  const handleSkipQuestions = () => {
    setShowSkipConfirmation(true);
  };

  const confirmSkipQuestions = () => {
    setShowSkipConfirmation(false);
    setError(null);

    // Luo oletusarvot jotka kertovat Geminille ettei muutoksia tarvita
    const defaultAnswers: Record<string, string> = {};
    const questionsToSubmit = storeQuestions.length > 0 ? storeQuestions : originalQuestions;
    
    questionsToSubmit.forEach(question => {
      const key = `${question.category}_${question.id}`;
      
      // Anna kontekstispesifiset oletusarvot
      switch(question.category) {
        case 'owner_salary':
          defaultAnswers[key] = "Ei tietoa markkinaehtoisesta palkasta. Käytä tilinpäätöksen mukaisia henkilöstökuluja.";
          break;
        case 'one_time_items':
          defaultAnswers[key] = "Ei tunnistettuja kertaluontoisia eriä.";
          break;
        case 'real_estate':
        case 'premises_costs':
          defaultAnswers[key] = "Käytä tilinpäätöksen mukaisia arvoja.";
          break;
        case 'inventory':
          defaultAnswers[key] = "Ei tietoa varaston todellisesta arvosta. Käytä kirjanpitoarvoja.";
          break;
        case 'non_business_assets':
          defaultAnswers[key] = "Ei tunnistettuja liiketoimintaan kuulumattomia eriä.";
          break;
        default:
          defaultAnswers[key] = "Ei lisätietoja. Käytä tilinpäätöksen mukaisia arvoja.";
      }
    });

    // Lähetä vastaukset normaalisti - Gemini ymmärtää näistä ettei normalisointeja tehdä
    onSubmit(defaultAnswers, questionsToSubmit);
  };

  // Helper function to get a human-readable category name
  const getCategoryLabel = (category: string): string => {
    const categories: Record<string, string> = {
      'owner_salary': 'Omistajan palkka',
      'premises_costs': 'Kiinteistöt ja toimitilat',
      'real_estate': 'Kiinteistöt ja toimitilat',
      'one_time_items': 'Kertaluonteiset erät',
      'inventory': 'Varasto',
      'non_business_assets': 'Liiketoimintaan kuulumattomat erät',
      'related_party': 'Lähipiiriliiketoimet',
      'customer_concentration': 'Asiakaskeskittymät',
      'income_statement': 'Tuloslaskelma',
      'balance_sheet': 'Tase',
      'balance_sheet_income_statement': 'Tase ja tuloslaskelma',
      'other': 'Muut'
    };

    // Jos kategoria löytyy suoraan, käytä sitä
    if (categories[category]) {
      return categories[category];
    }

    // Jos kategoria sisältää alaviivoja, yritä käsitellä se osina
    if (category.includes('_')) {
      const parts = category.split('_');
      const translatedParts = parts.map(part => categories[part] || part);
      return translatedParts.join(' ja ');
    }

    // Muuten palauta alkuperäinen kategoria
    return category;
  };

  const getPlaceholder = (question: FinancialQuestion): string => {
    if (question.category === 'owner_salary') {
      return 'Kerro omistajan palkasta';
    } else if (question.category === 'premises_costs' || question.category === 'real_estate') {
      return 'Kerro kiinteistöstä/toimitilasta...';
    } else if (question.category === 'inventory') {
      return 'Kerro varastosta...';
    }
    return "Kirjoita vastaus tähän...";
  };

  // Add beforeunload warning if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(storeAnswers).length > 0) {
        const message = "Olet täyttänyt vastauksia, jotka tallennetaan automaattisesti. Haluatko varmasti poistua sivulta?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storeAnswers]);

  return (
    <Card className="mb-6">
      <CardHeader>
        {currentStep && totalSteps && (
          <Badge variant="outline" className="mb-2 w-fit rounded-full flex items-center gap-1 text-xs py-1">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">{currentStep}</div>
            <span>/ {totalSteps}</span>
          </Badge>
        )}
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
          Vastaa tarkentaviin kysymyksiin
        </CardTitle>
        <CardDescription>
          Tunnistimme nämä kohdat, jotka tarvitsevat tarkennusta. 
          Vastaamalla saat luotettavamman arvion yrityksesi arvosta.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {initialFindings && (
          <Alert className="bg-blue-50 border-blue-200">
            <div className="text-blue-800">
              <h3 className="font-medium mb-1">Alustava analyysi yrityksestä</h3>
              <div className="space-y-1 text-sm">
                {initialFindings.company_size && (
                  <p><span className="font-medium">Yrityksen koko:</span> {typeof initialFindings.company_size === 'object' ? JSON.stringify(initialFindings.company_size) : initialFindings.company_size}</p>
                )}
                {initialFindings.financial_health && (
                  <p><span className="font-medium">Taloudellinen tila:</span> {typeof initialFindings.financial_health === 'object' ? JSON.stringify(initialFindings.financial_health) : initialFindings.financial_health}</p>
                )}
                {initialFindings.primary_concerns && Array.isArray(initialFindings.primary_concerns) && initialFindings.primary_concerns.length > 0 && (
                  <p><span className="font-medium">Huomioitavaa:</span> {initialFindings.primary_concerns.join(', ')}</p>
                )}
                {initialFindings.period_details?.latest_period_end && (
                  <p><span className="font-medium">Viimeisin tilikausi:</span> {typeof initialFindings.period_details.latest_period_end === 'object' ? JSON.stringify(initialFindings.period_details.latest_period_end) : initialFindings.period_details.latest_period_end}</p>
                )}
              </div>
            </div>
          </Alert>
        )}

        {questions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ei tunnistettuja kysymyksiä. Tilinpäätösanalyysi voidaan suorittaa nykyisillä tiedoilla.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {questions.reduce((acc: JSX.Element[], question: FinancialQuestion, index: number) => {
              // Only add category heading if this is the first question of its category
              const prevQuestion = index > 0 ? questions[index - 1] : null;
              const isNewCategory = !prevQuestion || prevQuestion.category !== question.category;

              if (isNewCategory) {
                acc.push(
                  <div key={`category-${question.category}-${index}`} className="pt-2 first:pt-0">
                    <h3 className="font-medium text-lg text-slate-800 mb-2">
                      {getCategoryLabel(question.category)}
                    </h3>
                  </div>
                );
              }

              const fieldKey = `${question.category}_${question.id}`;
              const hasError = !!validationErrors[fieldKey];

              acc.push(
                <div key={`question-${question.id}-${index}`} className={`border p-4 rounded-lg space-y-3 ${hasError ? 'border-red-300' : ''}`}>
                  {/* Kysymys-label ja kysymys selkeästi esitettynä */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-500">Kysymys:</div>
                    <div className="bg-slate-50 p-4 rounded-md border-l-4 border-blue-500">
                      <p className="text-base font-medium text-slate-800">{question.question}</p>
                    </div>
                  </div>

                  {/* Tunnistetut arvot tilinpäätöksestä */}
                  {question.identified_values && question.identified_values !== "0" && (
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Tunnistetut arvot tilinpäätöksestä:</p>
                      <p className="text-sm text-blue-700">
                        {typeof question.identified_values === 'number' 
                          ? new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(question.identified_values)
                          : typeof question.identified_values === 'object'
                            ? JSON.stringify(question.identified_values)
                            : question.identified_values}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 mb-4">
                    <Label htmlFor={question.id} className="text-sm font-medium">
                      Vastaa kysymykseen:
                    </Label>

                    {/* Kaikki kysymystyypit käyttävät Textarea-kenttää */}
                    <Textarea
                      id={question.id}
                      placeholder={getPlaceholder(question)}
                      className={`mt-1 ${hasError ? 'border-red-500' : ''}`}
                      value={storeAnswers[fieldKey] || ''}
                      onChange={(e) => handleInputChange(question.id, question.category, e.target.value)}
                    />
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors[fieldKey]}</p>
                    )}
                  </div>

                  {/* Lisätiedot vastauksen alapuolella pienemmällä fontilla */}
                  <div className="space-y-2 mt-2">
                    {/* Näytetään normalisoinnin tarkoitus */}
                    {question.normalization_purpose && (
                      <div className="bg-green-50 p-2 rounded-md">
                        <p className="text-xs text-green-700">{question.normalization_purpose}</p>
                      </div>
                    )}

                    {/* Näytetään vaikutus */}
                    {question.impact && (
                      <div className="bg-amber-50 p-2 rounded-md">
                        <p className="text-xs text-amber-700">{question.impact}</p>
                      </div>
                    )}

                    {question.source_location && (
                      <p className="text-xs text-slate-500">Lähde: {question.source_location}</p>
                    )}

                    {question.context && (
                      <p className="text-xs text-slate-500">{question.context}</p>
                    )}
                  </div>
                </div>
              );

              return acc;
            }, [])}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSkipQuestions}
          disabled={isProcessing}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Ohita kysymykset
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !allAnswered}
          className="gap-2 text-white"
        >
          {isProcessing ? (
            <>
              <span>Käsitellään...</span>
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
            </>
          ) : (
            <>
              <span>Analysoi vastausten perusteella</span>
              <span className="h-4 w-4 text-white">→</span>
            </>
          )}
        </Button>
      </CardFooter>

      <AlertDialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haluatko ohittaa kysymykset?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Olet ohittamassa kaikki tarkentavat kysymykset. Tämä tarkoittaa:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Arvonmääritys perustuu vain tilinpäätöstietoihin</li>
                <li>Normalisointeja ei tehdä (esim. omistajan palkka, kertaluonteiset erät)</li>
                <li>Arvio voi olla epätarkempi</li>
              </ul>
              <p className="font-medium">
                Haluatko varmasti jatkaa ilman vastauksia?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Peruuta</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSkipQuestions}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Kyllä, ohita kysymykset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ValuationPathQuestionForm;