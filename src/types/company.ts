// Company-related types based on the database schema

export type CompanyType = "osakeyhtiö" | "henkilöyhtiö" | "toiminimi" | "muu";

export type OwnershipChangeType = 
  | "osakekauppa" 
  | "liiketoimintakauppa" 
  | "toiminimikauppa" 
  | "sukupolvenvaihdos" 
  | "henkilöstökauppa" 
  | "laajentaminen" 
  | "muu";

export interface Company {
  id: string;
  name: string;
  business_id: string | null;
  company_type: CompanyType | null;
  created_at: string;
  description: string | null;
  employees: string | null;
  founded: string | null;
  industry: string | null;
  is_public: boolean;
  ownership_change_other: string | null;
  ownership_change_type: OwnershipChangeType | null;
  updated_at: string;
  user_id: string;
  website: string | null;
}