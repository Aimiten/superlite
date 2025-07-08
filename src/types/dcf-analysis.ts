// DCF Scenario Analysis Types
// These interfaces define the structure of data returned from Claude Sonnet 4 DCF analysis

export interface DCFScenarioAnalysis {
  id: string;
  user_id: string;
  company_id: string;
  valuation_id: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  analysis_date: string;
  raw_analysis?: string;
  structured_data?: DCFStructuredData;
  created_at: string;
  updated_at: string;
}

// Market data value structure from backend
interface MarketDataValue {
  value: number;
  source: string;
  confidence?: number;
  last_updated?: string;
}

// Comprehensive market data from backend
interface ComprehensiveMarketData {
  riskFreeRate: MarketDataValue;
  inflation: MarketDataValue;
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

export interface DCFStructuredData {
  company_info: {
    name: string;
    analysis_date: string;
    base_year: number;
    projection_years: number;
  };
  // Startup-specific analysis (only for forward_looking_dcf)
  startup_analysis?: {
    company_stage: string;
    business_model: string;
    growth_metrics?: {
      customer_acquisition_rate?: number;
      burn_rate?: number;
      runway_months?: number;
      revenue_per_customer?: number;
    };
    historical_periods: any[];
    data_quality: {
      periods_available: number;
      data_reliability: string;
      projection_basis: string;
      confidence_level: string;
    };
  };
  revenue_projections?: {
    market_size_analysis?: {
      total_addressable_market: number;
      serviceable_addressable_market: number;
      penetration_assumptions: number[];
    };
    growth_scenarios?: any;
  };
  historical_analysis: {
    periods: Array<{
      year: number;
      revenue: number;
      ebitda: number;
      ebit: number;
      capex: number;
      working_capital_change: number;
      free_cash_flow: number;
    }>;
    trends: {
      revenue_cagr: number;
      ebitda_margin_avg: number;
      ebit_margin_avg: number;
      capex_avg_percent: number;
      working_capital_trend: number;
    };
    wacc_estimate: number;
    net_debt: number;
    analysis_notes: string;
    data_quality: {
      periods_available: number;
      data_reliability: 'EPÄLUOTETTAVA' | 'RAJOITETTU LUOTETTAVUUS' | 'LUOTETTAVA TRENDIANALYYSI';
      normalization_adjustments: string[];
      key_limitations: string[];
      historical_depth?: string;
      trend_confidence?: string;
      benchmark_dependency?: string;
    };
    industry_benchmark: {
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
    };
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
    sensitivity_analysis: {
      base_case_equity_value: number;
      sensitivities: {
        revenue_growth: {
          plus_1pp: number;
          minus_1pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
        ebitda_margin: {
          plus_1pp: number;
          minus_1pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
        wacc: {
          plus_1pp: number;
          minus_1pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
        terminal_growth: {
          plus_05pp: number;
          minus_05pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
        capex_percent: {
          plus_1pp: number;
          minus_1pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
        working_capital_efficiency: {
          plus_1pp: number;
          minus_1pp: number;
          impact_plus: number;
          impact_minus: number;
          impact_percentage_plus: number;
          impact_percentage_minus: number;
        };
      };
      tornado_chart_data: Array<{
        parameter: string;
        impact_range: number;
        percentage_impact: number;
      }>;
      most_sensitive_parameters: string[];
    };
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
  confidence_assessment: {
    overall_confidence_score: number; // 1-10
    confidence_factors: {
      historical_data_adequacy: number; // 1-10
      financial_data_quality: number; // 1-10
      industry_stability: number; // 1-10
      normalization_impact: number; // 1-10
    };
    key_uncertainties: string[];
    reliability_statement: string;
  };
  methodology_assessment: {
    dcf_suitability_score: number; // 1-10
    company_stage: 'startup' | 'growth' | 'mature' | 'turnaround' | 'distressed';
    business_model: 'SaaS' | 'biotech' | 'manufacturing' | 'services' | 'real estate' | 'other';
    dcf_limitations: string[];
    alternative_methods_recommended: string[];
    methodology_rationale: string;
    complementary_analysis_needed: string[];
  };
  validation_summary?: {
    validation_performed: boolean;
    scenarios_validated: string[];
    critical_errors: boolean;
    total_errors: number;
    total_warnings: number;
  };
  // Orchestrator-specific fields
  dcf_variant?: 'full_dcf' | 'simplified_dcf' | 'forward_looking_dcf';
  method_selector_decision?: {
    selected_variant: string;
    reasoning: string;
    confidence_score: number;
    data_quality_assessment: string;
    recommended_approach: string;
  };
  fallback_used?: boolean;
  error_details?: string;
  execution_time_ms?: number;
  executive_summary: string;
}

export interface DCFScenario {
  assumptions: {
    revenue_growth: number[];        // 5-year array of growth rates (decimal)
    ebitda_margin: number[];         // 5-year array of EBITDA margins (decimal)
    capex_percent: number[];         // 5-year array of CAPEX/Revenue (decimal)
    working_capital_percent: number[]; // 5-year array of WC/Revenue (decimal)
    terminal_growth: number;         // Terminal growth rate (decimal)
    wacc: number;                   // Weighted Average Cost of Capital (decimal)
    tax_rate: number;               // Tax rate (decimal)
  };
  projections: {
    revenue: number[];              // 5-year revenue projections in EUR
    ebitda: number[];               // 5-year EBITDA projections in EUR
    free_cash_flows: number[];      // 5-year free cash flow projections in EUR
    terminal_value: number;         // Terminal value in EUR
    present_value: number;          // Present value of cash flows in EUR
    enterprise_value: number;       // Enterprise value in EUR
    equity_value: number;           // Equity value in EUR
  };
  detailed_calculations: {
    yearly_breakdown: Array<{
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
    }>;
    terminal_value_calculation: {
      terminal_fcf: number;
      terminal_growth_rate: number;
      wacc: number;
      terminal_value_formula: string;
      terminal_value: number;
      terminal_pv: number;
    };
    valuation_bridge: {
      sum_pv_fcf: number;
      terminal_pv: number;
      enterprise_value: number;
      net_debt: number;
      equity_value: number;
    };
  };
  rationale: string;                // Explanation of scenario assumptions
}

// API Request/Response types
export interface DCFAnalysisRequest {
  valuationId: string;
  companyId: string;
  userId: string; // Required by orchestrator backend
}

export interface DCFAnalysisResponse {
  success: boolean;
  analysis_id?: string;
  analysis?: DCFStructuredData;
  error?: string;
}

// UI Component Props types
export interface DCFScenarioAnalysisProps {
  latestValuation: any; // Existing valuation object from current system
}

export interface HistoricalAnalysisCardProps {
  analysis: DCFStructuredData['historical_analysis'];
}

export interface ScenarioComparisonCardProps {
  scenarios: DCFStructuredData['scenario_projections'];
}

export interface ValuationSummaryCardProps {
  summary: DCFStructuredData['valuation_summary'];
}

export interface RiskAnalysisCardProps {
  risks: DCFStructuredData['risk_analysis'];
}

export interface RecommendationsCardProps {
  recommendations: DCFStructuredData['recommendations'];
}

// Utility types for component state management
export type DCFAnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'failed';

export interface DCFAnalysisState {
  status: DCFAnalysisStatus;
  analysis: DCFScenarioAnalysis | null;
  error: string | null;
  progress: string;
}

// Helper type for scenario data processing
export interface ScenarioDataRow {
  name: string;
  key: keyof DCFStructuredData['scenario_projections'];
  color: string;
  icon: any; // Lucide React icon component
  bgColor: string;
  borderColor: string;
}

// Financial formatting utilities
export interface FormattedFinancialData {
  revenue: string;
  ebitda: string;
  equity_value: string;
  growth_rate: string;
  margin: string;
}