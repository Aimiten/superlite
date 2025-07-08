
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Utility function to call Supabase Edge Functions with retry logic
 * @param functionName Name of the edge function to call
 * @param body Request body to send to the function
 * @param options Configuration options
 * @returns Promise with the function response
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: any,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    showToasts?: boolean;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToasts = true,
  } = options;

  let lastError: Error | null = null;
  
  // Try the request up to maxRetries times
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Calling edge function ${functionName} (attempt ${attempt + 1}/${maxRetries})`);
      
      // Use the standard Supabase functions.invoke method
      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        body: body
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`Edge function ${functionName} call successful on attempt ${attempt + 1}`);
      return { data, error: null };
    } catch (err) {
      console.error(`Error calling ${functionName} (attempt ${attempt + 1}):`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(1.5, attempt); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all attempts failed
  if (showToasts) {
    toast({
      title: "Virhe",
      description: `Palvelun kutsu epäonnistui: ${lastError?.message || 'Tuntematon virhe'}`,
      variant: "destructive",
    });
  }
  
  return { data: null, error: lastError };
}
