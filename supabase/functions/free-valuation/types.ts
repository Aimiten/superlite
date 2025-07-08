// types.ts
export interface FinancialData {
  tilinpaatos: {
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
  };
  Arvioni: {
    EV_kerroin: number; // EV/Liikevaihto kerroin
    EV_perustelut: string;
    EV_EBIT_kerroin: number; 
    EV_EBIT_perustelut: string;// Lisätty EV/EBIT kerroin
  };
  normalization?: {
    status: {
      owner_salary_normalized: boolean;
      premises_costs_normalized: boolean;
      other_normalizations: boolean; // New field for third question 
      normalization_impact: string;
      original_values: Record<string, number>;
      adjusted_values: Record<string, number>;
      normalizations_explained?: Array<{
        category: string;
        original_value: number;
        normalized_value: number;
        explanation: string;
      }>;
    }
  };
}

// You can add additional types here as needed
export interface ValuationNumbers {
  substanssi_value: number;
  is_substanssi_negative: boolean;
  ev_liikevaihto_value: number;
  ev_ebit_value: number;
  is_ebit_negative_or_zero: boolean;
  ev_kerroin: number;
  ev_ebit_ratio: number;
  range: {
    low: number;
    high: number;
  };
}