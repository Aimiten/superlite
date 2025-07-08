// This Edge Function is deprecated - use queue-dcf-analysis instead
// Redirects to the new queue endpoint for backward compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Log deprecation notice
  console.warn("⚠️ DEPRECATED: dcf-scenario-analysis endpoint called. Client should migrate to queue-dcf-analysis");
  console.warn(`Request from: ${req.headers.get("origin") || "unknown"}`);
  console.warn(`User-Agent: ${req.headers.get("user-agent") || "unknown"}`);

  try {
    // Get the current request URL and construct the new endpoint URL
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const newEndpoint = `${baseUrl}/functions/v1/queue-dcf-analysis`;

    // Forward the request to the new endpoint
    const response = await fetch(newEndpoint, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Clone the response to add deprecation headers
    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);
    
    // Add deprecation notice headers
    responseHeaders.set("X-Deprecated", "true");
    responseHeaders.set("X-Deprecation-Message", "This endpoint is deprecated. Please use queue-dcf-analysis instead.");
    responseHeaders.set("X-New-Endpoint", "/functions/v1/queue-dcf-analysis");
    
    // Ensure CORS headers are included
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // If the response is JSON, add deprecation notice to the body
    let body = responseBody;
    try {
      const jsonBody = JSON.parse(responseBody);
      jsonBody._deprecation_notice = {
        deprecated: true,
        message: "This endpoint (dcf-scenario-analysis) is deprecated and will be removed in future versions.",
        migration_instructions: "Please update your application to use the queue-dcf-analysis endpoint instead.",
        new_endpoint: "/functions/v1/queue-dcf-analysis",
        documentation: "The new endpoint provides better performance and reliability through queue-based processing."
      };
      body = JSON.stringify(jsonBody);
    } catch {
      // If response is not JSON, return as is
    }

    return new Response(body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Error forwarding to new endpoint:", error);
    
    // If forwarding fails, return detailed error with migration instructions
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to redirect to new endpoint",
        details: error.message,
        _deprecation_notice: {
          deprecated: true,
          message: "This endpoint (dcf-scenario-analysis) is deprecated.",
          migration_instructions: "Please update your application to use the queue-dcf-analysis endpoint instead.",
          new_endpoint: "/functions/v1/queue-dcf-analysis",
          documentation: "The new endpoint provides better performance and reliability through queue-based processing."
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Deprecated": "true",
          "X-Deprecation-Message": "This endpoint is deprecated. Please use queue-dcf-analysis instead.",
          "X-New-Endpoint": "/functions/v1/queue-dcf-analysis"
        },
        status: 500
      }
    );
  }
});