
// src/components/valuation/ValuationLoadingStep.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from
"@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ValuationLoadingStepProps {
  stage: "analyzing" | "processing-questions" | "generating-report";
  error: string | null;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Loading step component for the valuation process
 */
const ValuationLoadingStep: React.FC<ValuationLoadingStepProps> = ({
  stage,
  error,
  currentStep,
  totalSteps,
}) => {
  const getStageTitle = () => {
    switch (stage) {
      case "analyzing":
        return "Analysoidaan yritystä";
      case "processing-questions":
        return "Käsitellään vastauksia";
      case "generating-report":
        return "Luodaan arvonmääritysraporttia";
      default:
        return "Käsitellään...";
    }
  };

  const getStageDescription = () => {
    const [elapsedTime, setElapsedTime] = React.useState(0);
    React.useEffect(() => {
      const timer = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);

      return () => clearInterval(timer);
    }, []);
    
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes} min ${secs < 10 ? "0" + secs : secs} sec`;
    };
    
    switch (stage) {
      case "analyzing":
        return `Tekoäly analysoi yrityksen tietoja ja tilinpäätöksiä. Tämä kestää n. 3-5 minuuttia (kulunut aika: ${formatTime(elapsedTime)})`;
      case "processing-questions":
        return `Tämä analyysi tarkentaa antamiasi vastauksia. Prosessin arvioitu kesto on 3-5 minuuttia (kulunut aika: ${formatTime(elapsedTime)})`;
      case "generating-report":
        return `Luodaan yksityiskohtaista arvonmääritysraporttia vastaustesi perusteella. Tämä kestää n. 3-5 minuuttia (kulunut aika: ${formatTime(elapsedTime)})`;
      default:
        return "Odota hetki, käsittelemme tietojasi.";
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col items-center justify-center 
p-6">
        {currentStep && totalSteps && (
          <Badge variant="outline" className="mb-4 w-fit rounded-full 
flex items-center gap-1 text-xs py-1 self-start">
            <div className="bg-indigo-100 text-indigo-700 rounded-full 
w-5 h-5 flex items-center justify-center flex-shrink-0 
font-medium">{currentStep}</div>
            <span>/ {totalSteps}</span>
          </Badge>
        )}

        {!error ? (
          <div className="flex flex-col items-center space-y-4 
text-center w-full">
            <div className="rounded-full bg-blue-100 p-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-medium">{getStageTitle()}</h3>
              <p className="text-sm text-gray-500 
mt-1">{getStageDescription()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Käsittely epäonnistui</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <p className="text-sm mt-4 text-gray-600">
              Yritä uudelleen tai kokeile myöhemmin uudestaan. Jos
ongelma toistuu, ota yhteyttä tukeen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValuationLoadingStep;