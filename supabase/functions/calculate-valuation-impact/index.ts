// supabase/functions/calculate-valuation-impact/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateAdjustmentFactors } from "./utils/adjustmentCalculations.ts";
import { applyValuationAdjustments } from "./utils/valuationAdjustments.ts";
import {
  SalesReadinessAnalysis,
  AdjustmentFactors,
  OriginalValuationSnapshot,
  AdjustedValuationResult,
  ValuationImpactResult
} from '../_shared/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

async function fetchOriginalValuationData(supabase: any, valuationId: string) {
  const { data: valuationData, error } = await supabase
    .from('valuations')
    .select('id, created_at, results')
    .eq('id', valuationId)
    .single();

  if (error) throw new Error(`Alkuperäisen arvonmäärityksen (ID: ${valuationId}) haku epäonnistui: 
${error.message}`);
  if (!valuationData || !valuationData.results) throw new Error(`Arvonmäärityksen (ID: ${valuationId}) data 
puutteellista.`);

  // Etsitään valuaatiometriikat esimerkkirakenteesta
  let valuationReport = valuationData.results.valuationReport;
  let valuation_numbers = valuationReport?.valuation_numbers;
  let financialAnalysis = valuationData.results.financialAnalysis;

  // Log rakenne
  console.log("[calculate-valuation-impact] Valuation structure keys:", Object.keys(valuationData.results));

  // Etsi viimeisin kausi jossa on weighted_financials
  let latestPeriod = null;
  if (financialAnalysis?.documents &&
      financialAnalysis.documents.length > 0 &&
      financialAnalysis.documents[0].financial_periods &&
      financialAnalysis.documents[0].financial_periods.length > 0) {

    // Etsi kausi jossa on weighted_financials tai käytä viimeisintä
    for (const period of financialAnalysis.documents[0].financial_periods) {
      if (period.weighted_financials) {
        latestPeriod = period;
        break;
      }
    }

    // Jos ei löydy weighted_financials, käytä viimeisintä kautta
    if (!latestPeriod) {
      latestPeriod = financialAnalysis.documents[0].financial_periods[0];
    }
  }

  // Rakennetaan snapshot käyttäen painotettuja arvoja ja oikeita kertoimia
  const snapshot: OriginalValuationSnapshot = {
    valuationId: valuationData.id,
    calculationDate: valuationData.created_at,
    averageValuation: valuation_numbers?.most_likely_value || 0,
    valuationRange: {
      low: valuation_numbers?.range?.low || 0,
      high: valuation_numbers?.range?.high || 0
    },
    multiplesUsed: {
      revenue: 0.5, // Päivitetään myöhemmin
      ebit: 10,     // Päivitetään myöhemmin
      ebitda: 8,    // Päivitetään myöhemmin
      pe: 12        // Päivitetään myöhemmin
    },
    revenue: 0,  // Päivitetään myöhemmin
    ebit: 0,     // Päivitetään myöhemmin
    ebitda: 0,   // Päivitetään myöhemmin
  };

  if (latestPeriod) {
    // KORJAUS 1: Käytä weighted_financials dataa jos saatavilla
    if (latestPeriod.weighted_financials) {
      snapshot.revenue = latestPeriod.weighted_financials.revenue || 0;
      snapshot.ebit = latestPeriod.weighted_financials.ebit || 0;
      // KORJAUS: Tarkista EBITDA myös calculated_fields:stä
      snapshot.ebitda = latestPeriod.weighted_financials.ebitda || 
                        latestPeriod.calculated_fields?.ebitda_estimated ||
                        latestPeriod.income_statement?.ebitda || 0;
      console.log("[calculate-valuation-impact] Using weighted financials for calculations");
    } else if (latestPeriod.income_statement) {
      // Fallback yksittäiseen kauteen jos painotettuja ei ole
      snapshot.revenue = latestPeriod.income_statement.revenue || 0;
      snapshot.ebit = latestPeriod.income_statement.ebit || 0;
      snapshot.ebitda = latestPeriod.calculated_fields?.ebitda_estimated ||
                        latestPeriod.income_statement?.ebitda || 0;
      console.log("[calculate-valuation-impact] Using single period financials (no weighted data available)");
    }

    // KORJAUS 2: Käytä AI-määriteltyjä kertoimia oikein
    if (latestPeriod.valuation_multiples) {
      const vm = latestPeriod.valuation_multiples;

      // Revenue multiple
      if (vm.revenue_multiple?.multiple) {
        snapshot.multiplesUsed.revenue = vm.revenue_multiple.multiple;
      } else if (vm.revenue?.multiple) {
        snapshot.multiplesUsed.revenue = vm.revenue.multiple;
      }

      // EBIT multiple
      if (vm.ev_ebit?.multiple) {
        snapshot.multiplesUsed.ebit = vm.ev_ebit.multiple;
      }

      // EBITDA multiple
      if (vm.ev_ebitda?.multiple) {
        snapshot.multiplesUsed.ebitda = vm.ev_ebitda.multiple;
      }

      // P/E multiple
      if (vm.p_e?.multiple) {
        snapshot.multiplesUsed.pe = vm.p_e.multiple;
      }

      console.log("[calculate-valuation-impact] Using AI-determined multiples:", snapshot.multiplesUsed);
    } else if (latestPeriod.valuation_metrics) {
      // Vaihtoehtoinen paikka kertoimille
      const vmet = latestPeriod.valuation_metrics;

      if (vmet.used_revenue_multiple?.value) {
        snapshot.multiplesUsed.revenue = vmet.used_revenue_multiple.value;
      }
      if (vmet.used_ev_ebit_multiple?.value) {
        snapshot.multiplesUsed.ebit = vmet.used_ev_ebit_multiple.value;
      }
      if (vmet.used_ev_ebitda_multiple?.value) {
        snapshot.multiplesUsed.ebitda = vmet.used_ev_ebitda_multiple.value;
      }
      if (vmet.used_p_e_multiple?.value) {
        snapshot.multiplesUsed.pe = vmet.used_p_e_multiple.value;
      }

      console.log("[calculate-valuation-impact] Using valuation metrics multiples:", snapshot.multiplesUsed);
    }

    // KORJAUS 3: Hae valuation methods tiedot
    if (latestPeriod.valuation_metrics) {
      snapshot.valuationMethods = {
        revenue: latestPeriod.valuation_metrics.revenue_valuation_method || 'business_based',
        ebit: latestPeriod.valuation_metrics.ebit_valuation_method || 'business_based',
        ebitda: latestPeriod.valuation_metrics.ebitda_valuation_method || 'business_based',
        pe: latestPeriod.valuation_metrics.pe_valuation_method || 'business_based'
      };
      console.log("[calculate-valuation-impact] Retrieved valuation methods:", snapshot.valuationMethods);

      // UUSI: Hae alkuperäiset menetelmien arvot ja mitkä käytettiin keskiarvossa
      snapshot.originalMethodValues = {
        book_value: latestPeriod.valuation_metrics.book_value || 0,
        asset_based_value: latestPeriod.valuation_metrics.asset_based_value || 0,
        equity_value_from_revenue: latestPeriod.valuation_metrics.equity_value_from_revenue || 0,
        equity_value_from_ebit: latestPeriod.valuation_metrics.equity_value_from_ebit || 0,
        equity_value_from_ebitda: latestPeriod.valuation_metrics.equity_value_from_ebitda || 0,
        equity_value_from_pe: latestPeriod.valuation_metrics.equity_value_from_pe || 0
      };

      // Selvitä mitkä menetelmät käytettiin alkuperäisessä keskiarvossa
      snapshot.methodsUsedInAverage = [];

      // Book value käytetään aina jos positiivinen
      if (latestPeriod.valuation_metrics.book_value > 0) {
        snapshot.methodsUsedInAverage.push('book_value');
      }

      // Asset-based value käytetään aina jos positiivinen  
      if (latestPeriod.valuation_metrics.asset_based_value > 0) {
        snapshot.methodsUsedInAverage.push('asset_based_value');
      }

      // Revenue käytetään jos business_based ja positiivinen
      if (latestPeriod.valuation_metrics.equity_value_from_revenue > 0 &&
          latestPeriod.valuation_metrics.revenue_valuation_method === 'business_based') {
        snapshot.methodsUsedInAverage.push('revenue');
      }

      // EBIT käytetään jos business_based ja positiivinen
      if (latestPeriod.valuation_metrics.equity_value_from_ebit > 0 &&
          latestPeriod.valuation_metrics.ebit_valuation_method === 'business_based') {
        snapshot.methodsUsedInAverage.push('ebit');
      }

      // EBITDA käytetään jos business_based ja positiivinen
      if (latestPeriod.valuation_metrics.equity_value_from_ebitda > 0 &&
          latestPeriod.valuation_metrics.ebitda_valuation_method === 'business_based') {
        snapshot.methodsUsedInAverage.push('ebitda');
      }

      // P/E käytetään jos business_based ja positiivinen
      if (latestPeriod.valuation_metrics.equity_value_from_pe > 0 &&
          latestPeriod.valuation_metrics.pe_valuation_method === 'business_based') {
        snapshot.methodsUsedInAverage.push('pe');
      }

      console.log("[calculate-valuation-impact] Original method values:", snapshot.originalMethodValues);
      console.log("[calculate-valuation-impact] Methods used in average:", snapshot.methodsUsedInAverage);
    }
  }

  return {
    snapshot,
    fullResults: valuationData.results,
    latestPeriod: latestPeriod || { valuation_metrics: {} }
  };
}

async function saveValuationImpact(supabase: any, companyId: string, impactResult: ValuationImpactResult) {
  try {
    const { error } = await supabase
      .from('valuation_impact_analysis')
      .insert({
        company_id: companyId,
        original_valuation_id: impactResult.originalValuation.valuationId,
        calculation_date: impactResult.calculationDate,
        sales_readiness_analysis: impactResult.salesReadinessAnalysis,
        adjustment_factors: impactResult.adjustmentFactors,
        original_valuation_snapshot: impactResult.originalValuation,
        adjusted_valuation_result: impactResult.adjustedValuation,
        dd_risk_analysis: impactResult.ddRiskAnalysis
      });

    if (error) {
      console.error(`Error saving valuation impact analysis for company ${companyId}:`, error);
      return false;
    }

    console.log(`Valuation impact analysis saved successfully for company ${companyId}.`);
    return true;
  } catch (error) {
    console.error(`Error in saveValuationImpact:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const requestData = await req.json();
    const { companyId, valuationId, salesReadinessAnalysis, ddRiskAnalysis } = requestData;

    if (!companyId || !valuationId || !salesReadinessAnalysis) {
      return new Response(JSON.stringify({
        success: false,
        message: "Puuttuvia tietoja: companyId, valuationId tai salesReadinessAnalysis"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[calculate-valuation-impact] Function started for company: ${companyId}, valuation: 
${valuationId}`);

    // 1. Hae alkuperäinen valuaatiodata
    const { snapshot: originalValuationSnapshot, fullResults, latestPeriod } = await
fetchOriginalValuationData(supabase, valuationId);
    console.log("[calculate-valuation-impact] Fetched original valuation data");

    // 2. Laske korjauskertoimet uuden JSON-rakenteen perusteella
    const adjustmentFactors = calculateAdjustmentFactors(salesReadinessAnalysis as SalesReadinessAnalysis);
    console.log("[calculate-valuation-impact] Calculated adjustment factors:", adjustmentFactors);

    // 3. Sovella korjaukset ja laske korjattu arvo
    const adjustedValuation = applyValuationAdjustments(
      originalValuationSnapshot,
      adjustmentFactors,
      latestPeriod
    );
    console.log("[calculate-valuation-impact] Calculated adjusted valuation");

    // 4. Kokoa lopullinen tulosobjekti
    const impactResult: ValuationImpactResult = {
      companyId: companyId,
      originalValuation: originalValuationSnapshot,
      salesReadinessAnalysis: salesReadinessAnalysis as SalesReadinessAnalysis,
      adjustmentFactors: adjustmentFactors,
      adjustedValuation: adjustedValuation,
      calculationDate: new Date().toISOString(),
      ddRiskAnalysis: ddRiskAnalysis || null
    };

    // 5. Tallenna tulokset (taustaprosessi)
    saveValuationImpact(supabase, companyId, impactResult)
      .catch(error => console.error("Error saving impact result:", error));

    // 6. Palauta tulokset käyttäjälle
    return new Response(JSON.stringify({
      success: true,
      data: impactResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[calculate-valuation-impact] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Tuntematon virhe";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
