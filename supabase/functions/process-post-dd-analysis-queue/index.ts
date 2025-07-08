// supabase/functions/process-post-dd-queue/index.ts
// Lisää global error handlers
addEventListener('error', (event) => {
  console.error('Uncaught Exception:', event.error);
});

addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Rejection:', event.reason);
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import helper functions
// Importtaa suoraan samoista tiedostoista joita sales-analyze käyttää
import { callAIModel } from "../analyze-sales-readiness/utils/ai-client-manager.ts";
import { validateResponse } from "../analyze-sales-readiness/utils/response-utils.ts";
import { createPostDDAnalysisPrompt } from "../analyze-post-dd-readiness/prompts/post-dd-analysis-prompt.ts";
import { fetchPreviousAnalysis, fetchLatestAnalysis, fetchCompanyData, fetchDDTasks, fetchDocuments } from "../analyze-post-dd-readiness/utils/data-service.ts";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[process-post-dd-queue][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[process-post-dd-queue][${area}] Data (Error):`, {
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
          console.log(`[process-post-dd-queue][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[process-post-dd-queue][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[process-post-dd-queue][${area}] Couldn't stringify data:`, String(data));
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

  // Save message ID to this variable
  let messageId: any = null;

  try {
    debugLog("Init", "Queue processor started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Create regular Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    debugLog("Queue", "Popping message from post_dd_analysis_queue");
    // Use queue_pop function to read from queue
    const queueResult = await supabase.rpc("queue_pop", {
      queue_name: "post_dd_analysis_queue",
      count: 1
    });

    if (queueResult.error) {
      throw new Error(`Failed to pop from queue: ${queueResult.error.message}`);
    }

    // Check if there are any messages
    const messages = queueResult.data;
    if (!messages || messages.length === 0) {
      debugLog("Queue", "No messages in queue to process");
      return new Response("No messages in queue", { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Process the first message
    const queueMessage = messages[0];
    debugLog("Queue", `Processing message ${queueMessage.msg_id}`, queueMessage);
    const requestData = queueMessage.message;

    // SAVE MESSAGE ID TO SEPARATE VARIABLE
    messageId = queueMessage.msg_id;

    const { companyId, valuationId, previousAnalysisId } = requestData;

    if (!companyId) {
      throw new Error("Missing company ID in message");
    }

    debugLog("Process", `Starting post-DD analysis for company: ${companyId}`);

    // Lisää tämä tarkistus ennen analyysin käsittelyn aloittamista
    const { data: existingAnalysis } = await supabase
      .from('valuation_impact_analysis')
      .select('id')
      .eq('company_id', companyId)
      .eq('analysis_phase', 'post_due_diligence')
      .in('status', ['completed', 'post_dd_completed']) 
      .eq('previous_analysis_id', previousAnalysisId)
      .limit(1);

    if (existingAnalysis?.length > 0) {
      debugLog("Info", `Analyysi on jo olemassa (ID: ${existingAnalysis[0].id}), ohitetaan käsittely`);
      // Arkistoi silti viesti
      await supabase.rpc("queue_archive", {
        queue_name: "post_dd_analysis_queue", 
        msg_id: messageId.toString()
      });
      return new Response(
        JSON.stringify({ success: true, message: "Already processed, skipped" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // --- 1. Fetch data ---
      const { companyData, error: companyError } = await fetchCompanyData(supabase, companyId);
      if (companyError) {
        throw new Error(`Failed to fetch company data: ${companyError}`);
      }

      const { ddTasks, ddTasksCompletionRate, error: tasksError } = await fetchDDTasks(supabase, companyId);
      if (tasksError) {
        throw new Error(`Failed to fetch DD tasks: ${tasksError}`);
      }

      const { documents, error: documentsError } = await fetchDocuments(supabase, companyId);
      if (documentsError) {
        debugLog("Warning", `Issue fetching documents: ${documentsError}`);
        // Continue despite document errors
      }

      // --- 2. Check completion rate ---
      const threshold = 0.75;
      if (ddTasksCompletionRate < threshold) {
        throw new Error(`At least ${(threshold * 100).toFixed(0)}% of DD tasks must be completed before analysis (now ${(ddTasksCompletionRate * 100).toFixed(1)}%).`);
      }

      // --- 3. Fetch original analysis ---
      let previousAnalysis = null;
      if (previousAnalysisId) {
        const { previousAnalysis: fetched, error: analysisError } = await fetchPreviousAnalysis(supabase, previousAnalysisId);
        if (analysisError) {
          debugLog("Warning", `Issue fetching previous analysis: ${analysisError}`);
        } else {
          previousAnalysis = fetched;
        }
      }

      if (!previousAnalysis) {
        // Try to fetch latest analysis as fallback
        const { latestAnalysis, error: latestError } = await fetchLatestAnalysis(supabase, companyId);
        if (!latestError && latestAnalysis) {
          previousAnalysis = latestAnalysis;
        }
      }

      if (!previousAnalysis || !previousAnalysis.sales_readiness_analysis) {
        throw new Error("No original sales readiness analysis found to compare against");
      }

      if (!previousAnalysis.dd_risk_analysis) {
        debugLog("Warning", "No original DD risk analysis found, will only analyze sales readiness");
      }

      // --- 4. Create prompt and call Gemini ---
      const postDDPrompt = createPostDDAnalysisPrompt({
        originalSalesReadinessAnalysis: previousAnalysis.sales_readiness_analysis,
        ddRiskAnalysis: previousAnalysis.dd_risk_analysis || null,
        ddTasks,
        companyData,
        documents,
        previousAnalysis
      });

      debugLog("AI", "Calling AI models for post-DD analysis");
      
      // Kerää DD-task-tiedostot documents-listaan
      const ddTaskDocuments = ddTasks
        .filter(task => task.fileContent)
        .map(task => ({
          ...task.fileContent,
          task_id: task.id,
          task_title: task.title
        }));
      
      debugLog("AI", `Including ${ddTaskDocuments.length} DD task attachments in post-DD analysis`);
      
      // Yhdistä company documents ja DD task documents
      const allDocumentsWithDDTasks = [...(documents || []), ...ddTaskDocuments];
      
      const postDDResult = await callAIModel(postDDPrompt, allDocumentsWithDDTasks);

      if (!postDDResult.response) {
        throw new Error("AI models did not return a response for post-DD analysis");
      }

      // Parse the response
      let postDDAnalysis;
      if (postDDResult.response.structuredJson) {
        debugLog("Parse", "Using structured JSON for post-DD analysis");
        postDDAnalysis = postDDResult.response.structuredJson;
        if (!postDDAnalysis.analyysiPvm) {
          postDDAnalysis.analyysiPvm = new Date().toISOString();
        }
      } else {
        const postDDText = postDDResult.response.text();
        debugLog("Parse", "Parsing JSON from text for post-DD analysis");
        try {
          postDDAnalysis = validateResponse(postDDText, 'post-dd-analysis');
        } catch (parseError) {
          debugLog("Error", "Failed to parse post-DD analysis JSON", parseError);
          throw new Error(`Failed to parse post-DD analysis: ${parseError.message}`);
        }
      }

      // --- 5. Kutsu calculate-valuation-impact talousvaikutusten laskemiseksi ---
      debugLog("ValuationImpact", "Calling calculate-valuation-impact for post-DD analysis");
      let originalValuationSnapshot = null;
      let adjustedValuationResult = null;

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
              valuationId: valuationId || previousAnalysis.original_valuation_id,
              salesReadinessAnalysis: postDDAnalysis,
              ddRiskAnalysis: previousAnalysis.dd_risk_analysis || null
            }),
          }
        );

        if (impactResponse.ok) {
          const impactResult = await impactResponse.json();
          if (impactResult.success && impactResult.data) {
            debugLog("ValuationImpact", "Valuation impact calculated successfully");
            originalValuationSnapshot = impactResult.data.originalValuation;
            adjustedValuationResult = impactResult.data.adjustedValuation;
          } else {
            debugLog("Warning", "Valuation impact calculation returned error", impactResult);
          }
        } else {
          const errorText = await impactResponse.text();
          debugLog("Warning", `Error calculating valuation impact: ${impactResponse.status}`, errorText);
        }
      } catch (impactError) {
        debugLog("Warning", "Error calling valuation impact endpoint", impactError);
        // Vaikka laskenta epäonnistuu, jatkamme silti - käytämme vain null-arvoja
      }

      // --- 6. Update valuation impact analysis record ---
      debugLog("Update", "Updating valuation_impact_analysis with post-DD results");
      
      // Validate that we have risk mitigation data
      if (postDDAnalysis.riskienLieventaminen) {
        debugLog("Update", `Found riskienLieventaminen data with ${postDDAnalysis.riskienLieventaminen.riskikategoriat?.length || 0} risk categories`);
      } else {
        debugLog("Warning", "No riskienLieventaminen data found in postDDAnalysis - this will be saved as null");
      }
      try {
        // Check for existing processing records
        const { data: pendingAnalysis } = await supabase
          .from('valuation_impact_analysis')
          .select('id')
          .eq('company_id', companyId)
          .eq('status', 'processing')
          .eq('analysis_phase', 'post_due_diligence')
          .order('calculation_date', { ascending: false })
          .limit(1);

        if (pendingAnalysis && pendingAnalysis.length > 0) {
          // Päivitä olemassa oleva rivi - käytä 'post_dd_completed' statusta
          const { error: updateError } = await supabase
            .from('valuation_impact_analysis')
            .update({
              status: 'post_dd_completed',  // Uusi status, joka ei aktivoi completed-rajoitetta
              post_dd_sales_readiness_analysis: postDDAnalysis,
              post_dd_risk_analysis: postDDAnalysis.riskienLieventaminen,  // UUSI: Tallenna riskien päivitys omaan kenttään
              adjustment_factors: postDDAnalysis.kategoriapainotus,
              completed_at: new Date().toISOString(),
              // Tallennetaan silti lasketut arvot, jotta ne ovat saatavilla UI:ssa
              original_valuation_snapshot: originalValuationSnapshot,
              adjusted_valuation_result: adjustedValuationResult,
              sales_readiness_analysis: previousAnalysis.sales_readiness_analysis,
              dd_risk_analysis: previousAnalysis.dd_risk_analysis  // Säilytetään alkuperäinen
            })
            .eq('id', pendingAnalysis[0].id);

          if (updateError) {
            debugLog("Warning", "Failed to update existing analysis", updateError);
          }
        } else {
          // Luo uusi rivi - käytä 'post_dd_completed' statusta
          const { error: insertError } = await supabase
            .from('valuation_impact_analysis')
            .insert({
              company_id: companyId,
              original_valuation_id: valuationId || previousAnalysis.original_valuation_id,
              previous_analysis_id: previousAnalysisId,
              status: 'post_dd_completed',  // Uusi status, joka ei aktivoi completed-rajoitetta
              analysis_phase: 'post_due_diligence',
              calculation_date: new Date().toISOString(),
              post_dd_sales_readiness_analysis: postDDAnalysis,
              post_dd_risk_analysis: postDDAnalysis.riskienLieventaminen,  // UUSI: Tallenna riskien päivitys omaan kenttään
              adjustment_factors: postDDAnalysis.kategoriapainotus,
              completed_at: new Date().toISOString(),
              // Tallennetaan silti lasketut arvot, jotta ne ovat saatavilla UI:ssa
              original_valuation_snapshot: originalValuationSnapshot,
              adjusted_valuation_result: adjustedValuationResult,
              sales_readiness_analysis: previousAnalysis.sales_readiness_analysis,
              dd_risk_analysis: previousAnalysis.dd_risk_analysis  // Säilytetään alkuperäinen
            });

          if (insertError) {
            debugLog("Warning", "Failed to create new analysis record", insertError);
          }
        }
      } catch (updateError) {
        debugLog("Warning", "Error during analysis status update", updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Post-DD analysis processed successfully",
          messageId: messageId
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (processingError) {
      debugLog("Error", "Processing failed", processingError);

      // Error handling
      try {
        // Check for existing processing records
        const { data: pendingAnalysis } = await supabase
          .from('valuation_impact_analysis')
          .select('id')
          .eq('company_id', companyId)
          .eq('status', 'processing')
          .eq('analysis_phase', 'post_due_diligence')
          .order('calculation_date', { ascending: false })
          .limit(1);

        if (pendingAnalysis && pendingAnalysis.length > 0) {
          // Update status to failed
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

      // Return error in response
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
    finally {
      if (messageId) {
        try {
          const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
          debugLog("Queue", `Archiving message ${messageId} from queue`);

          // Muunna messageId numeroksi (BIGINT)
          const numericMessageId = Number(messageId);

          const { error } = await supabase.rpc('queue_archive', {
            queue_name: 'post_dd_analysis_queue',
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