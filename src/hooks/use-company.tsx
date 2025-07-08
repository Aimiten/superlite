
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Company, CompanyType, OwnershipChangeType } from "@/components/assessment/types";

export function useCompany() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Yritystiedon tila
  const hasCompany = companies.length > 0;
  const activeCompany = hasCompany ? companies[0] : null;

  useEffect(() => {
    let isMounted = true;
    
    async function fetchCompanies() {
      if (!user) {
        if (isMounted) {
          setLoading(false);
          setCompanies([]);
          setDataFetched(true);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        console.log(`Fetching companies for user ID: ${user.id}`);
        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching companies:", error);
          if (isMounted) {
            setError(error.message);
            setLoading(false);
            setDataFetched(true);
          }
          return;
        }
        
        // Käsitellään data oikean tyyppiseksi
        const typedData = data?.map(item => ({
          ...item,
          company_type: item.company_type as CompanyType | null,
          ownership_change_type: item.ownership_change_type as OwnershipChangeType | null
        })) || [];
        
        console.log(`Found ${typedData.length} companies:`, typedData);
        
        if (isMounted) {
          setCompanies(typedData);
          setLoading(false);
          setDataFetched(true);
          console.log("Companies loaded, hasCompany now:", typedData.length > 0);
        }
      } catch (err: any) {
        console.error("Error fetching companies:", err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
          setDataFetched(true);
        }
      }
    }

    fetchCompanies();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Lisätään selkeä lokiviesti joka kerta kun hasCompany-arvo lasketaan
  console.log("useCompany hook - hasCompany current value:", hasCompany);

  return { 
    companies, 
    hasCompany, 
    activeCompany, 
    loading, 
    error,
    dataFetched // Uusi prop, joka kertoo onko data ladattu (onnistuneesti tai virheellisesti)
  };
}
