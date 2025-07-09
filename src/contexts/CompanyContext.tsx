// src/contexts/CompanyContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Company, CompanyType, OwnershipChangeType } from "@/types/company";

interface CompanyContextType {
  companies: Company[];
  hasCompany: boolean;
  activeCompany: Company | null;
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Onko vähintään yksi yritys?
  const hasCompany = useMemo(() => companies.length > 0, [companies]);

  // Valitaan "aktiiviseksi" aina ensimmäinen
  const activeCompany = useMemo(() => (hasCompany ? companies[0] : null), [hasCompany, companies]);

  // Seurataan, keneltä käyttäjältä on viimeksi haettu data.
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Refetch-funktio jolla voi pakottaa tietojen hakemisen uudelleen
  const refetch = useCallback(() => {
    console.log("🔄 CompanyProvider: refetch() kutsuttu");
    setForceRefresh(prev => prev + 1);
    lastFetchedUserIdRef.current = null; // Nollaa cache
  }, []);

  useEffect(() => {
    // Cleanup kun provider unmounttaa
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      // Ei käyttäjää → nollaa tila
      console.log("🚫 CompanyProvider: Ei käyttäjää, nollataan tila");
      setLoading(false);
      setCompanies([]);
      setDataFetched(false);
      setError(null);
      lastFetchedUserIdRef.current = null;
      return;
    }

    async function fetchCompanies() {
      try {
        console.log("📡 CompanyProvider: Haetaan yritykset käyttäjälle", user.id);
        setLoading(true);
        setError(null);
        setDataFetched(false);

        const { data, error: fetchError } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!isMountedRef.current) return;

        if (fetchError) {
          console.error("❌ CompanyProvider: Virhe haussa", fetchError);
          setError(fetchError.message);
        } else if (data) {
          const typedData = data.map(item => ({
            ...item,
            company_type: item.company_type as CompanyType | null,
            ownership_change_type: item.ownership_change_type as OwnershipChangeType | null
          }));
          console.log("✅ CompanyProvider: Löydettiin", typedData.length, "yritystä");
          setCompanies(typedData);
        }

        setDataFetched(true);
        lastFetchedUserIdRef.current = user.id;

      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.error("❌ CompanyProvider: Exception", err);
        setError(err.message || "Unknown error");
        setDataFetched(true);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchCompanies();
  }, [user?.id, forceRefresh]);

  const value = useMemo(() => ({
    companies,
    hasCompany,
    activeCompany,
    loading,
    error,
    dataFetched,
    refetch,
  }), [companies, hasCompany, activeCompany, loading, error, dataFetched, refetch]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

// Custom hook contextia varten
export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}