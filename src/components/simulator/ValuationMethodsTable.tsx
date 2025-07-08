import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Calculator, Loader2, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BaseValues, Multipliers, SelectedMethods, SimulationResult } from "@/types/simulator";

interface ValuationMethodsTableProps {
  baseValues: BaseValues;
  multipliers: Multipliers;
  setMultipliers: (multipliers: Multipliers) => void;
  selectedMethods: SelectedMethods;
  setSelectedMethods: (methods: SelectedMethods) => void;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  onResetToOriginal: () => void;
  onRunSimulation: () => void;
}

export const ValuationMethodsTable = ({
  baseValues,
  multipliers,
  setMultipliers,
  selectedMethods,
  setSelectedMethods,
  simulationResult,
  isSimulating,
  onResetToOriginal,
  onRunSimulation
}: ValuationMethodsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Arvonmääritys simulaattori</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToOriginal}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Palauta alkuperäiset
            </Button>
            <Button
              onClick={onRunSimulation}
              disabled={isSimulating || baseValues.revenue === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lasketaan...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Laske keskiarvo
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          💡 <strong>Taulukko päivittyy reaaliajassa</strong> kun muutat kertoimia. 
          <strong>"Laske keskiarvo"</strong> laskee valittujen menetelmien keskiarvon ja arvoalueen.
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
          <p className="font-medium">💡 Huom: Keskiarvo sisältää aina substanssin ({formatCurrency(baseValues.equity)}) + valitut menetelmät</p>
          <p className="text-xs text-muted-foreground mt-1">Tämä vastaa alkuperäistä arvonmääritystä jossa kaikki menetelmät olivat mukana keskiarvossa</p>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Käytä</TableHead>
              <TableHead>Menetelmä</TableHead>
              <TableHead>Perusarvo</TableHead>
              <TableHead>Kerroin</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    Yritysarvo (EV)
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enterprise Value = Perusarvo × Kerroin</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    Equity Value
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Oman pääoman arvo = EV - Nettovelka</p>
                    <p className="text-xs">Nettovelka: {formatCurrency(baseValues.netDebt)}</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Revenue Row */}
            <TableRow>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        checked={selectedMethods.revenue && baseValues.revenue > 0}
                        disabled={baseValues.revenue <= 0}
                        onCheckedChange={(checked) => 
                          setSelectedMethods({...selectedMethods, revenue: !!checked && baseValues.revenue > 0})
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  {baseValues.revenue <= 0 && (
                    <TooltipContent>
                      <p>Liikevaihto on {formatCurrency(baseValues.revenue)}</p>
                      <p className="text-xs">Menetelmä ei käytettävissä negatiivisella arvolla</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TableCell>
              <TableCell className="font-medium">EV/Liikevaihto</TableCell>
              <TableCell className={baseValues.revenue <= 0 ? "text-red-600" : ""}>
                {formatCurrency(baseValues.revenue)}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={multipliers.revenue}
                  onChange={(e) => setMultipliers({...multipliers, revenue: parseFloat(e.target.value) || 0})}
                  step="0.1"
                  min="0.1"
                  max="5"
                  className="w-20"
                  disabled={baseValues.revenue <= 0}
                />
              </TableCell>
              <TableCell>
                {(selectedMethods.revenue && baseValues.revenue > 0) ? 
                  formatCurrency(baseValues.revenue * multipliers.revenue) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
              <TableCell>
                {(selectedMethods.revenue && baseValues.revenue > 0) ? 
                  formatCurrency((baseValues.revenue * multipliers.revenue) - baseValues.netDebt) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
            </TableRow>
            
            {/* EBIT Row */}
            <TableRow>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        checked={selectedMethods.ebit && baseValues.ebit > 0}
                        disabled={baseValues.ebit <= 0}
                        onCheckedChange={(checked) => 
                          setSelectedMethods({...selectedMethods, ebit: !!checked && baseValues.ebit > 0})
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  {baseValues.ebit <= 0 && (
                    <TooltipContent>
                      <p>EBIT on {formatCurrency(baseValues.ebit)}</p>
                      <p className="text-xs">Menetelmä ei käytettävissä negatiivisella/nolla arvolla</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TableCell>
              <TableCell className="font-medium">EV/EBIT</TableCell>
              <TableCell className={baseValues.ebit <= 0 ? "text-red-600" : ""}>
                {formatCurrency(baseValues.ebit)}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={multipliers.ebit}
                  onChange={(e) => setMultipliers({...multipliers, ebit: parseFloat(e.target.value) || 0})}
                  step="0.5"
                  min="2"
                  max="20"
                  className="w-20"
                  disabled={baseValues.ebit <= 0}
                />
              </TableCell>
              <TableCell>
                {(selectedMethods.ebit && baseValues.ebit > 0) ? 
                  formatCurrency(baseValues.ebit * multipliers.ebit) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
              <TableCell>
                {(selectedMethods.ebit && baseValues.ebit > 0) ? 
                  formatCurrency((baseValues.ebit * multipliers.ebit) - baseValues.netDebt) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
            </TableRow>
            
            {/* EBITDA Row */}
            <TableRow>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        checked={selectedMethods.ebitda && baseValues.ebitda > 0}
                        disabled={baseValues.ebitda <= 0}
                        onCheckedChange={(checked) => 
                          setSelectedMethods({...selectedMethods, ebitda: !!checked && baseValues.ebitda > 0})
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  {baseValues.ebitda <= 0 && (
                    <TooltipContent>
                      <p>EBITDA on {formatCurrency(baseValues.ebitda)}</p>
                      <p className="text-xs">Menetelmä ei käytettävissä negatiivisella/nolla arvolla</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TableCell>
              <TableCell className="font-medium">EV/EBITDA</TableCell>
              <TableCell className={baseValues.ebitda <= 0 ? "text-red-600" : ""}>
                {formatCurrency(baseValues.ebitda)}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={multipliers.ebitda}
                  onChange={(e) => setMultipliers({...multipliers, ebitda: parseFloat(e.target.value) || 0})}
                  step="0.5"
                  min="2"
                  max="15"
                  className="w-20"
                  disabled={baseValues.ebitda <= 0}
                />
              </TableCell>
              <TableCell>
                {(selectedMethods.ebitda && baseValues.ebitda > 0) ? 
                  formatCurrency(baseValues.ebitda * multipliers.ebitda) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
              <TableCell>
                {(selectedMethods.ebitda && baseValues.ebitda > 0) ? 
                  formatCurrency((baseValues.ebitda * multipliers.ebitda) - baseValues.netDebt) : 
                  <span className="text-muted-foreground">-</span>
                }
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Summary row */}
        {simulationResult && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Keskiarvo (valitut menetelmät)</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(simulationResult.range?.average || 0)}
                </p>
                {baseValues.currentValue > 0 && simulationResult.change && simulationResult.change.absolute !== undefined && (
                  <p className={`text-sm ${
                    simulationResult.change.absolute > 0 ? 'text-green-600' : 
                    simulationResult.change.absolute < 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {simulationResult.change.absolute > 0 ? '+' : ''}
                    {((simulationResult.change.absolute / baseValues.currentValue) * 100).toFixed(1)}%
                    ({formatCurrency(simulationResult.change.absolute)})
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arvoalue</p>
                <p className="text-lg font-medium">
                  {formatCurrency(simulationResult.range?.low || 0)} - {formatCurrency(simulationResult.range?.high || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {simulationResult.validMethodCount} menetelmää käytössä (sisältää substanssin)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};