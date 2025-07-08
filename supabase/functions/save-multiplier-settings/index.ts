import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { method, customMultipliers } = await req.json();

    // Validate input
    if (method !== 'manual' || !customMultipliers) {
      return new Response(
        JSON.stringify({ error: "Invalid multiplier settings" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Save to user_multiplier_settings table
    const { error: saveError } = await supabase
      .from('user_multiplier_settings')
      .upsert({
        user_id: user.id,
        method: method,
        custom_multipliers: customMultipliers,
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      console.error("Failed to save multiplier settings:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save settings" }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Saved multiplier settings for user ${user.id}:`, customMultipliers);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error in save-multiplier-settings:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});