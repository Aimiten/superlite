import { parseGeminiJsonResponse } from "./gemini-parser.ts";

// Perplexity-funktio yrityksen taustatietojen hakemiseen
export async function getCompanyInfo(companyName: string) {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not found");
  }

  console.log(`Getting company info for: ${companyName}`);

  const prompt = `
    Etsi julkisista, luotettavista lähteistä (esim. yrityksen kotisivut, viranomaisrekisterit, mediakatsaukset) seuraavat tiedot yrityksestä nimeltä "${companyName}". Koosta ne pelkäksi JSON-objektiksi, noudattaen tarkasti alla olevaa rakennetta:

    {
      "yrityksenNimi": "${companyName}",
      "liiketoiminnanKuvaus": "",
      "asiakasJaMarkkina": "",
      "kilpailuJaErot": "",
      "strategiaJaTulevaisuus": "",
      "swot": {
        "vahvuudet": "",
        "heikkoudet": "",
        "mahdollisuudet": "",
        "uhat": ""
      },
      "riskitJaRegulaatio": "",
      "brandiJaMaine": "",
      "lahteet": ""
    }

    Täytä kentät seuraavasti:
    1. **liiketoiminnanKuvaus**: Lyhyt kuvaus siitä, mitä yritys konkreettisesti tekee (tuotteet/palvelut) ja missä se on erikoistunut.
    2. **asiakasJaMarkkina**: Kenelle tuotteet/palvelut on suunnattu (esim. B2B, B2C) ja millaisilla markkinoilla (maantieteellisesti, toimialoittain) yritys toimii.
    3. **kilpailuJaErot**: Mainitse yleisesti merkittävimmät kilpailijat tai kilpailukentän luonne ja miten yritys eroaa kilpailusta.
    4. **strategiaJaTulevaisuus**: Kerro pääkohdat tulevista suunnitelmista, laajentumisesta, tuotekehityksestä.
    5. **swot**: Lyhyt yhteenveto yrityksen vahvuuksista, heikkouksista, mahdollisuuksista ja uhista.
    6. **riskitJaRegulaatio**: Millaiset ulkoiset ja toimialakohtaiset riskit vaikuttavat yritykseen? Onko lainsäädännöllä tai viranomaismääräyksillä erityistä merkitystä yrityksen liiketoiminnalle?
    7. **brandiJaMaine**: Mahdolliset palkinnot, referenssit, mediassa ollut julkisuus, yms.
    8. **lahteet**: Kerro lyhyesti, mistä (esim. yrityksen verkkosivut, uutisartikkelit, PR-julkaisut) hankit tiedot.

    **Tärkeää**:
    - Älä paljasta tai lisää taloudellisia tietoja (liikevaihto, tulos, tase, kertoimet jne.).
    - Vastaa **ainoastaan** yllä mainitulla JSON-rakenteella, **ilman** ylimääräistä tekstiä tai selityksiä.
  `;

  try {
    console.log("Sending request to Perplexity API...");
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'Olet talousasiantuntija, joka etsii täsmällistä tietoa yrityksistä. Palauta tiedot vain JSON-muodossa. Älä lisää mitään selityksiä, johdantoja tai muuta tekstiä.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        presence_penalty: 0,
        frequency_penalty: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Perplexity API error:", errorData);
      throw new Error(`Perplexity API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("Perplexity response received");

    // Parse the JSON content from the response using the robust parser
    let jsonData;
    try {
      const content = data.choices[0].message.content;
      console.log("Raw Perplexity content:", content);

      // Käytä samaa robustia parseria kuin Gemini-vastauksille
      jsonData = parseGeminiJsonResponse(content, {
        expectFormat: "object",
        logPrefix: "perplexity-api"
      });

      console.log("Successfully parsed Perplexity response");
    } catch (jsonError) {
      console.error("Error parsing JSON from Perplexity response:", jsonError);
      return {
        error: "Virhe vastauksen käsittelyssä"
      };
    }

    // Yrityksen työntekijämäärä saadaan jo profiilista, joten se ei sisälly JSON-vastaukseen

    return {
      rawResponse: data,
      analysisText: data.choices[0].message.content,
      structuredData: {
        company_name: jsonData.yrityksenNimi,
        business_id: "",
        industry: "",
        employees: "", // Tähän ei enää pakoteta työntekijämäärää Perplexity-vastauksesta
        description: jsonData.liiketoiminnanKuvaus,
        competitive_advantages: [], 
        market_position: jsonData.asiakasJaMarkkina,
        challenges: [],
        key_products: [],
        website: ""
      }
    };
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    throw new Error(`Virhe Perplexity API-kutsussa: ${error.message}`);
  }
}