// supabase/functions/generate-tasks/regenerateSuggestion.ts - KORJATTU versio
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.2.0";
import { ExitType, Timeline, SuggestionResponse } from "./types.ts";

// PÄIVITETTY: Käytä uusinta Flash-mallia
const GEMINI_MODEL = "gemini-2.0-flash";

export async function regenerateExitSuggestionWithUserChoices(
  companyId: string,
  assessmentId: string,
  valuationId: string,
  userChosenExitType: ExitType,
  userChosenTimeline: Timeline,
  userId: string,
  authToken: string
): Promise<SuggestionResponse> {
  console.log(`Regenerating exit suggestions for company: ${companyId} with user choices: ${userChosenExitType}, ${userChosenTimeline}`);

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ympäristömuuttuja puuttuu");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Get company data from database
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!SUPABASE_URL) {
      throw new Error("Supabase-asetuksia ei ole määritetty");
    }

    // Fetch all necessary data from Supabase
    const [company, assessment, valuation] = await Promise.all([
      fetchCompanyData(authToken, SUPABASE_URL, companyId, userId),
      fetchAssessmentData(authToken, SUPABASE_URL, assessmentId, userId),
      fetchValuationData(authToken, SUPABASE_URL, valuationId, userId)
    ]);

    if (!company || !assessment || !valuation) {
      throw new Error("Tarvittavia tietoja ei löytynyt");
    }

    console.log("Haettu yrityksen, arvioinnin ja arvonmäärityksen tiedot onnistuneesti");

    // Map user chosen values to descriptions for better prompt
    const exitTypeDescriptionMap = {
      'share_sale': 'osakekauppa',
      'business_sale': 'liiketoimintakauppa',
      'generational_change': 'sukupolvenvaihdos',
      'other': 'muu järjestely'
    };

    const timelineDescriptionMap = {
      'immediate': 'välitön (0-6kk)',
      'short_term': 'lyhyt (6-12kk)',
      'mid_term': 'keskipitkä (1-2 vuotta)',
      'long_term': 'pitkä (3-5 vuotta)'
    };

    // PARANNETTU PROMPT: Varmista että käyttäjän valinnat säilyvät oikeina
    const prompt = `
    Olet yrityskauppa-asiantuntija, joka auttaa yrittäjiä suunnittelemaan omistajanvaihdosta.

    KRIITTINEN TIETO: Käyttäjä on ITSE valinnut:
    - exitType: "${userChosenExitType}" (${exitTypeDescriptionMap[userChosenExitType]})
    - timeline: "${userChosenTimeline}" (${timelineDescriptionMap[userChosenTimeline]})

    YRITYKSEN TIEDOT:
    ${JSON.stringify(company, null, 2)}

    ARVIOINNIN TULOKSET:
    ${JSON.stringify(assessment.results || {}, null, 2)}

    ARVONMÄÄRITYKSEN TULOKSET:
    ${JSON.stringify(valuation.results || {}, null, 2)}

    TEHTÄVÄSI:
    Analysoi yrityksen tiedot käyttäjän valitseman exit-strategian näkökulmasta ja kirjoita perustelut miksi käyttäjän valitsema strategia ja aikataulu ovat sopivia.

    TUOTTAMASI JSON-VASTAUS (ei muuta tekstiä!):

    {
      "suggestion": {
        "exitType": "${userChosenExitType}",
        "exitTypeDescription": "Lyhyt kuvaus exitType-vaihtoehdosta",
        "timeline": "${userChosenTimeline}",
        "timelineDescription": "Lyhyt kuvaus timeline-vaihtoehdosta",
        "reasoning": "Selkeät ja konkreettiset perustelut käyttäjän valitsemalle strategialle ja aikataululle"
      },
      "suggestedIssues": [
        "Tärkeä kehityskohde 1",
        "Tärkeä kehityskohde 2",
        "Tärkeä kehityskohde 3"
      ]
    }

    MUISTA: exitType TÄYTYY olla "${userChosenExitType}" ja timeline TÄYTYY olla "${userChosenTimeline}"!
    `;

    console.log(`Sending regeneration request to Gemini (${GEMINI_MODEL})`);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Gemini vastasi onnistuneesti");

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const suggestionData = JSON.parse(jsonString) as SuggestionResponse;

      if (!suggestionData.suggestion || !suggestionData.suggestedIssues) {
        throw new Error("Vastaus ei sisällä vaadittuja kenttiä");
      }

      // PAKOLLINEN KORJAUS: Varmista että käyttäjän valinnat säilyvät
      suggestionData.suggestion.exitType = userChosenExitType;
      suggestionData.suggestion.timeline = userChosenTimeline;

      console.log(`Jäsennettiin päivitetyt ehdotukset onnistuneesti: exitType="${suggestionData.suggestion.exitType}", timeline="${suggestionData.suggestion.timeline}"`);
      return suggestionData;

    } catch (error) {
      console.error("Virhe jäsennettäessä Geminin vastausta:", error);
      console.log("Alkuperäinen vastaus:", text);
      throw new Error(`Virhe jäsennettäessä Geminin vastausta: ${error.message}`);
    }

  } catch (error) {
    console.error("Virhe ehdotusten päivittämisessä:", error);
    throw error;
  }
}

// Helper functions to fetch data (sama kuin ennenkin)
async function fetchCompanyData(authToken: string, supabaseUrl: string, companyId: string, userId: string) {
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY ympäristömuuttuja puuttuu");
  }

  console.log("Haetaan yrityksen tietoja:", companyId);
  const response = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&select=*`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa yritystietoja: ${response.statusText}`);
  }

  const data = await response.json();
  return data[0] || null;
}

async function fetchAssessmentData(authToken: string, supabaseUrl: string, assessmentId: string, userId: string) {
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY ympäristömuuttuja puuttuu");
  }

  console.log("Haetaan arvioinnin tietoja:", assessmentId);
  const response = await fetch(`${supabaseUrl}/rest/v1/assessments?id=eq.${assessmentId}&select=*,results`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa arvioinnin tietoja: ${response.statusText}`);
  }

  const data = await response.json();
  return data[0] || null;
}

async function fetchValuationData(authToken: string, supabaseUrl: string, valuationId: string, userId: string) {
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY ympäristömuuttuja puuttuu");
  }

  console.log("Haetaan arvonmäärityksen tietoja:", valuationId);
  const response = await fetch(`${supabaseUrl}/rest/v1/valuations?id=eq.${valuationId}&select=*,results`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa arvonmääritystietoja: ${response.statusText}`);
  }

  const data = await response.json();
  return data[0] || null;
}