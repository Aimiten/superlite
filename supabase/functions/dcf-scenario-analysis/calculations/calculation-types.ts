/**
 * Type definitions for DCF calculations
 * Compatible with existing DCFStructuredData types
 */

import { 
  ScenarioAssumptions, 
  YearlyBreakdown,
  TerminalValueCalculation,
  ValuationBridge,
  MarketDataValue 
} from '../types/dcf-types.ts';

/**
 * Scenario type enumeration
 */
export type ScenarioType = 'pessimistic' | 'base' | 'optimistic';

/**
 * DCF variant types
 */
export type DCFVariant = 'full_dcf' | 'simplified_dcf' | 'forward_looking_dcf';

/**
 * Base input parameters common to all DCF variants
 */
export interface BaseDCFInputs {
  companyName: string;
  baseYear: number;
  projectionYears: number;
  historicalRevenue?: number[];
  historicalEbitda?: number[];
  netDebt: number;
  taxRate: number;
  variant: DCFVariant;
}

/**
 * Market data inputs for WACC calculation
 */
export interface WACCInputs {
  riskFreeRate: number;
  marketRiskPremium: number;
  beta: number;
  costOfDebt: number;
  debtToEquity: number;
  taxRate: number;
  creditSpread?: number;
}

/**
 * Full DCF specific inputs
 */
export interface FullDCFInputs extends BaseDCFInputs {
  variant: 'full_dcf';
  historicalData: {
    revenue: number[];
    ebitda: number[];
    capex: number[];
    workingCapitalChange: number[];
    periods: number; // Number of historical years
  };
  marketData: {
    wacc: number;
    terminalGrowth: number;
    industryBeta: number;
  };
}

/**
 * Simplified DCF specific inputs
 */
export interface SimplifiedDCFInputs extends BaseDCFInputs {
  variant: 'simplified_dcf';
  limitedHistoricalData: {
    revenue: number[]; // May have fewer periods
    ebitda?: number[]; // May be incomplete
    periods: number; // 1-2 years typically
  };
  benchmarkData: {
    industryGrowthRate: number;
    industryEbitdaMargin: number;
    industryCapexPercent: number;
    industryWACC: number;
    benchmarkWeight: number; // Weight given to industry benchmarks (0-1)
  };
}

/**
 * Forward-looking DCF specific inputs
 */
export interface ForwardLookingDCFInputs extends BaseDCFInputs {
  variant: 'forward_looking_dcf';
  startupMetrics: {
    companyStage: 'early_stage' | 'growth' | 'pre_revenue';
    burnRate?: number;
    runwayMonths?: number;
    customerAcquisitionRate?: number;
    revenuePerCustomer?: number;
  };
  marketAnalysis: {
    totalAddressableMarket: number;
    serviceableAddressableMarket: number;
    targetMarketShare: number[];
  };
  ventureAdjustments: {
    failureProbability: number;
    riskAdjustedWACC: number;
  };
}

/**
 * Union type for all DCF input variants
 */
export type DCFInputs = FullDCFInputs | SimplifiedDCFInputs | ForwardLookingDCFInputs;

/**
 * Scenario-specific assumptions
 */
export interface ScenarioInputs {
  scenarioType: ScenarioType;
  assumptions: ScenarioAssumptions;
  rationale: string;
  confidenceLevel?: number;
}

/**
 * Growth profile for revenue projections
 */
export interface GrowthProfile {
  initialGrowthRate: number;
  sustainedGrowthRate: number;
  declineRate: number; // Annual decline in growth rate
  terminalGrowthRate: number;
}

/**
 * Margin profile for profitability projections
 */
export interface MarginProfile {
  initialMargin: number;
  targetMargin: number;
  improvementRate: number; // Annual improvement in margin
  marginCap?: number; // Maximum achievable margin
}

/**
 * Working capital assumptions
 */
export interface WorkingCapitalAssumptions {
  daysReceivable: number;
  daysPayable: number;
  daysInventory: number;
  percentOfRevenue?: number; // Alternative: as % of revenue
}

/**
 * Capital expenditure assumptions
 */
export interface CapexAssumptions {
  percentOfRevenue: number[];
  maintenanceCapex: number;
  growthCapex: number;
  assetLifeYears?: number;
}

/**
 * Tax assumptions
 */
export interface TaxAssumptions {
  statutoryRate: number;
  effectiveRate: number;
  taxLossCarryforward?: number;
  taxOptimizations?: string[];
}

/**
 * Complete scenario configuration
 */
export interface ScenarioConfiguration {
  scenario: ScenarioType;
  growthProfile: GrowthProfile;
  marginProfile: MarginProfile;
  workingCapital: WorkingCapitalAssumptions;
  capex: CapexAssumptions;
  tax: TaxAssumptions;
  wacc: number;
  terminalValue: {
    method: 'perpetuity' | 'exit_multiple';
    growthRate?: number;
    exitMultiple?: number;
  };
}

/**
 * Annual projection results
 */
export interface AnnualProjection {
  year: number;
  revenue: number;
  revenueGrowth: number;
  ebitda: number;
  ebitdaMargin: number;
  ebit: number;
  tax: number;
  nopat: number;
  capex: number;
  workingCapitalChange: number;
  freeCashFlow: number;
  discountFactor: number;
  presentValue: number;
}

/**
 * Terminal value calculation results
 */
export interface TerminalValueResult extends TerminalValueCalculation {
  method: 'perpetuity' | 'exit_multiple';
  impliedMultiple?: number;
  reasonabilityCheck: {
    impliedGrowthRate?: number;
    impliedEVMultiple?: number;
    isReasonable: boolean;
    concerns?: string[];
  };
}

/**
 * Valuation results
 */
export interface ValuationResults {
  sumOfPVCashFlows: number;
  terminalValuePV: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  impliedMultiples: {
    evRevenue: number;
    evEbitda: number;
    peRatio?: number;
  };
}

/**
 * Complete calculation result for a scenario
 */
export interface ScenarioCalculationResult {
  scenario: ScenarioType;
  inputs: ScenarioConfiguration;
  projections: AnnualProjection[];
  terminalValue: TerminalValueResult;
  valuation: ValuationResults;
  summary: {
    cagr: number;
    avgEbitdaMargin: number;
    avgFCFMargin: number;
    totalFCF: number;
  };
}

/**
 * Complete DCF calculation results
 */
export interface DCFCalculationResults {
  variant: DCFVariant;
  baseInputs: DCFInputs;
  scenarios: {
    pessimistic: ScenarioCalculationResult;
    base: ScenarioCalculationResult;
    optimistic: ScenarioCalculationResult;
  };
  valuationSummary: {
    range: {
      min: number;
      max: number;
      median: number;
    };
    probabilityWeighted: {
      weights: {
        pessimistic: number;
        base: number;
        optimistic: number;
      };
      weightedValue: number;
    };
  };
  sensitivityMetrics?: {
    revenueGrowthImpact: number;
    marginImpact: number;
    waccImpact: number;
    terminalGrowthImpact: number;
  };
}

/**
 * Validation result for calculations
 */
export interface CalculationValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
  suggestions: string[];
}

/**
 * Helper type for calculation status
 */
export interface CalculationStatus {
  stage: 'input' | 'projection' | 'discounting' | 'terminal' | 'valuation' | 'complete';
  progress: number; // 0-100
  currentScenario?: ScenarioType;
  errors?: string[];
}

/**
 * Type guards for variant-specific inputs
 */
export function isFullDCFInputs(inputs: DCFInputs): inputs is FullDCFInputs {
  return inputs.variant === 'full_dcf';
}

export function isSimplifiedDCFInputs(inputs: DCFInputs): inputs is SimplifiedDCFInputs {
  return inputs.variant === 'simplified_dcf';
}

export function isForwardLookingDCFInputs(inputs: DCFInputs): inputs is ForwardLookingDCFInputs {
  return inputs.variant === 'forward_looking_dcf';
}