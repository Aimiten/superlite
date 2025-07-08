import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { AlertCircle } from "lucide-react";
import { Question, QuestionType, Answer } from "./types";

interface QuestionsStepProps {
  questions: Question[];
  answers: Record<string, any>;
  currentQuestionIndex: number;
  totalQuestions: number;
  handleAnswer: (questionId: string, value: any, questionType: QuestionType) => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  answers,
  currentQuestionIndex,
  totalQuestions,
  handleAnswer,
  handleNext,
  handlePrevious,
}) => {
  // Tarkistetaan onko kysymyksiä saatavilla
  if (!questions || questions.length === 0) {
    return (
      <Card className="card-3d mb-8">
        <CardHeader className="pb-4">
          <CardTitle>Kysymysten lataus epäonnistui</CardTitle>
          <CardDescription>
            Emme voineet ladata kysymyksiä arviointia varten. Palaa alkuun ja yritä uudelleen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 mb-4 text-red-800 rounded-lg bg-red-50">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Kysymyksiä ei löytynyt, yritä aloittaa arviointi uudelleen.</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => {
              localStorage.removeItem("assessment-step");
              localStorage.removeItem("assessment-questions");
              localStorage.removeItem("assessment-current-question-index");
              handlePrevious();
            }} 
            className="rounded-full"
          >
            Palaa alkuun
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Varmistetaan että currentQuestion on olemassa
  if (currentQuestionIndex >= questions.length) {
    console.error(`Invalid question index: ${currentQuestionIndex}, max is ${questions.length - 1}`);
    return (
      <Card className="card-3d mb-8">
        <CardHeader className="pb-4">
          <CardTitle>Virhe kysymysten käsittelyssä</CardTitle>
          <CardDescription>
            Kysymysten indeksi on virheellinen. Palaa alkuun ja yritä uudelleen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 mb-4 text-red-800 rounded-lg bg-red-50">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Tekninen virhe: kysymysindeksi on väärä. Aloita arviointi uudelleen.</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePrevious} className="rounded-full">
            Palaa alkuun
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Tulostetaan tarkistuksen vuoksi konsoliin mitä kysymyksiä meillä on
  console.log(`Rendering question ${currentQuestionIndex + 1}/${questions.length}:`, currentQuestion);

  const [tempMultiSelect, setTempMultiSelect] = useState<string[]>(
    Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : []
  );

  // Handle multiselect changes before submitting
  const handleMultiSelectChange = (value: string) => {
    let newValues: string[];
    
    if (tempMultiSelect.includes(value)) {
      newValues = tempMultiSelect.filter(item => item !== value);
    } else {
      newValues = [...tempMultiSelect, value];
    }
    
    setTempMultiSelect(newValues);
    handleAnswer(currentQuestion.id, newValues, 'multiselect');
  };
  
  const renderQuestionInput = () => {
    switch (currentQuestion.questionType) {
      case 'scale':
        return (
          <div className="space-y-3">
            {currentQuestion.answerOptions?.map((option) => (
              <button
                key={option.value.toString()}
                onClick={() => handleAnswer(currentQuestion.id, Number(option.value), 'scale')}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  answers[currentQuestion.id] === Number(option.value)
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option.value.toString()}</span>
                <span className="text-sm text-gray-500">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        );
        
      case 'text':
        return (
          <Textarea
            placeholder={currentQuestion.placeholder || "Kirjoita vastauksesi tähän..."}
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value, 'text')}
            className="min-h-[150px]"
          />
        );

      case 'select':
        return (
          <RadioGroup
            value={(answers[currentQuestion.id] || "").toString()}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value, 'select')}
            className="space-y-3"
          >
            {currentQuestion.answerOptions?.map((option) => (
              <label
                key={option.value.toString()}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <span>{option.label}</span>
                </div>
              </label>
            ))}
          </RadioGroup>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            {currentQuestion.answerOptions?.map((option) => (
              <label
                key={option.value.toString()}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  tempMultiSelect.includes(option.value.toString())
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id={`option-${option.value}`} 
                    checked={tempMultiSelect.includes(option.value.toString())}
                    onCheckedChange={() => handleMultiSelectChange(option.value.toString())}
                  />
                  <span>{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'numeric':
        return (
          <div className="space-y-6">
            <Input
              type="number"
              placeholder={currentQuestion.placeholder || "Anna numeraalinen arvo"}
              min={currentQuestion.min}
              max={currentQuestion.max}
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(currentQuestion.id, Number(e.target.value), 'numeric')}
              className="text-center text-lg"
            />
            {currentQuestion.min !== undefined && currentQuestion.max !== undefined && (
              <div className="px-4">
                <Slider
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step={1}
                  value={[answers[currentQuestion.id] || currentQuestion.min || 0]}
                  onValueChange={(values) => handleAnswer(currentQuestion.id, values[0], 'numeric')}
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{currentQuestion.min}</span>
                  <span>{currentQuestion.max}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={answers[currentQuestion.id] ? "true" : "false"}
              onValueChange={(value) => handleAnswer(
                currentQuestion.id, 
                value === "true", 
                'boolean'
              )}
              className="space-y-3"
            >
              <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                answers[currentQuestion.id] === true
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="true" id="answer-yes" />
                  <span>Kyllä</span>
                </div>
              </label>
              <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                answers[currentQuestion.id] === false
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="false" id="answer-no" />
                  <span>Ei</span>
                </div>
              </label>
            </RadioGroup>
          </div>
        );

      default:
        return <p>Tuntematon kysymystyyppi</p>;
    }
  };
  
  // Check if the current question has a valid answer
  const isAnswered = () => {
    if (answers[currentQuestion.id] === undefined) return false;
    
    if (currentQuestion.questionType === 'multiselect') {
      return Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length > 0;
    }
    
    if (currentQuestion.questionType === 'text') {
      return answers[currentQuestion.id] && answers[currentQuestion.id].trim() !== '';
    }
    
    if (currentQuestion.questionType === 'boolean') {
      return answers[currentQuestion.id] !== undefined;
    }
    
    return answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  };

  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4">
        <Badge variant="outline" className="mb-2 w-fit rounded-full">
          Vaihe 4: Kysymys {currentQuestionIndex + 1}/{totalQuestions}
        </Badge>
        <CardTitle>{currentQuestion.question}</CardTitle>
        <CardDescription>
          {currentQuestion.description}
        </CardDescription>
        {currentQuestion.context && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
            {currentQuestion.context}
            {currentQuestion.amount ? ` (${currentQuestion.amount.toLocaleString()} €)` : ''}
            {currentQuestion.period ? ` - ${currentQuestion.period}` : ''}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {renderQuestionInput()}
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <p>Vastauksesi yhdistetään aiempiin tietoihin ja tilinpäätösanalyysiin. OpenAI GPT-4o -malli analysoi kokonaistilanteen.</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="rounded-full"
        >
          Edellinen
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!isAnswered()}
          className="rounded-full"
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Analysoi' : 'Seuraava'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuestionsStep;
