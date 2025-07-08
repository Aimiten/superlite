// supabase/functions/list-conversations/index.ts
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
    const { user_id, company_id, task_id, limit = 20, offset = 0 } = await req.json();
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
    // Use provided user_id or default to authenticated user
    const queryUserId = user_id || user.id;
    // Ensure user can only access their own conversations
    if (queryUserId !== user.id) {
      return new Response(JSON.stringify({
        error: "Forbidden",
        message: "You can only access your own conversations"
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Build query for conversations
    let query = supabaseClient.from("ai_conversations").select(`
        id, 
        title, 
        is_saved, 
        created_at, 
        updated_at, 
        last_message_at,
        company_id,
        task_id,
        messages:messages->last
      `).eq("user_id", queryUserId).order("last_message_at", {
      ascending: false
    }).range(offset, offset + limit - 1);
    // Add filters if provided
    if (company_id) {
      query = query.eq("company_id", company_id);
    }
    if (task_id) {
      query = query.eq("task_id", task_id);
    }
    // Execute query
    const { data, error } = await query;
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
    // Format the data to only include the last message content for preview
    const formattedData = data.map((conversation)=>{
      // Extract the last message for preview
      const lastMessage = Array.isArray(conversation.messages) && conversation.messages.length > 0 ? conversation.messages[0] : null;
      return {
        id: conversation.id,
        title: conversation.title,
        is_saved: conversation.is_saved,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message_at: conversation.last_message_at,
        company_id: conversation.company_id,
        task_id: conversation.task_id,
        preview: lastMessage ? {
          role: lastMessage.role,
          content: lastMessage.content?.substring(0, 100) + (lastMessage.content?.length > 100 ? '...' : '')
        } : null
      };
    });
    // Return the conversations
    return new Response(JSON.stringify({
      success: true,
      data: formattedData,
      count: formattedData.length,
      offset,
      limit
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
