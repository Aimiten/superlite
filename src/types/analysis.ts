// Analysis-related types based on the component usage

export interface AnalysisSection {
  title: string;
  content: string;
}

export interface CompanyInsight {
  title: string;
  description: string;
}

export interface AnalysisResults {
  key_points?: {
    title?: string;
    content: string;
  };
  valuation_analysis?: {
    substanssi_analysis?: AnalysisSection;
    ev_ebit_analysis?: AnalysisSection;
  };
  company_insights?: CompanyInsight[];
  myyntikuntoon_recommendation?: {
    title: string;
    description: string;
  };
  analysis_sections?: AnalysisSection[];
  sale_readiness_growth_path?: {
    next_steps: string[];
    development_areas?: string[];
    estimated_timeline?: string;
  };
  development_areas?: Array<{
    name: string;
    priority: string;
    description?: string;
    estimated_timeline?: string;
  }>;
}