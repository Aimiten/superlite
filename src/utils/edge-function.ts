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
    maxRetries = 1, // Vähennetty 3 -> 1 kustannusten säästämiseksi
    retryDelay = 1000,
    showToasts = true,
  } = options;

  let lastError: Error | null = null;

  // Sallittujen funktioiden allow-list
  const ALLOWED_FUNCTIONS = [
    'analyze-post-dd-readiness', 'valuation', 'analyze-sales-readiness',
    'ai-database-chat', 'enhanced-calculator', 'company-preview',
    'send-email-valuation', 'get-shared-company',
    'create-checkout', 'send-report-email', 'ai-document-generator',
    'calculate-valuation-impact', 'cleanup-expired-conversations', 'list-conversations', 'save-conversation', 'get-conversation', 'analyze-valuation-documents', 'process-valuation-documents-queue', 'stripe-webhook',
    'simulate-valuation', 'reset-user-data',
    'queue-dcf-analysis', 'send-share-notification', 'generate-nda',
    'send-nda-email', 'accept-nda'
  ];

  // Tarkista onko funktio sallittu
  if (!ALLOWED_FUNCTIONS.includes(functionName)) {
    const error = new Error(`Virheellinen funktionimi: ${functionName}. Funktio ei ole sallittujen listalla.`);
    if (showToasts) {
      toast({
        title: "Virhe",
        description: `Tunnistamaton funktio: ${functionName}`,
        variant: "destructive",
      });
    }
    return { data: null, error };
  }

  try {
    console.log(`Calling edge function ${functionName}`);

    // Use the standard Supabase functions.invoke method with validated function name
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: body
    });

    if (error) {
      throw error;
    }

    console.log(`Edge function ${functionName} call successful`);
    return { data, error: null };
  } catch (err) {
    console.error(`Error calling ${functionName}:`, err);
    lastError = err instanceof Error ? err : new Error(String(err));
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