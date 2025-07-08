// supabase/functions/process-valuation-documents-queue/index.ts
addEventListener('error', (event) => {
  console.error('Uncaught Exception:', event.error);
});

addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Rejection:', event.reason);
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import functions directly from valuation
import { analyzeFinancialData } from "../valuation/financial-analysis.ts";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[process-valuation-queue][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[process-valuation-queue][${area}] Data (Error):`, {
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
          console.log(`[process-valuation-queue][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[process-valuation-queue][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[process-valuation-queue][${area}] Couldn't stringify data:`, String(data));
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

  let messageId: any = null;
  let error: any = null;

  try {
    debugLog("Init", "Queue processor started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    debugLog("Queue", "Popping message from valuation_document_analysis_queue");
    const queueResult = await supabase.rpc("queue_pop", {
      queue_name: "valuation_document_analysis_queue",
      count: 1
    });

    if (queueResult.error) {
      throw new Error(`Failed to pop from queue: ${queueResult.error.message}`);
    }

    const messages = queueResult.data;
    if (!messages || messages.length === 0) {
      debugLog("Queue", "No messages in queue to process");
      return new Response("No messages in queue", { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const queueMessage = messages[0];
    debugLog("Queue", `Processing message ${queueMessage.msg_id}`, queueMessage);
    const requestData = queueMessage.message;

    messageId = queueMessage.msg_id;

    const { companyId, companyName, companyType, analysisId, multiplierMethod, customMultipliers } = requestData;

    if (!companyId || !companyName) {
      throw new Error("Missing company data in message");
    }

    debugLog("Process", `Starting FIRST PHASE valuation analysis for company: ${companyName} (Analysis ID: ${analysisId})`);
    debugLog("Multipliers", `Received from queue: method=${multiplierMethod}, multipliers=`, customMultipliers);

    try {
      // Hae frontend:n prosessoimat tiedot
      debugLog("Data", `Fetching processed file data from analysis record ${analysisId}`);

      const { data: analysisRecord, error: fetchError } = await supabase
        .from('valuation_document_analysis')
        .select('processed_files')
        .eq('id', analysisId)
        .single();

      if (fetchError || !analysisRecord) {
        throw new Error(`Failed to fetch analysis record: ${fetchError?.message}`);
      }

      if (!analysisRecord.processed_files || !Array.isArray(analysisRecord.processed_files)) {
        throw new Error("No processed file data found in analysis record");
      }

      // Rekonstruoi FileData[] frontend:n prosessoimasta datasta
      debugLog("Data", `Building file objects from ${analysisRecord.processed_files.length} processed files`);
      const files = analysisRecord.processed_files.map(fileData => ({
        id: fileData.id,
        name: fileData.name,
        data: fileData.textData || '',
        base64: fileData.base64Data || null,
        mimeType: fileData.mimeType
      }));

      if (files.length === 0) {
        throw new Error("No valid processed files found for analysis");
      }

      debugLog("Data", `Successfully prepared ${files.length} files for Gemini analysis`);

      // RASKAS VAIHE - ENSIMMÄINEN GEMINI-KUTSU
      debugLog("Gemini", "Calling analyzeFinancialData (HEAVY PROCESS)");

      const firstPhaseResult = await analyzeFinancialData(companyName, files, companyType, multiplierMethod, customMultipliers);

      if (firstPhaseResult.error) {
        throw new Error(`First phase analysis error: ${firstPhaseResult.error}`);
      }

      debugLog("Gemini", "First phase analysis completed successfully");

      // Tallenna tulokset
      debugLog("Update", "Updating valuation_document_analysis with first phase results");
      const { error: updateError } = await supabase
        .from('valuation_document_analysis')
        .update({
          status: 'completed',
          questions: firstPhaseResult.questions || [],
          initial_findings: firstPhaseResult.initialFindings || {},
          financial_analysis: firstPhaseResult._rawAnalysisData || {},
          multiplier_method: multiplierMethod,
          custom_multipliers: customMultipliers,
          completed_at: new Date().toISOString(),
          processed_files: null // Poista väliaikainen data
        })
        .eq('id', analysisId);

      if (updateError) {
        debugLog("Warning", "Failed to update analysis record", updateError);
      }

      debugLog("Success", `First phase completed for analysis ${analysisId}. Questions: ${firstPhaseResult.questions?.length || 0}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "First phase valuation analysis processed successfully",
          analysisId: analysisId,
          messageId: messageId,
          questionsCount: firstPhaseResult.questions?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (processingError) {
      error = processingError;
      debugLog("Error", "Processing failed", processingError);

      try {
        await supabase
          .from('valuation_document_analysis')
          .update({
            status: 'failed',
            error_message: processingError instanceof Error ? processingError.message : "Unknown error",
            completed_at: new Date().toISOString()
          })
          .eq('id', analysisId);
      } catch (updateError) {
        error = processingError;
        debugLog("Warning", "Error updating status to failed", updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: processingError instanceof Error ? processingError.message : "Unknown error",
          messageId: messageId,
          analysisId: analysisId
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
  } finally {
    // Archive message ONLY if successful or permanently failed
    if (messageId) {
      try {
        // Arkistoi vain jos ei ole tilapäinen virhe
        const shouldArchive = !error?.message?.includes("palautetaan jonoon");

        if (shouldArchive) {
          const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
          debugLog("Queue", `Archiving message ${messageId} from queue`);

          const { error } = await supabase.rpc('queue_archive', {
            queue_name: 'valuation_document_analysis_queue',
            msg_id: Number(messageId)
          });

          if (error) {
            debugLog("Archive", `Failed: ${error.message}`);
          } else {
            debugLog("Archive", "Archived successfully");
          }
        } else {
          debugLog("Queue", `NOT archiving message ${messageId} - will retry`);
        }
      } catch (e) { 
        debugLog("Archive", "Exception", e);
      }
    }
  }
});