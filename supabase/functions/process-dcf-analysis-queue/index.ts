// supabase/functions/process-dcf-analysis-queue/index.ts
// Add global error handlers to catch unhandled exceptions
addEventListener('error', (event) => {
  console.error('[DCF-Queue] Uncaught Exception:', event.error);
});

addEventListener('unhandledrejection', (event) => {
  console.error('[DCF-Queue] Unhandled Rejection:', event.reason);
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runDCFAnalysis } from "../dcf-scenario-analysis/dcf-analysis-service.ts";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[dcf-queue][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[dcf-queue][${area}] Data (Error):`, {
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
          console.log(`[dcf-queue][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[dcf-queue][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[dcf-queue][${area}] Couldn't stringify data:`, String(data));
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
  let messageId: number | null = null;

  try {
    debugLog("Init", "DCF queue processor started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Luo tavallinen Supabase-client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    debugLog("Queue", "Popping message from dcf_analysis_queue");
    // Käytä queue_pop-funktiota jonosta lukemiseen
    const queueResult = await supabase.rpc("queue_pop", {
      queue_name: "dcf_analysis_queue",
      count: 1
    });

    if (queueResult.error) {
      throw new Error(`Failed to pop from queue: ${queueResult.error.message}`);
    }

    // Tarkista onko viestejä
    const messages = queueResult.data;
    if (!messages || messages.length === 0) {
      debugLog("Queue", "No messages in DCF queue to process");
      return new Response("No messages in queue", { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Käsittele ensimmäinen viesti
    const queueMessage = messages[0];
    debugLog("Queue", `Processing DCF message ${queueMessage.msg_id}`);
    const requestData = queueMessage.message;

    // TALLENNA VIESTI-ID TÄSTÄ ERILLISEEN MUUTTUJAAN
    messageId = queueMessage.msg_id;

    const { valuationId, companyId, userId } = requestData;

    if (!valuationId || !companyId || !userId) {
      throw new Error("Missing valuationId, companyId or userId in message");
    }

    debugLog("Process", `Starting DCF analysis for company: ${companyId}, valuation: ${valuationId}`);
    
    // Retry phase1_completed records (older than 5 minutes but less than 24 hours)
    try {
      const retryThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes
      const cleanupThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      // First check if there are phase1_completed records to retry
      const { data: retryRecords } = await supabase
        .from('dcf_scenario_analyses')
        .select('id, execution_metadata')
        .eq('status', 'phase1_completed')
        .lt('updated_at', retryThreshold)
        .gt('created_at', cleanupThreshold)
        .limit(5); // Process max 5 retries at once
      
      if (retryRecords && retryRecords.length > 0) {
        for (const record of retryRecords) {
          const retryCount = record.execution_metadata?.phase2_retry_count || 0;
          if (retryCount < 3) { // Max 3 retries
            debugLog("Retry", `Will retry phase1_completed record ${record.id} (attempt ${retryCount + 1}/3)`);
          }
        }
      }
      
      // Cleanup very old phase1_completed records (older than 24 hours)
      const { data: oldRecords, error: cleanupError } = await supabase
        .from('dcf_scenario_analyses')
        .delete()
        .eq('status', 'phase1_completed')
        .lt('created_at', cleanupThreshold)
        .select('id');
      
      if (cleanupError) {
        debugLog("Warning", "Failed to cleanup old phase1_completed records", cleanupError);
      } else if (oldRecords && oldRecords.length > 0) {
        debugLog("Cleanup", `Removed ${oldRecords.length} old phase1_completed records`);
      }
    } catch (cleanupError) {
      debugLog("Warning", "Cleanup/retry check failed but continuing", cleanupError);
    }

    // TÄRKEÄ: Tarkista onko jo olemassa completed tai phase1_completed DCF analyysi
    const { data: existingDCF } = await supabase
      .from('dcf_scenario_analyses')
      .select('id, status, raw_analysis')
      .eq('company_id', companyId)
      .eq('valuation_id', valuationId)
      .in('status', ['completed', 'phase1_completed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingDCF?.length > 0) {
      const existing = existingDCF[0];
      
      if (existing.status === 'completed') {
        debugLog("Info", `DCF analyysi on jo valmis (ID: ${existing.id}), ohitetaan käsittely`);

      // Poista mahdolliset jumissa olevat 'processing' rivit
      const { error: cleanupError } = await supabase
        .from('dcf_scenario_analyses')
        .delete()
        .eq('company_id', companyId)
        .eq('valuation_id', valuationId)
        .eq('status', 'processing');

      if (cleanupError) {
        debugLog("Warning", "Failed to cleanup processing DCF records", cleanupError);
      }

      // Arkistoi viesti
      await supabase.rpc("queue_archive", {
        queue_name: "dcf_analysis_queue", 
        msg_id: Number(messageId)
      });

        return new Response(
          JSON.stringify({ success: true, message: "DCF already processed, skipped" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (existing.status === 'phase1_completed' && existing.raw_analysis) {
        debugLog("Info", `DCF Phase 1 valmis (ID: ${existing.id}), jatketaan Phase 2:sta`);
        
        try {
          // Import Phase 2 executor
          const { runPhase2Only } = await import("../dcf-scenario-analysis/variants/phase2-executor.ts");
          
          // Validate required Phase 1 data exists
          if (!existing.variant_selected || !existing.variant_reasoning || !existing.variant_confidence) {
            throw new Error("Missing variant data from Phase 1 - cannot continue to Phase 2");
          }
          
          if (!existing.market_data_used) {
            throw new Error("Missing market data from Phase 1 - cannot continue to Phase 2");
          }
          
          // Validate marketBasedWACC exists
          let marketBasedWACC = existing.market_data_used.marketBasedWACC;
          if (typeof marketBasedWACC !== 'number' || marketBasedWACC <= 0 || marketBasedWACC > 0.30) {
            debugLog("Warning", `Invalid marketBasedWACC: ${marketBasedWACC}, using default 0.08`);
            marketBasedWACC = 0.08;
          }
          
          // Reconstruct necessary data from saved state with proper types
          const variant = {
            variant: String(existing.variant_selected || 'simplified_dcf'),
            reasoning: String(existing.variant_reasoning || 'Phase 2 continuation'),
            confidence_score: Number(existing.variant_confidence) || 5,
            data_quality_assessment: String(existing.market_data_used?.dataQuality) || "Unknown",
            recommended_approach: "Continue from Phase 1"
          };
          
          // Get company data
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();
            
          if (!company) {
            throw new Error(`Company not found: ${companyId}`);
          }
          
          // Run Phase 2 only with retry logic
          debugLog("Phase2", "Running Phase 2 with saved Phase 1 data");
          debugLog("Phase2", "MarketBasedWACC from Phase 1:", marketBasedWACC || 0.08);
          
          const companyData = {
            name: company.name,
            industry: company.industry || company.business_description,
            description: company.business_description || ''
          };
          
          // Retry logic for Phase 2
          let structuredData;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              structuredData = await runPhase2Only(
                variant,
                existing.raw_analysis,
                companyData,
                existing.market_data_used,
                marketBasedWACC || 0.08
              );
              break; // Success, exit retry loop
            } catch (phase2Error) {
              retryCount++;
              debugLog("Phase2", `Attempt ${retryCount}/${maxRetries} failed:`, phase2Error.message);
              
              if (retryCount < maxRetries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
                debugLog("Phase2", `Retrying after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                // Max retries reached, throw error
                throw phase2Error;
              }
            }
          }
          
          // Validate results
          const { DCFValidator, formatValidationResults } = await import("../_shared/dcf-validator.ts");
          const allErrors: string[] = [];
          const allWarnings: string[] = [];
          
          const scenarios = ['pessimistic', 'base', 'optimistic'] as const;
          for (const scenarioName of scenarios) {
            const scenario = structuredData.scenario_projections[scenarioName];
            const scenarioValidation = DCFValidator.validateScenario(scenario);
            
            if (!scenarioValidation.isValid) {
              allErrors.push(...scenarioValidation.errors.map(e => `${scenarioName}: ${e}`));
            }
            allWarnings.push(...scenarioValidation.warnings.map(w => `${scenarioName}: ${w}`));
          }
          
          const validationResults = {
            isValid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings
          };
          
          // Update with Phase 2 results
          const { error: updateError } = await supabase
            .from('dcf_scenario_analyses')
            .update({
              status: 'completed',
              structured_data: structuredData,
              validation_results: validationResults,
              execution_metadata: {
                ...existing.execution_metadata,
                phase2_completed_at: new Date().toISOString(),
                phase2_model_used: structuredData.modelUsed,
                phase1_skipped: true
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
            
          if (updateError) {
            throw updateError;
          }
          
          // Archive message
          await supabase.rpc("queue_archive", {
            queue_name: "dcf_analysis_queue", 
            msg_id: Number(messageId)
          });
          
          debugLog("Success", `Phase 2 completed from saved Phase 1 data`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              analysis_id: existing.id,
              message: "DCF Phase 2 completed from saved Phase 1" 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
          
        } catch (phase2Error) {
          debugLog("Error", "Phase 2 continuation failed", phase2Error);
          
          // Update retry count
          const currentRetryCount = existing.execution_metadata?.phase2_retry_count || 0;
          await supabase
            .from('dcf_scenario_analyses')
            .update({
              execution_metadata: {
                ...existing.execution_metadata,
                phase2_retry_count: currentRetryCount + 1,
                last_phase2_error: phase2Error?.message || 'Unknown error',
                last_retry_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          // Don't archive message - let it retry later
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Phase 2 failed, will retry later",
              retryCount: currentRetryCount + 1
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    try {
      // Call DCF analysis directly (no HTTP call)
      debugLog("DCF", "Running DCF analysis directly");
      
      const dcfResult = await runDCFAnalysis(
        { valuationId, companyId, userId },
        supabase
      );
      
      debugLog("DCF", "DCF analysis completed successfully", {
        hasAnalysisId: !!dcfResult.analysis_id,
        hasStructuredData: !!dcfResult.valuation_summary
      });

      // Archive message only after successful processing
      try {
        await supabase.rpc("queue_archive", {
          queue_name: "dcf_analysis_queue", 
          msg_id: Number(messageId)
        });
        debugLog("Success", `Archived DCF message ${messageId} after successful processing`);
      } catch (archiveError) {
        debugLog("Warning", "Failed to archive message after processing", archiveError);
        // Continue anyway - processing was successful
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "DCF analysis processed successfully",
          messageId: messageId,
          analysisId: dcfResult.analysis_id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (processingError) {
      debugLog("Error", "DCF processing failed - DETAILED ERROR INFO:");
      debugLog("Error", "Error type:", processingError?.constructor?.name || typeof processingError);
      debugLog("Error", "Error message:", processingError?.message || String(processingError));
      debugLog("Error", "Full error object:", processingError);
      
      if (processingError?.stack) {
        debugLog("Error", "Stack trace:");
        console.error(processingError.stack);
      }
      
      // Check if it's a specific error type
      if (processingError?.cause) {
        debugLog("Error", "Error cause:", processingError.cause);
      }

      // Virheenkäsittely - merkitse DCF analyysi epäonnistuneeksi
      try {
        // Tarkista onko keskeneräisiä DCF analyyseja
        const { data: pendingDCF } = await supabase
          .from('dcf_scenario_analyses')
          .select('id')
          .eq('company_id', companyId)
          .eq('valuation_id', valuationId)
          .eq('status', 'processing')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingDCF && pendingDCF.length > 0) {
          // Päivitä status virhetilaksi
          const errorMessage = processingError instanceof Error 
            ? processingError.message 
            : String(processingError);
            
          await supabase
            .from('dcf_scenario_analyses')
            .update({
              status: 'failed',
              error_message: errorMessage,
              error_details: {
                type: processingError?.constructor?.name || typeof processingError,
                stack: processingError?.stack,
                cause: processingError?.cause,
                timestamp: new Date().toISOString()
              }
            })
            .eq('id', pendingDCF[0].id);
            
          debugLog("Info", `Updated DCF analysis ${pendingDCF[0].id} status to failed`);
        }
      } catch (updateError) {
        debugLog("Warning", "Error updating DCF status to failed", updateError);
      }

      // Palauta virhe vastauksessa
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: processingError instanceof Error ? processingError.message : String(processingError),
          errorType: processingError?.constructor?.name || typeof processingError,
          messageId: messageId
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    debugLog("Error", `DCF queue processor failed: ${message}`, error);
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // No finally block - messages are archived only on success
  // This prevents data loss on errors
});