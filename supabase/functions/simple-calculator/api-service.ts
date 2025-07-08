// types.ts
export interface PromptInput {
  name?: string;
  businessId?: string;
}

export interface PerplexityRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface PerplexityOptions {
  temperature?: number;
  systemPrompt?: string;
}

// mainPrompt ilman arvostuskertoimia
export const mainPrompt = (companyInput: PromptInput, isBusinessId: boolean): string => `
  Olet Arventon yrityksen arvonmäärityksen laskurin avustaja. Tehtäväsi on hakea tietoja suomalaisesta 
  yrityksestä.

  ${isBusinessId && companyInput.businessId
    ? companyInput.name
      ? `Sinulle on annettu suomalainen Y-tunnus: "${companyInput.businessId}" ja yrityksen nimi: 
  "${companyInput.name}". Hae näillä tiedoilla yrityksen tiedot.`
      : `Sinulle on annettu suomalainen Y-tunnus: "${companyInput.businessId}". Hae tällä Y-tunnuksella 
  yrityksen tiedot.`
    : `Sinulle on annettu yrityksen nimi: "${companyInput.name}". Hae tällä nimellä yrityksen tiedot.`}

  TÄRKEÄÄ: Hae tietoja käyttäen suomenkielisiä hakuja kuten "yrityksen taloustiedot", "vuosikertomukset", 
  "tilinpäätöstiedot" jne.

  1. Käytä ERITYISESTI näitä luotettavia suomalaisia lähteitä taloustiedoille:
     * Suomen Asiakastieto (asiakastieto.fi) - HAE SIVUSTOLTA: "[yrityksen nimi] taloustiedot"
     * JOS asiakastieto.fi ei anna tuloksia, käytä Finder.fi - HAE: "[yrityksen nimi] liikevaihto"
     * Taloussanomat.fi taloussanomat.fi/porssi - HAE: "[yrityksen nimi] tilinpäätös"
     * Kauppalehti.fi - HAE: "[yrityksen nimi] talous"

  2. Selvitä yrityksen perustiedot:
     * Virallinen nimi (hakutuloksissa "Toiminimi:" tai "Yrityksen nimi:")
     * Y-tunnus (löytyy muodossa: 1234567-8)
     * Päätoimiala ja toimialakoodi (esim. "Liikkeenjohdon konsultointi" 70220)
     * Koko (henkilöstö tai liikevaihdon perusteella)

  3. Etsi yrityksen taloudelliset tiedot. Käytä ERITYISESTI näitä hakutermejä:
     * "[yrityksen nimi] liikevaihto" TAI "[Y-tunnus] liikevaihto"
     * "[yrityksen nimi] liiketulos" TAI "[Y-tunnus] tulos ennen veroja"
     * "[yrityksen nimi] EBIT" TAI "[Y-tunnus] liiketulos"
     * Etsi vähintään 1-3 vuoden tiedot (viimeisin tilinpäätös riittää)

  4. Jos tiettyjä lukuja ei löydy, käytä järkeviä oletuksia tai merkitse null:
     * Liikevaihto on tärkein luku - etsi se ensisijaisesti
     * EBIT voi olla nolla tai negatiivinen - merkitse silloin todellinen luku
     * Jos löydät vain viimeisimmän vuoden, käytä sitä kaikille vuosille

  5. Palauta tiedot TÄSMÄLLEEN tässä JSON-muodossa. Käytä null jos tietoa ei löydy:
  {
    "companyInfo": {
      "name": "Yrityksen virallinen nimi",
      "businessId": "Y-tunnus muodossa 1234567-8",
      "industry": "Toimialan kuvaus ja koodi",
      "size": "henkilöstömäärä tai kokoluokka"
    },
    "financialData": {
      "revenue": [
        {"year": 2024, "value": luku tai null},
        {"year": 2023, "value": luku tai null},
        {"year": 2022, "value": luku tai null}
      ],
      "operatingProfit": [
        {"year": 2024, "value": luku tai null},
        {"year": 2023, "value": luku tai null},
        {"year": 2022, "value": luku tai null}
      ]
    }
  }`;

/**
 * Hakee tiedot Perplexity API:lta
 */
export async function queryPerplexity(prompt: string, options: PerplexityOptions, PERPLEXITY_API_KEY: string): Promise<any> {
  const messages = [
    {
      role: 'system',
      content: options.systemPrompt || 'You are a meticulous financial data expert retrieving data for companies. Always respond ONLY with a valid JSON object matching the requested structure. Use standard double quotes for all keys and string values. Use null for unavailable data.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const requestBody: PerplexityRequest = {
    model: 'sonar-pro',
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 2000
  };

  console.log(`Calling Perplexity API with temperature: ${requestBody.temperature}`);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log("Received response, content length:", content.length);

    return extractJSON(content);

  } catch (error) {
    console.error("Perplexity API query failed:", error);
    throw error;
  }
}

/**
 * Apufunktio JSON:n erottamiseksi vastauksesta
 */
export function extractJSON(content: string): any {
  try {
    console.log("Parsing content, first 100 chars:", content.substring(0, 100));

    // Etsi JSON-rakenne tekstistä - aloittava '{' ja päättyvä '}'
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = content.substring(jsonStart, jsonEnd);
      console.log("Found JSON-like structure, first 50 chars:", jsonStr.substring(0, 50));
      return JSON.parse(jsonStr);
    } else {
      // Jos JSON-rakennetta ei löydy, koitetaan parsia koko sisältö
      console.log("No JSON structure found, trying to parse entire content");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("JSON parsing error:", error);
    console.error("Content that failed to parse:", content);
    throw new Error(`Virhe vastauksen käsittelyssä: ${error.message}`);
  }
}

/**
 * Tarkistaa, puuttuvatko kaikki taloudelliset tiedot
 */
export function hasValidFinancialData(data: any): boolean {
  if (!data?.financialData?.revenue || !data?.financialData?.operatingProfit) {
    return false;
  }

  // Tarkista, onko löytynyt edes yksi validi liikevaihto
  const hasValidRevenue = data.financialData.revenue.some((item: any) => 
    item.value !== null && item.value !== undefined && item.value !== 0);

  return hasValidRevenue;
}