// supabase/functions/get-conversation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  conversation_id: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { conversation_id } = await req.json() as RequestBody;

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: "Missing parameter", message: "conversation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User is not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the conversation
    const { data: conversation, error: conversationError } = await supabaseClient
      .from("ai_conversations")
      .select("*")
      .eq("id", conversation_id)
      .eq("user_id", user.id)  // Ensure user can only access their own conversations
      .single();

    if (conversationError) {
      if (conversationError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Not found", message: "Conversation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: conversationError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get associated files
    const { data: files, error: filesError } = await supabaseClient
      .from("ai_conversation_files")
      .select("*")
      .eq("conversation_id", conversation_id);

    if (filesError) {
      console.error("Error fetching files:", filesError);
      // Continue anyway, files are not critical
    }

    // Return the conversation with files
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...conversation,
          files: files || []
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});