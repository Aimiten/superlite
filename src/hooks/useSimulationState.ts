import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Multipliers, 
  SelectedMethods, 
  SimulationResult, 
  SavedSimulation,
  BaseValues 
} from '@/types/simulator';

interface UseSimulationStateProps {
  baseValues: BaseValues;
  originalMultipliers: Multipliers;
  companyId?: string;
  valuationId?: string;
}

interface UseSimulationStateResult {
  multipliers: Multipliers;
  setMultipliers: (multipliers: Multipliers) => void;
  selectedMethods: SelectedMethods;
  setSelectedMethods: (methods: SelectedMethods) => void;
  simulationResult: SimulationResult | null;
  setSimulationResult: (result: SimulationResult | null) => void;
  savedSimulations: SavedSimulation[];
  setSavedSimulations: (simulations: SavedSimulation[]) => void;
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;
  resetToOriginal: () => void;
  loadSimulation: (simulation: SavedSimulation) => Promise<void>;
  loadSavedSimulations: () => Promise<void>;
}

export const useSimulationState = ({
  baseValues,
  originalMultipliers,
  companyId,
  valuationId
}: UseSimulationStateProps): UseSimulationStateResult => {
  const [multipliers, setMultipliers] = useState<Multipliers>(originalMultipliers);
  const [selectedMethods, setSelectedMethods] = useState<SelectedMethods>({
    revenue: true,
    ebit: true,
    ebitda: true
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Update multipliers when original multipliers change
  useEffect(() => {
    setMultipliers(originalMultipliers);
  }, [originalMultipliers]);

  // Load saved simulations when valuation is loaded
  useEffect(() => {
    if (valuationId && companyId) {
      loadSavedSimulations();
    }
  }, [valuationId, companyId]);

  const loadSavedSimulations = async () => {
    if (!companyId || !valuationId) return;

    try {
      const { data, error } = await supabase
        .from('valuation_simulations')
        .select('*')
        .eq('company_id', companyId)
        .eq('valuation_id', valuationId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedSimulations(data);
      }
    } catch (error) {
      console.error('Error loading saved simulations:', error);
    }
  };

  const loadSimulation = async (simulation: SavedSimulation) => {
    if (simulation.simulation_data) {
      // Load all settings
      setMultipliers(simulation.simulation_data.multipliers || originalMultipliers);
      setSelectedMethods(simulation.simulation_data.selectedMethods || { revenue: true, ebit: true, ebitda: true });

      // Clear old result to show loading state
      setSimulationResult(null);

      toast({
        title: "Ladattu",
        description: `Simulaatio "${simulation.name}" ladattu - lasketaan uudelleen...`
      });
    }
  };

  const resetToOriginal = () => {
    setMultipliers(originalMultipliers);
  };

  return {
    multipliers,
    setMultipliers,
    selectedMethods,
    setSelectedMethods,
    simulationResult,
    setSimulationResult,
    savedSimulations,
    setSavedSimulations,
    saveDialogOpen,
    setSaveDialogOpen,
    resetToOriginal,
    loadSimulation,
    loadSavedSimulations
  };
};