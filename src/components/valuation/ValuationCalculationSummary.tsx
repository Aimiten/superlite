import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValuationCalculationSummaryProps {
  valuationMetrics: Record<string, any>;
  mostLikelyValue: number;
  methodsCount: number;
  className?: string;
}

/**
 * Komponentti joka näyttää selkeästi miten arvonmääritys on laskettu
 */
const ValuationCalculationSummary: React.FC<ValuationCalculationSummaryProps> = ({
  valuationMetrics,
  mostLikelyValue,
  methodsCount,
  className = ""
}) => {
  // Format currency 
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Check which methods were used (non-zero values)
  const usedMethods = [];
  let hasNegativeResult = false;

  if (valuationMetrics.book_value !== undefined && valuationMetrics.book_value !== 0) {
    usedMethods.push({
      name: "Taseen oma pääoma",
      value: valuationMetrics.book_value,
      description: "Vastaavaa - Vieras pääoma",
      key: "book_value"
    });
  }

  if (valuationMetrics.equity_value_from_revenue && valuationMetrics.equity_value_from_revenue > 0) {
    usedMethods.push({
      name: "Liikevaihtopohjainen",
      value: valuationMetrics.equity_value_from_revenue,
      description: "Liikevaihto × kerroin - Nettovelka",
      key: "equity_value_from_revenue"
    });
  }

  if (valuationMetrics.equity_value_from_ebit !== undefined) {
    if (valuationMetrics.equity_value_from_ebit > 0) {
      usedMethods.push({
        name: "EBIT-pohjainen",
        value: valuationMetrics.equity_value_from_ebit,
        description: "EBIT × kerroin - Nettovelka",
        key: "equity_value_from_ebit"
      });
    } else if (valuationMetrics.equity_value_from_ebit === 0) {
      hasNegativeResult = true;
    }
  }

  if (valuationMetrics.equity_value_from_ebitda !== undefined) {
    if (valuationMetrics.equity_value_from_ebitda > 0) {
      usedMethods.push({
        name: "EBITDA-pohjainen",
        value: valuationMetrics.equity_value_from_ebitda,
        description: "EBITDA × kerroin - Nettovelka",
        key: "equity_value_from_ebitda"
      });
    } else if (valuationMetrics.equity_value_from_ebitda === 0) {
      hasNegativeResult = true;
    }
  }

  if (valuationMetrics.equity_value_from_pe !== undefined) {
    if (valuationMetrics.equity_value_from_pe > 0) {
      usedMethods.push({
        name: "P/E-pohjainen",
        value: valuationMetrics.equity_value_from_pe,
        description: "Nettotulos × P/E-kerroin",
        key: "equity_value_from_pe"
      });
    } else if (valuationMetrics.equity_value_from_pe === 0) {
      hasNegativeResult = true;
    }
  }

  // If we found more methods than methodsCount, limit to the most significant ones
  if (usedMethods.length > methodsCount) {
    // Sort by value (highest first) and take methodsCount items
    usedMethods.sort((a, b) => b.value - a.value);
    usedMethods.splice(methodsCount);
  }

  // Create formula text for the calculation
  let formulaText = "";
  if (usedMethods.length > 0) {
    const valueTerms = usedMethods.map(m => formatCurrency(m.value)).join(" + ");
    formulaText = usedMethods.length > 1 
      ? `(${valueTerms}) ÷ ${usedMethods.length}`
      : valueTerms;
  }

  if (usedMethods.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
            Arvon laskentaperiaate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-amber-800">
              Arvon laskentaperiaatteen esittäminen ei ole mahdollista, koska tarvittavia tietoja ei ole saatavilla.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
          Arvon laskentaperiaate
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-2">
                  <Info className="h-4 w-4 text-slate-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  {methodsCount} menetelmän keskiarvo käyttäen vain positiivisia arvoja.
                  {hasNegativeResult && " Tulospohjaiset menetelmät tuottivat negatiivisen tai nolla-arvon, joten niitä ei huomioitu."}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <div className="text-sm text-slate-500 mt-1">
          Todennäköisin arvo: {formatCurrency(mostLikelyValue)}
          <Badge variant="outline" className="ml-2 text-xs">Keskiarvo {methodsCount} menetelmästä</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {usedMethods.map((method) => (
              <div key={method.key} className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{method.name}:</span>
                  <span className="font-medium">{formatCurrency(method.value)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {method.description}
                </div>
              </div>
            ))}

            {usedMethods.length > 1 && (
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-800">Todennäköisin arvo (keskiarvo):</span>
                  <span className="font-medium text-indigo-800">{formatCurrency(mostLikelyValue)}</span>
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  {formulaText}
                </div>
              </div>
            )}
          </div>

          {/* Tilikausien painotustiedot jos saatavilla */}
          {valuationMetrics.weighting_method && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
              <h3 className="text-sm font-medium text-blue-800">Usean tilikauden painotus</h3>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-blue-700">
                  <strong>Tilikausien määrä:</strong> {valuationMetrics.weighting_method.period_count || 1}
                </p>
                {valuationMetrics.weighting_method.method === "exponential" && (
                  <>
                    <p className="text-xs text-blue-700">
                      <strong>Yrityksen luonne:</strong> {
                        valuationMetrics.weighting_method.business_pattern === "growth" ? "Kasvuyritys" :
                        valuationMetrics.weighting_method.business_pattern === "cyclical" ? "Syklinen toimiala" :
                        "Vakaa liiketoiminta"
                      }
                    </p>
                    <p className="text-xs text-blue-700">
                      <strong>Painotuskerroin:</strong> {valuationMetrics.weighting_method.alpha?.toFixed(1)}
                    </p>
                    {valuationMetrics.weighting_method.weights?.length > 1 && (
                      <p className="text-xs text-blue-700">
                        <strong>Tilikausien painot:</strong> {
                          valuationMetrics.weighting_method.weights
                            .map(w => Math.round(w * 100))
                            .slice(0, 5)
                            .join('% / ')
                        }%
                      </p>
                    )}
                    <p className="text-xs text-blue-700 italic">
                      {valuationMetrics.weighting_method.explanation || ""}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {hasNegativeResult && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
              <p className="text-sm text-blue-700">
                <strong>Huomio:</strong> Jotkut tulospohjaiset arvostusmenetelmät (EV/EBIT, EV/EBITDA, P/E) tuottivat 
                negatiivisen tai nolla-arvon, joten niitä ei käytetty keskiarvon laskennassa.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ValuationCalculationSummary;