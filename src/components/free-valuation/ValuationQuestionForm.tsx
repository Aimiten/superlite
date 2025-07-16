
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FinancialQuestion } from "./types";

interface ValuationQuestionFormProps {
  questions: FinancialQuestion[];
  initialFindings: any;
  fileBase64: string;
  fileMimeType: string;
  companyName: string;
  companyType?: string;
  onSubmit: (answers: Record<string, string>, originalQuestions: FinancialQuestion[]) => void;
  isProcessing: boolean;
}

const ValuationQuestionForm: React.FC<ValuationQuestionFormProps> = ({
  questions,
  initialFindings,
  fileBase64,
  fileMimeType,
  companyName,
  companyType,
  onSubmit,
  isProcessing
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allAnswered, setAllAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Tallenna alkuperäiset kysymykset täällä
  const [originalQuestions, setOriginalQuestions] = useState<FinancialQuestion[]>([]);

  // Update allAnswered status when answers change
  useEffect(() => {
    if (questions.length === 0) return;
    
    const unansweredQuestions = questions.filter(q => 
      !answers[`${q.category}_${q.id}`] || answers[`${q.category}_${q.id}`].trim() === ""
    );
    
    setAllAnswered(unansweredQuestions.length === 0);
    
    // Reset validation errors when answers change
    setValidationErrors({});
  }, [answers, questions]);
  
  // Tallenna alkuperäiset kysymykset kun komponentti latautuu
  useEffect(() => {
    if (questions.length > 0) {
      setOriginalQuestions(questions);
    }
  }, [questions]);

  const handleInputChange = (questionId: string, category: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${category}_${questionId}`]: value
    }));
    
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
    questions.forEach(question => {
      const answerKey = `${question.category}_${question.id}`;
      const answer = answers[answerKey];
      
      // Check if answer exists
      if (!answer || answer.trim() === "") {
        newErrors[answerKey] = "Vastaus vaaditaan";
        isValid = false;
        return;
      }
      
      // Kaikki kysymykset käsitellään tekstinä, ei tarvita erikoisvalidointia
    });
    
    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!allAnswered) {
      setError("Vastaa kaikkiin kysymyksiin ennen jatkamista.");
      return;
    }
    
    if (!validateAnswers()) {
      setError("Tarkista syöttämäsi arvot.");
      return;
    }

    console.log("Submitting valuation question answers:", answers);
    setError(null);
    onSubmit(answers, originalQuestions);
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
      'other': 'Muut'
    };

    return categories[category] || category;
  };

  // Kaikki kysymykset ovat tyypiltään teksti

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

  // Ei tarvita enää erillistä enhanceQuestionText-funktiota, koska näytämme tiedot erillisessä osiossa

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Tarkenna tilinpäätöstietoja</CardTitle>
        <CardDescription>
          Tekoäly tunnisti seuraavat keskeisimmät kysymykset tilinpäätöksestäsi. 
          Vastaamalla tarkennat arvonmäärityksen luotettavuutta.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {initialFindings && (
          <Alert className="bg-info/10 border-info/20">
            <div className="text-info">
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
                  <div key={`category-${question.category}`} className="pt-2 first:pt-0">
                    <h3 className="font-medium text-lg text-secondary mb-2">
                      {getCategoryLabel(question.category)}
                    </h3>
                  </div>
                );
              }
              
              const fieldKey = `${question.category}_${question.id}`;
              const hasError = !!validationErrors[fieldKey];
              
              acc.push(
                <div key={question.id} className={`border p-4 rounded-lg space-y-3 ${hasError ? 'border-destructive/30' : ''}`}>
                  {/* Kysymys-label ja kysymys selkeästi esitettynä */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Kysymys:</div>
                    <div className="bg-muted p-4 rounded-md border-l-4 border-primary">
                      <p className="text-base font-medium text-secondary">{question.question}</p>
                    </div>
                  </div>
                  
                  {/* Tunnistetut arvot tilinpäätöksestä */}
                  {question.identified_values && 
                    // Tarkistetaan, ettei arvo ole välillä 0-10 (numero tai merkkijono)
                    !(
                      (typeof question.identified_values === 'number' && question.identified_values >= 0 && question.identified_values <= 10) || 
                      (typeof question.identified_values === 'string' && !isNaN(Number(question.identified_values)) && 
                       Number(question.identified_values) >= 0 && Number(question.identified_values) <= 10)
                    ) && (
                    <div className="bg-info/10 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium text-info mb-1">Tunnistetut arvot tilinpäätöksestä:</p>
                      <p className="text-sm text-info">
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
                      className={`mt-1 ${hasError ? 'border-destructive' : ''}`}
                      value={answers[fieldKey] || ''}
                      onChange={(e) => handleInputChange(question.id, question.category, e.target.value)}
                    />
                    {hasError && (
                      <p className="text-xs text-destructive mt-1">{validationErrors[fieldKey]}</p>
                    )}
                  </div>
                  
                  {/* Lisätiedot vastauksen alapuolella pienemmällä fontilla */}
                  <div className="space-y-2 mt-2">
                    {/* Näytetään normalisoinnin tarkoitus */}
                    {question.normalization_purpose && (
                      <div className="bg-success/10 p-2 rounded-md">
                        <p className="text-xs text-success">{question.normalization_purpose}</p>
                      </div>
                    )}
                    
                    {/* Näytetään vaikutus */}
                    {question.impact && (
                      <div className="bg-warning/10 p-2 rounded-md">
                        <p className="text-xs text-warning">{question.impact}</p>
                      </div>
                    )}
                    
                    {question.source_location && (
                      <p className="text-xs text-muted-foreground">Lähde: {question.source_location}</p>
                    )}
                    
                    {question.context && (
                      <p className="text-xs text-muted-foreground">{question.context}</p>
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
      
      <CardFooter className="flex justify-end">
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
              <span className="h-4 w-4">→</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ValuationQuestionForm;
