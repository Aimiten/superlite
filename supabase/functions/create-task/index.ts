// supabase/functions/create-task/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CreateTaskRequest {
  title: string;
  description?: string;
  category: 'financial' | 'legal' | 'operations' | 'documentation' | 'customers' | 'personnel' | 'strategy';
  type: 'checkbox' | 'multiple_choice' | 'text_input' | 'document_upload' | 'explanation' | 'contact_info';
  priority: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  estimated_time?: string;
  expected_outcome?: string;
  options?: string[];
  company_id: string;
  dependencies?: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse the request
    const requestData: CreateTaskRequest = await req.json();

    // Validate required fields
    if (!requestData.title || !requestData.category || !requestData.type || !requestData.company_id) {
      throw new Error("Missing required fields: title, category, type, or company_id");
    }

    console.log(`Creating new task for company ${requestData.company_id}:`, requestData.title);

    // Prepare data for insertion
    const taskData = {
      title: requestData.title,
      description: requestData.description || null,
      category: requestData.category,
      type: requestData.type,
      priority: requestData.priority || 'medium',
      impact: requestData.impact || null,
      estimated_time: requestData.estimated_time || null,
      expected_outcome: requestData.expected_outcome || null,
      options: requestData.options || null,
      company_id: requestData.company_id,
      completion_status: 'not_started',
      dependencies: requestData.dependencies || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the task
    const { data, error } = await supabase
      .from('company_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    console.log(`Task created successfully with ID: ${data.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Task created successfully",
        task: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error creating task:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});