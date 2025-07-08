// supabase/functions/analyze-sales-readiness/utils/ai-client-manager.ts
import { callGeminiModel } from "./gemini-client.ts";
import { callClaudeModel } from "./claude-client.ts";

interface AIResponse {
  response: {
    text: () => string;
    structuredJson?: any;
  };
}

/**
 * Calls both AI models in parallel and returns the first successful response
 * Falls back to single provider if only one API key is available
 */
export async function callAIModel(prompt: string, documents = []): Promise<AIResponse> {
  const hasGeminiKey = !!Deno.env.get("GEMINI_API_KEY");
  const hasClaudeKey = !!Deno.env.get("CLAUDE_API_KEY");

  console.log("[AI Manager] Available providers:", {
    gemini: hasGeminiKey,
    claude: hasClaudeKey
  });

  // If only one provider is available, use it directly
  if (hasGeminiKey && !hasClaudeKey) {
    console.log("[AI Manager] Using Gemini only (no Claude key)");
    return await callGeminiModel(prompt, documents);
  }

  if (hasClaudeKey && !hasGeminiKey) {
    console.log("[AI Manager] Using Claude only (no Gemini key)");
    return await callClaudeModel(prompt, documents);
  }

  if (!hasGeminiKey && !hasClaudeKey) {
    throw new Error("No AI provider API keys found. Please set either GEMINI_API_KEY or CLAUDE_API_KEY");
  }

  // Both providers available - race them
  console.log("[AI Manager] Racing both providers...");

  // Create promises for both providers
  const geminiPromise = callGeminiModel(prompt, documents)
    .then(result => {
      console.log("[AI Manager] Gemini responded first");
      return { provider: 'gemini', result };
    })
    .catch(error => {
      console.error("[AI Manager] Gemini failed:", error.message);
      throw error;
    });

  const claudePromise = callClaudeModel(prompt, documents)
    .then(result => {
      console.log("[AI Manager] Claude responded first");
      return { provider: 'claude', result };
    })
    .catch(error => {
      console.error("[AI Manager] Claude failed:", error.message);
      throw error;
    });

  try {
    // Race both promises - first successful response wins
    const winner = await Promise.race([geminiPromise, claudePromise]);
    console.log(`[AI Manager] ${winner.provider} won the race`);
    return winner.result;
  } catch (firstError) {
    console.log("[AI Manager] First provider failed, waiting for the other...");
    
    // If the race failed, try to get the result from the other provider
    try {
      const results = await Promise.allSettled([geminiPromise, claudePromise]);
      
      // Find a successful result
      for (const result of results) {
        if (result.status === 'fulfilled') {
          console.log(`[AI Manager] Fallback to ${result.value.provider} succeeded`);
          return result.value.result;
        }
      }
      
      // Both failed - throw the first error
      throw firstError;
    } catch (error) {
      console.error("[AI Manager] Both providers failed");
      throw error;
    }
  }
}