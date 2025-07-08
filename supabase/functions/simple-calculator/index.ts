// Päivitetty index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  mainPrompt, 
  queryPerplexity, 
  extractJSON,
  hasValidFinancialData,
  PromptInput
} from './api-service.ts';
import { getIndustryMultipliers } from './multipliers-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prosessoi laskelmien datan
function processValuationData(data: any) {
  // Validate data structure to prevent errors
  if (!data || !data.companyInfo || !data.financialData || !data.multipliers) {
    throw new Error("Invalid data structure from API");
  }

  try {
    // Calculate average revenue (from valid values only)
    const revenues = data.financialData.revenue || [];
    const validRevenues = revenues.filter((item: any) => 
      item.value !== null && item.value !== undefined && item.value !== 0);

    const avgRevenue = validRevenues.length > 0
      ? validRevenues.reduce((sum: number, item: any) => sum + (item.value || 0), 0) / validRevenues.length
      : 0;

    // Calculate average operating profit (from valid values only)
    const profits = data.financialData.operatingProfit || [];
    const validProfits = profits.filter((item: any) => 
      item.value !== null && item.value !== undefined);

    const avgOperatingProfit = validProfits.length > 0
      ? validProfits.reduce((sum: number, item: any) => sum + (item.value || 0), 0) / validProfits.length
      : 0;

    // Tarkista, että kertoimet ovat olemassa, muuten käytä oletuskertoimia
    let revenueMultipliers = data.multipliers.revenue;
    let evEbitMultipliers = data.multipliers.evEbit;

    // Varmista, että kertoimien arvot ovat kelvollisia numeroita
    if (!revenueMultipliers || 
        typeof revenueMultipliers.min !== 'number' ||
        typeof revenueMultipliers.avg !== 'number' ||
        typeof revenueMultipliers.max !== 'number') {
      console.log("Käytetään oletus liikevaihto-kertoimia, koska haetut kertoimet ovat virheellisiä");
      revenueMultipliers = {
        min: 0.5,
        avg: 1.0,
        max: 1.5,
        justification: "Oletuskertoimet, koska täsmällisiä kertoimia ei löytynyt.",
        source: "Arventon oletuskertoimet"
      };
    }

    if (!evEbitMultipliers || 
        typeof evEbitMultipliers.min !== 'number' ||
        typeof evEbitMultipliers.avg !== 'number' ||
        typeof evEbitMultipliers.max !== 'number') {
      console.log("Käytetään oletus EV/EBIT-kertoimia, koska haetut kertoimet ovat virheellisiä");
      evEbitMultipliers = {
        min: 4.0,
        avg: 6.0,
        max: 8.0,
        justification: "Oletuskertoimet, koska täsmällisiä kertoimia ei löytynyt.",
        source: "Arventon oletuskertoimet"
      };
    }

    const revenueValuations = {
      min: avgRevenue * (revenueMultipliers.min || 0),
      avg: avgRevenue * (revenueMultipliers.avg || 0),
      max: avgRevenue * (revenueMultipliers.max || 0)
    };

    const evEbitValuations = {
      min: avgOperatingProfit * (evEbitMultipliers.min || 0),
      avg: avgOperatingProfit * (evEbitMultipliers.avg || 0),
      max: avgOperatingProfit * (evEbitMultipliers.max || 0)
    };

    // Return processed data with calculations
    return {
      ...data,
      calculations: {
        avgRevenue,
        avgOperatingProfit,
        revenueValuations,
        evEbitValuations
      }
    };
  } catch (error) {
    console.error("Error processing valuation data:", error);
    throw new Error(`Virhe arvonmäärityksen laskennassa: ${error.message}`);
  }
}

// Pääfunktio tietojen hakuun ja prosessointiin
async function calculateValuation(companyInput: PromptInput, PERPLEXITY_API_KEY: string): Promise<any> {
  const valuationId = companyInput.businessId || companyInput.name || "unknown";
  const isBusinessId = !!companyInput.businessId;

  console.log(`Calculating valuation for: ${valuationId}`);
  console.log(`Using MAIN prompt with temp 0.2`);

  // Ensisijainen haku matalalla lämpötilalla
  try {
    const prompt = mainPrompt(companyInput, isBusinessId);

    // Ensimmäinen yritys - matala lämpötila (0.2)
    const mainData = await queryPerplexity(
      prompt, 
      {
        temperature: 0.2,
        systemPrompt: 'You are a meticulous financial data expert retrieving data for companies. Always respond ONLY with a valid JSON object matching the requested structure. Use standard double quotes for all keys and string values. Use null for unavailable data.'
      }, 
      PERPLEXITY_API_KEY
    );

    // Tarkista onko tuloksissa kelvollisia taloustietoja
    if (hasValidFinancialData(mainData)) {
      console.log("Primary query returned valid financial data");

      // Hae arvostuskertoimet erikseen toimialalle
      if (mainData.companyInfo && mainData.companyInfo.industry) {
        console.log("Fetching multipliers for industry:", mainData.companyInfo.industry);
        const multipliers = await getIndustryMultipliers(mainData.companyInfo.industry, PERPLEXITY_API_KEY);

        // Yhdistä tiedot
        const combinedData = {
          ...mainData,
          multipliers: multipliers
        };

        return processValuationData(combinedData);
      } else {
        throw new Error("No industry information found in company data");
      }
    }

    console.log("Primary query returned no valid financial data, trying fallback");
    throw new Error("No valid financial data in primary response");

  } catch (primaryError) {
    console.log(`Primary query failed or had invalid data: ${primaryError.message}`);

    // Fallback - sama prompt korkeammalla lämpötilalla (0.5)
    try {
      console.log(`Using FALLBACK prompt with temp 0.5`);
      const prompt = mainPrompt(companyInput, isBusinessId);

      const fallbackData = await queryPerplexity(
        prompt, 
        {
          temperature: 0.5, // Korkeampi lämpötila
          systemPrompt: 'You are a meticulous financial data expert retrieving data for companies. Always respond ONLY with a valid JSON object matching the requested structure. Use standard double quotes for all keys and string values. Use null for unavailable data.'
        }, 
        PERPLEXITY_API_KEY
      );

      console.log("Fallback query completed");

      // Hae arvostuskertoimet erikseen toimialalle
      if (fallbackData.companyInfo && fallbackData.companyInfo.industry) {
        console.log("Fetching multipliers for industry:", fallbackData.companyInfo.industry);
        const multipliers = await getIndustryMultipliers(fallbackData.companyInfo.industry, PERPLEXITY_API_KEY);

        // Yhdistä tiedot
        const combinedData = {
          ...fallbackData,
          multipliers: multipliers
        };

        return processValuationData(combinedData);
      } else {
        // Jos toimialaa ei löydy, käytä oletuskertoimia
        console.log("No industry information found, using default multipliers");
        const combinedData = {
          ...fallbackData,
          multipliers: {
            revenue: {
              min: 0.5,
              avg: 1.0,
              max: 1.5,
              justification: "Oletuskertoimet, koska toimialatietoa ei löytynyt.",
              source: "Arventon oletuskertoimet"
            },
            evEbit: {
              min: 4.0,
              avg: 6.0,
              max: 8.0,
              justification: "Oletuskertoimet, koska toimialatietoa ei löytynyt.",
              source: "Arventon oletuskertoimet"
            }
          }
        };

        return processValuationData(combinedData);
      }

    } catch (fallbackError) {
      console.error("All queries failed:", fallbackError);
      throw new Error(`Yrityksen tietojen hakeminen epäonnistui: ${fallbackError.message}`);
    }
  }
}

// Pääfunktio
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Määritetään muuttujat funktion näkyvyysalueella
  let requestData = {};
  let searchTerm = "ei hakutermiä";
  let queryType = "unknown";

  try {
    // Luetaan pyyntö alussa - vain kerran
    requestData = await req.json();

    // Tallennetaan hakutermi heti kun se on saatavilla
    searchTerm = requestData.businessId || requestData.companyName || "ei hakutermiä";
    queryType = requestData.businessId ? 'business_id' : (requestData.companyName ? 'company_name' : 'unknown');

    console.log(`Processing request with search term: ${searchTerm}, type: ${queryType}`);

    // Tarkistetaan onko kyseessä arvion tallennus
    if (requestData.rating && requestData.recordId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error("Supabase credentials missing");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Päivitetään arvio tietokantaan
        const { error } = await supabase
          .from('free_calculator_results')
          .update({ rating: requestData.rating })
          .eq('id', requestData.recordId);

        if (error) {
          throw new Error(`Failed to save rating: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Rating saved successfully" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      } catch (error) {
        console.error("Error saving rating:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Failed to save rating" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }
    }

    // Jatketaan normaalilla laskuri-toiminnallisuudella
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key not configured");
    }

    // Parse request data
    const { businessId, companyName } = requestData;

    if (!businessId && !companyName) {
      throw new Error("Business ID or Company Name is required");
    }

    // Valmistele input-objekti
    const companyInput: PromptInput = {
      name: companyName,
      businessId: businessId
    };

    // Hae ja prosessoi tiedot yhdellä kutsulla
    const processedData = await calculateValuation(companyInput, PERPLEXITY_API_KEY);

    // Log valuation results summary (useful for business intelligence)
    console.log(`Valuation completed for ${processedData.companyInfo.name} (${processedData.companyInfo.businessId})`);
    console.log(`Average Revenue: ${processedData.calculations.avgRevenue}, Average Profit: ${processedData.calculations.avgOperatingProfit}`);
    console.log(`Revenue Valuation Range: ${processedData.calculations.revenueValuations.min} - ${processedData.calculations.revenueValuations.max}`);
    console.log(`EV/EBIT Valuation Range: ${processedData.calculations.evEbitValuations.min} - ${processedData.calculations.evEbitValuations.max}`);

    // Tallenna tulokset tietokantaan
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Kerää metatiedot pyyntöä varten
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        // Valmistele tallennettava data
        const resultData = {
          company_name: processedData.companyInfo?.name || 'Tuntematon yritys',
          business_id: processedData.companyInfo?.businessId || null,
          company_info: processedData.companyInfo || {},
          financial_data: processedData.financialData || {},
          multipliers: processedData.multipliers || {},
          calculations: processedData.calculations || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          referer: referer,
          created_at: new Date()
        };

        // Tallenna tietokantaan
        const { data: savedData, error } = await supabase
          .from('free_calculator_results')
          .insert(resultData)
          .select('id')
          .single();

        if (error) {
          console.error('Error saving calculator results:', error);
        } else {
          console.log('Calculator results saved successfully, ID:', savedData.id);
          // Lisää ID vastaukseen
          processedData.database_record_id = savedData.id;
        }
      } else {
        console.warn('Supabase credentials missing, could not save results');
      }
    } catch (saveError) {
      console.error('Exception saving calculator results:', saveError);
      // Jatka normaalisti vaikka tallennus epäonnistuisi
    }

    return new Response(
      JSON.stringify(processedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(`Error in business-valuation function: ${error.message}`);
    console.error(`For search term: ${searchTerm}, type: ${queryType}`);

    // Tallennetaan virhe tietokantaan
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Kerää metatiedot pyyntöä varten
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        // Virhetilanne - loggaa hakutermi
        console.log(`Virhetilanne: hakutermi "${searchTerm}", virhe: "${error.message}"`);

        const errorData = {
          company_name: requestData.companyName || null,
          business_id: requestData.businessId || null,
          error_message: error.message || "Unknown error occurred",
          error_details: {
            stack: error.stack,
            originalError: error.toString(),
            requestData: requestData,
            searchTerm: searchTerm  // Lisätään hakutermi myös error_details-objektiin
          },
          search_term: searchTerm,  // TÄRKEÄ: Lisätään hakutermi päätason kenttänä
          query_type: queryType,
          ip_address: ipAddress,
          user_agent: userAgent,
          referer: referer,
          created_at: new Date()
        };

        // Tallenna tietokantaan
        const { error: saveError } = await supabase
          .from('free_calculator_errors')
          .insert(errorData);

        if (saveError) {
          console.error('Error saving error information:', saveError);
        } else {
          console.log('Error information saved successfully with search term:', searchTerm);
        }
      } else {
        console.warn('Supabase credentials missing, could not save results');
      }
    } catch (saveError) {
      console.error('Exception saving error information:', saveError);
      // Jatka normaalisti vaikka tallennus epäonnistuisi
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
        search_term: searchTerm  // Lisätään hakutermi myös vastaukseen
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});