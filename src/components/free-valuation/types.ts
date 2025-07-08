
export interface ManualFinancialInput {
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
}

export interface FinancialValues {
  revenue: string;
  profit: string;
  assets: string;
  liabilities: string;
}

export interface FinancialStatement {
  tase: {
    pysyvat_vastaavat: {
      aineelliset_kayttoomaisuuserat: number;
      aineettomat_hyodykkeet: number;
      muut: number;
    };
    vaihtuvat_vastaavat: number;
    velat: {
      lyhytaikaiset: number;
      pitkataikaiset: number;
    };
  };
  tuloslaskelma: {
    liikevaihto: number;
    liiketoiminnan_muut_tuotot: number;
    liiketoiminnan_kulut: {
      materiaalit: number;
      henkilostokulut: number;
      poistot: number;
      muut_kulut: number;
    };
    liikevoitto: number;
  };
}

export interface GeminiValuationEstimate {
  tilinpaatos: FinancialStatement;
  Arvioni: {
    EV: number;
    EV_kerroin: number;
    EV_EBIT_kerroin: number;
    liquidation: {
      pysyvat_vastaavat_discount: number;
      vaihtuvat_vastaavat_discount: number;
    };
  };
}

export interface ValuationNumbers {
  substanssi_value: number;
  is_substanssi_negative?: boolean;
  ev_liikevaihto_value: number;
  ev_ebit_value: number;
  is_ebit_negative_or_zero?: boolean;
  ev_kerroin: number;
  ev_ebit_ratio: number;
  range: {
    low: number; // Voi olla negatiivinen
    high: number; // Aina suurin positiivinen arvo tai 0
  };
}

// Kysymys-tyypit - updated with more complete definition
export interface FinancialQuestion {
  id: string;
  category: string;
  description: string;
  source_location?: string;
  question: string;
  impact?: string;
  context?: string;
  identified_values?: Record<string, any>;
  normalization_purpose?: string;
  validation?: {
    type?: 'number' | 'text' | 'select';
    min?: number;
    max?: number;
    required?: boolean;
    options?: string[];
  };
}

export interface FinancialQuestionAnswers {
  [key: string]: string; // Format: "category_id": "answer"
}

// Financial analysis summary from initial analysis
export interface FinancialAnalysisSummary {
  total_revenue: number | null;
  operating_profit: number | null;
  fiscal_year: string;
}

// Normalization status for reporting
export interface NormalizationStatus {
  owner_salary_normalized?: boolean;
  premises_costs_normalized?: boolean;
  normalization_impact?: string;
  original_values?: Record<string, number>;
  adjusted_values?: Record<string, number>;
}

// Uusi rajapinta myyntikuntoon-suosituksille
export interface MyyntikuntoonRecommendation {
  personalized_title: string;
  catchy_subtitle: string;
  main_benefit_description: string;
  bullet_points: {
    bullet_point_1: string;
    bullet_point_2: string;
    bullet_point_3: string;
  };
  call_to_action: string;
}
