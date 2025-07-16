import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BaseValues, FutureScenario } from "@/types/simulator";

interface ScenarioControlsProps {
  baseValues: BaseValues;
  futureScenario: FutureScenario;
  setFutureScenario: (scenario: FutureScenario) => void;
}

export const ScenarioControls = ({
  baseValues,
  futureScenario,
  setFutureScenario
}: ScenarioControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tulevaisuusskenaariot</CardTitle>
          <Checkbox
            checked={futureScenario.enabled}
            onCheckedChange={(checked) => 
              setFutureScenario({...futureScenario, enabled: !!checked})
            }
          />
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          💡 <strong>Aktivoi</strong> simuloidaksesi yrityksen kehitystä. Laskee uudet talousluvut ennen kertoimien soveltamista.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={!futureScenario.enabled ? "opacity-50" : ""}>
          <div className="flex items-center gap-2 mb-1">
            <Label>Liikevaihdon kasvu (%)</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Uusi liikevaihto = {formatCurrency(baseValues.revenue)} × (1 + kasvu%)</p>
                <p className="text-xs">Esim. +20% = {formatCurrency(baseValues.revenue * 1.2)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            type="number"
            value={(futureScenario.revenueGrowth * 100).toFixed(0)}
            onChange={(e) => setFutureScenario({
              ...futureScenario, 
              revenueGrowth: (parseFloat(e.target.value) || 0) / 100
            })}
            disabled={!futureScenario.enabled}
            min="-50"
            max="100"
            step="5"
            placeholder="esim. 20 = +20%"
          />
        </div>
        <div className={!futureScenario.enabled ? "opacity-50" : ""}>
          <div className="flex items-center gap-2 mb-1">
            <Label>Tavoite EBIT-% </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Uusi EBIT = Uusi liikevaihto × EBIT-%</p>
                <p className="text-xs">Parantaa kannattavuutta tehostamalla toimintaa</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            type="number"
            value={(futureScenario.targetEbitMargin * 100).toFixed(0)}
            onChange={(e) => setFutureScenario({
              ...futureScenario, 
              targetEbitMargin: (parseFloat(e.target.value) || 0) / 100
            })}
            disabled={!futureScenario.enabled}
            min="0"
            max="50"
            step="1"
            placeholder="esim. 15 = 15%"
          />
        </div>
        {futureScenario.enabled && (
          <div className="bg-info/5 p-3 rounded text-sm">
            <p className="font-medium">Ennuste:</p>
            <p>• Nykyinen EBIT-%: {baseValues.revenue > 0 ? ((baseValues.ebit / baseValues.revenue) * 100).toFixed(1) : '0.0'}%</p>
            <p>• Uusi liikevaihto: {formatCurrency(baseValues.revenue * (1 + futureScenario.revenueGrowth))}</p>
            <p>• Uusi EBIT: {formatCurrency(baseValues.revenue * (1 + futureScenario.revenueGrowth) * futureScenario.targetEbitMargin)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};