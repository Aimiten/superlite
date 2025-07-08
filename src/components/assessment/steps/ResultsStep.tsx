// src/components/assessment/steps/ResultsStep.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, AlertTriangle, Info, Target, HelpCircle, Edit } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAssessmentStore } from "@/stores/assessmentStore";

interface ResultsStepProps {
  onComplete?: () => void;
  onBack?: () => void;  // Lisätty erillinen callback paluutoiminnolle
}

const ResultsStep: React.FC<ResultsStepProps> = ({ onComplete, onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("report");

  const { questions, answers, results } = useAssessmentStore();

  // Format answers for display
  const reviewAnswers = questions
    .filter(q => q?.id !== 'placeholder-1' && answers && answers.hasOwnProperty(q?.id))
    .map(question => {
      if (!question) return null;

      const answerValue = answers[question.id]; 
      let displayAnswer: string;

      // Käsittele ohitetut kysymykset
      if (answerValue && typeof answerValue === 'object' && 'skipped' in answerValue) {
        displayAnswer = '[Ohitettu]';
      } else {
        switch (question.questionType) {
        case 'scale': 
        case 'select': 
          const option = typeof answerValue === 'object' ? answerValue : 
            question.answerOptions?.find(o => String(o?.value) === String(answerValue));
          displayAnswer = option ? 
            (typeof option === 'object' && 'label' in option ? 
              `${option.label} (${option.value})` : String(option)) : 
            String(answerValue);
          break;

        case 'multiselect': 
        let selectedLabels: string[] = [];

        if (typeof answerValue === 'object' && answerValue !== null && !Array.isArray(answerValue)) {
          if (Array.isArray(answerValue.labels)) {
            selectedLabels = answerValue.labels;
          } else if (Array.isArray(answerValue.values)) {
            selectedLabels = answerValue.values.map(val => {
              const index = parseInt(String(val), 10);
              if (question.options && Array.isArray(question.options) && index >= 0 && index < question.options.length) {
                return question.options[index];
              }
              return String(val);
            });
          }
        } else {
          // Fallback vanhalle tallennusmuodolle
          const selectedValues = Array.isArray(answerValue) ? answerValue : [answerValue];
          selectedLabels = selectedValues.map(val => {
            if (question.options && Array.isArray(question.options)) {
              const index = parseInt(String(val), 10);
              if (!isNaN(index) && index >= 0 && index < question.options.length) {
                return question.options[index];
              }
            }
            return String(val);
          });
        }

        displayAnswer = selectedLabels.length > 0 ? selectedLabels.join(', ') : '-';
        break;

        default: 
          displayAnswer = String(answerValue);
        }
      }

      return { 
        id: question.id, 
        question: question.question, 
        answer: displayAnswer 
      };
    })
    .filter(Boolean) as { id: string; question: string; answer: string }[];

  const handleBackToList = () => {
    if (onBack) {
      // Käytä onBack-callbackia, jos se on määritelty
      onBack();
    } else if (onComplete) {
      // Fallback vanhaan toimintaan yhteensopivuuden vuoksi
      onComplete();
    } else {
      // Jos kumpaakaan ei ole määritelty, navigoi suoraan arviointilistaukseen
      navigate('/assessment');
    }
  };

  if (!results || !results.myyntikuntoisuusRaportti) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Tuloksia ei löytynyt</h3>
          <p className="text-gray-600 text-center mb-6">
            Arvioinnin tuloksia ei löytynyt tai ne ovat puutteelliset.
          </p>
          <Button onClick={() => navigate('/assessment')} className="rounded-full">
            Palaa arviointinäkymään
          </Button>
        </CardContent>
      </Card>
    );
  }

  const report = results.myyntikuntoisuusRaportti;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Lisätty takaisin-painike ylätunnisteeksi samalla tyylillä kuin Valuation.tsx:ssä */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <Button onClick={handleBackToList} variant="outline">
          ← Takaisin listaan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="report">Analyysiraportti</TabsTrigger>
          <TabsTrigger value="answers">Antamasi vastaukset</TabsTrigger>
        </TabsList>

        {/* Report tab */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyysin yhteenveto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{report.yhteenveto || "Yhteenvetoa ei löytynyt."}</p>
              </div>

              {/* Findings */}
              {(report.havainnot?.vahvuudet?.length > 0 || report.havainnot?.heikkoudetJaKehityskohteet?.length > 0) && (
                <div className="space-y-4">
                  {/* Strengths */}
                  {report.havainnot?.vahvuudet && report.havainnot.vahvuudet.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center text-green-700 dark:text-green-400">
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Vahvuudet
                      </h3>
                      <ul className="list-none space-y-3 pl-0">
                        {report.havainnot.vahvuudet.map((item, index) => (
                          <li key={`vahvuus-${index}`} className="border-l-4 border-green-300 dark:border-green-600 pl-4 py-1">
                            <p className="font-medium">{item.havainto}</p>
                            {item.perustelu && <p className="text-xs text-muted-foreground italic">Perustelu: {item.perustelu}</p>}
                            {item.osaAlue && <Badge variant="outline" className="mt-1 text-xs">{item.osaAlue}</Badge>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {report.havainnot?.heikkoudetJaKehityskohteet && report.havainnot.heikkoudetJaKehityskohteet.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2 flex items-center text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="mr-2 h-5 w-5" /> Heikkoudet ja Kehityskohteet
                      </h3>
                      <ul className="list-none space-y-3 pl-0">
                        {report.havainnot.heikkoudetJaKehityskohteet.map((item, index) => (
                          <li key={`heikkous-${index}`} className="border-l-4 border-yellow-300 dark:border-yellow-600 pl-4 py-1">
                            <p className="font-medium">{item.havainto}</p>
                            {item.vaikutus && <p className="text-xs text-muted-foreground italic">Vaikutus: {item.vaikutus}</p>}
                            {item.osaAlue && <Badge variant="outline" className="mt-1 text-xs">{item.osaAlue}</Badge>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Reasoning */}
              {report.perustelut && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <h4 className="font-semibold mb-1 flex items-center text-gray-600 dark:text-gray-400">
                    <Info className="mr-2 h-4 w-4"/> Analyysin perustelut
                  </h4>
                  <p className="text-sm text-muted-foreground">{report.perustelut}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {report.kehitysehdotukset && report.kehitysehdotukset.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400"/> 
                  Kehitysehdotukset
                </CardTitle>
                <CardDescription>Ehdotetut toimenpiteet myyntikuntoisuuden parantamiseksi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.kehitysehdotukset.map((rec, index) => {
                  // Helpers for styling based on priority
                  const priorityColor = (priority?: string) => {
                    switch (priority) { 
                      case 'korkea': return 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700'; 
                      case 'keskitaso': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'; 
                      case 'matala': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'; 
                      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700'; 
                    }
                  };

                  const priorityText = (priority?: string) => {
                    switch (priority) { 
                      case 'korkea': return 'Korkea'; 
                      case 'keskitaso': return 'Keskitaso'; 
                      case 'matala': return 'Matala'; 
                      default: return 'Ei määrit.'; 
                    }
                  };

                  const priorityBadgeVariant = (priority?: string): "destructive" | "secondary" | "outline" => {
                    switch (priority) { 
                      case 'korkea': return 'destructive'; 
                      case 'keskitaso': return 'secondary'; 
                      default: return 'outline';
                    }
                  };

                  return (
                    <div key={`rec-${index}`} className={`p-4 rounded-lg border-l-4 ${priorityColor(rec.prioriteetti)}`}>
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="font-semibold">{rec.otsikko || "Nimetön ehdotus"}</h4>
                        <Badge variant={priorityBadgeVariant(rec.prioriteetti)} className="flex-shrink-0">
                          Prioriteetti: {priorityText(rec.prioriteetti)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{rec.kuvaus || "-"}</p>
                      {rec.liittyyHeikkouteen && <p className="text-xs text-muted-foreground">Liittyy heikkouteen: {rec.liittyyHeikkouteen}</p>}
                      {rec.oletettuVaikutus && <p className="text-xs text-muted-foreground">Oletettu vaikutus: {rec.oletettuVaikutus}</p>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Action items */}
          {report.selvitettavatAsiat && report.selvitettavatAsiat.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400"/> 
                  Selvitettävät asiat
                </CardTitle>
                <CardDescription>Asiat, jotka vaativat lisäselvitystä tai toimenpiteitä.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-none space-y-4 pl-0">
                  {report.selvitettavatAsiat.map((item, index) => (
                    <li key={`action-${index}`} className="border-l-4 border-orange-300 dark:border-orange-600 pl-4 py-2">
                      <p className="font-medium">{item.aihe || "Nimetön aihe"}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.kysymysTaiTehtava || "-"}</p>
                      {item.miksiTarkea && <p className="text-xs text-muted-foreground italic mt-1">Miksi tärkeä: {item.miksiTarkea}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Answers tab */}
        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400"/> 
                Antamasi vastaukset
              </CardTitle>
              <CardDescription>
                Tarkastele arvioinnin aikana antamiasi vastauksia. 
                {reviewAnswers.length > 0 && ` Vastasit ${reviewAnswers.filter(item => item.answer !== '[Ohitettu]').length}/${reviewAnswers.length} kysymykseen.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewAnswers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  Kysymyksiä tai vastauksia ei löytynyt tähän arviointiin.
                </p>
              ) : (
                reviewAnswers.map((item) => {
                  const isSkipped = item.answer === '[Ohitettu]';
                  return (
                    <div key={item.id} className={`p-3 border rounded-md ${isSkipped ? 'bg-yellow-50/50 dark:bg-yellow-900/20 dark:border-yellow-700' : 'bg-gray-50/50 dark:bg-gray-800/20 dark:border-gray-700'}`}>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{item.question}</p>
                      <p className={`text-sm pl-2 border-l-2 ${isSkipped ? 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700' : 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700'}`}>
                        <strong>Vastaus:</strong> {item.answer || <span className="italic text-muted-foreground">Ei vastausta</span>}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-4 border-t pt-6 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={onComplete}
            className="flex items-center gap-2 rounded-full cursor-pointer text-white"
          >
            Luo tehtävät
            <ArrowRight className="h-4 w-4 text-white" />
          </Button>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-full cursor-pointer"
          >
            Palaa etusivulle
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsStep;