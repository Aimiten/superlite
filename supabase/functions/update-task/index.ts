// supabase/functions/update-task/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface TaskUpdateRequest {
  taskId: string;
  updateData: {
    completion_status?: 'not_started' | 'in_progress' | 'completed';
    value?: {
      // For checkbox response
      checked?: boolean;

      // For text response
      text?: string;

      // For file response
      filePath?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      uploadDate?: string;
      textResponse?: string;

      // For multiple choice response
      options?: string[];

      // For contact info response
      contact?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        title?: string;
        address?: string;
      };

      // Metadata fields
      copiedFromAI?: boolean;
      copiedAt?: string;
      editedInChat?: boolean;
      editedAt?: string;
      generatedByAI?: boolean;
      generatedAt?: string;
    }
  }
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

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse the request
    const requestData: TaskUpdateRequest = await req.json();
    const { taskId, updateData } = requestData;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    console.log(`Processing update for task ${taskId}`);
    console.log("Update data:", JSON.stringify(updateData));

    // First, fetch the existing task to merge data correctly
    const getTaskResponse = await supabase
      .from('company_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (getTaskResponse.error) {
      throw new Error(`Failed to fetch task: ${getTaskResponse.error.message}`);
    }

    const existingTask = getTaskResponse.data;
    if (!existingTask) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Prepare update payload for company_tasks
    const updatePayload: any = {};

    // Handle completion status update if provided
    if (updateData.completion_status !== undefined) {
      updatePayload.completion_status = updateData.completion_status;

      // If task is marked as completed, update completed_at timestamp
      if (updateData.completion_status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
    }

    // Variables for task_responses table
    let responseData = {
      task_id: taskId,
      text_response: null,
      file_name: null,
      file_path: null,
      created_at: new Date().toISOString()
    };

    let fileUploaded = false;
    let hasTextContent = false;

    // Handle value updates
    if (updateData.value) {
      // Merge with existing value or create new value object
      const existingValue = existingTask.value || {};
      let updatedValue = { ...existingValue, ...updateData.value };

      // Process HTML content if present
      if (updatedValue.text && typeof updatedValue.text === 'string') {
        // Check if content is HTML
        if (updatedValue.text.includes('<') && updatedValue.text.includes('>')) {
          // Clean HTML for storage
          const cleanedText = htmlToPlainText(updatedValue.text);

          // Update response data
          responseData.text_response = cleanedText;
          hasTextContent = true;

          // Keep original text in value but add cleaned version
          updatedValue.text = cleanedText;
          updatedValue.cleaned_at = new Date().toISOString();
        } 
        // Check if content is base64 file data
        else if (updatedValue.text.includes('data:') && updatedValue.text.includes('base64,')) {
          try {
            // Extract MIME type and base64 data
            const fileMatch = updatedValue.text.match(/data:([^;]+);base64,([^"]+)/);

            if (fileMatch && fileMatch.length >= 3) {
              const mimeType = fileMatch[1];
              const base64Data = fileMatch[2];
              const fileExt = mimeType.split('/')[1] || 'bin';
              const fileName = `task-${taskId}-${Date.now()}.${fileExt}`;
              const filePath = `${existingTask.company_id}/${taskId}/${fileName}`;

              // Decode base64 to binary
              const binaryData = base64Decode(base64Data);

              // Upload file to Supabase Storage
              const uploadResult = await supabase.storage
                .from('task-files')
                .upload(filePath, binaryData, { contentType: mimeType });

              if (uploadResult.error) {
                throw uploadResult.error;
              }

              // Get public URL for the file
              const fileUrl = supabase.storage
                .from('task-files')
                .getPublicUrl(filePath).data.publicUrl;

              // Update value with file metadata
              updatedValue = {
                ...updatedValue,
                text: `Tiedosto: ${fileName}`,
                filePath: filePath,
                fileName: fileName,
                fileType: mimeType,
                fileUrl: fileUrl,
                uploadDate: new Date().toISOString()
              };

              // Update task_responses data
              responseData.file_name = fileName;
              responseData.file_path = filePath;
              responseData.text_response = `Tiedosto: ${fileName}`; // Optional description

              fileUploaded = true;
            }
          } catch (fileError) {
            console.error("Error processing file:", fileError);
            // Continue with normal text processing if file handling fails
            responseData.text_response = updatedValue.text;
            hasTextContent = true;
          }
        } 
        // Regular text content
        else {
          responseData.text_response = updatedValue.text;
          hasTextContent = true;
        }
      } 
      // Handle other value types (checkbox, multiple_choice, etc.)
      else {
        // For non-text responses, store JSON representation in text_response
        if (updatedValue.checked !== undefined) {
          responseData.text_response = updatedValue.checked ? "Kyllä" : "Ei";
          hasTextContent = true;
        } else if (updatedValue.options && Array.isArray(updatedValue.options)) {
          responseData.text_response = updatedValue.options.join(", ");
          hasTextContent = true;
        } else if (updatedValue.contact) {
          responseData.text_response = JSON.stringify(updatedValue.contact);
          hasTextContent = true;
        }
      }

      updatePayload.value = updatedValue;
    }

    // 1. Update the task in company_tasks table
    const updateTaskResult = await supabase
      .from('company_tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single();

    if (updateTaskResult.error) {
      throw new Error(`Failed to update task: ${updateTaskResult.error.message}`);
    }

    // 2. Save to task_responses table if we have content to save
    if (hasTextContent || fileUploaded) {
      // Check if there's an existing response
      const existingResponseResult = await supabase
        .from('task_responses')
        .select('*')
        .eq('task_id', taskId)
        .limit(1);

      if (existingResponseResult.error) {
        console.error("Error checking existing responses:", existingResponseResult.error);
      }

      let responseResult;

      // If existing response exists, update it
      if (existingResponseResult.data && existingResponseResult.data.length > 0) {
        responseResult = await supabase
          .from('task_responses')
          .update(responseData)
          .eq('task_id', taskId)
          .select();
      } 
      // Otherwise insert new response
      else {
        responseResult = await supabase
          .from('task_responses')
          .insert(responseData)
          .select();
      }

      if (responseResult.error) {
        console.error(`Warning: Failed to save task_response: ${responseResult.error.message}`);
        // We continue anyway since the main task was updated successfully
      }
    }

    console.log("Task updated successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Task updated successfully",
        task: updateTaskResult.data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error updating task:", error);

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

/**
 * Converts HTML to plain text by removing tags and converting common entities
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newline
    .replace(/<\/p>/gi, '\n\n')     // Convert </p> to double newline
    .replace(/<[^>]*>/g, '')        // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ')        // Replace common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')     // Normalize multiple newlines
    .trim();                         // Remove leading/trailing whitespace
}