// multipliers-service.ts
import { extractJSON } from './api-service.ts';

// Arvostuskertoimien prompt
export const multiplierPrompt = (industry: string): string => `
  Olet arvostuskertoimien asiantuntija. Tehtäväsi on määrittää sopivat arvostuskertoimet suomalaiselle yritykselle.

  Etsi seuraavalle toimialalle sopivat arvostuskertoimet:

  Toimiala: "${industry}"

  TÄRKEÄÄ: 
  1. Käytä suomenkielisiä hakuja kuten "toimialan arvostuskertoimet" tai "yrityksen arvostus [toimiala]"
  2. Käytä luotettavia lähteitä kuten:
     * Business Brokerage Press (vuosittainen raportti)
     * BVR (Business Valuation Resources) 
     * Suomalaisia M&A julkaisuja
     * Toimialakohtaisia tutkimuksia

  3. Määritä kertoimien vaihteluväli:
     * Liikevaihtokertoimet (Revenue Multiplier): Minimi, keskiarvo ja maksimi
     * EV/EBIT-kertoimet: Minimi, keskiarvo ja maksimi

  4. Jos et löydä tarkkoja kertoimia tälle toimialalle, käytä vertailukelpoisen toimialan kertoimia
     tai toimialaraporttien keskiarvoja. Mikäli näitäkään ei löydy, käytä seuraavia oletuskertoimia:
     * Liikevaihtokerroin: min 0.5, avg 1.0, max 1.5
     * EV/EBIT: min 4.0, avg 6.0, max 8.0

  Palauta tiedot VAIN tässä JSON-muodossa:
  {
    "multipliers": {
      "revenue": {
        "min": numero,
        "avg": numero,
        "max": numero,
        "justification": "Lyhyt selitys miksi nämä kertoimet ovat sopivia",
        "source": "Käytetyn lähteen nimi"
      },
      "evEbit": {
        "min": numero,
        "avg": numero,
        "max": numero,
        "justification": "Lyhyt selitys miksi nämä kertoimet ovat sopivia",
        "source": "Käytetyn lähteen nimi"
      }
    }
  }`;

/**
 * Hakee arvostuskertoimet annetulle toimialalle
 */
export async function getIndustryMultipliers(industry: string, PERPLEXITY_API_KEY: string): Promise<any> {
  console.log(`Haetaan arvostuskertoimet toimialalle: ${industry}`);

  const messages = [
    {
      role: 'system',
      content: 'Olet arvostuskertoimien asiantuntija, joka määrittelee yrityksen arvostuskertoimia. Vastaa VAIN pyydetyssä JSON-muodossa ilman selityksiä.'
    },
    {
      role: 'user',
      content: multiplierPrompt(industry)
    }
  ];

  try {
    // Arvostuskertoimet haetaan ilman domain-rajoitusta
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log("Received multipliers response, content length:", content.length);

    const multipliersData = extractJSON(content);

    // Tarkistetaan että multipliers-objekti on olemassa
    if (!multipliersData.multipliers || 
        !multipliersData.multipliers.revenue || 
        !multipliersData.multipliers.evEbit) {
      throw new Error("Arvostuskertoimet ovat puutteellisia");
    }

    console.log(`Arvostuskertoimet haettu toimialalle ${industry}`);
    return multipliersData.multipliers;

  } catch (error) {
    console.error("Arvostuskertoimien haku epäonnistui:", error);

    // Jos kertoimien haku epäonnistuu, luodaan oletuskertoimet
    console.log("Luodaan oletuskertoimet toimialalle:", industry);
    return {
      revenue: {
        min: 0.5,
        avg: 1.0,
        max: 1.5,
        justification: "Oletuskertoimet, koska täsmällisiä kertoimia ei löytynyt toimialalle.",
        source: "Arventon oletuskertoimet"
      },
      evEbit: {
        min: 4.0,
        avg: 6.0,
        max: 8.0,
        justification: "Oletuskertoimet, koska täsmällisiä kertoimia ei löytynyt toimialalle.",
        source: "Arventon oletuskertoimet"
      }
    };
  }
}