export interface BaseValues {
  revenue: number;
  ebit: number;
  ebitda: number;
  equity: number;
  netDebt: number;
  depreciation: number;
  currentValue: number;
}

export interface Multipliers {
  revenue: number;
  ebit: number;
  ebitda: number;
}

export interface SelectedMethods {
  revenue: boolean;
  ebit: boolean;
  ebitda: boolean;
}

// FutureScenario removed - was misleading and not useful for accurate valuation

export interface SimulationResult {
  adjustedFinancials: any;
  valuations: {
    substanssi: number;
    revenue: number | null;
    ebit: number | null;
    ebitda: number | null;
  };
  range: {
    low: number;
    high: number;
    average: number;
  };
  change: {
    absolute: number;
    percentage: number;
  };
  validMethodCount: number;
}

export interface SavedSimulation {
  id: string;
  name: string;
  created_at: string;
  simulation_data: {
    multipliers: Multipliers;
    selectedMethods: SelectedMethods;
  };
}

export interface ValuationData {
  id: string;
  company_name: string;
  created_at: string;
  results: any;
}

export interface SimulationState {
  baseValues: BaseValues;
  originalMultipliers: Multipliers;
  multipliers: Multipliers;
  selectedMethods: SelectedMethods;
  simulationResult: SimulationResult | null;
  savedSimulations: SavedSimulation[];
  isSimulating: boolean;
  saveDialogOpen: boolean;
}