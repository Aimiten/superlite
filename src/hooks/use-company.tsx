// src/hooks/use-company.tsx

import { useCompanyContext } from "@/contexts/CompanyContext";

/**
 * FAANG-tason useCompany hook
 * Käyttää React Context Provideria yhteiselle state:lle
 * 
 * Ennen: Jokainen komponentti loi oman instanssin
 * Nyt: Kaikki komponentit jakavat saman globaalin staten
 */
export function useCompany() {
  return useCompanyContext();
}
