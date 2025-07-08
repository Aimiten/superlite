//TODO: tätä ei ole vielä otettu käyttöön eikä testattu,

// supabase/functions/cleanup-expired-conversations/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // This function is intended to be called by a cron job
  // But we'll handle CORS preflight requests in case it's called manually
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Special auth for scheduled functions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For non-cron invocations, check for a valid service role key
      // This is a simple check and can be improved for production
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (authHeader !== `Bearer ${serviceKey}`) {
        return new Response(JSON.stringify({
          error: "Unauthorized",
          message: "Invalid authorization for scheduled function"
        }), {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    // Create a Supabase client with service role (admin) permissions
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const now = new Date().toISOString();
    // 1. First identify conversations to delete
    const { data: conversationsToDelete, error: queryError } = await supabaseAdmin.from("ai_conversations").select("id").lt("expires_at", now).eq("is_saved", false);
    if (queryError) {
      console.error("Error querying expired conversations:", queryError);
      return new Response(JSON.stringify({
        error: queryError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!conversationsToDelete || conversationsToDelete.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No expired conversations to delete",
        count: 0
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const conversationIds = conversationsToDelete.map((c)=>c.id);
    // 2. Delete files associated with these conversations
    // Get file paths to delete from storage
    const { data: filesToDelete, error: filesQueryError } = await supabaseAdmin.from("ai_conversation_files").select("id, file_path").in("conversation_id", conversationIds);
    if (filesQueryError) {
      console.error("Error querying files for expired conversations:", filesQueryError);
    // Continue anyway, this is not critical
    }
    // Delete the file records from the database
    if (filesToDelete && filesToDelete.length > 0) {
      const { error: filesDeleteError } = await supabaseAdmin.from("ai_conversation_files").delete().in("conversation_id", conversationIds);
      if (filesDeleteError) {
        console.error("Error deleting file records:", filesDeleteError);
      // Continue anyway, not critical
      }
      // Delete files from storage
      const filePathsToDelete = filesToDelete.filter((f)=>f.file_path).map((f)=>f.file_path);
      if (filePathsToDelete.length > 0) {
        const { error: storageDeleteError } = await supabaseAdmin.storage.from("conversation_files").remove(filePathsToDelete);
        if (storageDeleteError) {
          console.error("Error deleting files from storage:", storageDeleteError);
        // Continue anyway, not critical
        }
      }
    }
    // 3. Finally delete the conversations
    const { error: conversationsDeleteError } = await supabaseAdmin.from("ai_conversations").delete().in("id", conversationIds);
    if (conversationsDeleteError) {
      console.error("Error deleting expired conversations:", conversationsDeleteError);
      return new Response(JSON.stringify({
        error: conversationsDeleteError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Return success
    return new Response(JSON.stringify({
      success: true,
      message: "Expired conversations deleted successfully",
      count: conversationIds.length,
      filesDeleted: filesToDelete?.length ?? 0
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in cleanup function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
