
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
  onSubmit: (answers: Record<string, string>) => void;
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
      
      // Validate owner_salary to be numeric if applicable
      if (question.category === 'owner_salary') {
        if (isNaN(Number(answer.replace(/\s/g, "").replace(",", ".")))) {
          newErrors[answerKey] = "Syötä validi lukuarvo";
          isValid = false;
        }
      }
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

    setError(null);
    onSubmit(answers);
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

  const getInputType = (question: FinancialQuestion): string => {
    if (question.category === 'owner_salary') {
      return 'number';
    }
    return 'text';
  };

  const getPlaceholder = (question: FinancialQuestion): string => {
    if (question.category === 'owner_salary') {
      return 'esim. 60000';
    } else if (question.category === 'premises_costs' || question.category === 'real_estate') {
      return 'Kerro kiinteistöstä/toimitilasta...';
    } else if (question.category === 'inventory') {
      return 'Kerro varastosta...';
    }
    return "Kirjoita vastaus tähän...";
  };

  // Prefill identified values in the question text if they exist
  const enhanceQuestionText = (question: FinancialQuestion): string => {
    if (!question.identified_values) return question.question;
    
    let enhancedText = question.question;
    
    // For owner salary, add the identified personnel costs if available
    if (question.category === 'owner_salary' && 
        question.identified_values.total_personnel_costs && 
        question.identified_values.total_personnel_costs > 0) {
      enhancedText += ` (Tilinpäätöksessä henkilöstökulut: ${question.identified_values.total_personnel_costs.toLocaleString('fi-FI')} €)`;
    }
    
    // For premises costs, add the identified premises costs if available
    if (question.category === 'premises_costs' && 
        question.identified_values.premises_costs && 
        question.identified_values.premises_costs > 0) {
      enhancedText += ` (Tilinpäätöksessä toimitilakulut: ${question.identified_values.premises_costs.toLocaleString('fi-FI')} €)`;
    }
    
    return enhancedText;
  };

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
          <Alert className="bg-blue-50 border-blue-200">
            <div className="text-blue-800">
              <h3 className="font-medium mb-1">Alustava analyysi yrityksestä</h3>
              <div className="space-y-1 text-sm">
                {initialFindings.company_size && (
                  <p><span className="font-medium">Yrityksen koko:</span> {initialFindings.company_size}</p>
                )}
                {initialFindings.financial_health && (
                  <p><span className="font-medium">Taloudellinen tila:</span> {initialFindings.financial_health}</p>
                )}
                {initialFindings.primary_concerns && initialFindings.primary_concerns.length > 0 && (
                  <p><span className="font-medium">Huomioitavaa:</span> {initialFindings.primary_concerns.join(', ')}</p>
                )}
                {initialFindings.period_details?.latest_period_end && (
                  <p><span className="font-medium">Viimeisin tilikausi:</span> {initialFindings.period_details.latest_period_end}</p>
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
                    <h3 className="font-medium text-lg text-slate-800 mb-2">
                      {getCategoryLabel(question.category)}
                    </h3>
                  </div>
                );
              }
              
              const fieldKey = `${question.category}_${question.id}`;
              const hasError = !!validationErrors[fieldKey];
              
              acc.push(
                <div key={question.id} className={`border p-4 rounded-lg space-y-2 ${hasError ? 'border-red-300' : ''}`}>
                  <div className="flex justify-between">
                    <div className="font-medium">{question.description || getCategoryLabel(question.category)}</div>
                    {(question.impact || question.normalization_purpose) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <HelpCircle className="h-4 w-4 text-slate-400" />
                              <span className="sr-only">Lisätietoja</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{question.impact || question.normalization_purpose}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {question.source_location && (
                    <p className="text-xs text-slate-500">Lähde: {question.source_location}</p>
                  )}
                  
                  <div className="pt-2">
                    <Label htmlFor={question.id} className="text-sm">
                      {enhanceQuestionText(question)}
                    </Label>
                    
                    {/* Different input types based on category */}
                    {question.category === 'owner_salary' ? (
                      <>
                        <Input
                          id={question.id}
                          type="text"
                          inputMode="numeric"
                          placeholder="esim. 60000"
                          className={`mt-1 ${hasError ? 'border-red-500' : ''}`}
                          value={answers[fieldKey] || ''}
                          onChange={(e) => handleInputChange(question.id, question.category, e.target.value)}
                        />
                        {hasError && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors[fieldKey]}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <Textarea
                          id={question.id}
                          placeholder={getPlaceholder(question)}
                          className={`mt-1 ${hasError ? 'border-red-500' : ''}`}
                          value={answers[fieldKey] || ''}
                          onChange={(e) => handleInputChange(question.id, question.category, e.target.value)}
                        />
                        {hasError && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors[fieldKey]}</p>
                        )}
                      </>
                    )}
                    
                    {question.context && (
                      <p className="text-xs text-slate-500 mt-1">{question.context}</p>
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
          className="gap-2"
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
