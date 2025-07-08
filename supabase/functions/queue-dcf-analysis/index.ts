// supabase/functions/queue-dcf-analysis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[queue-dcf-analysis][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[queue-dcf-analysis][${area}] Data (Error):`, {
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
          console.log(`[queue-dcf-analysis][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[queue-dcf-analysis][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[queue-dcf-analysis][${area}] Couldn't stringify data:`, String(data));
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
    console.log("Handling OPTIONS preflight request for queue-dcf-analysis function");
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
      throw new Error("Missing environment variables (Supabase)");
    }

    // Jäsennä pyynnön data
    debugLog("Request", "Parsing request body");
    const requestData = await req.json();
    const { companyId, valuationId } = requestData;

    debugLog("Request", `Received DCF request for company ID: ${companyId}, valuation ID: ${valuationId}`);

    // Tarkista että pakolliset parametrit on määritelty
    if (!companyId || !valuationId) {
      debugLog("Error", "Missing companyId or valuationId in request");
      return new Response(
        JSON.stringify({ success: false, message: "Company ID tai valuation ID puuttuu" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Hae user_id authorizationista ENNEN kuin sitä käytetään
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (error) {
        debugLog("Warning", "Could not parse user ID from token", error);
      }
    }

    debugLog("Process", `Queueing DCF analysis for company: ${companyId}, valuation: ${valuationId}`);

    // Luo Supabase-client tietokantaoperaatioita varten
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Tarkista ensin onko jo olemassa completed DCF analyysi
    const { data: existingDCF } = await supabase
      .from('dcf_scenario_analyses')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('valuation_id', valuationId)
      .in('status', ['completed', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingDCF?.length > 0) {
      if (existingDCF[0].status === 'completed') {
        debugLog("Info", `DCF analyysi on jo valmis (ID: ${existingDCF[0].id})`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "DCF analyysi on jo valmis",
            status: "completed",
            analysis_id: existingDCF[0].id
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } else if (existingDCF[0].status === 'processing') {
        debugLog("Info", `DCF analyysi on jo käynnissä (ID: ${existingDCF[0].id})`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "DCF analyysi on jo käynnissä",
            status: "processing",
            analysis_id: existingDCF[0].id
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Lisää viesti jonoon käyttäen public-skeeman wrapper-funktiota
    debugLog("Queue", `Adding DCF request to dcf_analysis_queue for company: ${companyId}`);
    
    // Lisää userId queue-viestiin
    const queueMessage = {
      ...requestData,
      userId: userId
    };
    
    const { data: queueData, error: queueError } = await supabase.rpc("queue_send", {
      queue_name: "dcf_analysis_queue",
      message: queueMessage
    });

    if (queueError) {
      debugLog("Error", "Failed to add DCF message to queue", queueError);
      debugLog("Error", "Queue error details:", {
        code: queueError.code,
        details: queueError.details,
        hint: queueError.hint,
        message: queueError.message
      });
      throw new Error(`DCF jonoon lisääminen epäonnistui: ${queueError.message}`);
    }

    debugLog("Success", "DCF request added to queue successfully", { messageId: queueData });

    // Luo alustava rivi dcf_scenario_analyses-tauluun seurantaa varten (SAMA KUIN SALES-ANALYSIS)
    debugLog("DB", `Creating tracking record in dcf_scenario_analyses for company: ${companyId}`);
    
    // Always create tracking record - use requestData.userId as fallback
    const trackingUserId = userId || requestData.userId || null;
    debugLog("DB", `Using userId for tracking: ${trackingUserId ? 'Found' : 'Not found'}`);
    
    const { error: insertError } = await supabase
      .from('dcf_scenario_analyses')
      .insert({
        user_id: trackingUserId,
        company_id: companyId,
        valuation_id: valuationId,
        status: 'processing',
        analysis_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      debugLog("Warning", "Failed to create DCF tracking record", insertError);
      // Ei lopeteta prosessia vaikka merkinnän luominen epäonnistuisi
    } else {
      debugLog("Success", "DCF tracking record created successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "DCF analyysi lisätty jonoon",
        messageId: queueData,
        status: "queued"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    debugLog("Error", "Function failed", error);
    const errorMessage = error instanceof Error ? error.message : "Tuntematon virhe";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});