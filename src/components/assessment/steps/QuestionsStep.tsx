import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Loader2 } from "lucide-react";
import { Question, QuestionType } from "@/components/assessment/types";
import { useAssessmentStore } from "@/stores/assessmentStore";
import { supabase } from "@/integrations/supabase/client";

const QuestionsStep: React.FC = () => {
  // Käytä suoraan storea kysymysten hakemiseen
  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    saveAnswer, 
    updateQuestionIndex, 
    analyzeAnswers,
    updateStep,
    isLoading,
    session,
    sessionError,
  } = useAssessmentStore();

  const [localLoading, setLocalLoading] = useState(true);
  const [tempMultiSelect, setTempMultiSelect] = useState<string[]>([]);
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // KORJAUS: Suora kysymysten lataus tietokannasta, jos storessa ei ole niitä
  useEffect(() => {
    // Jos storeen on jo ladattu kysymykset, käytetään niitä
    if (questions && questions.length > 0) {
      console.log(`[QuestionsStep] Käytetään storen kysymyksiä: ${questions.length} kpl`);
      setLocalQuestions(questions);
      setLocalLoading(false);
      return;
    }

    // Jos session-objektissa on kysymykset, käytetään niitä
    if (session?.questions && session.questions.length > 0) {
      console.log(`[QuestionsStep] Käytetään session kysymyksiä: ${session.questions.length} kpl`);
      setLocalQuestions(session.questions);
      setLocalLoading(false);
      return;
    }

    // Jos ei löydy storestä tai session-objektista, haetaan suoraan tietokannasta
    const loadQuestionsDirectly = async () => {
      if (!session?.id) {
        console.error("[QuestionsStep] Ei session ID:tä saatavilla kysymysten lataamiseen");
        setLocalError("Arviointisessiota ei löydy. Käynnistä arviointi uudelleen.");
        setLocalLoading(false);
        return;
      }

      try {
        console.log(`[QuestionsStep] Haetaan kysymykset suoraan tietokannasta, session ID: ${session.id}`);
        const { data, error } = await supabase
          .from('assessments')
          .select('questions')
          .eq('id', session.id)
          .single();

        if (error) {
          throw new Error(`Tietokantavirhe: ${error.message}`);
        }

        if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('Kysymyksiä ei löytynyt tietokannasta');
        }

        console.log(`[QuestionsStep] Löydettiin ${data.questions.length} kysymystä tietokannasta`);
        // Lokitetaan ensimmäinen kysymys debuggia varten
        console.log(`[QuestionsStep] Ensimmäinen kysymys: ${JSON.stringify(data.questions[0])}`);

        setLocalQuestions(data.questions);
        setLocalLoading(false);
      } catch (error) {
        console.error("[QuestionsStep] Virhe kysymysten lataamisessa:", error);
        setLocalError(`Kysymysten lataus epäonnistui: ${error.message}`);
        setLocalLoading(false);
      }
    };

    // Ladataan kysymykset suoraan, jos muut lähteet eivät toimi
    loadQuestionsDirectly();
  }, [questions, session]);

  // Asetetaan multiselect-tila kysymyksen vaihtuessa
  useEffect(() => {
    const currentQuestions = localQuestions.length > 0 ? localQuestions : questions;

    if (currentQuestions && currentQuestions.length > 0 && currentQuestionIndex < currentQuestions.length) {
      const currentQuestion = currentQuestions[currentQuestionIndex];
      if (currentQuestion?.questionType === 'multiselect') {
        // Käsittele sekä vanha (array) että uusi (object) muoto
        const existingAnswer = answers[currentQuestion.id];
        if (existingAnswer && typeof existingAnswer === 'object' && 'values' in existingAnswer) {
          setTempMultiSelect(existingAnswer.values || []);
        } else if (Array.isArray(existingAnswer)) {
          setTempMultiSelect(existingAnswer);
        } else {
          setTempMultiSelect([]);
        }
      }
    }
  }, [currentQuestionIndex, localQuestions, questions, answers]);

  const handlePrevious = () => {
    // Jos ollaan ensimmäisessä kysymyksessä, palataan alkuun
    if (currentQuestionIndex === 0) {
      updateStep('initial-selection');
      return;
    }
    // Muuten siirrytään edelliseen kysymykseen
    updateQuestionIndex(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    const currentQuestions = localQuestions.length > 0 ? localQuestions : questions;

    // Jos ollaan viimeisessä kysymyksessä, lähetetään vastaukset analysoitavaksi
    if (currentQuestionIndex === currentQuestions.length - 1) {
      analyzeAnswers();
      return;
    }
    // Muuten siirrytään seuraavaan kysymykseen
    updateQuestionIndex(currentQuestionIndex + 1);
  };

  const handleSkipQuestion = () => {
    const currentQuestions = localQuestions.length > 0 ? localQuestions : questions;
    
    if (currentQuestions && currentQuestions.length > 0 && currentQuestionIndex < currentQuestions.length) {
      const currentQ = currentQuestions[currentQuestionIndex];
      
      // Tallenna tyhjä vastaus merkillä että ohitettu
      saveAnswer(currentQ.id, { skipped: true }, 'skipped');
      
      // Siirry seuraavaan samalla logiikalla kuin handleNext
      if (currentQuestionIndex === currentQuestions.length - 1) {
        analyzeAnswers();
      } else {
        updateQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  // Handle multiselect changes
  // Handle multiselect changes
  const handleMultiSelectChange = (value: string) => {
    let newValues: string[];

    if (tempMultiSelect.includes(value)) {
      newValues = tempMultiSelect.filter(item => item !== value);
    } else {
      newValues = [...tempMultiSelect, value];
    }

    setTempMultiSelect(newValues);

    const currentQuestions = localQuestions.length > 0 ? localQuestions : questions;
    if (currentQuestions && currentQuestions.length > 0 && currentQuestionIndex < currentQuestions.length) {
      const currentQuestion = currentQuestions[currentQuestionIndex];

      // Tallennetaan sekä indeksit että tekstisisällöt
      const answerWithLabels = {
        values: newValues,
        labels: newValues.map(val => {
          // Etsitään vastaava teksti
          if (currentQuestion.answerOptions && currentQuestion.answerOptions.length > 0) {
            const option = currentQuestion.answerOptions.find(opt => String(opt.value) === String(val));
            return option ? option.label : val;
          } else if (currentQuestion.options && Array.isArray(currentQuestion.options)) {
            const index = parseInt(val, 10);
            return index >= 0 && index < currentQuestion.options.length 
              ? currentQuestion.options[index] 
              : val;
          }
          return val;
        })
      };

      saveAnswer(currentQuestion.id, answerWithLabels, 'multiselect');
    }
  };

  // Näytä loader, jos tietoja vielä ladataan
  if (isLoading || localLoading) {
    return (
      <Card className="card-3d mb-8">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p>Ladataan kysymyksiä...</p>
        </CardContent>
      </Card>
    );
  }

  // Näytä virhe, jos kysymysten lataus epäonnistui
  if (localError || sessionError) {
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
            <span>{localError || sessionError || "Kysymyksiä ei löytynyt, yritä aloittaa arviointi uudelleen."}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateStep('initial-selection')} 
            className="rounded-full"
          >
            Palaa alkuun
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Käytä ensisijaisesti localQuestions, mutta jos se on tyhjä, käytä storen questions
  const currentQuestions = localQuestions.length > 0 ? localQuestions : questions;

  // Tarkistetaan onko kysymyksiä saatavilla
  if (!currentQuestions || currentQuestions.length === 0) {
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
            <span>Kysymyksiä ei löytynyt lainkaan. Yritä aloittaa arviointi uudelleen.</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => updateStep('initial-selection')} 
            className="rounded-full"
          >
            Palaa alkuun
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Varmistetaan että currentQuestionIndex on järkevä
  if (currentQuestionIndex >= currentQuestions.length) {
    console.error(`Invalid question index: ${currentQuestionIndex}, max is ${currentQuestions.length - 1}`);
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
          <Button onClick={() => updateStep('initial-selection')} className="rounded-full">
            Palaa alkuun
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Tulostetaan tarkistuksen vuoksi konsoliin mitä kysymyksiä meillä on
  console.log(`Rendering question ${currentQuestionIndex + 1}/${currentQuestions.length}:`, currentQuestion);

  const renderQuestionInput = () => {
    switch (currentQuestion.questionType) {
      case 'scale':
        // Luodaan vakiooptiot, jos ei muita ole saatavilla
        let scaleOptions: {value: number | string, label: string}[] = [];

        // Tarkista, onko answerOptions-objekteja (Gemini luo nämä)
        if (currentQuestion.answerOptions?.length > 0) {
          scaleOptions = currentQuestion.answerOptions;
        }
        // Tarkista, onko options-merkkijonotaulukkoa
        else if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
          scaleOptions = currentQuestion.options.map((opt, index) => ({
            value: index + 1,
            label: opt
          }));
        }
        // Jos ei kumpaakaan, käytä pelkkiä numeroita (vältetään ristiriitaa)
        else {
          scaleOptions = [1, 2, 3, 4, 5].map(value => ({
            value,
            label: value.toString() // Vain numero, ei tekstiä
          }));
        }

        return (
          <div className="space-y-3">
            {scaleOptions.map((option) => (
              <button
                key={option.value.toString()}
                onClick={() => {
                  // Tallennetaan sekä arvo että selite
                  const fullAnswer = {
                    value: option.value,
                    label: option.label
                  };
                  saveAnswer(currentQuestion.id, fullAnswer, 'scale');
                }}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  answers[currentQuestion.id]?.value === option.value
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
            onChange={(e) => saveAnswer(currentQuestion.id, e.target.value, 'text')}
            className="min-h-[150px]"
          />
        );

      case 'select':
        let selectOptions: {value: string, label: string}[] = [];

        // Tarkista, onko answerOptions-objekteja
        if (currentQuestion.answerOptions?.length > 0) {
          selectOptions = currentQuestion.answerOptions;
        }
        // Tarkista, onko options-merkkijonotaulukkoa
        else if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
          selectOptions = currentQuestion.options.map((opt, index) => ({
            value: String(index),
            label: opt
          }));
        }
        // Jos ei kumpaakaan, käytä tyhjiä arvoja
        else {
          selectOptions = [{ value: "0", label: "Ei vaihtoehtoja saatavilla" }];
        }

        return (
          <RadioGroup
            value={(answers[currentQuestion.id]?.value || answers[currentQuestion.id] || "").toString()}
            onValueChange={(value) => {
              const selectedOption = selectOptions.find(opt => opt.value.toString() === value);
              if (selectedOption) {
                // Tallennetaan sekä arvo että selite
                saveAnswer(currentQuestion.id, {
                  value: value,
                  label: selectedOption.label
                }, 'select');
              } else {
                saveAnswer(currentQuestion.id, value, 'select');
              }
            }}
            className="space-y-3"
          >
            {selectOptions.map((option) => (
              <label
                key={option.value.toString()}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  answers[currentQuestion.id]?.value === option.value || answers[currentQuestion.id] === option.value
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
        let multiselectOptions: {value: string, label: string}[] = [];

        if (currentQuestion.answerOptions?.length > 0) {
          multiselectOptions = currentQuestion.answerOptions;
        }
        else if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
          multiselectOptions = currentQuestion.options.map((opt, index) => ({
            value: String(index),
            label: opt
          }));
        }
        else {
          multiselectOptions = [{ value: "0", label: "Ei vaihtoehtoja saatavilla" }];
        }

        return (
          <div className="space-y-3">
            {multiselectOptions.map((option) => {
              const optionValue = option.value.toString();
              return (
                <label
                  key={optionValue}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    tempMultiSelect.includes(optionValue)
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`option-${optionValue}`} 
                      checked={tempMultiSelect.includes(optionValue)}
                      onCheckedChange={() => handleMultiSelectChange(optionValue)}
                    />
                    <span>{option.label}</span>
                  </div>
                </label>
              );
            })}
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
              onChange={(e) => saveAnswer(currentQuestion.id, Number(e.target.value), 'numeric')}
              className="text-center text-lg"
            />
            {currentQuestion.min !== undefined && currentQuestion.max !== undefined && (
              <div className="px-4">
                <Slider
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step={1}
                  value={[answers[currentQuestion.id] || currentQuestion.min || 0]}
                  onValueChange={(values) => saveAnswer(currentQuestion.id, values[0], 'numeric')}
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
        // Korjattu boolean-kysymysten käsittely

        // Määrittele RadioGroupin arvo niin, että undefined/null on eri kuin false
        // Käytä merkkijonoja "true", "false" tai "" (tyhjä = ei valintaa)
        const booleanValue = answers[currentQuestion.id] === undefined ? 
          "" : // Ei valintaa
          answers[currentQuestion.id] === true ? 
            "true" : // Kyllä
            "false"; // Ei

        return (
          <div className="space-y-3">
            <RadioGroup
              value={booleanValue}
              onValueChange={(value) => saveAnswer(
                currentQuestion.id, 
                value === "true" ? true : 
                value === "false" ? false : 
                undefined, // Ei pitäisi koskaan tapahtua
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
      const answer = answers[currentQuestion.id];
      if (answer && typeof answer === 'object' && 'values' in answer) {
        return Array.isArray(answer.values) && answer.values.length > 0;
      }
      return Array.isArray(answer) && answer.length > 0;
    }

    if (currentQuestion.questionType === 'text') {
      return answers[currentQuestion.id] && 
             typeof answers[currentQuestion.id] === 'string' && 
             answers[currentQuestion.id].trim() !== '';
    }

    if (currentQuestion.questionType === 'boolean') {
      return answers[currentQuestion.id] !== undefined;
    }

    if (currentQuestion.questionType === 'scale' && typeof answers[currentQuestion.id] === 'object') {
      return answers[currentQuestion.id]?.value !== undefined;
    }

    return answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  };

  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4">
        <Badge variant="outline" className="mb-2 w-fit rounded-full">
          Vaihe 4: Kysymys {currentQuestionIndex + 1}/{currentQuestions.length}
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
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleSkipQuestion}
            disabled={isLoading}
            className="rounded-full"
          >
            Ohita
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isAnswered()}
            className="rounded-full"
          >
            {currentQuestionIndex === currentQuestions.length - 1 ? <span style={{ color: 'white' }}>Analysoi</span> : <span style={{ color: 'white' }}>Seuraava</span>}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestionsStep;