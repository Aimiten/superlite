import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

interface SimulationRequest {
  currentFinancials: {
    revenue: number;
    ebit: number;
    ebitda: number;
    equity: number;
    netDebt: number;
    depreciation: number;
    currentValue: number;
  };
  multipliers: {
    revenue: number;
    ebit: number;
    ebitda: number;
  };
  selectedMethods?: {
    revenue: boolean;
    ebit: boolean;
    ebitda: boolean;
  };
  futureScenario?: {
    enabled: boolean;
    revenueGrowth: number;
    targetEbitMargin: number;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SimulationRequest = await req.json();
    const { currentFinancials, multipliers, selectedMethods, futureScenario } = data;
    
    console.log("Simulation request received:", {
      hasFinancials: !!currentFinancials,
      hasMultipliers: !!multipliers,
      hasFutureScenario: !!futureScenario,
      currentFinancials,
      multipliers
    });
    
    // Apply future scenario if provided and enabled
    let adjustedFinancials = { ...currentFinancials };
    if (futureScenario?.enabled) {
      // Calculate new revenue
      adjustedFinancials.revenue = currentFinancials.revenue * (1 + futureScenario.revenueGrowth);
      
      // Calculate new EBIT based on target margin
      adjustedFinancials.ebit = adjustedFinancials.revenue * futureScenario.targetEbitMargin;
      
      // Recalculate EBITDA (EBIT + depreciation)
      adjustedFinancials.ebitda = adjustedFinancials.ebit + currentFinancials.depreciation;
      
      console.log("Applied future scenario adjustments:", {
        originalRevenue: currentFinancials.revenue,
        newRevenue: adjustedFinancials.revenue,
        originalEbit: currentFinancials.ebit,
        newEbit: adjustedFinancials.ebit
      });
    }
    
    // Default selectedMethods to all true if not provided
    const methods = selectedMethods || { revenue: true, ebit: true, ebitda: true };
    
    // Calculate valuations with new multipliers (EQUITY values = EV - Net Debt)
    const valuations = {
      substanssi: adjustedFinancials.equity, // Always included
      revenue: (methods.revenue && adjustedFinancials.revenue > 0) 
        ? (adjustedFinancials.revenue * multipliers.revenue) - adjustedFinancials.netDebt 
        : null,
      ebit: (methods.ebit && adjustedFinancials.ebit > 0) 
        ? (adjustedFinancials.ebit * multipliers.ebit) - adjustedFinancials.netDebt 
        : null,
      ebitda: (methods.ebitda && adjustedFinancials.ebitda > 0)
        ? (adjustedFinancials.ebitda * multipliers.ebitda) - adjustedFinancials.netDebt
        : null
    };
    
    console.log("Selected methods:", methods);
    console.log("Calculated valuations:", {
      substanssi: `${valuations.substanssi} (always included)`,
      revenue: valuations.revenue ? `${adjustedFinancials.revenue} * ${multipliers.revenue} - ${adjustedFinancials.netDebt} = ${valuations.revenue}` : 'Not selected or invalid',
      ebit: valuations.ebit ? `${adjustedFinancials.ebit} * ${multipliers.ebit} - ${adjustedFinancials.netDebt} = ${valuations.ebit}` : 'Not selected or invalid',
      ebitda: valuations.ebitda ? `${adjustedFinancials.ebitda} * ${multipliers.ebitda} - ${adjustedFinancials.netDebt} = ${valuations.ebitda}` : 'Not selected or invalid'
    });

    // Calculate range from selected methods - ALWAYS include substanssi + selected multiples
    const selectedValues = [
      valuations.substanssi, // Always include substanssi/book value
      ...(valuations.revenue !== null && valuations.revenue > 0 ? [valuations.revenue] : []),
      ...(valuations.ebit !== null && valuations.ebit > 0 ? [valuations.ebit] : []),
      ...(valuations.ebitda !== null && valuations.ebitda > 0 ? [valuations.ebitda] : [])
    ];
    
    console.log("Values included in average:", selectedValues);
    
    // selectedValues should never be empty since substanssi is always included
    if (selectedValues.length === 0) {
      throw new Error("Critical error: No valuation methods available (substanssi should always be included)");
    }
    
    const range = {
      low: Math.min(...selectedValues),
      high: Math.max(...selectedValues),
      average: selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length
    };

    // Calculate change from current value
    const change = {
      absolute: range.average - currentFinancials.currentValue,
      percentage: currentFinancials.currentValue > 0 
        ? ((range.average - currentFinancials.currentValue) / currentFinancials.currentValue) * 100
        : 0
    };

    const response = {
      adjustedFinancials,
      valuations,
      range,
      change,
      validMethodCount: selectedValues.length
    };

    console.log("Returning simulation response");
    
    return new Response(JSON.stringify(response), { 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("Simulation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: corsHeaders }
    );
  }
});