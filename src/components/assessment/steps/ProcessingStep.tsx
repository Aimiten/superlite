// src/components/assessment/steps/ProcessingStep.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAssessmentStore } from "@/stores/assessmentStore";

interface ProcessingStepProps {
  stage: 'company-info' | 'questions' | 'analysis';
  progress: number;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  stage,
  progress
}) => {
  const { sessionError, updateStep } = useAssessmentStore();

  const getStageTitle = () => {
    switch (stage) {
      case "company-info":
        return "Haetaan yritystietoja...";
      case "questions":
        return "Muodostetaan kysymyksiä...";
      case "analysis":
        return "Analysoidaan vastauksia...";
      default:
        return "Käsitellään...";
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case "company-info":
        return "Etsimme tietoja yrityksestä ja sen myyntikuntoisuudesta.";
      case "questions":
        return "Muodostamme yrityskohtaisia kysymyksiä analyysia varten.";
      case "analysis":
        return "Analysoimme vastauksiasi ja luomme myyntikuntoisuusraporttia.";
      default:
        return "Odota hetki, käsittelemme tietojasi.";
    }
  };

  // Format error message in a user-friendly way
  const getFormattedError = () => {
    if (!sessionError) return "";

    if (sessionError.includes("Virhe kysymysten generoinnissa")) {
      return "Kysymysten muodostaminen epäonnistui. Tekoälypalvelu ei pystynyt luomaan sopivia kysymyksiä tällä hetkellä.";
    }

    if (sessionError.includes("API key not found")) {
      return "Tekoälypalvelun asetukset puuttuvat palvelimelta. Ota yhteyttä ylläpitoon.";
    }

    if (sessionError.includes("Invalid questions format")) {
      return "Kysymysten käsittelyssä tapahtui virhe. Tekoälypalvelu tuotti sopimattoman vastauksen.";
    }

    if (sessionError.includes("No valid JSON")) {
      return "Tekoälypalvelu tuotti virheellisen vastauksen. Kokeile aloittaa alusta.";
    }

    return sessionError;
  };

  return (
    <Card className="w-full max-w-lg mx-auto p-6">
      <CardContent className="flex flex-col items-center justify-center pt-6">
        {!sessionError ? (
          <>
            <div className="flex flex-col items-center space-y-4 text-center mb-8">
              <div className="rounded-full bg-blue-100 p-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-medium">{getStageTitle()}</h3>
                <p className="text-sm text-gray-500 mt-1">{getStageDescription()}</p>
              </div>
            </div>

            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
            </div>

            {progress > 75 && progress < 100 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Tekoäly käsittelee tietoja, tämä voi kestää hetken...
              </p>
            )}
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Käsittely epäonnistui</AlertTitle>
              <AlertDescription>{getFormattedError()}</AlertDescription>
            </Alert>

            <p className="text-sm mt-4 text-gray-600">
              Yritä uudelleen tai kokeile myöhemmin uudestaan. Jos ongelma toistuu, ota yhteyttä tukeen.
            </p>

            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => updateStep('initial-selection')}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> 
              Palaa alkuun
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStep;