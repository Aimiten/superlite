// supabase/functions/analyze-sales-readiness/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Strukturoitu lokitusfunktio kehitystä ja virheenhallintaa varten
 */
function debugLog(area: string, message: string, data?: any) {
  console.log(`[analyze-sales-readiness][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[analyze-sales-readiness][${area}] Data (Error):`, {
            message: data.message,
            name: data.name,
            stack: data.stack
          });
        } else {
          const safeData = typeof data.toJSON === 'function' 
            ? data.toJSON() 
            : JSON.parse(JSON.stringify(data, (key, value) => {
                if (key === 'api_key' || key === 'key' || key === 'password' || key === 'token') {
                  return '[REDACTED]';
                }
                return value;
              }));
          console.log(`[analyze-sales-readiness][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[analyze-sales-readiness][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[analyze-sales-readiness][${area}] Couldn't stringify data:`, String(data));
    }
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Käsittele CORS preflight -pyynnöt
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request for analyze-sales-readiness function");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Tarkista ympäristömuuttujat
    debugLog("Init", "Function started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      debugLog("Error", "Missing environment variables");
      throw new Error("Missing environment variables (Supabase/Gemini)");
    }

    // Jäsennä pyynnön data
    debugLog("Request", "Parsing request body");
    const requestData = await req.json();
    const { companyId, valuationId } = requestData;

    debugLog("Request", `Received request for company ID: ${companyId}`);

    // Tarkista että companyId on määritelty
    if (!companyId) {
      debugLog("Error", "Missing company ID in request");
      return new Response(
        JSON.stringify({ success: false, message: "Company ID puuttuu" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    debugLog("Process", `Function started for company: ${companyId}`);

    // Luo Supabase-client tietokantaoperaatioita varten
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Lisää viesti jonoon käyttäen public-skeeman wrapper-funktiota
    debugLog("Queue", `Adding request to sales_analysis_queue for company: ${companyId}`);
    const { data: queueData, error: queueError } = await supabase.rpc("queue_send", {
      queue_name: "sales_analysis_queue",
      message: requestData
    });

    if (queueError) {
      debugLog("Error", "Failed to add message to queue", queueError);
      throw new Error(`Jonoon lisääminen epäonnistui: ${queueError.message}`);
    }

    // Luo alustava rivi valuation_impact_analysis-tauluun seurantaa varten
    if (valuationId) {
      debugLog("DB", `Creating tracking record in valuation_impact_analysis for company: ${companyId}`);
      const { error: insertError } = await supabase
        .from('valuation_impact_analysis')
        .insert({
          company_id: companyId,
          original_valuation_id: valuationId,
          status: 'processing',
          calculation_date: new Date().toISOString(),
          started_at: new Date().toISOString()
        });

      if (insertError) {
        debugLog("Warning", "Failed to create tracking record", insertError);
        // Ei lopeteta prosessia vaikka merkinnän luominen epäonnistuisi
      }
    } else {
      debugLog("Warning", "No valuationId provided, skipping tracking record creation");
    }

    debugLog("Queue", `Analysis request successfully queued for company: ${companyId}, queue message ID: ${queueData}`);

    // Palauta onnistumisvastaus
    return new Response(
      JSON.stringify({
        success: true,
        message: "Analysis queued for processing",
        queueMessageId: queueData,
        status: "processing"
      }),
      { 
        status: 202, // Accepted
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    // Käsittele virhe ja palauta virhevastaus
    const message = error instanceof Error ? error.message : "Tuntematon virhe";
    debugLog("Error", `Function failed: ${message}`, error);
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});