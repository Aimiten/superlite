// supabase/functions/process-sales-analysis-queue/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Task, SalesReadinessAnalysis, DDRiskAnalysis } from "../_shared/types.ts";

// Importoidaan valmiit apufunktiot samasta hakemistosta kuin analyze-sales-readiness käyttää
import { callAIModel } from "../analyze-sales-readiness/utils/ai-client-manager.ts";
import { createSalesReadinessPrompt } from "../analyze-sales-readiness/prompts/sales-readiness-prompt.ts";
import { createDDRiskPrompt } from "../analyze-sales-readiness/prompts/dd-risk-prompt.ts";
import { fetchCompanyData } from "../analyze-sales-readiness/data/data-service.ts";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[process-queue][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[process-queue][${area}] Data (Error):`, {
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
          console.log(`[process-queue][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[process-queue][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[process-queue][${area}] Couldn't stringify data:`, String(data));
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Tallenna viesti-ID tähän muuttujaan
  let messageId: any = null;

  try {
    debugLog("Init", "Queue processor started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Luo tavallinen Supabase-client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    debugLog("Queue", "Popping message from sales_analysis_queue");
    // Käytä queue_pop-funktiota jonosta lukemiseen
    const queueResult = await supabase.rpc("queue_pop", {
      queue_name: "sales_analysis_queue",
      count: 1
    });

    if (queueResult.error) {
      throw new Error(`Failed to pop from queue: ${queueResult.error.message}`);
    }

    // Tarkista onko viestejä
    const messages = queueResult.data;
    if (!messages || messages.length === 0) {
      debugLog("Queue", "No messages in queue to process");
      return new Response("No messages in queue", { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Käsittele ensimmäinen viesti
    const queueMessage = messages[0];
    debugLog("Queue", `Processing message ${queueMessage.msg_id}`);
    const requestData = queueMessage.message;

    // TALLENNA VIESTI-ID TÄSTÄ ERILLISEEN MUUTTUJAAN
    messageId = queueMessage.msg_id;

    const { companyId, valuationId } = requestData;

    if (!companyId) {
      throw new Error("Missing company ID in message");
    }

    debugLog("Process", `Starting analysis for company: ${companyId}`);

    // TÄRKEÄ: Tarkista onko jo olemassa completed analyysi
    const { data: existingAnalysis } = await supabase
      .from('valuation_impact_analysis')
      .select('id')
      .eq('company_id', companyId)
      .eq('original_valuation_id', valuationId)
      .in('status', ['completed', 'post_dd_completed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingAnalysis?.length > 0) {
      debugLog("Info", `Analyysi on jo olemassa (ID: ${existingAnalysis[0].id}), ohitetaan käsittely`);

      // Poista mahdolliset jumissa olevat 'processing' rivit
      const { error: cleanupError } = await supabase
        .from('valuation_impact_analysis')
        .delete()
        .eq('company_id', companyId)
        .eq('original_valuation_id', valuationId)
        .eq('status', 'processing');

      if (cleanupError) {
        debugLog("Warning", "Failed to cleanup processing records", cleanupError);
      }

      // Arkistoi viesti
      await supabase.rpc("queue_archive", {
        queue_name: "sales_analysis_queue", 
        msg_id: Number(messageId)
      });

      return new Response(
        JSON.stringify({ success: true, message: "Already processed, skipped" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // --- 1. Hae tiedot ---
      const data = await fetchCompanyData(supabase, companyId);
      const { companyData, companyInfo, tasks, organizedTasks, assessmentData,
              valuationData, financialAnalysisData, documents, completionRate } = data;

      if (!tasks || tasks.length === 0) {
        throw new Error("No tasks found for company");
      }

      // --- 2. Tarkista suoritusaste ---
      const threshold = 0.75;
      if (completionRate < threshold) {
        throw new Error(`At least ${(threshold * 100).toFixed(0)}% of tasks must be completed before analysis (now ${(completionRate * 100).toFixed(1)}%).`);
      }

      // --- 3. Luo promptit ---
      const salesReadinessPrompt = createSalesReadinessPrompt({
        tasks, companyData, organizedTasks, companyInfo, assessmentData, valuationData
      });

      const ddRiskPrompt = createDDRiskPrompt({
        tasks, companyData, companyInfo, documents: [], 
        valuationData, financialAnalysisData
      });

      // --- 4. Kutsu AI-malleja myyntikuntoisuusanalyysille ---
      debugLog("AI", "Calling AI models for sales readiness analysis");
      
      // Kerää task-tiedostot documents-listaan
      const taskDocuments = tasks
        .filter(task => task.fileContent)
        .map(task => ({
          ...task.fileContent,
          task_id: task.id,
          task_title: task.title
        }));
      
      debugLog("AI", `Including ${taskDocuments.length} task attachments in analysis`);
      
      // Käytä vain task-dokumentteja (company documents poistettu)
      const allDocuments = taskDocuments;
      
      const salesReadinessResult = await callAIModel(salesReadinessPrompt, allDocuments);

      if (!salesReadinessResult.response) {
        throw new Error("AI models did not return a response for sales readiness");
      }

      // Käsittele vastaus
      let salesReadinessAnalysis: SalesReadinessAnalysis;
      if (salesReadinessResult.response.structuredJson) {
        debugLog("Parse", "Using structured JSON for sales readiness");
        salesReadinessAnalysis = salesReadinessResult.response.structuredJson as SalesReadinessAnalysis;
        if (!salesReadinessAnalysis.analyysiPvm) {
          salesReadinessAnalysis.analyysiPvm = new Date().toISOString();
        }
      } else {
        const salesReadinessText = salesReadinessResult.response.text();
        debugLog("Parse", "Parsing JSON from text for sales readiness");
        try {
          salesReadinessAnalysis = JSON.parse(salesReadinessText) as SalesReadinessAnalysis;
          if (!salesReadinessAnalysis.analyysiPvm) {
            salesReadinessAnalysis.analyysiPvm = new Date().toISOString();
          }
        } catch (parseError) {
          debugLog("Error", "Failed to parse sales readiness JSON", parseError);
          throw new Error(`Failed to parse sales readiness analysis: ${parseError.message}`);
        }
      }

      // --- 5. Kutsu AI-malleja DD-riskianalyysille ---
      debugLog("AI", "Calling AI models for DD risk analysis");
      const ddRiskResult = await callAIModel(ddRiskPrompt, allDocuments);

      let ddRiskAnalysis: DDRiskAnalysis | null = null;
      if (ddRiskResult.response) {
        if (ddRiskResult.response.structuredJson) {
          debugLog("Parse", "Using structured JSON for DD risk");
          ddRiskAnalysis = ddRiskResult.response.structuredJson as DDRiskAnalysis;
          if (ddRiskAnalysis && !ddRiskAnalysis.analyysiPvm) {
            ddRiskAnalysis.analyysiPvm = new Date().toISOString();
          }
        } else {
          const ddRiskText = ddRiskResult.response.text();
          debugLog("Parse", "Parsing JSON from text for DD risk");
          try {
            ddRiskAnalysis = JSON.parse(ddRiskText) as DDRiskAnalysis;
            if (ddRiskAnalysis && !ddRiskAnalysis.analyysiPvm) {
              ddRiskAnalysis.analyysiPvm = new Date().toISOString();
            }
          } catch (err) {
            debugLog("Warning", "Failed to parse DD risk JSON response", err);
            ddRiskAnalysis = null;
          }
        }
      }

      // --- 6. Kutsu calculate-valuation-impact ---
      let adjustmentFactors = null;
      let originalValuationSnapshot = null;
      let adjustedValuationResult = null;

      if (valuationId) {
        debugLog("ValuationImpact", `Calling calculate-valuation-impact with valuation ID: ${valuationId}`);

        try {
          const impactResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/calculate-valuation-impact`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                companyId,
                valuationId,
                salesReadinessAnalysis,
                ddRiskAnalysis
              }),
            }
          );

          if (!impactResponse.ok) {
            const errorText = await impactResponse.text();
            debugLog("Warning", `Error calculating valuation impact: ${impactResponse.status}`, errorText);
          } else {
            // Lue vastaus ja käsittele sen data
            const impactResult = await impactResponse.json();

            if (impactResult.success && impactResult.data) {
              debugLog("ValuationImpact", "Valuation impact calculated successfully");

              // Poimi tarvittavat tiedot impactResult.data-objektista
              originalValuationSnapshot = impactResult.data.originalValuation;
              adjustedValuationResult = impactResult.data.adjustedValuation;
              adjustmentFactors = impactResult.data.adjustmentFactors;

              debugLog("ValuationImpact", "Retrieved data objects", {
                hasOriginal: !!originalValuationSnapshot,
                hasAdjusted: !!adjustedValuationResult,
                hasFactors: !!adjustmentFactors
              });
            } else {
              debugLog("Warning", "Valuation impact calculation returned invalid result", impactResult);
            }
          }
        } catch (impactError) {
          debugLog("Warning", "Error calling valuation impact endpoint", impactError);
        }
      }

      // --- 7. Päivitä analyysin tila ja tulokset ---
      if (valuationId) {
        debugLog("Update", "Updating valuation_impact_analysis status to completed");
        try {
          // Tarkista onko keskeneräisiä analyyseja
          const { data: pendingAnalysis } = await supabase
            .from('valuation_impact_analysis')
            .select('id')
            .eq('company_id', companyId)
            .eq('status', 'processing')
            .eq('original_valuation_id', valuationId)  // Correct
            .order('calculation_date', { ascending: false })
            .limit(1);

          if (pendingAnalysis && pendingAnalysis.length > 0) {
            // Päivitä olemassa oleva analyysi
            const { error: updateError } = await supabase
              .from('valuation_impact_analysis')
              .update({
                status: 'completed',
                sales_readiness_analysis: salesReadinessAnalysis,
                dd_risk_analysis: ddRiskAnalysis,
                // Käytä calculate-valuation-impact -funktion palauttamia arvoja
                adjustment_factors: adjustmentFactors,
                original_valuation_snapshot: originalValuationSnapshot,
                adjusted_valuation_result: adjustedValuationResult
              })
              .eq('id', pendingAnalysis[0].id);

            if (updateError) {
              debugLog("Warning", "Failed to update existing analysis", updateError);
            } else {
              debugLog("Update", "Successfully updated valuation_impact_analysis");
            }
          } else {
            // Luo uusi analyysi merkintä
            const { error: insertError } = await supabase
              .from('valuation_impact_analysis')
              .insert({
                company_id: companyId,
                original_valuation_id: valuationId,
                status: 'completed',
                calculation_date: new Date().toISOString(),
                sales_readiness_analysis: salesReadinessAnalysis,
                dd_risk_analysis: ddRiskAnalysis,
                // Käytä calculate-valuation-impact -funktion palauttamia arvoja
                adjustment_factors: adjustmentFactors,
                original_valuation_snapshot: originalValuationSnapshot,
                adjusted_valuation_result: adjustedValuationResult
              });

            if (insertError) {
              debugLog("Warning", "Failed to create new analysis record", insertError);
            } else {
              debugLog("Update", "Successfully created new valuation_impact_analysis");
            }
          }
        } catch (updateError) {
          debugLog("Warning", "Error during analysis status update", updateError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Analysis processed successfully",
          messageId: messageId
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (processingError) {
      debugLog("Error", "Processing failed", processingError);

      // Virheenkäsittely
      if (valuationId) {
        try {
          // Tarkista onko keskeneräisiä analyyseja
          const { data: pendingAnalysis } = await supabase
            .from('valuation_impact_analysis')
            .select('id')
            .eq('company_id', companyId)
            .eq('status', 'processing')
            .eq('original_valuation_id', valuationId)  // Correct
            .order('calculation_date', { ascending: false })
            .limit(1);

          if (pendingAnalysis && pendingAnalysis.length > 0) {
            // Päivitä status virhetilaksi
            await supabase
              .from('valuation_impact_analysis')
              .update({
                status: 'failed',
                error_message: processingError instanceof Error ? processingError.message : "Unknown error"
              })
              .eq('id', pendingAnalysis[0].id);
          }
        } catch (updateError) {
          debugLog("Warning", "Error updating status to failed", updateError);
        }
      }

      // Palauta virhe vastauksessa
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: processingError instanceof Error ? processingError.message : "Unknown error",
          messageId: messageId
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    debugLog("Error", `Queue processor failed: ${message}`, error);
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // FINALLY-LOHKO:
  finally {
    if (messageId) {
      try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        debugLog("Queue", `Archiving message ${messageId} from queue`);

        // Muunna messageId numeroksi (BIGINT)
        const numericMessageId = Number(messageId);

        const { error } = await supabase.rpc('queue_archive', {
          queue_name: 'sales_analysis_queue',
          msg_id: numericMessageId
        });

        if (error) {
          debugLog("Archive", `Failed: ${error.message}`);
        } else {
          debugLog("Archive", "Archived successfully");
        }
      } catch (e) { 
        debugLog("Archive", "Exception", e);
      }
    }
  }
});