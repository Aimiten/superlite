import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment configuration");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get confirmation from request body
    const { confirmation } = await req.json();
    
    if (confirmation !== "POISTA KAIKKI TIEDOT") {
      throw new Error("Invalid confirmation text");
    }

    const userId = user.id;
    console.log(`Starting data reset for user: ${userId}`);

    // Start transaction-like deletion in correct order
    const deletionResults = {
      taskResponses: 0,
      taskFiles: 0,
      companyFiles: 0,
      errors: [] as string[]
    };

    // 1. Get all user's companies for cascading operations
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", userId);
    
    const companyIds = companies?.map(c => c.id) || [];

    // 2. Delete task responses and files
    if (companyIds.length > 0) {
      // Get tasks for these companies
      const { data: tasks } = await supabase
        .from("company_tasks")
        .select("id")
        .in("company_id", companyIds);
      
      const taskIds = tasks?.map(t => t.id) || [];
      
      if (taskIds.length > 0) {
        // Get task response files before deletion
        const { data: taskResponses } = await supabase
          .from("task_responses")
          .select("file_path")
          .in("task_id", taskIds)
          .not("file_path", "is", null);

        // Delete files from storage
        if (taskResponses?.length) {
          for (const response of taskResponses) {
            try {
              const { error } = await supabase.storage
                .from("task-files")
                .remove([response.file_path]);
              if (!error) deletionResults.taskFiles++;
            } catch (e) {
              deletionResults.errors.push(`File deletion failed: ${response.file_path}`);
            }
          }
        }

        // Delete task responses
        const { count } = await supabase
          .from("task_responses")
          .delete({ count: 'exact' })
          .in("task_id", taskIds);
        
        deletionResults.taskResponses = count || 0;
      }

      // Delete company documents files
      const { data: companyDocs } = await supabase
        .from("company_documents")
        .select("file_path")
        .in("company_id", companyIds)
        .not("file_path", "is", null);

      if (companyDocs?.length) {
        for (const doc of companyDocs) {
          try {
            const { error } = await supabase.storage
              .from("company-files")
              .remove([doc.file_path]);
            if (!error) deletionResults.companyFiles++;
          } catch (e) {
            deletionResults.errors.push(`File deletion failed: ${doc.file_path}`);
          }
        }
      }
    }

    // 3. Delete all user data in correct order
    // Note: Many of these will cascade delete due to foreign keys
    
    // Sharing related - hae ensin share_id:t
    const { data: userShares } = await supabase
      .from("company_sharing")
      .select("id")
      .eq("shared_by", userId);
    
    const shareIds = userShares?.map(s => s.id) || [];
    
    if (shareIds.length > 0) {
      await supabase.from("share_view_logs").delete().in("share_id", shareIds);
      await supabase.from("share_comments").delete().in("share_id", shareIds);
    }
    
    await supabase.from("company_sharing").delete().eq("shared_by", userId);

    // Valuation related
    if (companyIds.length > 0) {
      await supabase.from("valuation_impact_analysis").delete().in("company_id", companyIds);
      await supabase.from("dcf_scenario_analyses").delete().eq("user_id", userId);
      await supabase.from("valuation_simulations").delete().eq("user_id", userId);
    }
    
    await supabase.from("valuation_document_analysis").delete().eq("user_id", userId);

    // Free tools (no user_id in schema, skip these)
    // await supabase.from("free_valuations").delete()
    // await supabase.from("free_calculator_results").delete()
    // await supabase.from("free_calculator_errors").delete()

    // Company related (will cascade delete many things)
    if (companyIds.length > 0) {
      await supabase.from("company_tasks").delete().in("company_id", companyIds);
      await supabase.from("company_documents").delete().in("company_id", companyIds);
      await supabase.from("company_info").delete().in("company_id", companyIds);
    }

    // Main entities
    await supabase.from("assessments").delete().eq("user_id", userId);
    await supabase.from("valuations").delete().eq("user_id", userId);
    await supabase.from("companies").delete().eq("user_id", userId);

    // User related
    await supabase.from("feedback").delete().eq("user_id", userId);
    // EI poisteta subscriptions tai stripe_customers - käyttäjä säilyttää tilauksensa!

    console.log(`Data reset completed for user: ${userId}`, deletionResults);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Kaikki käyttäjätietosi on poistettu (paitsi keskusteluhistoria)",
        details: {
          taskResponsesDeleted: deletionResults.taskResponses,
          filesDeleted: deletionResults.taskFiles + deletionResults.companyFiles,
          errors: deletionResults.errors
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error resetting user data:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Tietojen nollaus epäonnistui" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});