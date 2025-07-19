import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUserFriendlyError, UserError } from '../_shared/errors.ts';
import { fetchYTJData } from './ytj-service.ts';
import { firecrawlService } from './firecrawl-service.ts';
import { generateCompanyTeaser } from './gemini-service.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { search: rawSearch } = body;
    
    // Input validointi turvallisuuden vuoksi
    if (!rawSearch || typeof rawSearch !== 'string') {
      throw new Error("Invalid search term");
    }
    
    // Siivoa input - poista erikoismerkit, pidä vain turvalliset
    const search = rawSearch
      .trim()
      .substring(0, 50) // Max 50 merkkiä
      .replace(/[^a-zA-Z0-9äöåÄÖÅ\s\-]/g, ''); // Vain kirjaimet, numerot, väliviiva
    
    if (search.length < 3) {
      throw new Error("Search term too short - minimum 3 characters");
    }

    console.log(`Company preview search: ${search} (cleaned from: ${rawSearch})`);

    // 1. Try YTJ first (fastest)
    const ytjData = await fetchYTJData(search);
    
    if (!ytjData) {
      throw new UserError(
        "Company not found",
        "Yritystä ei löytynyt. Tarkista yrityksen nimi tai y-tunnus.",
        "COMPANY_NOT_FOUND"
      );
    }

    // 2. Parallel fetch: Firecrawl + Gemini
    const [finderData, geminiAnalysis] = await Promise.all([
      firecrawlService.scrapeUrl(
        `https://www.finder.fi/search?what=${encodeURIComponent(ytjData.name)}`
      ).catch(err => {
        console.error("Finder scraping failed:", err);
        return null;
      }),
      generateCompanyTeaser(ytjData).catch(err => {
        console.error("Gemini analysis failed:", err);
        return null;
      })
    ]);

    // 3. Parse financial data if available
    let latestRevenue = null;
    let employees = null;
    
    if (finderData?.content) {
      // Extract revenue
      const revenueMatch = finderData.content.match(/Liikevaihto.*?(\d{4}).*?(\d+(?:[.,]\d+)?)\s*(?:tuhatta|milj|€)/i);
      if (revenueMatch) {
        const value = revenueMatch[2].replace(',', '.');
        if (value.includes('milj')) {
          latestRevenue = parseFloat(value) * 1000000;
        } else {
          latestRevenue = parseFloat(value) * 1000;
        }
      }
      
      // Extract employees
      const employeeMatch = finderData.content.match(/Henkilöstö.*?(\d+)/i);
      if (employeeMatch) {
        employees = parseInt(employeeMatch[1]);
      }
    }

    // 4. Calculate quick valuation
    let quickValuation = null;
    if (latestRevenue) {
      // Use conservative multiplier for preview
      const minMultiplier = 0.6;
      const maxMultiplier = 1.0;
      quickValuation = {
        min: Math.round(latestRevenue * minMultiplier),
        max: Math.round(latestRevenue * maxMultiplier),
        multiplier: `${minMultiplier}-${maxMultiplier}x`,
        source: "Toimialan keskiarvo"
      };
    }

    // Return preview data
    return new Response(JSON.stringify({
      // YTJ data
      name: ytjData.name,
      businessId: ytjData.businessId,
      companyForm: ytjData.companyForm,
      registrationDate: ytjData.registrationDate,
      businessLine: ytjData.businessLine,
      
      // Calculated
      companyAge: new Date().getFullYear() - new Date(ytjData.registrationDate).getFullYear(),
      
      // Financial data
      revenue: latestRevenue,
      employees: employees,
      
      // Gemini analysis
      teaser: geminiAnalysis?.teaser || null,
      whyValuable: geminiAnalysis?.whyValuable || null,
      marketSituation: geminiAnalysis?.marketSituation || null,
      
      // Quick valuation
      quickValuation: quickValuation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Company preview error:', error);
    
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