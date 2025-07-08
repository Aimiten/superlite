import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinancialMetricsCards } from "./FinancialMetricsCards";
import { ValuationMethodsTable } from "./ValuationMethodsTable";
import { SavedSimulations } from "./SavedSimulations";
import { SaveSimulationDialog } from "./SaveSimulationDialog";
import { 
  BaseValues, 
  Multipliers, 
  SelectedMethods, 
  SimulationResult, 
  SavedSimulation,
  ValuationData 
} from "@/types/simulator";

interface SimulatorDashboardProps {
  latestValuation: ValuationData;
  baseValues: BaseValues;
  multipliers: Multipliers;
  setMultipliers: (multipliers: Multipliers) => void;
  selectedMethods: SelectedMethods;
  setSelectedMethods: (methods: SelectedMethods) => void;
  simulationResult: SimulationResult | null;
  savedSimulations: SavedSimulation[];
  isSimulating: boolean;
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;
  activeCompany: any;
  onResetToOriginal: () => void;
  onRunSimulation: () => void;
  onLoadSimulation: (simulation: SavedSimulation) => void;
  onSavedSimulations: () => void;
}

export const SimulatorDashboard = ({
  latestValuation,
  baseValues,
  multipliers,
  setMultipliers,
  selectedMethods,
  setSelectedMethods,
  simulationResult,
  savedSimulations,
  isSimulating,
  saveDialogOpen,
  setSaveDialogOpen,
  activeCompany,
  onResetToOriginal,
  onRunSimulation,
  onLoadSimulation,
  onSavedSimulations
}: SimulatorDashboardProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Arvonmäärityssimulaattori</h1>
            <Badge variant="outline">
              {latestValuation?.company_name} - {new Date(latestValuation?.created_at).toLocaleDateString('fi-FI')}
            </Badge>
          </div>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Käyttöohje:</strong> Säädä arvostuskertoimia nähdäksesi, miten ne vaikuttavat yrityksen arvoon. 
              Voit myös aktivoida tulevaisuusskenaariot ja simuloida liikevaihdon kasvun tai kannattavuuden parantumisen vaikutuksia.
            </AlertDescription>
          </Alert>
        </div>

        <FinancialMetricsCards baseValues={baseValues} />

        <ValuationMethodsTable
          baseValues={baseValues}
          multipliers={multipliers}
          setMultipliers={setMultipliers}
          selectedMethods={selectedMethods}
          setSelectedMethods={setSelectedMethods}
          simulationResult={simulationResult}
          isSimulating={isSimulating}
          onResetToOriginal={onResetToOriginal}
          onRunSimulation={onRunSimulation}
        />

        <SavedSimulations
          savedSimulations={savedSimulations}
          simulationResult={simulationResult}
          isSimulating={isSimulating}
          onSaveDialogOpen={() => setSaveDialogOpen(true)}
          onLoadSimulation={onLoadSimulation}
        />

        <SaveSimulationDialog
          isOpen={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          activeCompany={activeCompany}
          latestValuation={latestValuation}
          multipliers={multipliers}
          selectedMethods={selectedMethods}
          simulationResult={simulationResult}
          baseValues={baseValues}
          onSaved={onSavedSimulations}
        />
      </div>
    </TooltipProvider>
  );
};