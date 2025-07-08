import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { SavedSimulation, SimulationResult } from "@/types/simulator";

interface SavedSimulationsProps {
  savedSimulations: SavedSimulation[];
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  onSaveDialogOpen: () => void;
  onLoadSimulation: (simulation: SavedSimulation) => void;
}

export const SavedSimulations = ({
  savedSimulations,
  simulationResult,
  isSimulating,
  onSaveDialogOpen,
  onLoadSimulation
}: SavedSimulationsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tallennetut simulaatiot</CardTitle>
          {simulationResult && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSaveDialogOpen}
            >
              <Save className="w-4 h-4 mr-2" />
              Tallenna
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {savedSimulations.length > 0 ? (
          <div className="space-y-2">
            {savedSimulations.map((sim) => (
              <div key={sim.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{sim.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sim.created_at).toLocaleDateString('fi-FI')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadSimulation(sim)}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Lataa"
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ei tallennettuja simulaatioita</p>
        )}
      </CardContent>
    </Card>
  );
};