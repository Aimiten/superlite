// supabase/functions/upload-conversation-file/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  conversation_id?: string;
  file_data: string; // Base64 encoded file data
  file_name: string;
  file_type: string;
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
    const { conversation_id, file_data, file_name, file_type } = await req.json() as RequestBody;

    if (!file_data || !file_name || !file_type) {
      return new Response(
        JSON.stringify({ error: "Missing parameters", message: "file_data, file_name, and file_type are required" }),
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

    // If conversation_id is provided, verify ownership
    if (conversation_id) {
      const { data: conversation, error: fetchError } = await supabaseClient
        .from("ai_conversations")
        .select("user_id")
        .eq("id", conversation_id)
        .single();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: "Not found", message: "Conversation not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Ensure user can only upload to their own conversations
      if (conversation.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Forbidden", message: "You can only upload to your own conversations" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Decode base64 file data
    let binaryData: Uint8Array;
    try {
      const base64Data = file_data.replace(/^data:.*?;base64,/, "");
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid data", message: "Could not decode file data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // File size limits
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB general limit
    const MAX_PDF_SIZE = 25 * 1024 * 1024;  // 25MB for PDFs
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

    // Check file size
    const fileSize = binaryData.length;
    let maxSize = MAX_FILE_SIZE;
    
    if (file_type === 'application/pdf') {
      maxSize = MAX_PDF_SIZE;
    } else if (file_type.startsWith('image/')) {
      maxSize = MAX_IMAGE_SIZE;
    }

    if (fileSize > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return new Response(
        JSON.stringify({ 
          error: "File too large", 
          message: `File size ${(fileSize / (1024 * 1024)).toFixed(1)}MB exceeds maximum of ${maxSizeMB}MB for ${file_type}` 
        }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type - only Gemini-compatible types
    const ALLOWED_FILE_TYPES = [
      // Text files
      'text/plain',
      'text/csv', 
      'application/json',
      'application/xml',
      'text/xml',
      'text/html',
      'text/markdown',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf'
    ];

    const ALLOWED_FILE_PATTERNS = [
      /^text\//,  // All text files
      /^image\//  // All image files
    ];

    // Check if file type is allowed
    const isAllowed = ALLOWED_FILE_TYPES.includes(file_type) || 
                     ALLOWED_FILE_PATTERNS.some(pattern => pattern.test(file_type));

    if (!isAllowed) {
      // Check for common unsupported types
      const unsupportedOfficeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      let message = `File type ${file_type} is not supported. Allowed types: text files, images, and PDFs.`;
      
      if (unsupportedOfficeTypes.includes(file_type)) {
        message = `Office files (Excel, Word, PowerPoint) are not supported by AI analysis. Please convert to PDF or text format first.`;
      }

      return new Response(
        JSON.stringify({ 
          error: "Invalid file type", 
          message
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const uniqueId = crypto.randomUUID();
    const filePath = `${user.id}/${timestamp}_${uniqueId}_${file_name}`;

    // Upload file to storage
    const { data: storageData, error: storageError } = await supabaseClient
      .storage
      .from("conversation_files")
      .upload(filePath, binaryData, {
        contentType: file_type,
        upsert: false
      });

    if (storageError) {
      return new Response(
        JSON.stringify({ error: "Upload failed", message: storageError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file size
    const fileSize = binaryData.length;

    // If conversation_id is provided, add file to conversation
    if (conversation_id) {
      const { error: fileRecordError } = await supabaseClient
        .from("ai_conversation_files")
        .insert({
          conversation_id,
          file_name,
          file_path: filePath,
          file_type,
          file_size: fileSize
        });

      if (fileRecordError) {
        // Try to delete the uploaded file if record creation fails
        await supabaseClient.storage.from("conversation_files").remove([filePath]);

        return new Response(
          JSON.stringify({ error: "Database error", message: fileRecordError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabaseClient
      .storage
      .from("conversation_files")
      .getPublicUrl(filePath);

    // Return the file info
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          file_name,
          file_path: filePath,
          file_type,
          file_size: fileSize,
          public_url: publicUrlData.publicUrl
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