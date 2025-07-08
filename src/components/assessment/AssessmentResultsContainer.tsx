import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, AlertTriangle, Info, Target, HelpCircle, Edit } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Question, AnalysisResults } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Propsien määrittely komponentille
interface AssessmentResultsContainerProps {
  analysisResults?: { myyntikuntoisuusRaportti?: AnalysisResults } | null;
  answers?: Record<string, any>;
  questions?: Question[]; // Lisätty questions propsi
  onBack?: (e?: React.MouseEvent) => void;
}

// --- SUORAAN INTEGROIDUT NÄYTTÖKOMPONENTIT ---

// Näyttää analyysiraportin pääkohdat
const AnalysisReportDisplay: React.FC<{ report: AnalysisResults | undefined }> = ({ report }) => {
    if (!report) {
        return <p className="text-center text-muted-foreground">Analyysin tietoja ei saatavilla.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analyysin yhteenveto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Yhteenveto */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                   <p>{report.yhteenveto || "Yhteenvetoa ei löytynyt."}</p>
                </div>

                {/* Havainnot */}
                {(report.havainnot?.vahvuudet?.length > 0 || report.havainnot?.heikkoudetJaKehityskohteet?.length > 0) && (
                     <div className="space-y-4">
                        {/* Vahvuudet */}
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
                         {/* Heikkoudet */}
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
                {/* Perustelut */}
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
    );
};

// Näyttää kehitysehdotukset
const RecommendationsDisplay: React.FC<{ recommendations: AnalysisResults['kehitysehdotukset'] | undefined }> = ({ recommendations }) => {
    if (!recommendations || recommendations.length === 0) return null; // Ei renderöidä mitään, jos ei ehdotuksia

    // Apufunktiot väreille ja teksteille
    const priorityColor = (priority: string | undefined) => {
        switch (priority) { case 'korkea': return 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700'; case 'keskitaso': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'; case 'matala': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'; default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700'; }
    };
    const priorityText = (priority: string | undefined) => {
        switch (priority) { case 'korkea': return 'Korkea'; case 'keskitaso': return 'Keskitaso'; case 'matala': return 'Matala'; default: return 'Ei määrit.'; }
    };
    const priorityBadgeVariant = (priority: string | undefined): "destructive" | "secondary" | "outline" => {
        switch (priority) { case 'korkea': return 'destructive'; case 'keskitaso': return 'secondary'; default: return 'outline';}
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400"/> Kehitysehdotukset</CardTitle>
                <CardDescription>Ehdotetut toimenpiteet myyntikuntoisuuden parantamiseksi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.map((rec, index) => (
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
                ))}
            </CardContent>
        </Card>
    );
};

// Näyttää selvitettävät asiat
const ActionItemsDisplay: React.FC<{ actionItems: AnalysisResults['selvitettavatAsiat'] | undefined }> = ({ actionItems }) => {
    if (!actionItems || actionItems.length === 0) return null; // Ei renderöidä mitään, jos ei tehtäviä

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-orange-600 dark:text-orange-400"/> Selvitettävät asiat</CardTitle>
                <CardDescription>Asiat, jotka vaativat lisäselvitystä tai toimenpiteitä.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-none space-y-4 pl-0">
                    {actionItems.map((item, index) => (
                         <li key={`action-${index}`} className="border-l-4 border-orange-300 dark:border-orange-600 pl-4 py-2">
                            <p className="font-medium">{item.aihe || "Nimetön aihe"}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{item.kysymysTaiTehtava || "-"}</p>
                            {item.miksiTarkea && <p className="text-xs text-muted-foreground italic mt-1">Miksi tärkeä: {item.miksiTarkea}</p>}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

// Näyttää käyttäjän vastaukset
const AnswersReviewDisplay: React.FC<{ answers: { id: string; question: string; answer: string }[] }> = ({ answers }) => {
    console.log("AnswersReviewDisplay sai vastaukset:", answers);

    if (!answers || answers.length === 0) {
       return (
           <Card>
               <CardContent className="pt-6 text-center text-muted-foreground">
                   Kysymyksiä tai vastauksia ei löytynyt tähän arviointiin.
               </CardContent>
           </Card>
       );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Edit className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400"/> Antamasi vastaukset</CardTitle>
                <CardDescription>Tarkastele arvioinnin aikana antamiasi vastauksia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {answers.map((item) => (
                    <div key={item.id} className="p-3 border rounded-md bg-gray-50/50 dark:bg-gray-800/20 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{item.question || `Kysymys (ID: ${item.id})`}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 pl-2 border-l-2 border-blue-200 dark:border-blue-700">
                            <strong>Vastaus:</strong> {item.answer || <span className="italic text-muted-foreground">Ei vastausta</span>}
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

// --- PÄÄKOMPONENTTI ---
const AssessmentResultsContainer: React.FC<AssessmentResultsContainerProps> = ({
  analysisResults,
  answers = {},
  questions = [], // Käytä propseista saatuja kysymyksiä
  onBack
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("report");

  // Otetaan itse raportti talteen
  const report = analysisResults?.myyntikuntoisuusRaportti;

  // Debug-lokitus auttaa selvittämään, saadaanko tarvittavat tiedot
  console.log("AssessmentResults - saadut tiedot:", {
    analysisResults: !!analysisResults,
    raporttiSaatavilla: !!report,
    answers: Object.keys(answers).length > 0 ? "Vastauksia saatavilla" : "Ei vastauksia",
    questions: questions.length > 0 ? "Kysymyksiä saatavilla" : "Ei kysymyksiä",
    questionIds: questions.map(q => q?.id).filter(Boolean)
  });

  // Takaisin-navigointi
  const handleBackToList = (e: React.MouseEvent) => {
    console.log("Takaisin-nappia klikattu");
    e.preventDefault(); 
    e.stopPropagation();

    try {
      // Varmistetaan että callbackia kutsutaan
      if (onBack) {
        console.log("Kutsutaan onBack callback-funktiota");
        onBack();
      } else {
        console.log("onBack callback puuttuu, käytetään varafallback-navigointia");
        // Varafallback, jos onBack-funktiota ei ole
        navigate('/assessment', { replace: true });
        // Nollataan URL parametrit
        if (window.history && location.search) {
          window.history.replaceState({}, '', '/assessment');
        }
      }
    } catch (error) {
      console.error("Virhe takaisin-painikkeen käsittelyssä:", error);
      // Varmistetaan että käyttäjä pääsee takaisin turvallisesti
      navigate('/assessment', { replace: true });
    }
  };

  // Muotoillaan vastaukset näyttöä varten käyttäen propseista saatuja kysymyksiä
  const reviewAnswers = React.useMemo(() => {
    console.log("reviewAnswers laskenta alkaa, kysymyksiä:", questions.length);
    console.log("vastauksia:", Object.keys(answers).length);

    // Jos kysymyksiä ei ole saatavilla tai tuntuu että kysymykset eivät osu vastauksiin,
    // käytä vaihtoehtoista metodia
    const hasAnswers = answers && typeof answers === 'object' && Object.keys(answers).length > 0;
    const anyMatch = questions.some(q => q?.id && answers.hasOwnProperty(q.id));

    if (!hasAnswers) {
      console.log("Ei vastauksia, palautetaan tyhjä lista");
      return [];
    }

    // Debug-tulostukset
    console.log("Vastaukset:", Object.keys(answers).join(", "));
    console.log("Kysymysten ID:t:", questions.map(q => q?.id).join(", "));
    console.log("Osuvatko kysymykset vastauksiin:", anyMatch);

    // Jos kysymykset vastaavat vastauksia, käytä perinteistä logiikkaa
    if (questions.length > 0 && anyMatch) {
      console.log("Kysymykset vastaavat vastauksia, käytetään normaalia logiikkaa");

      const result = questions
        .filter(q => q?.id !== 'placeholder-1' && q?.id && answers.hasOwnProperty(q.id))
        .map(question => {
          if (!question) return null;

          const answerValue = answers[question.id]; 
          let displayAnswer: string;

          // Tarkistetaan onko vastaus olemassa
          if (answerValue === undefined || answerValue === null) {
            return null; // Ohitetaan kysymykset joissa ei ole vastausta
          }

          try {
            switch (question.questionType) {
              case 'scale': 
              case 'select': 
                // Tarkista onko vastaus objekti (uusi muoto)
                if (typeof answerValue === 'object' && answerValue !== null) {
                  displayAnswer = answerValue.label ? 
                    `${answerValue.label} (${answerValue.value})` : 
                    String(answerValue.value || JSON.stringify(answerValue));
                } else {
                  // Etsitään vaihtoehto vastausvalinnoista
                  const option = question.answerOptions?.find(o => String(o?.value) === String(answerValue));
                  displayAnswer = option ? 
                    `${option.label} (${option.value})` : 
                    String(answerValue);
                }
                break;

              case 'multiselect': 
                // Tarkistetaan onko vastaus objekti (uusi muoto)
                if (typeof answerValue === 'object' && answerValue !== null && !Array.isArray(answerValue)) {
                  if (Array.isArray(answerValue.labels)) {
                    displayAnswer = answerValue.labels.join(', ');
                  } else if (Array.isArray(answerValue.values)) {
                    // Haetaan vastausten tekstit
                    const labels = answerValue.values.map((val: any) => {
                      const option = question.answerOptions?.find(o => String(o?.value) === String(val));
                      return option?.label || val;
                    });
                    displayAnswer = labels.join(', ');
                  } else {
                    displayAnswer = JSON.stringify(answerValue);
                  }
                } else {
                  // Vanha muoto (array tai string)
                  const selectedValues = Array.isArray(answerValue) ? answerValue : [answerValue];
                  const selectedLabels = selectedValues.map(val => {
                    const option = question.answerOptions?.find(o => String(o?.value) === String(val));
                    return option?.label || val;
                  }).filter(Boolean);
                  displayAnswer = selectedLabels.length > 0 ? selectedLabels.join(', ') : '-';
                }
                break;

              case 'boolean': 
                displayAnswer = answerValue === true ? 'Kyllä' : (answerValue === false ? 'Ei' : '-');
                break;

              default: 
                // Tarkistetaan onko vastaus objekti
                if (typeof answerValue === 'object' && answerValue !== null) {
                  displayAnswer = JSON.stringify(answerValue);
                } else {
                  displayAnswer = String(answerValue || '-');
                }
            }
          } catch (error) {
            console.error(`Virhe kysymyksen ${question.id} käsittelyssä:`, error);
            displayAnswer = `[Virhe vastauksen käsittelyssä: ${error.message}]`;
          }

          return { 
            id: question.id, 
            question: question.question, 
            answer: displayAnswer 
          };
        })
        .filter(Boolean) as { id: string; question: string; answer: string }[];

      console.log("Prosessoituja vastauksia:", result.length);
      return result;
    }

    // Vaihtoehtoinen käsittely, jos kysymykset eivät täsmää vastauksiin
    console.log("Kysymykset eivät vastaa vastauksia, käytetään vaihtoehtoista logiikkaa");

    return Object.entries(answers).map(([key, value]) => {
      let displayAnswer: string;

      if (typeof value === 'boolean') {
        displayAnswer = value ? 'Kyllä' : 'Ei';
      } else if (typeof value === 'object' && value !== null) {
        if (value.label) {
          displayAnswer = value.label;
          if (value.value) displayAnswer += ` (${value.value})`;
        } else if (Array.isArray(value)) {
          displayAnswer = value.join(', ');
        } else if (Array.isArray(value.labels)) {
          displayAnswer = value.labels.join(', ');
        } else if (Array.isArray(value.values)) {
          displayAnswer = value.values.join(', ');
        } else {
          displayAnswer = JSON.stringify(value);
        }
      } else {
        displayAnswer = String(value || '');
      }

      // Muotoile kysymys avaimesta
      const readableQuestion = key
        .replace(/^q\d+_/, '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        id: key,
        question: readableQuestion,
        answer: displayAnswer
      };
    });
  }, [questions, answers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Välilehdet */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="report">Analyysiraportti</TabsTrigger>
          <TabsTrigger value="answers">Antamasi vastaukset</TabsTrigger>
        </TabsList>

        {/* Raportti-välilehti */}
        <TabsContent value="report" className="space-y-6">
          {!report ? (
             <Card>
                 <CardContent className="pt-6 text-center text-muted-foreground">
                    Analyysin tuloksia ei löytynyt.
                 </CardContent>
             </Card>
          ) : (
            <>
              <AnalysisReportDisplay report={report} />
              <RecommendationsDisplay recommendations={report.kehitysehdotukset} />
              <ActionItemsDisplay actionItems={report.selvitettavatAsiat} />
            </>
          )}
        </TabsContent>

        {/* Vastaukset-välilehti */}
        <TabsContent value="answers">
           <AnswersReviewDisplay answers={reviewAnswers} />
        </TabsContent>
      </Tabs>

      {/* Alapalkki - Korjattu */}
      <div className="flex items-center justify-between gap-4 border-t pt-6 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={onBack}
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

export { AssessmentResultsContainer as AssessmentResults };
export default AssessmentResultsContainer;