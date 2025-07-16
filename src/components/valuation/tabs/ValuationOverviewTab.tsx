import React from "react";
import { Target, Scale, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanMarkdownText } from "@/utils/markdownUtils";

interface ValuationOverviewTabProps {
  valuationReport: any;
  latestPeriod: any;
}

const ValuationOverviewTab: React.FC<ValuationOverviewTabProps> = ({
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
      <div className="border border-primary/20 rounded-xl p-6 bg-primary/10 shadow-neumorphic">
        <h3 className="text-xl font-bold mb-4 flex items-center text-primary">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Yrityksen arvo (Oma pääoma)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Arvohaarukka */}
          <div className="p-5 bg-card rounded-lg shadow-neumorphic border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Arvohaarukka</h4>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(
                valuationReport?.valuation_numbers?.range?.low || 
                latestPeriod?.valuation_metrics?.equity_valuation_range?.low || 
                0
              )} – {formatCurrency(
                valuationReport?.valuation_numbers?.range?.high || 
                latestPeriod?.valuation_metrics?.equity_valuation_range?.high || 
                0
              )}
            </p>
          </div>

          {/* Todennäköisin arvo */}
          <div className="p-5 bg-card rounded-lg shadow-neumorphic border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Todennäköisin arvo</h4>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(
                valuationReport?.valuation_numbers?.most_likely_value || 
                latestPeriod?.valuation_metrics?.average_equity_valuation || 
                0
              )}
            </p>
            {(valuationReport?.valuation_numbers?.valuation_methods_in_average || 
              latestPeriod?.valuation_metrics?.methods_count) && (
              <p className="text-xs text-muted-foreground mt-1">
                Perustuu {valuationReport?.valuation_numbers?.valuation_methods_in_average || 
                         latestPeriod?.valuation_metrics?.methods_count} arvostusmenetelmään
              </p>
            )}
          </div>
        </div>

        {/* Laskentaperiaate */}
        {latestPeriod?.valuation_metrics && valuationReport?.valuation_numbers?.most_likely_value && (
          <div className="bg-card p-5 rounded-lg mt-4 border border-border shadow-neumorphic">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Calculator className="h-4 w-4 mr-1 text-primary" />
              Arvon laskentaperiaate
            </h4>
            <div className="text-sm">
              <p className="mb-2">
                Arvo on laskettu {valuationReport.valuation_numbers.valuation_methods_in_average} eri 
                arvostusmenetelmän keskiarvona. Tarkemmat tiedot laskennasta löytyvät "Arvostusmenetelmät"-välilehdeltä.
              </p>
            </div>
          </div>
        )}

        {/* Arvonmäärityksen perusteet */}
        {valuationReport?.valuation_numbers?.valuation_rationale && (
          <div className="bg-card p-5 rounded-lg mt-4 border border-border shadow-neumorphic">
            <h4 className="text-sm font-medium text-foreground mb-2">Arvonmäärityksen perusteet</h4>
            <p className="text-sm whitespace-pre-line">{cleanMarkdownText(valuationReport.valuation_numbers.valuation_rationale)}</p>
          </div>
        )}
      </div>

      {/* Keskeiset havainnot */}
      {valuationReport?.key_points?.content && (
        <div className="border border-primary/20 rounded-xl p-6 shadow-neumorphic">
          <h3 className="text-lg font-semibold flex items-center mb-3">
            <Scale className="h-5 w-5 mr-2 text-primary" />
            {valuationReport.key_points.title || "Keskeiset havainnot"}
          </h3>
          <div className="bg-card p-4 rounded-lg border border-border shadow-neumorphic">
            <p className="whitespace-pre-line">{cleanMarkdownText(valuationReport.key_points.content)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValuationOverviewTab;