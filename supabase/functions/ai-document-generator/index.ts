// supabase/functions/ai-document-generator/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";

// Käytä virallista preview-versiota thinking-ominaisuudella
const GEMINI_MODEL = "gemini-2.5-pro";

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
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // Parse request
    const requestData = await req.json();
    const { format, userData, taskContext } = requestData;

    if (!userData || !taskContext) {
      throw new Error("Missing required parameters: userData or taskContext");
    }

    const { taskId, taskTitle, taskDescription, taskType } = taskContext;

    if (!taskId || !taskTitle) {
      throw new Error("Missing required task information");
    }

    // Initialize Gemini AI with 2.5 model
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Configure the model with thinking enabled
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192, // Riittävästi tokeneita pitkälle dokumentille
      },
      // Aktivoi thinking mode (jos tarvitaan explicit-määritys)
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
    });

    // Build prompt that encourages step-by-step thinking
    const prompt = `
    Olet yrityskehityksen ja yritysmyyntien asiantuntija, joka auttaa käyttäjää suorittamaan tehtävän:

    Tehtävä: "${taskTitle}"
    Tehtävän kuvaus: "${taskDescription}"
    Tehtävän tyyppi: ${taskType}

    Tarvitsen sinun luovan kattavan dokumentin tämän tehtävän suorittamiseksi. Käytä seuraavia tietoja:

    Käyttäjän kanssa käyty keskustelu:
    ${JSON.stringify(userData.messages, null, 2)}

    ${userData.fileContents && userData.fileContents.length > 0 ? 
      `Käyttäjän lataamat tiedostot:
      ${userData.fileContents.map((file: any) => 
        `Tiedosto: ${file.name || 'Nimetön tiedosto'}\nSisältö: ${file.content || '[Sisältöä ei voitu näyttää]'}`
      ).join('\n\n')}` 
      : 'Käyttäjä ei ole ladannut tiedostoja.'}

    Ennen dokumentin kirjoittamista, mieti seuraavasti:

    1. Analysoi ensin tehtävän tavoite ja mitä käyttäjä haluaa saavuttaa
    2. Tunnista tärkeimmät käyttäjän antamat tiedot, jotka ovat oleellisia tehtävän kannalta
    3. Suunnittele dokumentin rakenne vastaamaan tehtävän vaatimuksia
    4. Arvioi millaisia osia dokumentissa pitäisi olla, jotta se palvelee parhaiten käyttäjän tavoitetta

    Huomioi erityisesti:
    - Käytä VAIN käyttäjän antamia tietoja - älä keksi tai oleta puuttuvia tietoja
    - Kerro selkeästi, jos jokin oleellinen tieto puuttuu
    - Priorisoi konkreettisia, toimintakelpoisia suosituksia
    - Sisällytä vain luotettavat ja faktapohjaiset päätelmät

    Luo nyt markdown-muotoinen dokumentti, joka on:
    - Ammattimainen ja selkeä
    - Hyvin jäsennelty otsikoihin ja alaotsikoihin
    - Sisältää kaikki olennaiset osat tehtävän suorittamiseksi
    - Helppo muokata ja käyttää sellaisenaan
    `;

    // Generate content with Gemini 2.5 (thinking model)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const markdownContent = response.text();

    // Return the document content
    return new Response(
      JSON.stringify({
        content: markdownContent,
        format: "markdown"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in document generation:", error);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});