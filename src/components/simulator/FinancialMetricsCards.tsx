import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info as InfoIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BaseValues } from "@/types/simulator";

interface FinancialMetricsCardsProps {
  baseValues: BaseValues;
}

export const FinancialMetricsCards = ({ baseValues }: FinancialMetricsCardsProps) => {
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold">Talousluvut simulaattorissa</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Luvut perustuvat painotettuihin keskiarvoihin (weighted financials) 
                viimeisimmistä tilikausista. Painotus antaa suuremman painoarvon 
                uudemmille tilikausille.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(baseValues.revenue)}</div>
            <p className="text-xs text-muted-foreground">Liikevaihto (painotettu)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(baseValues.ebit)}</div>
            <p className="text-xs text-muted-foreground">EBIT (painotettu)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(baseValues.ebitda)}</div>
            <p className="text-xs text-muted-foreground">EBITDA (painotettu)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(baseValues.currentValue)}</div>
            <p className="text-xs text-muted-foreground">Nykyinen arvo</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};