import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUserFriendlyError, UserError } from '../_shared/errors.ts';
import { fetchYTJData } from '../company-preview/ytj-service.ts';
import { scrapeFinancialData } from './financial-scraper.ts';
import { getIndustryMultipliers } from './multiplier-service.ts';
import { calculateValuations } from './valuation-calculator.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { businessId: rawBusinessId, companyName: rawCompanyName } = body;
    
    // Input validointi
    let businessId = null;
    let companyName = null;
    
    if (rawBusinessId) {
      // Y-tunnus validointi
      if (typeof rawBusinessId !== 'string') {
        throw new Error("Invalid business ID format");
      }
      
      // Y-tunnus muoto: 1234567-8
      const cleanedId = rawBusinessId.trim();
      const businessIdRegex = /^\d{7}-\d$/;
      
      if (!businessIdRegex.test(cleanedId)) {
        throw new Error("Invalid business ID format. Expected format: 1234567-8");
      }
      
      businessId = cleanedId;
    }
    
    if (rawCompanyName) {
      // Yrityksen nimi validointi
      if (typeof rawCompanyName !== 'string') {
        throw new Error("Invalid company name format");
      }
      
      companyName = rawCompanyName
        .trim()
        .substring(0, 100) // Max 100 merkkiä
        .replace(/[^a-zA-Z0-9äöåÄÖÅ\s\-&]/g, ''); // Salli & merkki yritysnimissä
      
      if (companyName.length < 2) {
        throw new Error("Company name too short");
      }
    }
    
    if (!businessId && !companyName) {
      throw new Error("Business ID or company name required");
    }

    console.log(`Enhanced calculator: ${businessId || companyName}`);

    // Check cache first (6 hour cache)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Build query based on what we have
        let cacheQuery = supabase
          .from('free_calculator_results')
          .select('*')
          .gte('created_at', new Date(Date.now() - 6*60*60*1000).toISOString()); // 6 hours
        
        if (businessId) {
          cacheQuery = cacheQuery.eq('business_id', businessId);
        } else if (companyName) {
          cacheQuery = cacheQuery.eq('company_name', companyName);
        }
        
        const { data: cachedResult, error } = await cacheQuery
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (cachedResult && !error) {
          console.log('Returning cached result for', businessId || companyName);
          
          // Return cached data in same format as fresh calculation
          return new Response(JSON.stringify({
            companyInfo: cachedResult.company_info,
            financialData: cachedResult.financial_data,
            multipliers: cachedResult.multipliers,
            calculations: cachedResult.calculations,
            database_record_id: cachedResult.id,
            fromCache: true,
            cachedAt: cachedResult.created_at
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (cacheError) {
        console.log('Cache check failed, continuing with fresh calculation:', cacheError);
      }
    }

    // 1. Get company info from YTJ
    const ytjData = await fetchYTJData(businessId || companyName);
    if (!ytjData) {
      throw new UserError(
        "Company not found",
        "Yritystä ei löytynyt. Tarkista yrityksen nimi tai y-tunnus.",
        "COMPANY_NOT_FOUND"
      );
    }

    // 2. Scrape financial data from multiple sources (parallel)
    const [finderData, asiakastietoData] = await Promise.all([
      scrapeFinancialData('finder', ytjData.name, ytjData.businessId),
      scrapeFinancialData('asiakastieto', ytjData.name, ytjData.businessId)
    ]);

    // 3. Merge and validate financial data
    const financialData = mergeFinancialData(finderData, asiakastietoData);
    
    if (!financialData.revenue || financialData.revenue.length === 0) {
      throw new UserError(
        "No financial data found",
        "Yrityksen taloustietoja ei löytynyt julkisista lähteistä. Tarkista että yrityksellä on julkaistuja tilinpäätöksiä.",
        "NO_FINANCIAL_DATA"
      );
    }

    // 4. Get industry multipliers
    const multipliers = await getIndustryMultipliers(
      ytjData.businessLine || ytjData.name,
      Deno.env.get('PERPLEXITY_API_KEY') || ''
    );

    // 5. Calculate valuations
    const calculations = calculateValuations(financialData, multipliers);

    // 6. Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let database_record_id = null;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: savedData, error } = await supabase
          .from('free_calculator_results')
          .insert({
            company_name: ytjData.name,
            business_id: ytjData.businessId,
            company_info: {
              ...ytjData,
              size: financialData.employees ? getCompanySize(financialData.employees) : null
            },
            financial_data: financialData,
            multipliers: multipliers,
            calculations: calculations
          })
          .select('id')
          .single();

        if (!error && savedData) {
          console.log('Results saved with ID:', savedData.id);
          database_record_id = savedData.id;
        } else if (error) {
          console.error('Failed to save results:', error);
        }
      } catch (saveError) {
        console.error('Failed to save results:', saveError);
      }
    }

    // Return enhanced data (same format as simple-calculator for compatibility)
    return new Response(JSON.stringify({
      companyInfo: {
        name: ytjData.name,
        businessId: ytjData.businessId,
        industry: ytjData.businessLine,
        size: financialData.employees ? getCompanySize(financialData.employees) : null
      },
      financialData: financialData,
      multipliers: multipliers,
      calculations: calculations,
      // Add database record ID for rating feature
      database_record_id: database_record_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhanced calculator error:', error);
    
    // Log error to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('free_calculator_errors').insert({
          error_message: error.message,
          search_term: businessId || companyName,
          edge_function: 'enhanced-calculator',
          context: { businessId, companyName }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    // Get user-friendly error message
    const userMessage = error instanceof UserError 
      ? error.userMessage 
      : getUserFriendlyError(error);
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        code: error.code || 'UNKNOWN_ERROR'
      }),
      { 
        status: error instanceof UserError ? 400 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function mergeFinancialData(finderData: any, asiakastietoData: any): any {
  // Prefer finder data but use asiakastieto as backup
  const revenue = finderData.revenue || asiakastietoData.revenue || [];
  const operatingProfit = finderData.operatingProfit || asiakastietoData.operatingProfit || [];
  const employees = finderData.employees || asiakastietoData.employees;
  
  return {
    revenue: revenue.sort((a: any, b: any) => b.year - a.year),
    operatingProfit: operatingProfit.sort((a: any, b: any) => b.year - a.year),
    employees: employees
  };
}

function getCompanySize(employees: number): string {
  if (employees < 10) return "Mikroyritys";
  if (employees < 50) return "Pienyritys";
  if (employees < 250) return "Keskisuuri yritys";
  return "Suuryritys";
}