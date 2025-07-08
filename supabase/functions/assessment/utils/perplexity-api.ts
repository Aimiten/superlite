// supabase/functions/assessment/utils/perplexity-api.ts

// Perplexity-funktio yrityksen taustatietojen hakemiseen
export async function getCompanyInfo(companyName: string): Promise<{
  rawResponse?: any;
  analysisText?: string;
  structuredData?: any;
  error?: string;
}> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API key not found in environment variables.");
    return { error: "Perplexity API key not found" };
  }

  console.log(`[getCompanyInfo] Getting company info for: ${companyName}`);

  // --- TIUKENNETTU PROMPT ---
  const prompt = `
    Etsi julkisista, luotettavista lähteistä (esim. yrityksen kotisivut, viranomaisrekisterit, mediakatsaukset) seuraavat tiedot yrityksestä nimeltä "${companyName}".
    Palauta vastaus **ainoastaan ja ehdottomasti** yhtenä validina JSON-objektina. Älä lisää mitään muuta tekstiä, selityksiä, johdantoja, johtopäätöksiä tai markdown-muotoiluja (kuten \`\`\`json).
    Vastauksesi TÄYTYY olla pelkkä JSON-objekti, joka noudattaa tarkasti alla olevaa rakennetta:

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
    1.  **liiketoiminnanKuvaus**: Lyhyt kuvaus siitä, mitä yritys konkreettisesti tekee (tuotteet/palvelut) ja missä se on erikoistunut.
    2.  **asiakasJaMarkkina**: Kenelle tuotteet/palvelut on suunnattu (esim. B2B, B2C) ja millaisilla markkinoilla (maantieteellisesti, toimialoittain) yritys toimii.
    3.  **kilpailuJaErot**: Mainitse yleisesti merkittävimmät kilpailijat tai kilpailukentän luonne ja miten yritys eroaa kilpailusta.
    4.  **strategiaJaTulevaisuus**: Kerro pääkohdat tulevista suunnitelmista, laajentumisesta, tuotekehityksestä.
    5.  **swot**: Lyhyt yhteenveto yrityksen vahvuuksista, heikkouksista, mahdollisuuksista ja uhista.
    6.  **riskitJaRegulaatio**: Millaiset ulkoiset ja toimialakohtaiset riskit vaikuttavat yritykseen? Onko lainsäädännöllä tai viranomaismääräyksillä erityistä merkitystä yrityksen liiketoiminnalle?
    7.  **brandiJaMaine**: Mahdolliset palkinnot, referenssit, mediassa ollut julkisuus, yms.
    8.  **lahteet**: Kerro lyhyesti, mistä (esim. yrityksen verkkosivut, uutisartikkelit, PR-julkaisut) hankit tiedot.

    **Erittäin tärkeää**:
    - Älä paljasta tai lisää taloudellisia tietoja (liikevaihto, tulos, tase, kertoimet jne.).
    - Vastaa **VAIN JA AINOASTAAN** yllä kuvatulla JSON-rakenteella.
    - Varmista, että KAIKKI JSON-avaimet JA merkkijonoarvot ovat standardien kaksoislainausmerkkien ("") sisällä. Älä käytä kaarevia lainausmerkkejä (“”).
  `;
  // --- PROMPT PÄÄTTYY ---

  try {
    console.log("[getCompanyInfo] Sending request to Perplexity API...");
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Käytä parasta saatavilla olevaa mallia tarkkuuden varmistamiseksi
        messages: [
          {
            role: 'system',
            // --- TIUKENNETTU SYSTEM PROMPT ---
            content: 'Olet talousasiantuntija, joka etsii täsmällistä tietoa yrityksistä. Palauta tiedot AINA JA VAIN validina JSON-objektina ilman mitään muuta tekstiä tai muotoiluja. Varmista JSONin validius ja standardien kaksoislainausmerkkien käyttö.'
            // --- SYSTEM PROMPT PÄÄTTYY ---
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Matala lämpötila tarkkuuden ja ohjeiden noudattamisen parantamiseksi
        max_tokens: 2500, // Riittävästi tilaa JSON-vastaukselle
        presence_penalty: 0,
        frequency_penalty: 0.5 // Pieni penalty toiston vähentämiseksi
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
          errorData = await response.json();
          console.error("[getCompanyInfo] Perplexity API error response:", errorData);
      } catch (e) {
          console.error("[getCompanyInfo] Perplexity API error: Failed to parse error response.", response.status, response.statusText);
          errorData = { message: response.statusText };
      }
      throw new Error(`Perplexity API error: ${errorData?.error?.message || errorData?.message || response.statusText} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log("[getCompanyInfo] Perplexity response received.");

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("[getCompanyInfo] Invalid response structure from Perplexity:", data);
        throw new Error("Perplexity API returned an unexpected response structure.");
    }

    // *** KORJATTU JSON-KÄSITTELY ***
    // Käytetään 'let', jotta muuttujaa voidaan muokata
    let rawContent = data.choices[0].message.content;
    console.log("[getCompanyInfo] Raw Perplexity content (first 500 chars):", rawContent.substring(0, 500) + (rawContent.length > 500 ? "..." : ""));

    let jsonData;
    let jsonStringForParsing = rawContent.trim(); // Poista ylimääräiset välilyönnit alusta ja lopusta

    // 1. Yritä poistaa markdown-koodilohko (` ```json ... ``` `)
    const markdownJsonPattern = /```json\s*([\s\S]*?)\s*```/;
    const markdownMatch = jsonStringForParsing.match(markdownJsonPattern);
    if (markdownMatch && markdownMatch[1]) {
      console.log("[getCompanyInfo] Found JSON in markdown format, extracting...");
      jsonStringForParsing = markdownMatch[1].trim(); // Otetaan vain lohkon sisältö
    } else {
      // Jos ei löytynyt ```json, tarkista onko vastaus pelkkä {}-lohko
      // ja poista mahdolliset ylimääräiset tekstit sen ulkopuolelta.
      // Tämä auttaa, jos malli lisää silti pienen johdannon tms.
      const pureJsonPattern = /(\{[\s\S]*\})/;
      const pureJsonMatch = jsonStringForParsing.match(pureJsonPattern);
      if (pureJsonMatch && pureJsonMatch[1]) {
         if (pureJsonMatch[1].length / jsonStringForParsing.length > 0.8) { // Varmistetaan, ettei poisteta liikaa
            console.log("[getCompanyInfo] Attempting to isolate JSON object from surrounding text...");
            jsonStringForParsing = pureJsonMatch[1];
         }
      }
    }

    // 2. Korjaa kaarevat lainausmerkit standardeiksi ("")
    const originalStringBeforeQuoteFix = jsonStringForParsing;
    jsonStringForParsing = jsonStringForParsing.replace(/“|”/g, '"');
    if (jsonStringForParsing !== originalStringBeforeQuoteFix) {
        console.log("[getCompanyInfo] Replaced curly quotes with standard double quotes.");
    }

    // 3. Yritä jäsentää korjattu merkkijono
    try {
      jsonData = JSON.parse(jsonStringForParsing);
      console.log("[getCompanyInfo] Successfully parsed JSON after initial cleanup (markdown/quotes).");
    } catch (parseError) {
      console.warn(`[getCompanyInfo] Initial JSON parsing failed: ${parseError.message}. Attempting further fixes.`);
      console.log("[getCompanyInfo] String attempted for parsing:", jsonStringForParsing.substring(0, 500) + (jsonStringForParsing.length > 500 ? "..." : ""));

      // Tässä voitaisiin lisätä monimutkaisempia korjausyrityksiä,
      // mutta usein markdown-poisto ja lainausmerkkien korjaus riittävät.
      // Esimerkiksi puuttuvien lainausmerkkien lisäys avaimiin voisi olla yksi,
      // mutta se on riskialtista ja voi rikkoa validin sisällön.
      // Pidetään tämä nyt yksinkertaisena.

      console.error("[getCompanyInfo] All JSON parsing attempts failed after cleanup.");
      console.log("[getCompanyInfo] Final string attempted for parsing:", jsonStringForParsing.substring(0, 500) + (jsonStringForParsing.length > 500 ? "..." : ""));
      return {
        rawResponse: data,
        analysisText: rawContent, // Palautetaan alkuperäinen raakateksti analyysiksi
        error: `Virhe vastauksen käsittelyssä: JSON-jäsentäminen epäonnistui korjausyritysten jälkeen. Virhe: ${parseError.message}`
      };
    }
    // *** JSON-KÄSITTELY PÄÄTTYY ***

    // Tarkistetaan, että saatu JSON sisältää odotettuja kenttiä (esimerkki)
    if (!jsonData || typeof jsonData.liiketoiminnanKuvaus === 'undefined') {
        console.warn("[getCompanyInfo] Parsed JSON seems incomplete or doesn't match expected structure:", jsonData);
        // Voit päättää, onko tämä virhe vai jatketaanko silti
    }

    console.log("[getCompanyInfo] Company info retrieved successfully.");
    // Palautetaan strukturoitu data ja alkuperäinen raakavastaus
    return {
      rawResponse: data,
      analysisText: rawContent, // Alkuperäinen Perplexityn vastaus teksti muodossa
      structuredData: {
        company_name: jsonData.yrityksenNimi || companyName,
        // Nämä kentät tulevat suoraan Perplexityn JSONista
        description: jsonData.liiketoiminnanKuvaus || "",
        market_position: jsonData.asiakasJaMarkkina || "",
        competition_differentiation: jsonData.kilpailuJaErot || "",
        strategy_future: jsonData.strategiaJaTulevaisuus || "",
        swot: jsonData.swot || { vahvuudet: "", heikkoudet: "", mahdollisuudet: "", uhat: "" },
        risks_regulation: jsonData.riskitJaRegulaatio || "",
        brand_reputation: jsonData.brandiJaMaine || "",
        sources: jsonData.lahteet || "",
        // Nämä kentät voidaan jättää tyhjäksi tai täyttää myöhemmin muista lähteistä jos tarpeen
        business_id: "",
        industry: "",
        employees: "",
        competitive_advantages: [], // Voi poimia esim. SWOTista tai kuvauksesta
        challenges: [], // Voi poimia esim. SWOTista
        key_products: [], // Voi poimia kuvauksesta
        website: "" // Voi yrittää etsiä lähteistä tai antaa erikseen
      }
    };

  } catch (error) {
    console.error(`[getCompanyInfo] Error calling Perplexity API or processing response for ${companyName}:`, error);
    // Varmistetaan, että palautetaan aina Error-objektin message
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `Virhe Perplexity API-kutsussa tai vastauksen käsittelyssä: ${errorMessage}`
    };
  }
}

// Uusi funktio myyntikuntoisuuden tietojen hakuun
export async function getReadinessForSaleInfo(companyName: string): Promise<{
  rawResponse?: any;
  analysisText?: string;
  structuredData?: any; // Tässä odotetaan sitä monimutkaisempaa JSON-rakennetta
  error?: string;
}> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API key not found in environment variables.");
    return { error: "Perplexity API key not found" };
  }

  console.log(`[getReadinessForSaleInfo] Getting readiness for sale info for: ${companyName}`);

  // --- TIUKENNETTU PROMPT ---
  const prompt = `
    Analysoi yrityksestä "${companyName}" saatavilla olevaa tietoa keskittyen myyntikuntoon laittamiseen.
    Palauta vastaus **ainoastaan ja ehdottomasti** yhtenä validina JSON-objektina. Älä lisää mitään muuta tekstiä, selityksiä, johdantoja, johtopäätöksiä tai markdown-muotoiluja (kuten \`\`\`json).
    Vastauksesi TÄYTYY olla pelkkä JSON-objekti, joka noudattaa tarkasti alla olevaa rakennetta:

    {
      "myyntikuntoon": {
        "myytavaKokonaisuus": {
          "kaupanRakenne": "Kuvaus tyypillisistä rakenteista tällä toimialalla (osake-/liiketoimintakauppa).",
          "mukanaOlevatToiminnot": "Mitä omaisuutta/toimintoja yleensä sisällytetään.",
          "ulkopuolelleJaavatToiminnot": "Mitä yleensä rajataan ulos."
        },
        "ostajanNakokulma": {
          "tyypillisetOstajat": ["Lista mahdollisista ostajaprofiileista (esim. 'Kilpailija', 'Pääomasijoittaja')."],
          "ostajienKysymykset": ["Lista tyypillisistä kysymyksistä/huolenaiheista."],
          "kriittisetTarkistuskohteet": ["Lista due diligence -painopisteistä."],
          "dealBreakerTekijat": ["Lista mahdollisista kaupan kariuttavista tekijöistä."]
        },
        "tilinpaatoksenOikaisut": {
          "tyypillisetOikaisut": ["Lista toimialalle tyypillisistä oikaisuista (esim. 'Omistajan palkka', 'Ylimääräiset edut')."],
          "kannattavuudenNormalisointi": "Kuvaus normalisoinnin erityispiirteistä.",
          "toimialavertailuKohteet": ["Lista vertailukohteista (esim. 'Myyntikate', 'Käyttökate')."]
        },
        "asiakasjakauma": {
          "optimaalinenRakenne": "Kuvaus optimaalisesta asiakasrakenteesta (diversifikaatio).",
          "sopimustenSiirrettavyys": "Huomioita sopimusten siirrettävyydestä.",
          "asiakasriskienHallinta": "Keinoja asiakasriskien hallintaan."
        },
        "operatiivisetRiippuvuudet": {
          "avainhenkilot": "Avainhenkilöriippuvuuden merkitys ja hallinta.",
          "prosessienDokumentointi": "Prosessien dokumentoinnin tärkeys ja tavat.",
          "toimittajasuhteet": "Toimittajasuhteiden merkitys ja hallinta."
        },
        "kasvupotentiaali": {
          "markkinakasvu": "Toimialan yleiset kasvunäkymät.",
          "kasvunKonkretisointi": "Miten kasvupotentiaali osoitetaan ostajalle.",
          "investointitarpeet": "Mahdolliset investointitarpeet kasvun saavuttamiseksi."
        },
        "lahteet": ["Lista käytetyistä tietolähteistä (jos tiedossa)."]
      }
    }

    Varmista, että kaikki JSON-kentät täytetään relevantilla tiedolla toimialakohtaisesti. Keskity konkreettisiin toimenpide-ehdotuksiin ja analyysiin.
    **Erittäin tärkeää**:
    - Vastaa **VAIN JA AINOASTAAN** yllä kuvatulla JSON-rakenteella.
    - Varmista, että KAIKKI JSON-avaimet JA merkkijonoarvot ovat standardien kaksoislainausmerkkien ("") sisällä. Älä käytä kaarevia lainausmerkkejä (“”).
  `;
  // --- PROMPT PÄÄTTYY ---

  try {
    console.log("[getReadinessForSaleInfo] Sending readiness for sale request to Perplexity API...");
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
            // --- TIUKENNETTU SYSTEM PROMPT ---
            content: 'Olet yrityskauppa-asiantuntija, joka analysoi yritysten myyntikuntoisuutta. Palauta analyysi AINA JA VAIN validina JSON-objektina noudattaen annettua rakennetta. Älä lisää mitään muuta tekstiä tai muotoiluja. Varmista JSONin validius ja standardien kaksoislainausmerkkien käyttö.'
            // --- SYSTEM PROMPT PÄÄTTYY ---
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000, // Tarvitaan enemmän tilaa tälle rakenteelle
        presence_penalty: 0,
        frequency_penalty: 0.5
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
          errorData = await response.json();
          console.error("[getReadinessForSaleInfo] Perplexity API error response:", errorData);
      } catch (e) {
          console.error("[getReadinessForSaleInfo] Perplexity API error: Failed to parse error response.", response.status, response.statusText);
          errorData = { message: response.statusText };
      }
      throw new Error(`Perplexity API error: ${errorData?.error?.message || errorData?.message || response.statusText} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log("[getReadinessForSaleInfo] Perplexity readiness for sale response received");

     if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("[getReadinessForSaleInfo] Invalid response structure from Perplexity:", data);
        throw new Error("Perplexity API returned an unexpected response structure.");
    }

    // *** KORJATTU JSON-KÄSITTELY (sama logiikka kuin getCompanyInfo) ***
    let rawContent = data.choices[0].message.content;
    console.log("[getReadinessForSaleInfo] Raw Perplexity content (first 500 chars):", rawContent.substring(0, 500) + (rawContent.length > 500 ? "..." : ""));

    let jsonData;
    let jsonStringForParsing = rawContent.trim();

    // 1. Poista markdown
    const markdownJsonPattern = /```json\s*([\s\S]*?)\s*```/;
    const markdownMatch = jsonStringForParsing.match(markdownJsonPattern);
    if (markdownMatch && markdownMatch[1]) {
      console.log("[getReadinessForSaleInfo] Found JSON in markdown format, extracting...");
      jsonStringForParsing = markdownMatch[1].trim();
    } else {
      const pureJsonPattern = /(\{[\s\S]*\})/;
      const pureJsonMatch = jsonStringForParsing.match(pureJsonPattern);
      if (pureJsonMatch && pureJsonMatch[1]) {
         if (pureJsonMatch[1].length / jsonStringForParsing.length > 0.8) {
            console.log("[getReadinessForSaleInfo] Attempting to isolate JSON object from surrounding text...");
            jsonStringForParsing = pureJsonMatch[1];
         }
      }
    }

    // 2. Korjaa lainausmerkit
    const originalStringBeforeQuoteFix = jsonStringForParsing;
    jsonStringForParsing = jsonStringForParsing.replace(/“|”/g, '"');
     if (jsonStringForParsing !== originalStringBeforeQuoteFix) {
        console.log("[getReadinessForSaleInfo] Replaced curly quotes with standard double quotes.");
    }

    // 3. Yritä jäsentää
    try {
      jsonData = JSON.parse(jsonStringForParsing);
      console.log("[getReadinessForSaleInfo] Successfully parsed JSON after initial cleanup.");
    } catch (parseError) {
      console.error(`[getReadinessForSaleInfo] All JSON parsing attempts failed after cleanup: ${parseError.message}`);
      console.log("[getReadinessForSaleInfo] Final string attempted for parsing:", jsonStringForParsing.substring(0, 500) + (jsonStringForParsing.length > 500 ? "..." : ""));
      return {
          rawResponse: data,
          analysisText: rawContent,
          error: `Virhe vastauksen käsittelyssä: JSON-jäsentäminen epäonnistui korjausyritysten jälkeen. Virhe: ${parseError.message}`
      };
    }
    // *** JSON-KÄSITTELY PÄÄTTYY ***

    // Tarkistetaan, että saatu JSON sisältää odotetun juurielementin
    if (!jsonData || !jsonData.myyntikuntoon) {
        console.warn("[getReadinessForSaleInfo] Parsed JSON missing 'myyntikuntoon' root element:", jsonData);
        return {
          rawResponse: data,
          analysisText: rawContent,
          // Voit päättää, palautetaanko silti saatu data vai heitetäänkö virhe
          structuredData: jsonData, // Palautetaan se mitä saatiin
          error: "Virhe vastauksen käsittelyssä: JSON-vastaus ei sisältänyt odotettua 'myyntikuntoon'-rakennetta."
        };
    }

    console.log("[getReadinessForSaleInfo] Readiness for sale info retrieved successfully.");
    return {
      rawResponse: data,
      analysisText: rawContent,
      structuredData: jsonData // Palautetaan koko jäsennetty JSON-objekti
    };

  } catch (error) {
    console.error(`[getReadinessForSaleInfo] Error calling Perplexity API or processing response for ${companyName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { // Palautetaan aina objekti, jossa error-kenttä
      error: `Virhe Perplexity API-kutsussa tai vastauksen käsittelyssä: ${errorMessage}`
    };
  }
}