// supabase/functions/save-conversation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Get request body
    const { conversation_id, title, messages, is_saved = false, company_id, task_id, file_data = [] } = await req.json();
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")
        }
      }
    });
    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: "Unauthorized",
        message: "User is not authenticated"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Add timestamps to messages if not already present
    const messagesWithTimestamps = messages.map((message)=>{
      if (!message.timestamp) {
        return {
          ...message,
          timestamp: new Date().toISOString()
        };
      }
      return message;
    });
    const now = new Date().toISOString();
    // Set conversation expiration (30 days from now by default)
    // Only non-saved conversations will expire
    const expires_at = is_saved ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let conversation;
    if (conversation_id) {
      // Update existing conversation
      const { data: existingConversation, error: fetchError } = await supabaseClient.from("ai_conversations").select("user_id").eq("id", conversation_id).single();
      if (fetchError) {
        return new Response(JSON.stringify({
          error: "Not found",
          message: "Conversation not found"
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Ensure user can only update their own conversations
      if (existingConversation.user_id !== user.id) {
        return new Response(JSON.stringify({
          error: "Forbidden",
          message: "You can only update your own conversations"
        }), {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Update the conversation
      const { data, error } = await supabaseClient.from("ai_conversations").update({
        title,
        messages: messagesWithTimestamps,
        is_saved,
        updated_at: now,
        last_message_at: now,
        expires_at: expires_at
      }).eq("id", conversation_id).select().single();
      if (error) {
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
      conversation = data;
    } else {
      // Create new conversation
      const { data, error } = await supabaseClient.from("ai_conversations").insert({
        user_id: user.id,
        company_id,
        task_id,
        title,
        messages: messagesWithTimestamps,
        is_saved,
        created_at: now,
        updated_at: now,
        last_message_at: now,
        expires_at: expires_at
      }).select().single();
      if (error) {
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
      conversation = data;
    }
    // Handle file attachments if any
    if (file_data.length > 0 && conversation) {
      const fileInserts = file_data.map((file)=>({
          conversation_id: conversation.id,
          file_name: file.file_name,
          file_path: file.file_path,
          file_type: file.file_type,
          file_size: file.file_size
        }));
      const { error: fileError } = await supabaseClient.from("ai_conversation_files").insert(fileInserts);
      if (fileError) {
        console.error("Error saving file attachments:", fileError);
      // We don't want to fail the entire operation if just file storage fails
      }
    }
    // Return the conversation data
    return new Response(JSON.stringify({
      success: true,
      data: conversation
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
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
