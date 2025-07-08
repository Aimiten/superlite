export type AnswerOption = {
  value: number | string;
  label: string;
};

export type QuestionType = 
  | 'scale' 
  | 'text' 
  | 'multiselect' 
  | 'select' 
  | 'numeric'
  | 'boolean';

export type Question = {
  id: string;
  question: string;
  description: string;
  questionType: QuestionType;
  context?: string;
  amount?: number;
  period?: string;
  answerOptions?: AnswerOption[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type Answer = {
  questionId: string;
  value: number | string | string[] | boolean;
  questionType: QuestionType;
};

export type CompanyData = {
  company_name?: string;
  business_id?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  revenue?: string | number;
  description?: string;
  competitive_advantages?: string[];
  market_position?: string;
  challenges?: string[];
  key_products?: string[];
  website?: string;
};

export type AnalysisResults = {
  key_points?: {
    title: string;
    content: string;
  };
  valuation_analysis?: {
    substanssi_analysis?: {
      title: string;
      content: string;
    };
    ev_ebit_analysis?: {
      title: string;
      content: string;
    };
  };
  company_insights?: {
    title: string;
    description: string;
  }[];
  myyntikuntoon_recommendation?: {
    title: string;
    description: string;
  };
  analysis_sections?: {
    title: string;
    content: string;
  }[];
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority?: "korkea" | "keskitaso" | "matala";
    expected_impact?: string;
  }[];
  additional_recommendations?: {
    title: string;
    description: string;
    expected_impact?: string;
  }[];
  sale_readiness_growth_path?: {
    next_steps: string[];
    medium_term_actions: string[];
    expected_outcomes: string;
  };
};

export type CompanyType = "osakeyhtiö" | "henkilöyhtiö" | "toiminimi" | "muu";

export type OwnershipChangeType = 
  | "osakekauppa" 
  | "liiketoimintakauppa" 
  | "toiminimikauppa" 
  | "sukupolvenvaihdos" 
  | "henkilöstökauppa" 
  | "laajentaminen" 
  | "muu";

export type Company = {
  id: string;
  name: string;
  business_id?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  description?: string;
  website?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  company_type?: CompanyType | null;
  ownership_change_type?: OwnershipChangeType | null;
  ownership_change_other?: string;
  valuation?: string | number | null;
};

export type CompanyInfo = {
  id: string;
  company_id: string;
  business_description?: string;
  employees_count?: string;
  customer_and_market?: string;
  competition?: string;
  strategy_and_future?: string;
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
  risks_and_regulation?: string;
  brand_and_reputation?: string;
  sources?: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  company_id: string;
  assessment_id?: string | null;
  valuation_id?: string | null;
  title: string;
  description: string;
  category: 'financial' | 'operations' | 'documentation' | 'customers';
  urgency: 'high' | 'medium' | 'low';
  expected_outcome: string | null;
  response_type: 'text' | 'file' | 'both';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskResponse = {
  id?: string;
  task_id: string;
  text_response?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface Document {
  id?: string;
  name: string;
  file_path?: string;
  file_type?: string;
  document_type?: string;
  created_at?: string;
  file?: File; // Lisätään tuki File-objektille
}