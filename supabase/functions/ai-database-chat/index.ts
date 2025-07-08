// supabase/functions/ai-database-chat/index.ts
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
      console.error("CRITICAL ERROR: Gemini API key not configured");
      throw new Error("Gemini API key not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("CRITICAL ERROR: Supabase credentials not configured");
      throw new Error("Supabase credentials not configured");
    }

    // Parse the request body carefully to avoid circular references
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request parsed successfully");
    } catch (e) {
      console.error("Failed to parse request JSON:", e.message);
      throw new Error("Invalid JSON in request body");
    }

    const { message, messageHistory = [], userId, companyContext, fileContent, fileName, fileType, taskContext } = requestData;

    if (!message) {
      console.error("VALIDATION ERROR: Message is required but was missing");
      throw new Error("Message is required");
    }

    console.log("Request details:");
    console.log("- Message:", message.substring(0, 100) + (message.length > 100 ? "..." : ""));
    console.log("- Message history length:", messageHistory.length);
    console.log("- Company context:", companyContext ? "Available" : "Not available");
    console.log("- File provided:", fileName ? `Yes (${fileName})` : "No");
    console.log("- File type:", fileType || "None");
    console.log("- Task context:", taskContext ? "Available" : "Not available");

    // Initialize Gemini AI
    console.log(`Initializing Gemini model: ${GEMINI_MODEL}`);
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
    const compatibleChatHistory = (messageHistory || []).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || "" }]
    }));

    console.log("Prepared chat history with", compatibleChatHistory.length, "messages");

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

        // Continue adding company context...

        // Add valuation if available
        if (companyContext.valuation) {
          const valuation = companyContext.valuation;
          contextText += `\n\nYrityksen arvonmäärityksen tulokset:`;

          // Check valuation object details...
        }
      }

      // Add task context if provided
      if (taskContext) {
        contextText += `\n\nKäyttäjä pyytää apua seuraavan tehtävän suorittamisessa:

Tehtävä: ${taskContext.taskTitle || 'Ei otsikkoa'}
Kuvaus: ${taskContext.taskDescription || 'Ei kuvausta'}
Tehtävätyyppi: ${taskContext.taskType || 'Ei määritelty'}

Ohjaa käyttäjää tämän tehtävän suorittamisessa:
1. Selitä, miksi tämä tehtävä on tärkeä yritysmyynnin kannalta
2. Kysy käyttäjältä tarvittavia tietoja tehtävän suorittamiseksi
3. Tarjoa konkreettisia neuvoja ja ohjeita tehtävän suorittamiseen

Auta käyttäjää keräämään oikeat tiedot, jotta tehtävä voidaan suorittaa tehokkaasti.
Dokumenttitehtävissä kerro, mitä dokumentin tulisi sisältää ja miten se kannattaa jäsennellä.`;
      }

      // Add instructions about web search capability
      contextText += `

      Sinulla on myös mahdollisuus etsiä tietoa internetistä Google-haun avulla. Käytä tätä ominaisuutta harkiten seuraavasti:

      1. Käytä aina ensisijaisesti käyttäjän antamia tietoja yrityksestä.
      2. Jos tarvitset lisätietoa tai annetuissa tiedoissa ei ole riittävästi tietoa, voit etsiä tietoa internetistä.
      3. Kun käytät Google-hakua, mainitse aina että tieto on haettu internetistä ja kerro myös lähde.

      Vastaa aina suomeksi, olet ystävällinen ja avulias tekoälyassistentti.`;

      // === IMPROVED MULTIMODAL HANDLING ===
      let initialContext;
      let geminiParts = [];

      // First, add text context to parts
      geminiParts.push({ text: contextText });

      // Handle file content if provided
      if (fileContent && fileName) {
        console.log(`Processing file: ${fileName} (Type: ${fileType})`);

        // LOGGING: Log file details
        if (typeof fileContent === 'string') {
          console.log(`File content format: string, length: ${fileContent.length}`);
          if (fileContent.startsWith('data:')) {
            console.log(`File content appears to be a data URL`);
          }
        } else {
          console.log(`File content format: ${typeof fileContent}`);
        }

        try {
          // Handle images and PDFs properly
          if (fileType && (fileType.startsWith('image/') || fileType === 'application/pdf')) {
            console.log(`Processing ${fileType.startsWith('image/') ? 'image' : 'PDF'} file`);

            // Process base64 data
            let base64Data = fileContent;

            // Remove data URL prefix if present
            if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
              console.log("Base64 data URL detected, extracting data portion");
              base64Data = base64Data.split('base64,')[1];
            }

            // Validate base64 format
            if (typeof base64Data === 'string') {
              // Check if base64 is valid
              const validBase64Regex = /^[A-Za-z0-9+/=]+$/;
              const isValidBase64 = validBase64Regex.test(base64Data.replace(/\s/g, ''));
              console.log(`Base64 validation: ${isValidBase64 ? 'Valid' : 'Invalid'}`);

              if (!isValidBase64) {
                console.warn("Invalid base64 characters detected, attempting to clean...");
                base64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');
                console.log(`Cleaned base64 length: ${base64Data.length}`);
              }

              // Ensure length is multiple of 4 (base64 requirement)
              while (base64Data.length % 4 !== 0) {
                base64Data += '=';
              }

              // Log sample of base64 (for debugging)
              console.log(`Base64 sample start: ${base64Data.substring(0, 20)}...`);
              console.log(`Base64 sample end: ...${base64Data.substring(base64Data.length - 20)}`);
            }

            // Add media as inlineData to Gemini parts
            geminiParts.push({
              inlineData: {
                mimeType: fileType,
                data: base64Data
              }
            });
            console.log(`Successfully added ${fileType} as inlineData to Gemini parts`);
          } else {
            // For text-based files, add as text
            console.log(`Processing as text file`);
            const safeFileContent = typeof fileContent === 'string' ? fileContent.substring(0, 10000) : '';
            geminiParts.push({ 
              text: `\n\nKäyttäjä on lisännyt tiedoston "${fileName}" seuraavalla sisällöllä:\n${safeFileContent}` 
            });
            console.log(`Added text file content to Gemini parts`);
          }
        } catch (fileError) {
          console.error("Error processing file content:", fileError);
          console.error("Error details:", fileError.stack);
          // If error occurs, add error message to context
          geminiParts.push({ 
            text: `\n\nKäyttäjä yritti lisätä tiedoston "${fileName}", mutta sen käsittelyssä tapahtui virhe: ${fileError.message}`
          });
        }
      }

      // Add current message from user
      geminiParts.push({ text: message });

      // Create final parts structure for Gemini
      initialContext = {
        role: "user",
        parts: geminiParts
      };

      console.log(`Created multimodal context with ${geminiParts.length} parts`);
      console.log(`Text parts: ${geminiParts.filter(p => p.text).length}`);
      console.log(`Media parts: ${geminiParts.filter(p => p.inlineData).length}`);

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
      console.log(`Response length: ${responseText.length} characters`);

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
        groundingSources = [];
      }

      return new Response(
        JSON.stringify({
          response: responseText,
          groundingSources: groundingSources || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      console.error("Error stack:", error.stack);
      return new Response(
        JSON.stringify({ 
          error: `Virhe Gemini API:ssa: ${error.message}`,
          response: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen.",
          groundingSources: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error("Error in AI database chat function:", error);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen.",
        groundingSources: []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});