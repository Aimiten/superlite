// src/components/tasks/AnalysisAlert.tsx
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface AnalysisAlertProps {
  isVisible: boolean;
  analysisType?: 'valuation' | 'dd'; // valuation = arvovaikutus, dd = due diligence
  className?: string;
}

/**
 * Komponentti, joka näyttää ilmoituksen kun analyysi on käynnissä
 */
const AnalysisAlert: React.FC<AnalysisAlertProps> = ({
  isVisible,
  analysisType = 'valuation',
  className = ''
}) => {
  if (!isVisible) return null;

  const title = analysisType === 'dd' 
    ? "Due diligence -analyysi käynnissä" 
    : "Arvovaikutuksen laskenta käynnissä";

  return (
    <Alert className={`bg-blue-50 border-blue-200 ${className}`}>
      <div className="flex items-center gap-2">
        <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-600" />
        <AlertTitle>{title}</AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        <p>
          Laskenta on nyt käynnissä ja voi kestää useita minuutteja. 
          Voit poistua tältä sivulta tai käyttää sovelluksen muita toimintoja odottaessasi.
        </p>
        <p className="mt-1">
          Kun laskenta on valmis, näet tulokset Arvovaikutus-välilehdellä.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default AnalysisAlert;