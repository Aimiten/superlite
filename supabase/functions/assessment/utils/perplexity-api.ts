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

    // Parse the JSON content from the response
    let jsonData;
    try {
      const content = data.choices[0].message.content;
      console.log("Raw Perplexity content:", content);
      
      // Etsi JSON osa vastauksesta, mahdollisten lisätekstien jälkeen
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd);
        jsonData = JSON.parse(jsonStr);
      } else {
        jsonData = JSON.parse(content);
      }
    } catch (jsonError) {
      console.error("Error parsing JSON from Perplexity response:", jsonError);
      return {
        error: "Virhe vastauksen käsittelyssä"
      };
    }

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

// Uusi funktio myyntikuntoisuuden tietojen hakuun
export async function getReadinessForSaleInfo(companyName: string) {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not found");
  }

  console.log(`Getting readiness for sale info for: ${companyName}`);

  const prompt = `
    Analysoi yrityksestä "${companyName}" saatavilla olevaa tietoa keskittyen myyntikuntoon laittamiseen. Palauta JSON-muodossa seuraavat osa-alueet:

    1. Myytävä kokonaisuus
       - Tyypilliset yrityskaupan rakenteet tällä toimialalla (osakekauppa vs. liiketoimintakauppa)
       - Mikä omaisuus ja toiminnot tavallisesti sisällytetään / rajataan ulos kaupoissa

    2. Ostajan due diligence -painopisteet
       - Tyypilliset ostajien kysymykset ja huolenaiheet tämän toimialan yrityksissä
       - Kriittiset tarkistuskohteet, jotka todennäköisesti vaikuttavat kauppahintaan
       - Tyypilliset ostajaprofiilit ja heidän motiivinsa

    3. Tilinpäätöksen oikaisutarpeet
       - Toimialalle tyypilliset oikaisut (omistajan palkka, etuudet, liiketoimintaan kuulumattomat kulut)
       - Kannattavuuden normalisoinnin erityispiirteet

    4. Asiakasrakenne ja sopimukset
       - Asiakasportfolion diversifikaation merkitys tällä toimialalla
       - Sopimusten siirrettävyyden kriittiset kysymykset

    5. Operatiiviset riippuvuudet
       - Avainhenkilöiden osaamisen dokumentoinnin ja siirron merkitys
       - Toimittajasuhteiden ja prosessien dokumentoinnin erityispiirteet

    6. Kasvupotentiaalin todentaminen
       - Miten konkretisoida kasvupotentiaali ostajalle
       - Toimialan tulevaisuuden näkymät ostajan kannalta

    Palauta vastaus seuraavassa JSON-rakenteessa:

    {
      "myyntikuntoon": {
        "myytavaKokonaisuus": {
          "kaupanRakenne": "",
          "mukanaOlevatToiminnot": "",
          "ulkopuolelleJaavatToiminnot": ""
        },
        "ostajanNakokulma": {
          "tyypillisetOstajat": [],
          "ostajienKysymykset": [],
          "kriittisetTarkistuskohteet": [],
          "dealBreakerTekijat": []
        },
        "tilinpaatoksenOikaisut": {
          "tyypillisetOikaisut": [],
          "kannattavuudenNormalisointi": "",
          "toimialavertailuKohteet": []
        },
        "asiakasjakauma": {
          "optimaalinenRakenne": "",
          "sopimustenSiirrettavyys": "",
          "asiakasriskienHallinta": ""
        },
        "operatiivisetRiippuvuudet": {
          "avainhenkilot": "",
          "prosessienDokumentointi": "",
          "toimittajasuhteet": ""
        },
        "kasvupotentiaali": {
          "markkinakasvu": "",
          "kasvunKonkretisointi": "",
          "investointitarpeet": ""
        },
        "lahteet": []
      }
    }

    Varmista, että kaikki JSON-kentät täytetään, ja että JSON-rakenne on validi. Keskity toimialakohtaisiin erityispiirteisiin ja konkreettisiin toimenpide-ehdotuksiin, jotka auttavat juuri tätä yritystä myyntikuntoon laittamisessa.
  `;

  try {
    console.log("Sending readiness for sale request to Perplexity API...");
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
            content: 'Olet yrityskauppa-asiantuntija, joka etsii täsmällistä tietoa yritysten myyntikuntoon laittamisesta. Palauta tiedot vain JSON-muodossa. Älä lisää mitään selityksiä, johdantoja tai muuta tekstiä.'
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
    console.log("Perplexity readiness for sale response received");

    // Parse the JSON content from the response
    let jsonData;
    try {
      const content = data.choices[0].message.content;
      console.log("Raw Perplexity content:", content);
      
      // Etsi JSON osa vastauksesta, mahdollisten lisätekstien jälkeen
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = content.substring(jsonStart, jsonEnd);
        jsonData = JSON.parse(jsonStr);
      } else {
        jsonData = JSON.parse(content);
      }

      return {
        rawResponse: data,
        analysisText: data.choices[0].message.content,
        structuredData: jsonData
      };
    } catch (jsonError) {
      console.error("Error parsing JSON from Perplexity response:", jsonError);
      return {
        error: "Virhe vastauksen käsittelyssä"
      };
    }
  } catch (error) {
    console.error("Error calling Perplexity API for readiness for sale:", error);
    throw new Error(`Virhe Perplexity API-kutsussa: ${error.message}`);
  }
}
