// src/hooks/useValuationImpact.tsx
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/edge-function';
import { SalesReadinessAnalysis, ValuationImpactResult } from '../../supabase/functions/_shared/types';

interface UseValuationImpactReturn {
  analyzeValuationImpact: (companyId: string, valuationId: string | null) => Promise<ValuationImpactResult | null>;
  analyzePostDDImpact: (companyId: string, previousAnalysisId: string, valuationId: string | null) => Promise<ValuationImpactResult | null>;
  fetchLatestAnalysis: (companyId: string) => Promise<void>;
  valuationImpact: ValuationImpactResult | null;
  isAnalyzing: boolean;
  isLoadingLatest: boolean;
  hasAnalysis: boolean;
  isPostDDAnalysis: boolean;
  error: string | null;
}

/**
 * Custom hook for managing valuation impact analysis state and API calls.
 */
export function useValuationImpact(): UseValuationImpactReturn {
  const { toast } = useToast();
  const [valuationImpact, setValuationImpact] = useState<ValuationImpactResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uusi tilamuuttuja, joka kertoo onko kyseessä post-DD analyysi
  const isPostDDAnalysis = !!valuationImpact?.analysis_phase && 
                          ['post_due_diligence', 'post_dd'].includes(valuationImpact.analysis_phase);

  const hasAnalysis = !!valuationImpact && !error;

  /**
   * Fetches the latest valuation impact analysis directly from the database.
   * Used as a fallback method and for initial data loading.
   */
  const fetchLatestAnalysisFromDatabase = useCallback(async (companyId: string): Promise<ValuationImpactResult | null> => {
    try {
      console.log(`[useValuationImpact] Fetching latest analysis from database for company: ${companyId}`);

      // Ensin yritetään hakea post-DD analyysi, jos sellainen on
      const { data: postDDData, error: postDDError } = await supabase
        .from('valuation_impact_analysis')
        .select('*')
        .eq('company_id', companyId)
        .eq('analysis_phase', 'post_due_diligence')
        .in('status', ['completed', 'post_dd_completed'])
        .order('calculation_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (postDDData) {
        console.log("[useValuationImpact] Successfully fetched post-DD analysis");
        setValuationImpact(postDDData as ValuationImpactResult);
        return postDDData as ValuationImpactResult;
      }

      // Jos post-DD analyysiä ei löydy, haetaan tavallinen analyysi
      const { data, error: fetchError } = await supabase
        .from('valuation_impact_analysis')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("[useValuationImpact] Error fetching analysis from DB:", fetchError);
        return null;
      }

      if (data) {
        console.log("[useValuationImpact] Successfully fetched analysis from database");
        setValuationImpact(data as ValuationImpactResult);
        return data as ValuationImpactResult;
      }

      return null;
    } catch (err) {
      console.error("[useValuationImpact] Error in database fetch:", err);
      return null;
    }
  }, []);

  /**
   * Fetches the latest stored valuation impact analysis for a company.
   */
  const fetchLatestAnalysis = useCallback(async (companyId: string) => {
    if (!companyId) return;
    setIsLoadingLatest(true);
    setError(null);

    try {
      const result = await fetchLatestAnalysisFromDatabase(companyId);

      if (!result) {
        console.log("[useValuationImpact] No existing analysis found in database");
        setValuationImpact(null);
      }
    } catch (err: any) {
      console.error("[useValuationImpact] Error fetching latest analysis:", err);
      setError(`Viimeisimmän arvovaikutusanalyysin haku epäonnistui: ${err.message}`);
      setValuationImpact(null);
    } finally {
      setIsLoadingLatest(false);
    }
  }, [fetchLatestAnalysisFromDatabase]);

  /**
   * Polls the database for analysis completion
   */
  const pollForAnalysisCompletion = useCallback(async (
    companyId: string,
    maxRetries: number = 60,
    intervalMs: number = 10000
  ): Promise<ValuationImpactResult | null> => {
    let retries = 0;

    while (retries < maxRetries) {
      console.log(`[useValuationImpact] Polling for analysis completion (attempt ${retries + 1}/${maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, intervalMs));

      try {
        // Query the latest analysis for this company
        const { data, error } = await supabase
          .from('valuation_impact_analysis')
          .select('*')
          .eq('company_id', companyId)
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("[useValuationImpact] Error during polling:", error);
          // Continue polling despite error
        } else if (data) {
          // Check status field
          if (data.status === 'completed') {
            console.log("[useValuationImpact] Analysis completed successfully");
            return data as ValuationImpactResult;
          } else if (data.status === 'failed') {
            console.error("[useValuationImpact] Analysis failed:", data.error_message);
            throw new Error(data.error_message || "Analyysi epäonnistui");
          }
          // Otherwise status is still 'processing', continue polling
        }
      } catch (err) {
        console.warn("[useValuationImpact] Error during poll:", err);
        // Continue polling despite error
      }

      retries++;
    }

    // If we reach here, we've exceeded max retries
    console.warn("[useValuationImpact] Analysis polling timed out after maximum attempts");
    return null;
  }, []);

  /**
   * Polls the database specifically for post-DD analysis completion
   */
  const pollForPostDDAnalysisCompletion = useCallback(async (
    companyId: string,
    maxRetries: number = 60,
    intervalMs: number = 10000
  ): Promise<ValuationImpactResult | null> => {
    let retries = 0;

    while (retries < maxRetries) {
      console.log(`[useValuationImpact] Polling for post-DD analysis completion (attempt ${retries + 1}/${maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, intervalMs));

      try {
        // Query specifically for post_due_diligence analysis
        const { data, error } = await supabase
          .from('valuation_impact_analysis')
          .select('*')
          .eq('company_id', companyId)
          .eq('analysis_phase', 'post_due_diligence')
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("[useValuationImpact] Error during post-DD polling:", error);
          // Continue polling despite error
        } else if (data) {
          // Check status field - accepts both completed and post_dd_completed
          if (data.status === 'completed' || data.status === 'post_dd_completed') {
            console.log("[useValuationImpact] Post-DD analysis completed successfully");
            return data as ValuationImpactResult;
          } else if (data.status === 'failed') {
            console.error("[useValuationImpact] Post-DD analysis failed:", data.error_message);
            throw new Error(data.error_message || "Analyysi epäonnistui");
          }
          // Otherwise status is still 'processing', continue polling
        }
      } catch (err) {
        console.warn("[useValuationImpact] Error during post-DD poll:", err);
        // Continue polling despite error
      }

      retries++;
    }

    // If we reach here, we've exceeded max retries
    console.warn("[useValuationImpact] Post-DD analysis polling timed out after maximum attempts");
    return null;
  }, []);

  /**
   * Fetches the latest post-DD analysis
   */
  const fetchLatestPostDDAnalysis = useCallback(async (companyId: string): Promise<ValuationImpactResult | null> => {
    try {
      console.log(`[useValuationImpact] Fetching latest post-DD analysis for company: ${companyId}`);

      const { data, error } = await supabase
        .from('valuation_impact_analysis')
        .select('*')
        .eq('company_id', companyId)
        .eq('analysis_phase', 'post_due_diligence')
        .in('status', ['completed', 'post_dd_completed'])
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("[useValuationImpact] Error fetching latest post-DD analysis:", error);
        return null;
      }

      return data as ValuationImpactResult;
    } catch (err) {
      console.error("[useValuationImpact] Exception during fetchLatestPostDDAnalysis:", err);
      return null;
    }
  }, []);

  /**
   * Triggers the queue-based valuation impact analysis process.
   * Initiates the analysis and then polls for completion.
   */
  const analyzeValuationImpact = useCallback(async (
    companyId: string,
    valuationId: string | null 
  ): Promise<ValuationImpactResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    setValuationImpact(null);

    if (!valuationId) {
      const missingValuationIdError = "Alkuperäistä arvonmääritystä ei ole valittu analyysiä varten.";
      setError(missingValuationIdError);
      toast({ title: "Virhe", description: missingValuationIdError, variant: "destructive" });
      setIsAnalyzing(false);
      return null;
    }

    try {
      console.log("[useValuationImpact] Queuing analysis for company:", companyId);
      const { data: initiationData, error: initiationError, status } = await callEdgeFunction("analyze-sales-readiness", {
        companyId,
        valuationId
      });

      if (initiationError || !initiationData || initiationData.success === false) {
        throw new Error(initiationError?.message || initiationData?.message || "Analyysin käynnistys epäonnistui");
      }

      console.log("[useValuationImpact] Analysis queued successfully:", initiationData);
      toast({ 
        title: "Analyysi käynnistetty", 
        description: "Analyysi käsitellään taustalla. Tämä voi kestää useita minuutteja.",
        variant: "default"
      });

      const result = await pollForAnalysisCompletion(companyId);

      if (!result) {
        // Tarkistusmekanismi: tee vielä yksi varmistus, jos polling aikakatkaistui
        const finalCheck = await fetchLatestAnalysisFromDatabase(companyId);

        if (finalCheck && finalCheck.status === 'completed') {
          toast({ 
            title: "Analyysi valmistunut", 
            description: "Arvovaikutusanalyysi on valmis.",
            variant: "success"
          });
          setValuationImpact(finalCheck);
          return finalCheck;
        }

        throw new Error("Analyysi on edelleen käynnissä. Voit tarkistaa tulokset myöhemmin päivittämällä sivun.");
      }

      toast({ 
        title: "Analyysi valmistunut", 
        description: "Arvovaikutusanalyysi on valmis.",
        variant: "success"
      });

      setValuationImpact(result);
      return result;
    } catch (err: any) {
      console.error("[useValuationImpact] Error during valuation impact analysis:", err);

      // Yritetään hakea viimeisintä analyysia fallback-menetelmänä
      console.warn("[useValuationImpact] Attempting database fallback after error");
      const latestAnalysis = await fetchLatestAnalysisFromDatabase(companyId);

      if (latestAnalysis && latestAnalysis.status === 'completed') {
        console.log("[useValuationImpact] Successfully retrieved analysis from database fallback");
        toast({ 
          title: "Aiempi analyysi ladattu", 
          description: "Uuden analyysin luonti epäonnistui, näytetään aiempi analyysi",
          variant: "default"
        });
        setValuationImpact(latestAnalysis);
        return latestAnalysis;
      }

      const errorMessage = err.message || "Tuntematon virhe analyysin aikana.";
      setError(errorMessage);
      setValuationImpact(null);
      toast({
        title: "Analyysi epäonnistui",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, fetchLatestAnalysisFromDatabase, pollForAnalysisCompletion]);

  /**
   * Triggers post-DD valuation impact analysis and polls for completion
   */
  const analyzePostDDImpact = useCallback(async (
    companyId: string, 
    previousAnalysisId: string,
    valuationId: string | null
  ): Promise<ValuationImpactResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("[useValuationImpact] Starting post-DD analysis for company:", companyId);
      const { data: initiationData, error: initiationError } = await callEdgeFunction("analyze-post-dd-readiness", {
        companyId,
        valuationId,
        previousAnalysisId
      });

      if (initiationError || !initiationData || initiationData.success === false) {
        throw new Error(initiationError?.message || initiationData?.message || "Analyysin käynnistys epäonnistui");
      }

      console.log("[useValuationImpact] Post-DD analysis queued successfully:", initiationData);
      toast({ 
        title: "DD-analyysi käynnistetty", 
        description: "Analyysi käsitellään taustalla. Tämä voi kestää useita minuutteja.",
        variant: "default"
      });

      const result = await pollForPostDDAnalysisCompletion(companyId);

      if (!result) {
        // Tarkistusmekanismi: tee vielä yksi varmistus, jos polling aikakatkaistui
        const finalCheck = await fetchLatestPostDDAnalysis(companyId);

        if (finalCheck && (finalCheck.status === 'completed' || finalCheck.status === 'post_dd_completed')) {
          toast({ 
            title: "DD-analyysi valmistunut", 
            description: "DD-toimenpiteiden vaikutusten analyysi on valmis.",
            variant: "success"
          });
          setValuationImpact(finalCheck);
          return finalCheck;
        }

        throw new Error("Analyysi on edelleen käynnissä. Voit tarkistaa tulokset myöhemmin päivittämällä sivun.");
      }

      toast({ 
        title: "DD-analyysi valmistunut", 
        description: "DD-toimenpiteiden vaikutusten analyysi on valmis.",
        variant: "success"
      });

      setValuationImpact(result);
      return result;
    } catch (err: any) {
      console.error("[useValuationImpact] Error during post-DD analysis:", err);

      // Tarkista, onko analyysi ehkä jo valmis riippumatta virheestä
      const latestPostDDAnalysis = await fetchLatestPostDDAnalysis(companyId);

      if (latestPostDDAnalysis && (latestPostDDAnalysis.status === 'completed' || latestPostDDAnalysis.status === 'post_dd_completed')) {
        console.log("[useValuationImpact] Found completed post-DD analysis despite error");
        toast({ 
          title: "DD-analyysi valmistunut", 
          description: "DD-toimenpiteiden vaikutusten analyysi on valmis.",
          variant: "success"
        });
        setValuationImpact(latestPostDDAnalysis);
        return latestPostDDAnalysis;
      }

      const errorMessage = err.message || "Tuntematon virhe analyysin aikana.";
      setError(errorMessage);
      setValuationImpact(null);
      toast({
        title: "DD-analyysi epäonnistui",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, pollForPostDDAnalysisCompletion, fetchLatestPostDDAnalysis]);

  return {
    analyzeValuationImpact,
    analyzePostDDImpact,
    fetchLatestAnalysis,
    valuationImpact,
    isAnalyzing,
    isLoadingLatest,
    hasAnalysis,
    isPostDDAnalysis,
    error,
  };
}