import { useState } from 'react';
import { callEdgeFunction } from '@/utils/edge-function';
import { toast } from '@/hooks/use-toast';
import { 
  BaseValues, 
  Multipliers, 
  SelectedMethods, 
  FutureScenario, 
  SimulationResult 
} from '@/types/simulator';

interface UseSimulationCalculatorResult {
  isSimulating: boolean;
  runSimulation: (
    baseValues: BaseValues,
    multipliers: Multipliers,
    selectedMethods: SelectedMethods
  ) => Promise<SimulationResult | null>;
}

export const useSimulationCalculator = (): UseSimulationCalculatorResult => {
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async (
    baseValues: BaseValues,
    multipliers: Multipliers,
    selectedMethods: SelectedMethods
  ): Promise<SimulationResult | null> => {
    if (baseValues.revenue === 0) {
      console.log('Cannot run simulation: revenue is 0');
      return null;
    }

    setIsSimulating(true);
    try {
      console.log('Running simulation with:', { baseValues, multipliers, selectedMethods });
      const response = await callEdgeFunction('simulate-valuation', {
        currentFinancials: baseValues,
        multipliers,
        selectedMethods
      });

      console.log('Simulation response:', response);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      console.log('Simulation result:', result);
      return result;
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Virhe",
        description: "Simulaation suorittaminen epäonnistui",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    isSimulating,
    runSimulation
  };
};