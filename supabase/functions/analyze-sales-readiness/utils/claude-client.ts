// supabase/functions/analyze-sales-readiness/utils/claude-client.ts
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.20.1";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

// Retry logic with exponential backoff
async function retryWithExponentialBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let lastError = null;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;

      if (retries >= maxRetries) {
        console.error(`[Claude] Max retries (${maxRetries}) reached. Giving up.`);
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
      console.log(`[Claude] Retry ${retries}/${maxRetries} after ${Math.round(delay)}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function callClaudeModel(prompt: string, documents = []) {
  if (!CLAUDE_API_KEY) {
    throw new Error("Missing Claude API key");
  }

  console.log("[Claude] Starting API call");

  const anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY,
  });

  // Add explicit JSON formatting instructions to the prompt
  const enhancedPrompt = `${prompt}\n\nTÄRKEÄ: Vastaa vain validissa JSON-muodossa. Vastauksessasi EI saa olla mitään muuta tekstiä, kuten markdown-merkintöjä, koodinäytteitä tai selityksiä - vain puhdas JSON-vastaus. Varmista, että KAIKKI merkkijonot on suljettu lainausmerkeillä ja kaikki JSON-syntaksi on täysin validia.`;

  // Check if there are PDF documents
  const hasPdfDocuments = documents && documents.some(doc => 
    doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf'))
  );

  if (documents && documents.length > 0) {
    console.log("[Claude] Document diagnostics:");
    documents.forEach((doc, index) => {
      console.log(`[Claude] Doc ${index}: has base64=${!!doc.base64}, mime=${doc.mime_type}, file_type=${doc.file_type}`);
    });
  }

  // Use retry logic
  return await retryWithExponentialBackoff(async () => {
    try {
      let systemPrompt = "You are a business analysis expert. Always respond in valid JSON format only.";
      let userPrompt = enhancedPrompt;

      // Build content array for multimodal messages
      const content = [];
      
      // Add the main prompt text
      content.push({
        type: "text",
        text: enhancedPrompt
      });

      // If we have documents, add them as appropriate content blocks
      if (documents && documents.length > 0) {
        console.log("Using multipart content for PDF documents");
        
        documents.forEach((doc, index) => {
          if (doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf'))) {
            // For PDFs, add as document block (Claude 4 supports PDFs natively)
            content.push({
              type: "document",
              source: {
                type: "base64",
                media_type: doc.mime_type || "application/pdf",
                data: doc.base64
              }
            });
            console.log(`Added PDF document ${index + 1}: ${doc.name}`);
          } else if (doc.content) {
            // For text content, add as text block
            content.push({
              type: "text",
              text: `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n${doc.content}`
            });
            console.log(`Added text document ${index + 1}: ${doc.name}`);
          }
        });
      }

      console.log("[Claude] Sending request to API");
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 18192,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: content  // Use content array instead of string
          }
        ]
      });

      console.log("[Claude] Received response from API");

      // Extract text from Claude's response
      let responseText = "";
      if (response.content && response.content.length > 0) {
        responseText = response.content[0].text || "";
      }

      console.log("[Claude] Response text length:", responseText.length);

      // Try to parse the JSON response
      try {
        const parsedData = JSON.parse(responseText);
        console.log("[Claude] Successfully parsed JSON response");

        // Return in a format compatible with Gemini's response structure
        return {
          response: {
            text: () => responseText,
            structuredJson: parsedData
          }
        };
      } catch (parseError) {
        console.error("[Claude] Failed to parse JSON response:", parseError);
        console.log("[Claude] Raw response preview:", responseText.substring(0, 500) + "...");
        
        // Try to extract JSON from the response if it's wrapped in markdown or other text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log("[Claude] Successfully extracted and parsed JSON from response");
            return {
              response: {
                text: () => jsonMatch[0],
                structuredJson: extractedJson
              }
            };
          } catch (extractError) {
            console.error("[Claude] Failed to parse extracted JSON:", extractError);
          }
        }
        
        throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
      }
    } catch (apiError) {
      console.error("[Claude] API error:", apiError);
      throw apiError;
    }
  }, 3, 1000); // 3 retries, starting with 1000ms delay
}