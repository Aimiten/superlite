import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.2.0";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.1";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ympäristömuuttuja puuttuu");
    }

    const { companyId, assessmentId, valuationId } = await req.json();
    
    if (!companyId || !assessmentId || !valuationId) {
      throw new Error("Pakolliset parametrit puuttuvat: companyId, assessmentId, valuationId");
    }
    
    console.log(`Generating tasks for company: ${companyId}, assessment: ${assessmentId}, valuation: ${valuationId}`);
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Get company data from database
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase-asetuksia ei ole määritetty");
    }

    const fetchCompanyData = async () => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Virhe haettaessa yritystietoja: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] || null;
    };
    
    const fetchAssessmentData = async () => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/assessments?id=eq.${assessmentId}&select=*,results`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Virhe haettaessa arvioinnin tietoja: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] || null;
    };
    
    const fetchValuationData = async () => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/valuations?id=eq.${valuationId}&select=*,results`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Virhe haettaessa arvonmääritystietoja: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data[0] || null;
    };
    
    const [company, assessment, valuation] = await Promise.all([
      fetchCompanyData(),
      fetchAssessmentData(),
      fetchValuationData()
    ]);
    
    if (!company || !assessment || !valuation) {
      throw new Error("Tarvittavia tietoja ei löytynyt");
    }
    
    console.log("Haettu yrityksen, arvioinnin ja arvonmäärityksen tiedot onnistuneesti");
    
    const prompt = `
    Olet tehtävägeneraattori, joka luo käytännönläheisiä, hyvin määriteltyjä tehtäviä yrityksen myyntikunnon parantamiseksi.
    
    Yrityksen tiedot:
    ${JSON.stringify(company, null, 2)}
    
    Arvioinnin tulokset:
    ${JSON.stringify(assessment.results || {}, null, 2)}
    
    Arvonmäärityksen tulokset:
    ${JSON.stringify(valuation.results || {}, null, 2)}
    
    Tehtäväsi:
    1. Luo 12-15 konkreettista, toteuttamiskelpoista tehtävää perustuen yrityksen nykytilanteeseen ja analyyseista saatuihin tietoihin.
    2. Keskity erityisesti niihin osa-alueisiin, joissa on eniten kehitettävää arvioinnin perusteella.
    3. Jokaisen tehtävän tulee olla:
       - Konkreettinen ja selkeästi määritelty
       - Mitattava ja seurattava
       - Toteuttamiskelpoinen annetuilla resursseilla
       - Suoraan kytköksissä myyntikuntoisuuden parantamiseen
    4. Jaa tehtävät neljään kategoriaan:
       - financial (talous)
       - operations (toiminta)
       - documentation (dokumentaatio)
       - customers (asiakkaat)
    
    Jokaisen tehtävän kohdalla määritä:
    - Kiireellisyys (high, medium, low) perustuen vaikuttavuuteen ja kriittisyyteen
    - Selkeä kuvaus mitä pitää tehdä ja miksi
    - Konkreettinen, mitattava odotettu lopputulos
    - Mikä vastaustyyppi vaaditaan (text = tekstimuotoinen vastaus, file = tiedosto, both = molemmat)
    
    Älä luo:
    - Liian yleisiä tai epämääräisiä tehtäviä
    - Tehtäviä ilman selkeää yhteyttä myyntikuntoisuuteen
    - Epärealistisia tai liian laajoja tehtäviä
    - Tehtäviä ilman konkreettista lopputulosta
    
    Palauta tehtävät JSON-muodossa:
    {
      "tasks": [
        {
          "title": "Selkeä, toimintaa kuvaava otsikko",
          "description": "Yksityiskohtainen kuvaus tehtävästä ja sen tavoitteista",
          "category": "financial|operations|documentation|customers",
          "urgency": "high|medium|low",
          "expected_outcome": "Konkreettinen, mitattava lopputulos",
          "response_type": "text|file|both"
        }
      ]
    }`;

    console.log(`Sending task generation request to Gemini (${GEMINI_MODEL})`);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("Gemini vastasi onnistuneesti");
    
    let tasksData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      tasksData = JSON.parse(jsonString);
      
      if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
        throw new Error("Vastaus ei sisällä tehtäviä oikeassa muodossa");
      }
      
      console.log(`Jäsennettiin ${tasksData.tasks.length} tehtävää onnistuneesti`);
    } catch (error) {
      console.error("Virhe jäsennettäessä Geminin vastausta:", error);
      console.log("Alkuperäinen vastaus:", text);
      throw new Error(`Virhe jäsennettäessä Geminin vastausta: ${error.message}`);
    }
    
    const storeTasksResponse = await fetch(`${SUPABASE_URL}/rest/v1/company_tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(
        tasksData.tasks.map(task => ({
          company_id: companyId,
          assessment_id: assessmentId,
          valuation_id: valuationId,
          title: task.title,
          description: task.description,
          category: task.category,
          urgency: task.urgency,
          expected_outcome: task.expected_outcome,
          response_type: task.response_type,
          is_completed: false
        }))
      )
    });
    
    if (!storeTasksResponse.ok) {
      const errorText = await storeTasksResponse.text();
      throw new Error(`Virhe tallennettaessa tehtäviä tietokantaan: ${storeTasksResponse.statusText}, ${errorText}`);
    }
    
    console.log("Tehtävät tallennettu tietokantaan onnistuneesti");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tehtävät generoitu onnistuneesti", 
        taskCount: tasksData.tasks.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Virhe tehtävien generoinnissa:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Tuntematon virhe" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
