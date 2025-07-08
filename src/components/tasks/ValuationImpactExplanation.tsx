// src/components/tasks/ValuationImpactExplanation.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Calculator, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValuationImpactExplanationProps {
  valuationImpact: any;
  isPostDD?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const ValuationImpactExplanation: React.FC<ValuationImpactExplanationProps> = ({
  valuationImpact,
  isPostDD
}) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!valuationImpact) {
    return null;
  }

  // Data extraction with fallbacks
  const originalSnapshot = valuationImpact?.original_valuation_snapshot || valuationImpact?.originalValuation;
  const adjustedResult = valuationImpact?.adjusted_valuation_result || valuationImpact?.adjustedValuation;
  const adjustmentFactors = valuationImpact?.adjustment_factors || valuationImpact?.adjustmentFactors;
  const salesAnalysis = valuationImpact?.sales_readiness_analysis || valuationImpact?.salesReadinessAnalysis;
  const kvantitatiivisetArviot = salesAnalysis?.kvantitatiivisetArviot;

  // Kerää kategoriavaikutukset
  const categoryImpacts: Record<string, number> = {};
  if (kvantitatiivisetArviot) {
    Object.entries(kvantitatiivisetArviot).forEach(([key, data]: [string, any]) => {
      if (data.arvovaikutus?.vaikutusprosentti !== undefined) {
        categoryImpacts[key] = data.arvovaikutus.vaikutusprosentti;
      }
    });
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Laskennan tarkistus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-blue-900">
            Myyntikuntoisuusanalyysi vaikuttaa yrityksen arvostuskertoimiin. 
            Arvonmääritys lasketaan uudelleen käyttäen samoja menetelmiä kuin alkuperäisessä, 
            mutta säätämällä kertoimia myyntikuntoisuuden perusteella.
          </p>
        </div>

        {/* 1. Mistä korjauskertoimet tulevat */}
        <div className="border rounded-lg">
          <button
            className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            onClick={() => toggleSection('factors')}
          >
            <span className="font-medium text-sm">Mistä korjauskertoimet tulevat?</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform text-gray-500",
              openSection === 'factors' && "rotate-180"
            )} />
          </button>

          {openSection === 'factors' && (
            <div className="border-t p-3 bg-gray-50 space-y-3">
              {/* Sanallinen selitys */}
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  Myyntikuntoisuusanalyysin eri kategoriat vaikuttavat arvostuskertoimiin eri tavoin:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Asiakaskeskittyneisyys ja sopimusrakenne vaikuttavat erityisesti liikevaihtokertoimeen</li>
                  <li>Operatiiviset tekijät ja talous vaikuttavat tuloskertoimiin (EBIT, EBITDA)</li>
                  <li>Dokumentaation puutteet vaikuttavat kaikkiin kertoimiin</li>
                </ul>
              </div>

              {/* Korjauskertoimet */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Lasketut korjauskertoimet:</p>

                {adjustmentFactors?.revenueMultipleFactor && (
                  <div className="bg-white p-2 rounded text-sm">
                    <div className="font-medium mb-1">
                      Liikevaihtokerroin: {(adjustmentFactors.revenueMultipleFactor).toFixed(3)}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Perustuu: asiakaskeskittyneisyys (35%), sopimusrakenne (30%), strategia (25%), dokumentaatio (10%)
                    </div>
                  </div>
                )}

                {adjustmentFactors?.ebitMultipleFactor && (
                  <div className="bg-white p-2 rounded text-sm">
                    <div className="font-medium mb-1">
                      EBIT-kerroin: {(adjustmentFactors.ebitMultipleFactor).toFixed(3)}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Perustuu: operatiiviset (30%), taloudelliset (30%), henkilöstö (25%), dokumentaatio (15%)
                    </div>
                  </div>
                )}

                {adjustmentFactors?.ebitdaMultipleFactor && (
                  <div className="bg-white p-2 rounded text-sm">
                    <div className="font-medium mb-1">
                      EBITDA-kerroin: {(adjustmentFactors.ebitdaMultipleFactor).toFixed(3)}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Perustuu: operatiiviset (35%), taloudelliset (25%), henkilöstö (25%), dokumentaatio (15%)
                    </div>
                  </div>
                )}
              </div>

              {/* Suurimmat vaikuttajat */}
              {Object.entries(categoryImpacts).length > 0 && (
                <div className="bg-white p-2 rounded">
                  <p className="text-xs font-medium text-gray-700 mb-1">Suurimmat vaikutukset:</p>
                  {Object.entries(categoryImpacts)
                    .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
                    .slice(0, 3)
                    .map(([category, impact]) => (
                      <div key={category} className="text-xs text-gray-600">
                        • {category.charAt(0).toUpperCase() + category.slice(1)}: {formatPercent(impact)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Miten kertoimia säädetään */}
        <div className="border rounded-lg">
          <button
            className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            onClick={() => toggleSection('application')}
          >
            <span className="font-medium text-sm">Miten arvostuskertoimia säädetään?</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform text-gray-500",
              openSection === 'application' && "rotate-180"
            )} />
          </button>

          {openSection === 'application' && (
            <div className="border-t p-3 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">
                Alkuperäiset kertoimet kerrotaan korjauskertoimilla:
              </p>

              <div className="space-y-2">
                {originalSnapshot?.multiplesUsed?.revenue && (
                  <div className="bg-white p-2 rounded">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">Liikevaihto:</span>
                      <div className="font-mono text-xs">
                        <span>{originalSnapshot.multiplesUsed.revenue.toFixed(3)}x</span>
                        <span className="mx-1 text-gray-500">×</span>
                        <span>{(adjustmentFactors?.revenueMultipleFactor || 1).toFixed(3)}</span>
                        <span className="mx-1 text-gray-500">=</span>
                        <span className="font-semibold text-sm">{(adjustedResult?.adjustedMultiples?.revenue || 0).toFixed(3)}x</span>
                      </div>
                    </div>
                  </div>
                )}

                {originalSnapshot?.multiplesUsed?.ebit && (
                  <div className="bg-white p-2 rounded">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">EBIT:</span>
                      <div className="font-mono text-xs">
                        <span>{originalSnapshot.multiplesUsed.ebit.toFixed(3)}x</span>
                        <span className="mx-1 text-gray-500">×</span>
                        <span>{(adjustmentFactors?.ebitMultipleFactor || 1).toFixed(3)}</span>
                        <span className="mx-1 text-gray-500">=</span>
                        <span className="font-semibold text-sm">{(adjustedResult?.adjustedMultiples?.ebit || 0).toFixed(3)}x</span>
                      </div>
                    </div>
                  </div>
                )}

                {originalSnapshot?.multiplesUsed?.ebitda && (
                  <div className="bg-white p-2 rounded">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">EBITDA:</span>
                      <div className="font-mono text-xs">
                        <span>{originalSnapshot.multiplesUsed.ebitda.toFixed(3)}x</span>
                        <span className="mx-1 text-gray-500">×</span>
                        <span>{(adjustmentFactors?.ebitdaMultipleFactor || 1).toFixed(3)}</span>
                        <span className="mx-1 text-gray-500">=</span>
                        <span className="font-semibold text-sm">{(adjustedResult?.adjustedMultiples?.ebitda || 0).toFixed(3)}x</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                💡 Korjauskertoimet perustuvat myyntikuntoisuusanalyysin tuloksiin. 
                Kerroin alle 1.0 tarkoittaa arvon laskua, yli 1.0 arvon nousua.
              </p>
            </div>
          )}
        </div>

        {/* 3. Miten uusi arvo lasketaan */}
        <div className="border rounded-lg">
          <button
            className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            onClick={() => toggleSection('calculation')}
          >
            <span className="font-medium text-sm">Miten uusi arvo lasketaan?</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform text-gray-500",
              openSection === 'calculation' && "rotate-180"
            )} />
          </button>

          {openSection === 'calculation' && (
            <div className="border-t p-3 bg-gray-50 space-y-3">
              {/* Käytetyt luvut */}
              <div className="bg-white p-2 rounded">
                <p className="text-xs font-medium text-gray-700 mb-1">Alkuperäiset equity value -arvot:</p>
                <div className="space-y-1 text-xs">
                  {originalSnapshot?.originalMethodValues?.book_value > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kirjanpitoarvo:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.book_value)}</span>
                    </div>
                  )}
                  {originalSnapshot?.originalMethodValues?.asset_based_value > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Omaisuuspohjainen:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.asset_based_value)}</span>
                    </div>
                  )}
                  {originalSnapshot?.originalMethodValues?.equity_value_from_revenue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liikevaihto-pohjainen:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_revenue)}</span>
                    </div>
                  )}
                  {originalSnapshot?.originalMethodValues?.equity_value_from_ebit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">EBIT-pohjainen:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_ebit)}</span>
                    </div>
                  )}
                  {originalSnapshot?.originalMethodValues?.equity_value_from_ebitda > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">EBITDA-pohjainen:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_ebitda)}</span>
                    </div>
                  )}
                  {originalSnapshot?.originalMethodValues?.equity_value_from_pe > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">P/E-pohjainen:</span>
                      <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_pe)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t mt-1 pt-1">
                  <p className="text-xs text-gray-500">
                    Käytetyt menetelmät: {originalSnapshot?.methodsUsedInAverage?.join(', ')}
                  </p>
                </div>
              </div>

              {/* Laskenta */}
              <div className="bg-white p-2 rounded">
                <p className="text-xs font-medium text-gray-700 mb-2">Korjatut arvot:</p>
                <div className="space-y-3 text-xs">
                  {/* Book value - ei muutu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('book_value') && 
                   originalSnapshot?.originalMethodValues?.book_value > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">Kirjanpitoarvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.book_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">{formatCurrency(originalSnapshot.originalMethodValues.book_value)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Asset-based value - ei muutu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('asset_based_value') && 
                   originalSnapshot?.originalMethodValues?.asset_based_value > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">Omaisuuspohjainen arvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.asset_based_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">{formatCurrency(originalSnapshot.originalMethodValues.asset_based_value)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revenue-pohjainen - skaalattu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('revenue') && 
                   originalSnapshot?.originalMethodValues?.equity_value_from_revenue > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">Liikevaihto-pohjainen arvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Kertoimen muutos:</span>
                          <span className="font-mono">
                            {(originalSnapshot?.multiplesUsed?.revenue || 0).toFixed(3)}x → {(adjustedResult?.adjustedMultiples?.revenue || 0).toFixed(3)}x
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">
                            {formatCurrency(
                              originalSnapshot.originalMethodValues.equity_value_from_revenue * 
                              ((adjustedResult?.adjustedMultiples?.revenue || 0) / (originalSnapshot?.multiplesUsed?.revenue || 1))
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EBIT-pohjainen - skaalattu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('ebit') && 
                   originalSnapshot?.originalMethodValues?.equity_value_from_ebit > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">EBIT-pohjainen arvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_ebit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Kertoimen muutos:</span>
                          <span className="font-mono">
                            {(originalSnapshot?.multiplesUsed?.ebit || 0).toFixed(1)}x → {(adjustedResult?.adjustedMultiples?.ebit || 0).toFixed(1)}x
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">
                            {formatCurrency(
                              originalSnapshot.originalMethodValues.equity_value_from_ebit * 
                              ((adjustedResult?.adjustedMultiples?.ebit || 0) / (originalSnapshot?.multiplesUsed?.ebit || 1))
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EBITDA-pohjainen - skaalattu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('ebitda') && 
                   originalSnapshot?.originalMethodValues?.equity_value_from_ebitda > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">EBITDA-pohjainen arvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_ebitda)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Kertoimen muutos:</span>
                          <span className="font-mono">
                            {(originalSnapshot?.multiplesUsed?.ebitda || 0).toFixed(3)}x → {(adjustedResult?.adjustedMultiples?.ebitda || 0).toFixed(3)}x
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">
                            {formatCurrency(
                              originalSnapshot.originalMethodValues.equity_value_from_ebitda * 
                              ((adjustedResult?.adjustedMultiples?.ebitda || 0) / (originalSnapshot?.multiplesUsed?.ebitda || 1))
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* P/E-pohjainen - skaalattu */}
                  {originalSnapshot?.methodsUsedInAverage?.includes('pe') && 
                   originalSnapshot?.originalMethodValues?.equity_value_from_pe > 0 && (
                    <div className="border-b pb-2">
                      <div className="font-medium text-gray-700 mb-1">P/E-pohjainen arvo:</div>
                      <div className="pl-2 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Alkuperäinen:</span>
                          <span className="font-mono">{formatCurrency(originalSnapshot.originalMethodValues.equity_value_from_pe)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Kertoimen muutos:</span>
                          <span className="font-mono">
                            {(originalSnapshot?.multiplesUsed?.pe || 0).toFixed(1)}x → {(adjustedResult?.adjustedMultiples?.pe || 0).toFixed(1)}x
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Korjattu arvo:</span>
                          <span className="font-mono font-medium">
                            {formatCurrency(
                              originalSnapshot.originalMethodValues.equity_value_from_pe * 
                              ((adjustedResult?.adjustedMultiples?.pe || 0) / (originalSnapshot?.multiplesUsed?.pe || 1))
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Keskiarvo ({originalSnapshot?.methodsUsedInAverage?.length || 0} menetelmää):</span>
                    <span>{formatCurrency(adjustedResult?.averageValuation || 0)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Käytetään alkuperäisiä equity value -arvoja (nettovelka huomioitu) ja skaalataan ne uusilla kertoimilla. 
                Kirjanpitoarvo pysyy muuttumattomana. Lopullinen arvo on näiden keskiarvo.
              </p>
            </div>
          )}
        </div>

        {/* Lopputulos */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Alkuperäinen arvo:</span>
            <span className="font-medium">{formatCurrency(originalSnapshot?.averageValuation || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Korjattu arvo:</span>
            <span className="font-medium">{formatCurrency(adjustedResult?.averageValuation || 0)}</span>
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between items-center">
            <span className="font-medium text-sm">Vaikutus:</span>
            <span className={cn(
              "font-bold",
              ((adjustedResult?.averageValuation || 0) - (originalSnapshot?.averageValuation || 0)) > 0
                ? "text-green-600"
                : "text-red-600"
            )}>
              {formatPercent(
                ((adjustedResult?.averageValuation || 0) - (originalSnapshot?.averageValuation || 0)) / 
                (originalSnapshot?.averageValuation || 1) * 100
              )}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default ValuationImpactExplanation;