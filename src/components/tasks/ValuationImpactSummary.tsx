// src/components/tasks/ValuationImpactSummary.tsx
import React from "react";
import { ArrowUp, ArrowDown, ArrowRight, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValuationImpactSummaryProps {
  originalValue: number | null | undefined;
  adjustedValue: number | null | undefined;
  hasAnalysis: boolean;
}

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

// Päivitetty funktio, joka laskee prosenttimuutoksen
const calculatePercentageChange = (initial: number | null | undefined, final: number | null | undefined): string => {
  if (!initial || !final) return "N/A";
  const change = ((final - initial) / Math.abs(initial)) * 100;
  return change.toFixed(1);
};

export const ValuationImpactSummary: React.FC<ValuationImpactSummaryProps> = ({
  originalValue,
  adjustedValue,
  hasAnalysis,
}) => {
  // Älä näytä mitään, jos analyysiä ei ole tai arvot puuttuvat
  if (!hasAnalysis || originalValue === null || adjustedValue === null || originalValue === undefined || adjustedValue === undefined) {
    return null;
  }

  const change = adjustedValue - originalValue;
  // Varmistetaan, että alkuperäinen arvo ei ole nolla prosenttilaskussa
  const percentageChange = Math.abs(originalValue) > 0.01 ? (change / Math.abs(originalValue)) * 100 : (adjustedValue !== 0 ? (adjustedValue > 0 ? Infinity : -Infinity) : 0);

  const isPositive = change > 0.01; // Pieni toleranssi
  const isNegative = change < -0.01; // Pieni toleranssi
  const isNeutral = !isPositive && !isNegative;

  const changeColor = isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-slate-600";
  const bgColor = isPositive ? "bg-green-100" : isNegative ? "bg-red-100" : "bg-slate-100";
  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : ArrowRight;

  let percentageText: string;
  if (percentageChange === Infinity) percentageText = "+∞%";
  else if (percentageChange === -Infinity) percentageText = "-∞%";
  else percentageText = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;


  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${changeColor} flex-shrink-0`} />
          <span className={`text-lg font-semibold ${changeColor}`}>
            {percentageText}
          </span>
          <span className="text-sm text-slate-600 whitespace-nowrap">arvovaikutus</span>
          {/* Lisätty infonappi */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>Myyntikuntoisuuden vaikutus yrityksen arvoon. Perustuu kaikkien kategorioiden kokonaisvaikutukseen, jossa huomioidaan mm. asiakaskeskittyneisyys, henkilöstö ja dokumentaation taso.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-sm text-slate-700 flex items-center gap-1 justify-end sm:justify-start flex-wrap">
          <span>{formatCurrency(originalValue)}</span>
          <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <span className="font-medium">{formatCurrency(adjustedValue)}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1 text-right sm:text-left">
        {/* Selkeämpi selitys vaikutuksen luonteesta */}
        Perustuen {isNeutral ? 'nykyiseen' : (isPositive ? 'parantuneeseen' : 'heikentyneeseen')} myyntikuntoisuuteen, jossa {isPositive ? 'vahvuudet' : 'kehityskohteet'} huomioitu kertoimissa.
      </p>
    </div>
  );
};

export default ValuationImpactSummary;