// Comprehensive TypeScript types for DCF Analysis

export interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  company_type?: string;
  created_at?: string;
  updated_at?: string;
}

// DEPRECATED - DocumentData interface removed in favor of FinancialData approach
// DCF analysis now works directly with structured financial data from valuations
// instead of processing PDF documents with base64 encoding

// New interface for financial data without base64 encoding
export interface FinancialData {
  // Company information
  company: {
    id: string;
    name: string;
    industry?: string;
    description?: string;
    company_type?: string;
  };
  
  // Financial periods with structured data
  financial_periods: Array<{
    year: number;
    period_type: 'annual' | 'quarterly' | 'monthly';
    
    // Income Statement
    income_statement: {
      revenue: number;
      cost_of_goods_sold?: number;
      gross_profit?: number;
      operating_expenses?: number;
      ebitda?: number;
      depreciation_amortization?: number;
      ebit?: number;
      interest_expense?: number;
      tax_expense?: number;
      net_income?: number;
    };
    
    // Balance Sheet
    balance_sheet: {
      total_assets?: number;
      current_assets?: number;
      cash_and_equivalents?: number;
      accounts_receivable?: number;
      inventory?: number;
      fixed_assets?: number;
      total_liabilities?: number;
      current_liabilities?: number;
      long_term_debt?: number;
      shareholders_equity?: number;
    };
    
    // Cash Flow Statement (if available)
    cash_flow?: {
      operating_cash_flow?: number;
      investing_cash_flow?: number;
      financing_cash_flow?: number;
      free_cash_flow?: number;
      capex?: number;
    };
  }>;
  
  // Analysis and recommendations from valuation
  valuation_analysis?: {
    valuation_date?: string;
    valuation_method?: string;
    enterprise_value?: number;
    equity_value?: number;
    key_assumptions?: Record<string, any>;
    recommendations?: string[];
  };
  
  // Calculated metrics for DCF
  calculated_metrics?: {
    historical_revenue_growth?: number[];
    historical_ebitda_margins?: number[];
    historical_capex_percent?: number[];
    working_capital_changes?: number[];
    average_tax_rate?: number;
    net_debt?: number;
    wacc?: number;
  };
  
  // Data quality indicators
  data_quality?: {
    completeness_score?: number;
    periods_available?: number;
    has_audited_financials?: boolean;
    data_source?: string;
    extraction_confidence?: number;
  };
}

export interface MarketDataValue {
  value: number;
  source: string;
  confidence?: number;
  last_updated?: string;
}

export interface ComprehensiveMarketData {
  riskFreeRate: MarketDataValue;
  inflation: MarketDataValue;
  gdpGrowth: MarketDataValue;
  industryBeta: MarketDataValue;
  costOfCapital: MarketDataValue;
  creditSpread: MarketDataValue;
  marketRiskPremium: MarketDataValue;
  debtToEquity: MarketDataValue;
  dataQuality: string;
  summary: string;
  successfulSources?: number;
  totalSources?: number;
}

export interface HistoricalPeriod {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  capex: number;
  working_capital_change: number;
  free_cash_flow: number;
}

export interface FinancialTrends {
  revenue_cagr: number;
  ebitda_margin_avg: number;
  ebit_margin_avg: number;
  capex_avg_percent: number;
  working_capital_trend: number;
}

export interface DataQuality {
  periods_available: number;
  data_reliability: 'EPÄLUOTETTAVA' | 'RAJOITETTU LUOTETTAVUUS' | 'LUOTETTAVA TRENDIANALYYSI';
  normalization_adjustments: string[];
  key_limitations: string[];
  historical_depth?: string;
  trend_confidence?: string;
  benchmark_dependency?: string;
}

export interface IndustryBenchmark {
  industry_name: string;
  benchmark_metrics: {
    avg_ebitda_margin: number;
    avg_revenue_growth: number;
    typical_wacc_range: string;
    avg_capex_percent: number;
  };
  company_vs_industry: {
    ebitda_margin_comparison: string;
    growth_comparison: string;
    performance_assessment: string;
  };
  industry_outlook: string;
  comparable_companies: string[];
}

export interface ScenarioAssumptions {
  revenue_growth: number[];
  ebitda_margin: number[];
  capex_percent: number[];
  working_capital_percent: number[];
  terminal_growth: number;
  wacc: number;
  tax_rate: number;
}

export interface ScenarioProjections {
  revenue: number[];
  ebitda: number[];
  free_cash_flows: number[];
  terminal_value: number;
  present_value: number;
  enterprise_value: number;
  equity_value: number;
}

export interface YearlyBreakdown {
  year: number;
  revenue: number;
  revenue_growth: number;
  ebitda: number;
  ebitda_margin: number;
  ebit: number;
  tax: number;
  nopat: number;
  capex: number;
  capex_percent: number;
  working_capital: number;
  working_capital_change: number;
  free_cash_flow: number;
  discount_factor: number;
  present_value_fcf: number;
}

export interface TerminalValueCalculation {
  terminal_fcf: number;
  terminal_growth_rate: number;
  wacc: number;
  terminal_value_formula: string;
  terminal_value: number;
  terminal_pv: number;
}

export interface ValuationBridge {
  sum_pv_fcf: number;
  terminal_pv: number;
  enterprise_value: number;
  net_debt: number;
  equity_value: number;
}

export interface DetailedCalculations {
  yearly_breakdown: YearlyBreakdown[];
  terminal_value_calculation: TerminalValueCalculation;
  valuation_bridge: ValuationBridge;
}

export interface DCFScenario {
  assumptions: ScenarioAssumptions;
  projections: ScenarioProjections;
  detailed_calculations: DetailedCalculations;
  rationale: string;
}

export interface SensitivityParameter {
  plus_1pp: number;
  minus_1pp: number;
  impact_plus: number;
  impact_minus: number;
  impact_percentage_plus: number;
  impact_percentage_minus: number;
}

export interface TerminalGrowthSensitivity {
  plus_05pp: number;
  minus_05pp: number;
  impact_plus: number;
  impact_minus: number;
  impact_percentage_plus: number;
  impact_percentage_minus: number;
}

export interface SensitivityAnalysis {
  base_case_equity_value: number;
  sensitivities: {
    revenue_growth: SensitivityParameter;
    ebitda_margin: SensitivityParameter;
    wacc: SensitivityParameter;
    terminal_growth: TerminalGrowthSensitivity;
    capex_percent: SensitivityParameter;
    working_capital_efficiency: SensitivityParameter;
  };
  tornado_chart_data: Array<{
    parameter: string;
    impact_range: number;
    percentage_impact: number;
  }>;
  most_sensitive_parameters: string[];
}

export interface ConfidenceAssessment {
  overall_confidence_score: number;
  confidence_factors: {
    historical_data_adequacy: number;
    financial_data_quality: number;
    industry_stability: number;
    normalization_impact: number;
  };
  key_uncertainties: string[];
  reliability_statement: string;
}

export interface MethodologyAssessment {
  dcf_suitability_score: number;
  company_stage: 'startup' | 'growth' | 'mature' | 'turnaround' | 'distressed';
  business_model: 'SaaS' | 'biotech' | 'manufacturing' | 'services' | 'real_estate' | 'other';
  dcf_limitations: string[];
  alternative_methods_recommended: string[];
  methodology_rationale: string;
  complementary_analysis_needed: string[];
}

// Base DCF structure that all variants extend
export interface BaseDCFStructuredData {
  dcf_variant: 'full_dcf' | 'simplified_dcf' | 'forward_looking_dcf';
  company_info: {
    name: string;
    analysis_date: string;
    base_year: number;
    projection_years: number;
  };
  historical_analysis: {
    periods: HistoricalPeriod[];
    trends: FinancialTrends;
    wacc_estimate: number;
    net_debt: number;
    analysis_notes: string;
    data_quality: DataQuality;
    industry_benchmark: IndustryBenchmark;
    market_data_integration: ComprehensiveMarketData & {
      calculated_market_wacc: number;
      recommended_terminal_growth: number;
      last_updated: string;
    };
  };
  scenario_projections: {
    pessimistic: DCFScenario;
    base: DCFScenario;
    optimistic: DCFScenario;
  };
  valuation_summary: {
    equity_value_range: {
      min: number;
      max: number;
      base: number;
    };
    probability_weighted_valuation: {
      pessimistic_weight: number;
      base_weight: number;
      optimistic_weight: number;
      weighted_equity_value: number;
      methodology_note: string;
    };
    key_value_drivers: string[];
    sensitivity_analysis: SensitivityAnalysis;
  };
  risk_analysis: {
    high_risks: string[];
    medium_risks: string[];
    risk_mitigation: string[];
  };
  recommendations: {
    value_creation: string[];
    operational_improvements: string[];
    strategic_initiatives: string[];
  };
  confidence_assessment: ConfidenceAssessment;
  methodology_assessment: MethodologyAssessment;
  executive_summary: string;
  method_selector_decision?: {
    selected_variant: string;
    reasoning: string;
    confidence_score: number;
    data_quality_assessment: string;
    recommended_approach: string;
  };
  validation_summary?: {
    validation_performed: boolean;
    scenarios_validated: string[];
    critical_errors: boolean;
    total_errors: number;
    total_warnings: number;
  };
}

// Full DCF specific extensions
export interface FullDCFStructuredData extends BaseDCFStructuredData {
  dcf_variant: 'full_dcf';
  historical_analysis: BaseDCFStructuredData['historical_analysis'] & {
    data_quality: DataQuality & {
      data_reliability: 'LUOTETTAVA TRENDIANALYYSI';
      historical_depth: string;
      trend_confidence: 'KORKEA';
    };
  };
}

// Simplified DCF specific extensions
export interface SimplifiedDCFStructuredData extends BaseDCFStructuredData {
  dcf_variant: 'simplified_dcf';
  historical_analysis: BaseDCFStructuredData['historical_analysis'] & {
    trends: FinancialTrends & {
      benchmark_weighted_growth: number;
      industry_benchmark_weight: number;
    };
    data_quality: DataQuality & {
      data_reliability: 'RAJOITETTU LUOTETTAVUUS';
      benchmark_dependency: 'KORKEA';
    };
    industry_benchmark_usage: {
      growth_rate_source: string;
      margin_validation: string;
      capex_assumptions: string;
      wacc_adjustment: string;
    };
  };
}

// Forward-looking DCF specific extensions
export interface ForwardLookingDCFStructuredData extends BaseDCFStructuredData {
  dcf_variant: 'forward_looking_dcf';
  startup_analysis: {
    company_stage: 'early_stage' | 'growth' | 'pre_revenue';
    business_model: string;
    growth_metrics: {
      customer_acquisition_rate?: number;
      burn_rate?: number;
      runway_months?: number;
      revenue_per_customer?: number;
    };
    historical_periods: HistoricalPeriod[];
    data_quality: DataQuality & {
      data_reliability: 'EPÄLUOTETTAVA HISTORIA';
      projection_basis: 'MARKET-DRIVEN';
      confidence_level: 'MATALA';
    };
  };
  revenue_projections: {
    market_size_analysis: {
      total_addressable_market: number;
      serviceable_addressable_market: number;
      penetration_assumptions: number[];
    };
    growth_scenarios: {
      pessimistic: {
        year_1_growth: number;
        year_2_growth: number;
        plateau_year: number;
        terminal_growth: number;
      };
      base: {
        year_1_growth: number;
        scaling_period: number;
        maturity_growth: number;
        terminal_growth: number;
      };
      optimistic: {
        year_1_growth: number;
        market_leadership: string;
        premium_margins: string;
        terminal_growth: number;
      };
    };
  };
  startup_specific_valuation: {
    scenario_weighting: {
      pessimistic_weight: number;
      base_weight: number;
      optimistic_weight: number;
    };
    venture_style_discounting: {
      failure_probability: number;
      success_probability: number;
      risk_adjusted_wacc: number;
    };
  };
  alternative_valuations_recommended: string[];
}

// Union type for all DCF variants
export type DCFStructuredData = FullDCFStructuredData | SimplifiedDCFStructuredData | ForwardLookingDCFStructuredData;

// Type for structured data with model info (used in Phase 2)
export type DCFStructuredDataWithModel = DCFStructuredData & { modelUsed?: string };