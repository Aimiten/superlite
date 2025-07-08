import React from "react";
import { Scale, Calculator, Clock, Info } from "lucide-react";
import ValuationCalculationSummary from "../ValuationCalculationSummary";
import { cleanMarkdownText } from "@/utils/markdownUtils";

interface ValuationMethodsTabProps {
  valuationReport: any;
  latestPeriod: any;
}

const ValuationMethodsTab: React.FC<ValuationMethodsTabProps> = ({
  valuationReport,
  latestPeriod
}) => {
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "Ei tietoa";

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    if (!Number.isInteger(value)) {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat('fi-FI', options).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Selkeä laskentaperiaate */}
      {latestPeriod?.valuation_metrics && (
        <ValuationCalculationSummary
          valuationMetrics={latestPeriod.valuation_metrics}
          mostLikelyValue={valuationReport?.valuation_numbers?.most_likely_value || 0}
          methodsCount={valuationReport?.valuation_numbers?.valuation_methods_in_average || 0}
        />
      )}

      {/* Arvostusmenetelmät */}
      {valuationReport?.analysis?.valuation_methods?.content && (
        <div className="border border-indigo-100 rounded-xl p-6 bg-indigo-50">
          <h3 className="text-lg font-semibold flex items-center mb-3">
            <Scale className="h-5 w-5 mr-2 text-indigo-600" />
            {valuationReport.analysis.valuation_methods.title || "Arvostusmenetelmät ja laskelmat"}
          </h3>
          <div className="bg-white p-4 rounded-lg border border-indigo-100">
            <p className="whitespace-pre-line">{cleanMarkdownText(valuationReport.analysis.valuation_methods.content)}</p>
          </div>
        </div>
      )}

      {/* Arvostuskomponentit */}
      <div className="border border-indigo-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Käytetyt arvostuskomponentit</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Näytetään vain ne komponentit, joilla on arvo */}
          {latestPeriod?.valuation_metrics?.equity_value_from_revenue !== undefined && 
           latestPeriod.valuation_metrics.equity_value_from_revenue > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Arvo liikevaihtokertoimella</h4>
              <p className="text-lg font-medium text-indigo-700">
                {formatCurrency(latestPeriod.valuation_metrics.equity_value_from_revenue)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                (Liikevaihto × {latestPeriod.valuation_multiples?.revenue_multiple?.multiple || "?"}) - Nettovelka
              </p>
            </div>
          )}

          {latestPeriod?.valuation_metrics?.equity_value_from_ebit !== undefined && 
           latestPeriod.valuation_metrics.equity_value_from_ebit > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Arvo EV/EBIT-kertoimella</h4>
              <p className="text-lg font-medium text-indigo-700">
                {formatCurrency(latestPeriod.valuation_metrics.equity_value_from_ebit)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                (EBIT × {latestPeriod.valuation_multiples?.ev_ebit?.multiple || "?"}) - Nettovelka
              </p>
            </div>
          )}

          {latestPeriod?.valuation_metrics?.equity_value_from_ebitda !== undefined && 
           latestPeriod.valuation_metrics.equity_value_from_ebitda > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Arvo EV/EBITDA-kertoimella</h4>
              <p className="text-lg font-medium text-indigo-700">
                {formatCurrency(latestPeriod.valuation_metrics.equity_value_from_ebitda)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                (EBITDA × {latestPeriod.valuation_multiples?.ev_ebitda?.multiple || "?"}) - Nettovelka
              </p>
            </div>
          )}

          {latestPeriod?.valuation_metrics?.equity_value_from_pe !== undefined && 
           latestPeriod.valuation_metrics.equity_value_from_pe > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Arvo P/E-kertoimella</h4>
              <p className="text-lg font-medium text-indigo-700">
                {formatCurrency(latestPeriod.valuation_metrics.equity_value_from_pe)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Nettotulos × {latestPeriod.valuation_multiples?.p_e?.multiple || "?"}
              </p>
            </div>
          )}

          {latestPeriod?.valuation_metrics?.book_value !== undefined && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-1">Taseen oma pääoma</h4>
              <p className="text-lg font-medium text-indigo-700">
                {formatCurrency(latestPeriod.valuation_metrics.book_value)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Vastaavaa - Vieras pääoma</p>
            </div>
          )}
        </div>
      </div>

      {/* Käytetyt arvostuskertoimet */}
      {latestPeriod?.valuation_multiples && Object.keys(latestPeriod.valuation_multiples).length > 0 && (
        <div className="border border-indigo-100 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Käytetyt arvostuskertoimet
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white">
            {latestPeriod.valuation_multiples.revenue_multiple?.multiple !== undefined && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Liikevaihtokerroin</h3>
                <p className="text-xl font-semibold">{latestPeriod.valuation_multiples.revenue_multiple.multiple}x</p>
                {latestPeriod.valuation_multiples.revenue_multiple.justification && (
                  <div className="mt-2 text-xs text-slate-500">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
                      <span>{cleanMarkdownText(latestPeriod.valuation_multiples.revenue_multiple.justification)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {latestPeriod.valuation_multiples.ev_ebit?.multiple !== undefined && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">EV/EBIT-kerroin</h3>
                <p className="text-xl font-semibold">{latestPeriod.valuation_multiples.ev_ebit.multiple}x</p>
                {latestPeriod.valuation_multiples.ev_ebit.justification && (
                  <div className="mt-2 text-xs text-slate-500">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
                      <span>{cleanMarkdownText(latestPeriod.valuation_multiples.ev_ebit.justification)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {latestPeriod.valuation_multiples.ev_ebitda?.multiple !== undefined && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">EV/EBITDA-kerroin</h3>
                <p className="text-xl font-semibold">{latestPeriod.valuation_multiples.ev_ebitda.multiple}x</p>
                {latestPeriod.valuation_multiples.ev_ebitda.justification && (
                  <div className="mt-2 text-xs text-slate-500">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
                      <span>{cleanMarkdownText(latestPeriod.valuation_multiples.ev_ebitda.justification)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {latestPeriod.valuation_multiples.p_e?.multiple !== undefined && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">P/E-kerroin</h3>
                <p className="text-xl font-semibold">{latestPeriod.valuation_multiples.p_e.multiple}x</p>
                {latestPeriod.valuation_multiples.p_e.justification && (
                  <div className="mt-2 text-xs text-slate-500">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0 mt-0.5" />
                      <span>{cleanMarkdownText(latestPeriod.valuation_multiples.p_e.justification)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tilikausien painotustiedot */}
      {latestPeriod?.valuation_metrics?.weighting_method && (
        <div className="border border-indigo-100 rounded-xl p-6 mt-4">
          <h3 className="text-lg font-semibold mb-4">Tilikausien painotus</h3>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">
                  {latestPeriod.valuation_metrics.weighting_method.business_pattern === "growth" 
                    ? "Kasvuyritys" 
                    : latestPeriod.valuation_metrics.weighting_method.business_pattern === "cyclical"
                      ? "Syklinen toimiala"
                      : "Vakaa liiketoiminta"
                  }
                </h4>
                <p className="text-sm text-indigo-700 mt-1">
                  {cleanMarkdownText(latestPeriod.valuation_metrics.weighting_method.explanation)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <p className="text-xs text-slate-500">Tilikausien määrä</p>
                    <p className="font-medium">{latestPeriod.valuation_metrics.weighting_method.period_count}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-indigo-100">
                    <p className="text-xs text-slate-500">Painotuskerroin (α)</p>
                    <p className="font-medium">{latestPeriod.valuation_metrics.weighting_method.alpha?.toFixed(1)}</p>
                  </div>
                </div>
                {latestPeriod.valuation_metrics.weighting_method.weights?.length > 1 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">Tilikausien painotusjakauma</p>
                    <div className="flex h-6 rounded-md overflow-hidden">
                      {latestPeriod.valuation_metrics.weighting_method.weights.map((weight: number, index: number) => (
                        <div 
                          key={index}
                          className={`h-full ${
                            index === 0 ? 'bg-indigo-600' : 
                            index === 1 ? 'bg-indigo-500' : 
                            index === 2 ? 'bg-indigo-400' : 
                            'bg-indigo-300'
                          }`}
                          style={{ width: `${weight * 100}%` }}
                          title={`Tilikausi ${index + 1}: ${Math.round(weight * 100)}%`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-500">Uusin</span>
                      <span className="text-xs text-slate-500">Vanhin</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValuationMethodsTab;