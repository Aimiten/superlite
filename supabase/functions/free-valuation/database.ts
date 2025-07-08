import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Saves free valuation data to the database
 */
export async function saveFreeValuation(valuationData) {
  console.log("======== TALLENNUS ALOITETTU ========");
  console.log(`Tallennetaan arviointi yritykselle: ${valuationData.company_name}`);

  try {
    console.log("Suoritetaan tietokantakysely: INSERT free_valuations");

    // Log database connection info (without exposing secrets)
    console.log("Supabase URL määritetty:", !!supabaseUrl);
    console.log("Supabase API Key määritetty:", !!supabaseServiceKey);

    const { data, error } = await supabase
      .from('free_valuations')
      .insert(valuationData)
      .select()
      .single();

    if (error) {
      console.error("======== TALLENNUS EPÄONNISTUI ========");
      console.error('Virhe tallennuksessa:', error);
      console.error("Epäonnistuneet tiedot:", JSON.stringify({
        company_name: valuationData.company_name,
        company_id: valuationData.company_id,
        has_file: valuationData.has_file,
        error_code: error.code,
        error_message: error.message
      }));
      return { success: false, error, data: null };
    }

    console.log("======== TALLENNUS ONNISTUI ========");
    console.log(`Arviointi tallennettu ID:llä: ${data.id}`);
    return { success: true, id: data.id, data };
  } catch (err) {
    console.error("======== TALLENNUS EPÄONNISTUI (POIKKEUS) ========");
    console.error('Odottamaton virhe tallennuksessa:', err);
    console.error("Virhetyyppi:", err.name);
    console.error("Virheviesti:", err.message);
    return { success: false, error: err, data: null };
  }
}

/**
 * Updates free valuation data
 */
export async function updateFreeValuation(id, data) {
  try {
    const { error } = await supabase
      .from('free_valuations')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating free valuation:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating free valuation:', err);
    return { success: false, error: err };
  }
}