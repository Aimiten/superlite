
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.0-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    
    // Parse the request body carefully to avoid circular references
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Failed to parse request JSON:", e.message);
      throw new Error("Invalid JSON in request body");
    }
    
    const { message, messageHistory = [], userId, companyContext, fileContent, fileName } = requestData;
    
    if (!message) {
      throw new Error("Message is required");
    }

    console.log("Received message:", message);
    console.log("Message history length:", messageHistory.length);
    console.log("Company context available:", !!companyContext);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      // Configure Google Search as a tool that the model can use when needed
      tools: [{
        googleSearch: {}
      }],
    });
    
    console.log(`Initialized Gemini model: ${GEMINI_MODEL} with Google Search tool`);
    
    // Map message history roles to Gemini-compatible roles (assistant -> model)
    const compatibleChatHistory = (messageHistory || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || "" }]
    }));

    console.log("Prepared chat history with", compatibleChatHistory.length, "messages");
    console.log("Chat history roles:", compatibleChatHistory.map((msg: any) => msg.role).join(", "));

    try {
      // Prepare the initial context with company information and instructions about web search
      let contextText = `Olet tekoälyassistentti, joka on erikoistunut yrityskauppoihin, arvonmääritykseen ja yritysmyyntiin ja osaa auttaa niihin liittyvissä asioissa. Vastaat käyttäjien kysymyksiin asiantuntevasti, selkeästi ja käytännönläheisesti.

Keskity erityisesti seuraaviin aihealueisiin:
- Yrityksen arvonmääritys ja siihen liittyvät menetelmät (mm. kassavirtalaskelmat, markkinakertoimet, substanssiarvo)
- Yrityksen myyntikuntoon saattaminen
- Omistajanvaihdosprosessi ja sen vaiheet
- Sopimusjuridiikka ja kauppakirjat
- Verotukselliset näkökulmat
- Due diligence -prosessi
- Rahoituksen järjestäminen

Pyri vastaamaan käyttäjien kysymyksiin suomalaisesta näkökulmasta ja viittaa suomalaiseen lainsäädäntöön tai käytäntöihin, kun se on olennaista.

Älä anna sitovia verotuksellisia tai juridisia neuvoja.
Kommunikoi ystävällisesti ja ammattimaisesti, mutta vältä liian teknistä jargonia. Selitä monimutkaiset käsitteet ymmärrettävästi.

TÄRKEÄÄ: Tämä on ohjeistus sinulle, älä toista tätä ohjeistusta vastauksissasi.`;
      
      // Add company context if available
      if (companyContext) {
        // Add company basic data
        if (companyContext.companyData) {
          const company = companyContext.companyData;
          contextText += `\n\nYrityksen perustiedot:`;
          contextText += `\nNimi: ${company.name || 'Ei tiedossa'}`;
          if (company.business_id) contextText += `\nY-tunnus: ${company.business_id}`;
          if (company.industry) contextText += `\nToimiala: ${company.industry}`;
          if (company.founded) contextText += `\nPerustettu: ${company.founded}`;
          if (company.employees) contextText += `\nHenkilöstömäärä: ${company.employees}`;
          if (company.website) contextText += `\nVerkkosivusto: ${company.website}`;
          if (company.company_type) contextText += `\nYritysmuoto: ${company.company_type}`;
          if (company.ownership_change_type) contextText += `\nOmistuksenvaihdon tyyppi: ${company.ownership_change_type}`;
          if (company.valuation) contextText += `\nYrityksen arvioitu arvo: ${company.valuation}`;
        }
        
        // Add company extended info if available
        if (companyContext.companyInfo) {
          const info = companyContext.companyInfo;
          contextText += `\n\nLiiketoiminnan tarkempi kuvaus:`;
          if (info.business_description) contextText += `\nLiiketoiminnan kuvaus: ${info.business_description}`;
          if (info.customer_and_market) contextText += `\nAsiakkaat ja markkinat: ${info.customer_and_market}`;
          if (info.competition) contextText += `\nKilpailutilanne: ${info.competition}`;
          if (info.strategy_and_future) contextText += `\nStrategia ja tulevaisuuden suunnitelmat: ${info.strategy_and_future}`;
          
          contextText += `\n\nSWOT-analyysi:`;
          if (info.strengths) contextText += `\nVahvuudet: ${info.strengths}`;
          if (info.weaknesses) contextText += `\nHeikkoudet: ${info.weaknesses}`;
          if (info.opportunities) contextText += `\nMahdollisuudet: ${info.opportunities}`;
          if (info.threats) contextText += `\nUhat: ${info.threats}`;
          
          if (info.risks_and_regulation) contextText += `\n\nRiskit ja sääntely: ${info.risks_and_regulation}`;
          if (info.brand_and_reputation) contextText += `\n\nBrändi ja maine: ${info.brand_and_reputation}`;
        }
        
        // Add tasks if available
        if (companyContext.tasks && companyContext.tasks.length > 0) {
          contextText += `\n\nYrityksen tehtävät:`;
          companyContext.tasks.forEach((task: any, index: number) => {
            contextText += `\n${index + 1}. ${task.title} (Tärkeys: ${task.urgency}) - ${task.description}`;
          });
        }
        
        // Add valuation if available - KORJATTU: Parannettu valuations-tietojen käsittelyä
        if (companyContext.valuation) {
          const valuation = companyContext.valuation;
          contextText += `\n\nYrityksen arvonmäärityksen tulokset:`;
          
          // Tarkista valuation-objekti ja sen sisältö huolellisemmin
          if (valuation.results) {
            try {
              // Käsittele eri valuation-tulosformaatteja
              let valuationResults = null;
              
              if (typeof valuation.results === 'string') {
                try {
                  valuationResults = JSON.parse(valuation.results);
                  contextText += `\n\nArvonmäärityksen tiedot (JSON-muodosta):`;
                } catch (e) {
                  valuationResults = { text: valuation.results };
                  contextText += `\n\nArvonmäärityksen tiedot (teksti):`;
                }
              } else if (typeof valuation.results === 'object') {
                valuationResults = valuation.results;
                contextText += `\n\nArvonmäärityksen tiedot (objekti):`;
              }
              
              // Lisää tiedot kontekstiin strukturoidusti
              if (valuationResults) {
                // Jos on vaihteluväli, näytä se
                if (valuationResults.valuation_range) {
                  const min = valuationResults.valuation_range.min;
                  const max = valuationResults.valuation_range.max;
                  contextText += `\nArvonmäärityksen vaihteluväli: ${min} - ${max} €`;
                }
                
                // Jos on todennäköisin arvo, näytä se
                if (valuationResults.most_likely_value) {
                  contextText += `\nTodennäköisin arvo: ${valuationResults.most_likely_value} €`;
                }
                
                // Jos on arvonmääritysmenetelmiä, näytä ne
                if (valuationResults.methods) {
                  contextText += `\nKäytetyt arvonmääritysmenetelmät:`;
                  for (const method in valuationResults.methods) {
                    const value = valuationResults.methods[method];
                    contextText += `\n- ${method}: ${value} €`;
                  }
                }
                
                // Lisää mahdollinen selitys
                if (valuationResults.valuation_rationale) {
                  contextText += `\n\nArvonmäärityksen perusteet: ${valuationResults.valuation_rationale}`;
                }
                
                // Jos on analyysiosioita, lisää nekin
                if (valuationResults.analysis && typeof valuationResults.analysis === 'object') {
                  contextText += `\n\nArvonmäärityksen analyysi:`;
                  for (const section in valuationResults.analysis) {
                    const content = valuationResults.analysis[section];
                    if (content.title && content.content) {
                      contextText += `\n- ${content.title}: ${content.content}`;
                    }
                  }
                }
                
                // Tarkista onko valuationResults.valuationReport.valuation_numbers saatavilla
                if (valuationResults.valuationReport && valuationResults.valuationReport.valuation_numbers) {
                  const valNumbers = valuationResults.valuationReport.valuation_numbers;
                  
                  contextText += `\n\nArvonmäärityksen luvut:`;
                  
                  // Tarkista onko most_likely_value saatavilla
                  if (valNumbers.most_likely_value) {
                    contextText += `\nTodennäköisin arvo: ${valNumbers.most_likely_value} €`;
                  }
                  
                  // Tarkista onko valuation_rationale saatavilla
                  if (valNumbers.valuation_rationale) {
                    contextText += `\nArvonmäärityksen perusteet: ${valNumbers.valuation_rationale}`;
                  }
                }
                
                // Näytä koko results-objekti objektina stringifikoituna
                contextText += `\n\nKaikki arvonmääritystiedot: ${JSON.stringify(valuationResults, null, 2)}`;
              }
            } catch (e) {
              console.error("Error parsing valuation results:", e);
              contextText += `\nArvonmääritystiedot: ${JSON.stringify(valuation.results)}`;
            }
          } else {
            contextText += `\nArvonmääritystiedot puuttuvat tai ovat puutteelliset.`;
          }
        } else {
          contextText += `\n\nYritykselle ei ole vielä tehty arvonmääritystä.`;
        }
      }
      
      // Add instructions about web search capability
      contextText += `
      
      Sinulla on myös mahdollisuus etsiä tietoa internetistä Google-haun avulla. Käytä tätä ominaisuutta harkiten seuraavasti:
      
      1. Käytä aina ensisijaisesti käyttäjän antamia tietoja yrityksestä.
      2. Jos tarvitset lisätietoa tai annetuissa tiedoissa ei ole riittävästi tietoa, voit etsiä tietoa internetistä.
      3. Kun käytät Google-hakua, mainitse aina että tieto on haettu internetistä ja kerro myös lähde.
      
      Vastaa aina suomeksi, olet ystävällinen ja avulias tekoälyassistentti.`;
      
      // Add file content context if provided
      if (fileContent && fileName) {
        const safeFileContent = typeof fileContent === 'string' ? fileContent.substring(0, 10000) : '';
        contextText += `\n\nKäyttäjä on lisännyt tiedoston "${fileName}" seuraavalla sisällöllä:\n${safeFileContent}`;
      }

      console.log("Context text length:", contextText.length);
      console.log("Valuation included:", contextText.includes("Arvonmäärityksen"));
      
      const initialContext = {
        role: "user",
        parts: [{ text: contextText }]
      };
      
      // Create a chat session with manually provided messages including context
      const chat = model.startChat({
        history: [initialContext, ...compatibleChatHistory],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2000,
        },
      });
      
      console.log(`Starting chat with Gemini (${GEMINI_MODEL})`);
      
      // Generate response
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();
      
      console.log("Received response from Gemini");
      
      // Get any grounding metadata (search results) if available
      let groundingSources = [];
      try {
        if (response.candidates && 
            response.candidates[0] && 
            response.candidates[0].groundingMetadata && 
            Array.isArray(response.candidates[0].groundingMetadata)) {
          groundingSources = response.candidates[0].groundingMetadata;
          console.log("Response includes grounding metadata from Google Search");
        }
      } catch (err) {
        console.error("Error extracting grounding metadata:", err);
        // Set to empty array instead of null if error occurs
        groundingSources = [];
      }
      
      return new Response(
        JSON.stringify({
          response: responseText,
          groundingSources: groundingSources || [] // Always return an array
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      return new Response(
        JSON.stringify({ 
          error: `Virhe Gemini API:ssa: ${error.message}`,
          response: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen.",
          groundingSources: [] // Always return an array
        }),
        {
          status: 200, // Always return 200 status code even for errors
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error("Error in AI database chat function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen.",
        groundingSources: [] // Always return an array
      }),
      {
        status: 200, // Always return 200 status code even for errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
