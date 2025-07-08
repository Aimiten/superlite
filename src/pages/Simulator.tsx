import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import SimplePageTransition from "@/components/SimplePageTransition";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SimulatorDashboard } from "@/components/simulator/SimulatorDashboard";
import { useCompany } from "@/hooks/use-company";
import { useValuationData } from "@/hooks/useValuationData";
import { useSimulationState } from "@/hooks/useSimulationState";
import { useSimulationCalculator } from "@/hooks/useSimulationCalculator";
import { useNavigate } from "react-router-dom";

const Simulator = () => {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  
  // Load valuation data
  const { 
    latestValuation, 
    baseValues, 
    originalMultipliers, 
    isLoading, 
    error 
  } = useValuationData(activeCompany?.id);

  // Manage simulation state
  const {
    multipliers,
    setMultipliers,
    selectedMethods,
    setSelectedMethods,
    futureScenario,
    setFutureScenario,
    simulationResult,
    setSimulationResult,
    savedSimulations,
    saveDialogOpen,
    setSaveDialogOpen,
    resetToOriginal,
    loadSimulation,
    loadSavedSimulations
  } = useSimulationState({
    baseValues,
    originalMultipliers,
    companyId: activeCompany?.id,
    valuationId: latestValuation?.id
  });

  // Handle calculations
  const { isSimulating, runSimulation } = useSimulationCalculator();

  const handleRunSimulation = async () => {
    const result = await runSimulation(baseValues, multipliers, selectedMethods);
    if (result) {
      setSimulationResult(result);
    }
  };

  const handleLoadSimulation = async (simulation: any) => {
    await loadSimulation(simulation);
    // Run simulation with loaded settings after a delay to ensure state is updated
    setTimeout(handleRunSimulation, 100);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <SimplePageTransition>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ladataan arvonmääritystietoja...</p>
            </div>
          </div>
        </SimplePageTransition>
      </DashboardLayout>
    );
  }

  if (!activeCompany) {
    return (
      <DashboardLayout>
        <SimplePageTransition>
          <div className="flex items-center justify-center h-64">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Valitse ensin yritys ylävalikosta
              </AlertDescription>
            </Alert>
          </div>
        </SimplePageTransition>
      </DashboardLayout>
    );
  }

  if (!latestValuation || error) {
    return (
      <DashboardLayout>
        <SimplePageTransition>
          <div className="flex items-center justify-center h-64">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Yritykselle ei ole tehty arvonmääritystä."} 
                <Button variant="link" onClick={() => navigate('/valuation')} className="px-1">
                  Tee arvonmääritys ensin
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </SimplePageTransition>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SimplePageTransition>
        <SimulatorDashboard
          latestValuation={latestValuation}
          baseValues={baseValues}
          multipliers={multipliers}
          setMultipliers={setMultipliers}
          selectedMethods={selectedMethods}
          setSelectedMethods={setSelectedMethods}
          futureScenario={futureScenario}
          setFutureScenario={setFutureScenario}
          simulationResult={simulationResult}
          savedSimulations={savedSimulations}
          isSimulating={isSimulating}
          saveDialogOpen={saveDialogOpen}
          setSaveDialogOpen={setSaveDialogOpen}
          activeCompany={activeCompany}
          onResetToOriginal={resetToOriginal}
          onRunSimulation={handleRunSimulation}
          onLoadSimulation={handleLoadSimulation}
          onSavedSimulations={loadSavedSimulations}
        />
      </SimplePageTransition>
    </DashboardLayout>
  );
};

export default Simulator;