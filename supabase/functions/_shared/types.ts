// supabase/functions/_shared/types.ts

// Kategoria-arvioinnin perusrakenne
interface CategoryAssessment {
  perustelu: string;
  arvovaikutus?: {
    vaikutusprosentti: number;
    perustelu: string;
  };
}

// Geminin tuottama päivitetty myyntikuntoisuusanalyysi
export interface SalesReadinessAnalysis {
  analyysiPvm: string; // ISO 8601 date string
  perustuuTehtaviin: number; // Montako kohtaa analyysissä huomioitu
  kvantitatiivisetArviot: {
    // Taloudelliset tekijät
    taloudelliset?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      vakaus: number; // 1-10
      kannattavuus: number; // 1-10
    };

    // Juridiset tekijät
    juridiset?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      sopimusriskit: number; // 1-10
      immateriaalisuoja: number; // 1-10
    };

    // Asiakaskeskittyneisyys
    asiakaskeskittyneisyys?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      arvioituTop1Prosentti: number | null;
      arvioituTop5Prosentti: number | null;
    };

    // Henkilöstötekijät (aiemmin avainhenkilöriippuvuus)
    henkilosto?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      arvioituTaso: 'critical' | 'high' | 'moderate' | 'low' | 'unknown';
      havaittuLievennys: {
        seuraajasuunnitelma: boolean;
        avainSopimukset: boolean;
        tietojenSiirto: boolean;
      };
    };

    // Operatiiviset tekijät
    operatiiviset?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      prosessit: number; // 1-10
      teknologia: number; // 1-10
    };

    // Dokumentaatio
    dokumentaatio?: CategoryAssessment & {
      arvioituTasoPisteet: number | null; // 0-100
      puutteet: string[];
    };

    // Strategiset tekijät
    strategiset?: CategoryAssessment & {
      kokonaisarvio: number; // 1-10
      kilpailuedut: number; // 1-10
      kasvupotentiaali: number; // 1-10
    };

    // Sopimusrakenne
    sopimusrakenne?: CategoryAssessment & {
      arvioituSopimuspohjainenProsentti: number | null;
      arvioituKeskimKestoVuosina: number | null;
    };
  };

  // Kategoriapainotukset
  kategoriapainotus: {
    taloudelliset: number; // 0-1
    juridiset: number; // 0-1
    asiakaskeskittyneisyys: number; // 0-1
    henkilosto: number; // 0-1
    operatiiviset: number; // 0-1
    dokumentaatio: number; // 0-1
    strategiset: number; // 0-1
    sopimusrakenne: number; // 0-1
    painotusperustelu: string;
  };

  sanallinenYhteenveto: string; // Geminin sanallinen koonti tilanteesta
}

// Korjauskertoimet, jotka lasketaan koodissa analyysin perusteella
export interface AdjustmentFactors {
  customerConcentrationFactor: number;
  keyPersonDependencyFactor: number;
  contractStructureFactor: number;
  financialFactor: number;
  legalFactor: number; 
  operationalFactor: number;
  strategicFactor: number;
  documentationAdjustmentFactor: number;
  overallMultipleAdjustmentFactor: number;
  // Uudet menetelmäkohtaiset kertoimet
  revenueMultipleFactor?: number;
  ebitMultipleFactor?: number;
  ebitdaMultipleFactor?: number;
  peMultipleFactor?: number;
}

// Alkuperäisen arvonmäärityksen oleelliset tiedot
export interface OriginalValuationSnapshot {
    valuationId: string;
    calculationDate: string;
    averageValuation: number;
    valuationRange: { low: number; high: number };
    multiplesUsed: { // Käytetyt peruskertoimet
        revenue: number | null;
        ebit: number | null;
        ebitda: number | null;
        pe: number | null; // P/E-kerroin
    };
    // Keskeiset tunnusluvut
    revenue: number | null;
    ebit: number | null;
    ebitda: number | null;
    // Valuation methods tieto
    valuationMethods?: {
        revenue: 'business_based' | 'not_applicable';
        ebit: 'business_based' | 'not_applicable';
        ebitda: 'business_based' | 'not_applicable';
        pe: 'business_based' | 'not_applicable';
    };
    // UUSI: Alkuperäisten menetelmien arvot
    originalMethodValues?: {
        book_value: number;
        asset_based_value: number;
        equity_value_from_revenue: number;
        equity_value_from_ebit: number;
        equity_value_from_ebitda: number;
        equity_value_from_pe: number;
    };
    // UUSI: Mitkä menetelmät käytettiin keskiarvossa
    methodsUsedInAverage?: string[];
}

// Korjatun arvonmäärityksen tulos
export interface AdjustedValuationResult {
    averageValuation: number;
    valuationRange: { low: number; high: number };
    adjustedMultiples: { // Käytetyt korjatut kertoimet
        revenue: number | null;
        ebit: number | null;
        ebitda: number | null;
        pe: number | null;
    };
}

// DD-riski-kategoriat
export interface DDRiskCategory {
  kategoria: string;
  riskitaso: number; // 1-10 
  kuvaus: string;
  vaikutus: 'high' | 'medium' | 'low';
  havainnot: string[];
  toimenpideSuositukset: string[];
}

// DD-riskianalyysi
export interface DDRiskAnalysis {
  analyysiPvm: string;
  kokonaisRiskitaso: number; // 1-10
  riskiKategoriat: DDRiskCategory[];
  keskeisimmatLöydökset: string[];
  yhteenveto: string;
}

// Riskien lieventämisen analyysi (post-DD)
export interface RiskMitigationAnalysis {
  alkuperainenKokonaisRiskitaso: number;
  paivitettyKokonaisRiskitaso: number;
  riskikategoriat: Array<{
    kategoria: string;
    alkuperainenRiskitaso: number;
    paivitettyRiskitaso: number;
    muutosPerustelu: string;
    jaljellaolevat_toimenpiteet: string[];
  }>;
  yhteenveto: string;
}

// Analyysin tila-enum, uusi lisäys
export enum AnalysisStatus {
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  PostDDCompleted = 'post_dd_completed'
}

// Koko arvovaikutusanalyysin tulos
export interface ValuationImpactResult {
  companyId: string;
  originalValuation: OriginalValuationSnapshot;
  salesReadinessAnalysis: SalesReadinessAnalysis;
  adjustmentFactors: AdjustmentFactors;
  adjustedValuation: AdjustedValuationResult;
  calculationDate: string;
  ddRiskAnalysis?: DDRiskAnalysis;
  analysis_phase?: 'initial' | 'post_dd'; // Analyysin vaihe (alkuperäinen vai DD-korjausten jälkeinen)
  previous_analysis_id?: string; // Viittaus aiempaan analyysiin (jos kyseessä post-DD)
  id?: string; // Analyysin tietokanta-ID (tarvitaan viittaamista varten)

  // Post-DD analyysin kentät
  post_dd_sales_readiness_analysis?: SalesReadinessAnalysis; // DD-korjausten jälkeinen myyntikuntoisuusanalyysi
  post_dd_risk_analysis?: RiskMitigationAnalysis; // DD-korjausten jälkeinen riskianalyysi

  // Uusi kenttä analyysin tilalle
  status?: AnalysisStatus; // Analyysin tila
  
  // Lisätty taloudellisen datan kenttä
  financialPeriodData?: {
    netDebt: number;
    bookValue: number;
    cash: number;
    debt: number;
  };
}