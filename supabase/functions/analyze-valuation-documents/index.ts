// supabase/functions/analyze-valuation-documents/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function debugLog(area: string, message: string, data?: any) {
  console.log(`[analyze-valuation-documents][${area}] ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object' && data !== null) {
        if (data instanceof Error) {
          console.log(`[analyze-valuation-documents][${area}] Data (Error):`, {
            message: data.message,
            name: data.name,
            stack: data.stack
          });
        } else {
          const safeData = JSON.parse(JSON.stringify(data, (key, value) => {
            if (key === 'api_key' || key === 'key' || key === 'password' || key === 'token') {
              return '[REDACTED]';
            }
            return value;
          }));
          console.log(`[analyze-valuation-documents][${area}] Data:`, safeData);
        }
      } else {
        console.log(`[analyze-valuation-documents][${area}] Data:`, data);
      }
    } catch (err) {
      console.log(`[analyze-valuation-documents][${area}] Couldn't stringify data:`, String(data));
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
    console.log("Handling OPTIONS preflight request for analyze-valuation-documents function");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    debugLog("Init", "Function started, checking environment variables");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      debugLog("Error", "Missing environment variables");
      throw new Error("Missing environment variables (Supabase)");
    }

    debugLog("Request", "Parsing request body");
    const requestData = await req.json();
    const { companyId, companyName, companyType, files, userId, multiplierMethod, customMultipliers } = requestData;

    debugLog("Request", `Received request for company: ${companyName} (ID: ${companyId})`);
    debugLog("Multipliers", `Received multipliers: method=${multiplierMethod}, multipliers=`, customMultipliers);

    if (!companyId || !companyName || !files || !userId) {
      debugLog("Error", "Missing required fields in request");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Pakolliset kentät puuttuvat (companyId, companyName, files, userId)" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    debugLog("Process", `Function started for company: ${companyName}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Erottele uudet ja vanhat tiedostot
    const newUploads = files.filter(f => f.object !== null);
    const existingDocs = files.filter(f => f.object === null && f.id && f.id.match(/^[0-9a-f-]{36}$/));

    debugLog("Files", `Processing: ${newUploads.length} new uploads + ${existingDocs.length} existing docs`);

    // Tallenna VAIN uudet tiedostot storage:een
    const documentIds = [];

    for (const file of newUploads) {
      const filePath = `${userId}/${companyId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, file.object, { upsert: true });

      if (uploadError) {
        debugLog("Warning", `Failed to upload file ${file.name}`, uploadError);
        continue;
      }

      const { data: docRecord, error: docError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId,
          user_id: userId,
          name: file.name,
          file_path: filePath,
          file_type: file.mimeType
        })
        .select()
        .single();

      if (!docError && docRecord) {
        documentIds.push(docRecord.id);
      }
    }

    // Lisää vanhojen dokumenttien ID:t
    for (const file of existingDocs) {
      documentIds.push(file.id);
    }

    debugLog("Files", `Total documents to process: ${documentIds.length}`);

    // Puhdista prosessoidut tiedot (poista null-merkit)
    const cleanFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      textData: file.data ? file.data.replace(/\0/g, '') : '',
      base64Data: file.base64 ? (
    file.base64.includes(',') 
      ? file.base64.split(',')[1]
      : file.base64
  ) : null,
      hasData: !!(file.data && file.data.length > 0),
      hasBase64: !!(file.base64 && file.base64.length > 0)
    }));

    // Luo tracking record
    debugLog("DB", `Creating tracking record in valuation_document_analysis for company: ${companyName}`);
    const { data: analysisRecord, error: insertError } = await supabase
      .from('valuation_document_analysis')
      .insert({
        user_id: userId,
        company_id: companyId,
        company_name: companyName,
        company_type: companyType,
        files_metadata: cleanFiles.map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          hasData: f.hasData,
          hasBase64: f.hasBase64
        })),
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      debugLog("Error", "Failed to create tracking record", insertError);
      throw new Error(`Tracking-tietueen luonti epäonnistui: ${insertError.message}`);
    }

    debugLog("DB", `Created tracking record with ID: ${analysisRecord.id}`);

    // Tallenna puhdistetut prosessoidut tiedot
    debugLog("DB", `Storing processed file data for analysis ${analysisRecord.id}`);
    const { error: updateError } = await supabase
      .from('valuation_document_analysis')
      .update({
        processed_files: cleanFiles
      })
      .eq('id', analysisRecord.id);

    if (updateError) {
      debugLog("Warning", "Failed to store processed file data", updateError);
    }

    // Lähetä queue:een VAIN metadata
    debugLog("Queue", `Adding request to valuation_document_analysis_queue for company: ${companyName}`);
    const { data: queueData, error: queueError } = await supabase.rpc("queue_send", {
      queue_name: "valuation_document_analysis_queue",
      message: {
        companyId,
        companyName,
        companyType,
        userId,
        analysisId: analysisRecord.id,
        multiplierMethod,
        customMultipliers
        // EI file-dataa!
      }
    });

    if (queueError) {
      debugLog("Error", "Failed to add message to queue", queueError);

      await supabase
        .from('valuation_document_analysis')
        .update({ 
          status: 'failed', 
          error_message: queueError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisRecord.id);

      throw new Error(`Jonoon lisääminen epäonnistui: ${queueError.message}`);
    }

    debugLog("Queue", `Analysis request successfully queued for company: ${companyName}, queue message ID: ${queueData}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Valuation analysis queued for processing",
        analysisId: analysisRecord.id,
        queueMessageId: queueData,
        status: "processing"
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tuntematon virhe";
    debugLog("Error", `Function failed: ${message}`, error);
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});