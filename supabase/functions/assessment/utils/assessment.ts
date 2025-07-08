// supabase/functions/assessment/utils/assessment.ts

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, type Part } from "https://esm.sh/@google/generative-ai@0.23.0";

// The model name that should always be used for all Gemini API calls
// >>> KÄYTETÄÄN ANTAMAASI MALLIA <<<
const GEMINI_MODEL = "gemini-2.5-flash-lite-preview-06-17"; // Päivitetty uuteen lite-malliin

// --- TURVALLISUUSASETUKSET ---
// Määritellään turvallisuusasetukset estämään haitallista sisältöä
// Nämä ovat melko tiukat asetukset
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
// --- TURVALLISUUSASETUKSET PÄÄTTYY ---


export async function analyzeAssessmentAnswers(
  companyName: string,
  companyInfo: any, // Oletetaan, että tämä sisältää { structuredData: {...}, analysisText: "..." } tai { error: "..." }
  answers: Record<string, any>, // Oletetaan { questionId: answerValue }
  documentsWithContent?: { // Odotetaan dokumentteja sisällön kanssa
      id?: string;
      name: string;
      document_type?: string;
      file_type?: string;
      text?: string; // Dokumentin tekstisisältö (jos purettu)
      base64?: string | null; // Base64-koodattu sisältö (esim. PDF)
      error?: string | null; // Virhe dokumentin käsittelyssä
  }[],
  readinessForSaleData?: any, // Oletetaan { structuredData: {...}, analysisText: "...", rawResponse: ... } tai { error: "..." }
  valuationData?: any // Uusi parametri arvonmääritystiedoille
): Promise<{ // Määritellään palautustyyppi selkeämmin
  analysisReport?: any; // Tässä on varsinainen raportti JSON-muodossa
  error?: string; // Virheilmoitus, jos jokin menee pieleen
}> {
  console.log(`[analyzeAssessmentAnswers] Starting detailed analysis for: ${companyName}`);
  const geminiParts: Part[] = []; // Käytetään tyypitettyä Part-taulukkoa

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("[analyzeAssessmentAnswers] Gemini API key not found.");
      return { error: "Gemini API key not found" };
    }

    // --- 1. Käsittele frontendiltä saadut dokumentit ---
    const documentProcessingInfo: string[] = [];
    const docsArray = documentsWithContent && Array.isArray(documentsWithContent)
      ? documentsWithContent
      : (documentsWithContent ? [documentsWithContent] : []);

    let addedDocsCount = 0;
    if (docsArray.length > 0) {
      console.log(`[analyzeAssessmentAnswers] Received ${docsArray.length} documents.`);
      for (const doc of docsArray) {
        if (!doc) {
          console.log("[analyzeAssessmentAnswers] Skipping undefined/null document entry.");
          continue;
        }
        if (doc.error) {
          documentProcessingInfo.push(`- Dokumenttia '${doc.name || "tuntematon"}' ei voitu käyttää virheen vuoksi: ${doc.error}`);
          console.warn(`[analyzeAssessmentAnswers] Document '${doc.name || "tuntematon"}' skipped due to error: ${doc.error}`);
        } else if (doc.base64 && doc.file_type?.startsWith('application/pdf')) {
          // Varmistetaan, että base64 ei ole null tai tyhjä
          if (doc.base64.length > 0) {
              // Puhdista base64-merkkijono poistamalla mahdollinen header
              const cleanBase64 = doc.base64.replace(/^data:application\/pdf;base64,/, "");

              // Lisää dokumentti oikeassa muodossa geminiParts-taulukkoon
              geminiParts.push({ 
                inlineData: { 
                  mimeType: 'application/pdf', 
                  data: cleanBase64 
                } 
              });
              documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (PDF) annettu kontekstiksi.`);
              addedDocsCount++;
              console.log(`[analyzeAssessmentAnswers] Added PDF document '${doc.name || "tuntematon"}' to Gemini context.`);
          } else {
              documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (PDF) oli tyhjä.`);
              console.warn(`[analyzeAssessmentAnswers] Document '${doc.name || "tuntematon"}' (PDF) was empty.`);
          }
        } else if (doc.text) {
           // Varmistetaan, että teksti ei ole null tai tyhjä
          if (doc.text.trim().length > 0) {
              // Teksti lisätään osaksi promptia myöhemmin, EI suoraan parts-taulukkoon erillisenä elementtinä tässä vaiheessa
              // Merkitään se kuitenkin käsitellyksi
              documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (Tyyppi: ${doc.file_type || 'teksti/tuntematon'}) annettu kontekstiksi tekstinä.`);
              addedDocsCount++; // Lasketaan mukaan, koska sen sisältö lisätään promptiin
          } else {
              documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (Tyyppi: ${doc.file_type || 'teksti/tuntematon'}) oli tyhjä.`);
              console.warn(`[analyzeAssessmentAnswers] Document '${doc.name || "tuntematon"}' (text) was empty.`);
          }
        } else {
          documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' ei sisältänyt käyttökelpoista sisältöä (ei base64 PDF:lle, ei tekstiä).`);
          console.warn(`[analyzeAssessmentAnswers] Document '${doc.name || "tuntematon"}' had no usable content.`);
        }
      }
      console.log(`[analyzeAssessmentAnswers] Processed ${addedDocsCount} documents for Gemini context (PDFs added as inlineData, text content will be added to prompt).`);
    } else {
      documentProcessingInfo.push("- Ei dokumentteja annettu analysoitavaksi.");
    }

    // --- 2. Rakenna prompt ---
    const companyBaseInfo = companyInfo?.structuredData?.description
        ? `Yrityksen peruskuvaus: ${companyInfo.structuredData.description}`
        : (companyInfo?.analysisText && !companyInfo.error ? `Yrityksen yleisanalyysi: ${companyInfo.analysisText}` : "Yrityksen perustietoja ei saatavilla.");

    let prompt = `Suorita syvällinen myyntikuntoisuusanalyysi yritykselle "${companyName}". Perusta analyysi KAIKKIIN annettuihin tietoihin: yrityksen yleiskuvaus, käyttäjän vastaukset kysymyksiin, myyntikuntoisuusanalyysin pohjatiedot (jos annettu) sekä erikseen toimitetut dokumentit (PDF-sisältö annettu ohessa, tekstisisältö alla).

**Analyysin tavoitteet:**
1.  **Tunnista nykytila:** Arvioi yrityksen vahvuudet ja heikkoudet myyntikuntoisuuden kannalta eri osa-alueilla (sopimukset, prosessit, talous, asiakkaat, kasvu/strategia, henkilöstö). Ole spesifi ja perustele havaintosi suoraan annettuihin vastauksiin ja dokumentteihin viitaten (mainitse mistä tieto on peräisin, esim. "Vastauksesta kysymykseen X", "Dokumentista Y").
2.  **Laadi konkreettiset kehitysehdotukset:** Anna selkeitä, toteuttamiskelpoisia toimenpide-ehdotuksia tunnistettujen heikkouksien korjaamiseksi ja myyntikuntoisuuden parantamiseksi. Priorisoi ehdotukset (korkea, keskitaso, matala) niiden oletetun vaikuttavuuden perusteella.
3.  **Listaa selvitettävät asiat:** Tunnista tiedon puutteet tai epäselvyydet, jotka vaativat lisäselvitystä ennen potentiaalista myyntiprosessia. Nämä voivat liittyä vastauksiin, dokumentteihin tai yleisiin tietoihin. Luo näistä selkeä lista.
4.  **Muodosta sanallinen yhteenveto:** Kirjoita tiivis, mutta kattava johtopäätös yrityksen nykyisestä myyntikuntoisuudesta ja sen parantamisen potentiaalista.

**Annetut tiedot:**

${companyBaseInfo}
`;

    // Lisää myyntikuntoisuuden pohjatiedot, jos saatavilla ja virheettömät
    if (readinessForSaleData && !readinessForSaleData.error && readinessForSaleData.structuredData) {
        try {
            // Poistetaan turha 'lahteet' kenttä promptista, jos se on vain lista
            const readinessDataForPrompt = JSON.parse(JSON.stringify(readinessForSaleData.structuredData)); // Deep copy
            if (readinessDataForPrompt?.myyntikuntoon?.lahteet && Array.isArray(readinessDataForPrompt.myyntikuntoon.lahteet)) {
                // Jätetään lähteet pois promptista selkeyden vuoksi, jos ne ovat vain lista
                // delete readinessDataForPrompt.myyntikuntoon.lahteet; // Tai jätetään ne mukaan
            }
             prompt += `\nMyyntikuntoon liittyviä esitietoja yrityksestä (Perplexityn analyysi):\n${JSON.stringify(readinessDataForPrompt, null, 2)}\n`;
        } catch (stringifyError) {
            console.error("[analyzeAssessmentAnswers] Error stringifying readinessForSaleData:", stringifyError);
            prompt += "\nMyyntikuntoon liittyviä esitietoja ei voitu lisätä virheen vuoksi.\n";
        }
    } else if (readinessForSaleData?.error) {
         prompt += `\nMyyntikuntoon liittyviä esitietoja ei saatu haettua virheen vuoksi: ${readinessForSaleData.error}\n`;
    }

    // Lisää arvonmääritystiedot promptiin, jos saatavilla
    if (valuationData) {
      try {
        // Lisätään arvonmääritystietojen yhteenveto
        prompt += "\n**Arvonmäärityksen tiedot:**\n";

        // Lisätään normalisointien yhteenveto
        if (valuationData.normalization_summary) {
          prompt += `\nTilinpäätöstietojen normalisoinnit: ${valuationData.normalization_summary}\n`;
        }

        // Lisätään yksityiskohtaiset normalisoinnit
        if (valuationData.applied_normalizations && Array.isArray(valuationData.applied_normalizations) && valuationData.applied_normalizations.length > 0) {
          prompt += "\nSovelletut normalisoinnit:\n";
          valuationData.applied_normalizations.forEach((normalization: any, index: number) => {
            prompt += `${index+1}. ${normalization.explanation} (Alkuperäinen arvo: ${normalization.original_value}, Normalisoitu arvo: ${normalization.normalized_value})\n`;
          });
        }

        // Lisätään käyttäjän vastaukset arvonmäärityksessä
        if (valuationData.user_answers && Object.keys(valuationData.user_answers).length > 0) {
          prompt += "\nArvonmäärityksessä annetut tiedot:\n";
          Object.entries(valuationData.user_answers).forEach(([key, value]) => {
            prompt += `- ${key}: ${value}\n`;
          });
        }

        // Lisätään arvonmäärityksen perustelut
        if (valuationData.valuation_rationale) {
          prompt += `\nArvonmäärityksen perusteet: ${valuationData.valuation_rationale}\n`;
        }

        // Lisätään arvonmäärityksen keskeiset havainnot
        if (valuationData.key_points && valuationData.key_points.content) {
          prompt += `\nArvonmäärityksen keskeiset havainnot: ${valuationData.key_points.content}\n`;
        }

        console.log("[analyzeAssessmentAnswers] Added valuation data to prompt");
      } catch (valuationError) {
        console.error("[analyzeAssessmentAnswers] Error adding valuation data to prompt:", valuationError);
        prompt += "\nArvonmääritystietoja oli saatavilla, mutta niiden käsittelyssä tapahtui virhe.\n";
      }
    }

    prompt += `\nKäyttäjän vastaukset kysymyksiin:\n`
    prompt += Object.entries(answers)
      .map(([questionId, answer]) => {
        let answerString;
        // Käsittele erilaisia vastaustyyppejä selkeämmin
        if (answer === null || typeof answer === 'undefined') answerString = 'Ei vastausta';
        // Käsittele ohitetut kysymykset
        else if (answer && typeof answer === 'object' && 'skipped' in answer) answerString = '[Ohitettu]';
        // Käsittele multiselect-vastaukset (labels-array)
        else if (answer && typeof answer === 'object' && 'labels' in answer && Array.isArray(answer.labels)) answerString = answer.labels.join(", ");
        // Käsittele scale/select-vastaukset (label-string)
        else if (answer && typeof answer === 'object' && 'label' in answer) answerString = answer.label;
        else if (Array.isArray(answer)) answerString = answer.length > 0 ? `[${answer.join(", ")}]` : '[] (Tyhjä valinta)';
        else if (typeof answer === 'object') answerString = JSON.stringify(answer);
        else if (typeof answer === 'boolean') answerString = answer ? 'Kyllä' : 'Ei';
        else if (typeof answer === 'string' && answer.trim() === '') answerString = '(Tyhjä tekstivastaus)';
        else answerString = String(answer);
        // Tähän voisi ideaalitilanteessa hakea kysymyksen tekstin ID:n perusteella, mutta se vaatisi lisälogiikkaa
        return `- Kysymys (ID: ${questionId}): ${answerString}`;
      })
      .join("\n");
    prompt += "\n";


    // Lisätään tieto käsitellyistä dokumenteista
    prompt += `\nAnalyysissä huomioidut dokumentit:\n`;
    prompt += documentProcessingInfo.join('\n');
    prompt += "\n";

    // Lisätään tekstidokumenttien sisältö promptin loppuun
    let textContentForPrompt = "";
    if (docsArray.length > 0) {
        docsArray.forEach(doc => {
            // Lisää teksti vain, jos se on olemassa, ei ole virhettä, eikä se ole tyhjä
            if (doc && doc.text && !doc.error && doc.text.trim().length > 0) {
                // Lyhennetään erittäin pitkiä tekstejä token-rajan säästämiseksi
                const MAX_TEXT_LENGTH = 70000; // Max merkkimäärä per dokumentti promptissa
                const truncatedText = doc.text.length > MAX_TEXT_LENGTH
                    ? doc.text.substring(0, MAX_TEXT_LENGTH) + "\n...(teksti lyhennetty)...\n"
                    : doc.text;

                textContentForPrompt += `\n--- DOKUMENTIN '${doc.name || "tuntematon"}' TEKSTISISÄLTÖ ---\n`;
                textContentForPrompt += truncatedText;
                textContentForPrompt += `\n--- DOKUMENTIN '${doc.name || "tuntematon"}' LOPPU ---\n`;
            }
        });
    }
    if (textContentForPrompt) {
        prompt += "\n" + textContentForPrompt;
    }


    // --- TARKKA JSON-OHJEISTUS RAPORTILLE ---
    prompt += `

TÄRKEÄÄ: Palauta vastauksesi **ainoastaan ja ehdottomasti** yhtenä validina JSON-objektina ilman mitään ylimääräistä tekstiä, selityksiä tai markdown-muotoiluja. JSON-objektin tulee noudattaa tarkasti seuraavaa rakennetta:

{
  "myyntikuntoisuusRaportti": {
    "yhteenveto": "Tiivis sanallinen johtopäätös (max 3-4 virkettä) yrityksen nykyisestä myyntikuntoisuudesta, keskeisimmistä havainnoista ja parannuspotentiaalista.",
    "havainnot": {
      "vahvuudet": [
        {
          "osaAlue": "Kategoria (esim. Sopimukset, Talous, Asiakkaat, Prosessit, Henkilöstö, Strategia)",
          "havainto": "Spesifinen vahvuus liittyen tähän osa-alueeseen perustuen annettuihin tietoihin (vastaukset/dokumentit).",
          "perustelu": "Lyhyt perustelu, miksi tämä on vahvuus myynnin kannalta ja mistä tieto on peräisin (esim. 'Vastaus kysymykseen X', 'Dokumentti Y')."
        }
        // ... lisää muita vahvuuksia tarvittaessa (max 5-7 kpl)
      ],
      "heikkoudetJaKehityskohteet": [
        {
          "osaAlue": "Kategoria (esim. Sopimukset, Talous, Asiakkaat, Prosessit, Henkilöstö, Strategia)",
          "havainto": "Spesifinen heikkous tai kehityskohde liittyen tähän osa-alueeseen perustuen annettuihin tietoihin.",
          "vaikutus": "Lyhyt kuvaus, miten tämä heikkous voi vaikuttaa myyntikuntoisuuteen tai kauppahintaan ja mistä tieto on peräisin."
        }
        // ... lisää muita heikkouksia tarvittaessa (max 5-7 kpl)
      ]
    },
    "kehitysehdotukset": [
      {
        "otsikko": "Konkreettinen toimenpide-ehdotuksen otsikko (max 5-10 sanaa).",
        "kuvaus": "Tarkempi selitys toimenpiteestä, sen tavoitteista ja mahdollisista toteutustavoista (max 2-3 virkettä).",
        "liittyyHeikkouteen": "Viittaus yllä listattuun heikkouteen/havaintoon, jota tämä korjaa (esim. 'Heikkous: Prosessien dokumentointi').",
        "prioriteetti": "korkea | keskitaso | matala",
        "oletettuVaikutus": "Lyhyt kuvaus, miten tämän toimenpiteen odotetaan parantavan myyntikuntoisuutta (esim. 'Vähentää ostajan riskiä', 'Parantaa ennustettavuutta')."
      }
      // ... lisää kehitysehdotuksia tarvittaessa (järjestä prioriteetin mukaan, korkein ensin, max 5-7 kpl)
    ],
    "selvitettavatAsiat": [
      {
        "aihe": "Asia tai kysymys, joka vaatii lisäselvitystä.",
        "kysymysTaiTehtava": "Mitä konkreettisesti pitää selvittää tai tehdä?",
        "miksiTarkea": "Miksi tämän asian selvittäminen on tärkeää myyntiprosessin tai arvonmäärityksen kannalta."
      }
      // ... lisää selvitettäviä asioita tarvittaessa (max 3-5 kpl)
    ]
  }
}

Varmista, että kaikki kentät täytetään relevantilla tiedolla annettujen tietojen perusteella. Jos johonkin kohtaan ei löydy tietoa, mainitse se perusteluissa tai jätä lista tyhjäksi ([]). Koko vastauksesi tulee olla tämä yksi JSON-objekti. Älä käytä markdownia.
`;
    // --- JSON-OHJEISTUS PÄÄTTYY ---

    // Lisätään tekstiprompt osaksi parts-taulukkoa
    geminiParts.push({ text: prompt });

    // Luodaan lopullinen contents-rakenne
    const contents = [{ role: "user", parts: geminiParts }];

    // --- 3. Kutsu Gemini ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        safetySettings: safetySettings // Lisätään turvallisuusasetukset
    });

    const generationConfig = {
      temperature: 0.4, // Pidä analyyttisena, mutta salli hieman luovuutta johtopäätöksissä
      maxOutputTokens: 8192, // Varmista riittävä tila laajalle raportille
      responseMimeType: "application/json", // Pyydetään JSON-vastausta
      // EI käytetä responseSchemaa tässä, koska prompti on erittäin tarkka
    };

    console.log(`[analyzeAssessmentAnswers] Sending request to Gemini (${GEMINI_MODEL}) with ${geminiParts.filter(p => p.inlineData).length} inline docs and text prompt length approx ${prompt.length} chars.`);

    const result = await model.generateContent({ contents, generationConfig });

    // Tarkistetaan vastaus ennen sen käyttöä
    if (!result.response) {
        console.error("[analyzeAssessmentAnswers] Gemini response was missing.");
        throw new Error("Gemini API did not return a response.");
    }

     // Tarkistetaan, estettiinkö vastaus turvallisuussyistä
    const safetyRatings = result.response.promptFeedback?.safetyRatings;
    if (result.response.promptFeedback?.blockReason || (safetyRatings && safetyRatings.some(rating => rating.blocked))) {
      console.error("[analyzeAssessmentAnswers] Gemini request/response was blocked due to safety settings.");
      console.error("Block Reason:", result.response.promptFeedback?.blockReason);
      console.error("Safety Ratings:", safetyRatings);
      throw new Error(`Gemini esti vastauksen turvallisuussyistä: ${result.response.promptFeedback?.blockReason || 'Tuntematon syy'}`);
    }


    const responseText = result.response.text();
    // console.log(`[analyzeAssessmentAnswers] Gemini raw response text (first 500 chars): ${responseText.substring(0,500)}...`); // Loggaa vain tarvittaessa debug-mielessä

    // --- 4. Jäsennä ja palauta ---
    try {
      const analysis = JSON.parse(responseText);
      // Tarkistetaan, että odotettu päärakenne löytyy
      if (!analysis || !analysis.myyntikuntoisuusRaportti) {
         console.error("[analyzeAssessmentAnswers] Parsed JSON missing 'myyntikuntoisuusRaportti' root element.", analysis);
         // Yritetään palauttaa edes jotain, jos parsinta onnistui
         return {
             analysisReport: analysis, // Palautetaan mitä saatiin
             error: "Analyysivastauksen rakenne ei vastaa odotettua (puuttuva 'myyntikuntoisuusRaportti'-objekti)."
            };
      }
      console.log("[analyzeAssessmentAnswers] Successfully parsed detailed analysis report.");
      return { analysisReport: analysis }; // Palautetaan koko raportti
    } catch (parseError) {
      console.error("[analyzeAssessmentAnswers] Error parsing Gemini JSON response:", parseError);
      // Logataan koko raakavastaus virhetilanteessa
      console.error("[analyzeAssessmentAnswers] Full Gemini raw response text on parse error:", responseText);
      return {
          error: `Analyysivastauksen jäsennys epäonnistui: ${parseError.message}. Vastaus ei ollut validia JSON:ia tai ei vastannut vaadittua rakennetta.`
        };
    }

  } catch (error) {
    console.error(`[analyzeAssessmentAnswers] Error during analysis for ${companyName}:`, error);
    // Varmistetaan, että palautetaan aina Error-objektin message
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Virhe myyntikuntoisuuden analysoinnissa: ${errorMessage}` };
  }
}


export async function generateAssessmentQuestions(
  companyName: string,
  companyInfo: any, // Sisältää { structuredData: {...}, analysisText: "..." } tai { error: "..." }
  documentsWithContent?: { // Odotetaan dokumentteja sisällön KERA
      id?: string;
      name: string;
      document_type?: string;
      file_type?: string;
      text?: string;
      base64?: string | null;
      error?: string | null;
  }[],
  readinessForSaleData?: any, // Sisältää { structuredData: {...}, ... } tai { error: "..." }
  valuationData?: any // Uusi parametri arvonmääritystiedoille
): Promise<any[] | { error: string }> { // Palauttaa kysymystaulukon tai virheobjektin
  console.log(`[generateAssessmentQuestions] Starting question generation for: ${companyName}`);
  const geminiParts: Part[] = []; // Käytetään tyypitettyä Part-taulukkoa

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
        console.error("[generateAssessmentQuestions] Gemini API key not found.");
        return { error: "Gemini API key not found" };
    }

    // --- 1. Käsittele dokumentit (sama logiikka kuin analyysissä) ---
    const documentProcessingInfo: string[] = [];
    const docsArray = documentsWithContent && Array.isArray(documentsWithContent)
      ? documentsWithContent
      : (documentsWithContent ? [documentsWithContent] : []);

    let addedDocsCount = 0;
    if (docsArray.length > 0) {
      console.log(`[generateAssessmentQuestions] Received ${docsArray.length} documents.`);
      for (const doc of docsArray) {
         if (!doc) {
            console.log("[generateAssessmentQuestions] Skipping undefined/null document entry.");
            continue;
         }
        if (doc.error) {
          documentProcessingInfo.push(`- Dokumenttia '${doc.name || "tuntematon"}' ei voitu käyttää: ${doc.error}`);
          console.warn(`[generateAssessmentQuestions] Document '${doc.name || "tuntematon"}' skipped due to error: ${doc.error}`);
        } else if (doc.base64 && doc.file_type?.startsWith('application/pdf')) {
            if (doc.base64.length > 0) {
                // Puhdista base64-merkkijono poistamalla mahdollinen header
                const cleanBase64 = doc.base64.replace(/^data:application\/pdf;base64,/, "");

                // Lisää dokumentti oikeassa muodossa geminiParts-taulukkoon
                geminiParts.push({ 
                  inlineData: { 
                    mimeType: 'application/pdf', 
                    data: cleanBase64 
                  } 
                });
                documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (PDF) annettu kontekstiksi.`);
                addedDocsCount++;
                console.log(`[generateAssessmentQuestions] Added PDF document '${doc.name || "tuntematon"}' to Gemini context.`);
            } else {
                 documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (PDF) oli tyhjä.`);
                 console.warn(`[generateAssessmentQuestions] Document '${doc.name || "tuntematon"}' (PDF) was empty.`);
            }
        } else if (doc.text) {
            if (doc.text.trim().length > 0) {
                // Teksti lisätään promptiin myöhemmin
                documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (Tyyppi: ${doc.file_type || 'teksti/tuntematon'}) annettu kontekstiksi tekstinä.`);
                addedDocsCount++;
            } else {
                 documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' (Tyyppi: ${doc.file_type || 'teksti/tuntematon'}) oli tyhjä.`);
                 console.warn(`[generateAssessmentQuestions] Document '${doc.name || "tuntematon"}' (text) was empty.`);
            }
        } else {
          documentProcessingInfo.push(`- Dokumentti '${doc.name || "tuntematon"}' ei sisältänyt käyttökelpoista sisältöä.`);
           console.warn(`[generateAssessmentQuestions] Document '${doc.name || "tuntematon"}' had no usable content.`);
        }
      }
       console.log(`[generateAssessmentQuestions] Processed ${addedDocsCount} documents for Gemini context.`);
    } else {
      documentProcessingInfo.push("- Ei dokumentteja annettu kontekstiksi.");
    }

    // --- 2. Rakenna prompt ---
     const companyDataSources = [];
    if (companyInfo?.structuredData?.description) companyDataSources.push(`- Kuvaus: ${companyInfo.structuredData.description}`);
    if (companyInfo?.structuredData?.market_position) companyDataSources.push(`- Markkina: ${companyInfo.structuredData.market_position}`);
    if (companyInfo?.structuredData?.competition_differentiation) companyDataSources.push(`- Kilpailu/Erot: ${companyInfo.structuredData.competition_differentiation}`);
    if (companyInfo?.structuredData?.swot?.vahvuudet) companyDataSources.push(`- Vahvuudet (SWOT): ${companyInfo.structuredData.swot.vahvuudet}`);
    if (companyInfo?.structuredData?.swot?.heikkoudet) companyDataSources.push(`- Heikkoudet (SWOT): ${companyInfo.structuredData.swot.heikkoudet}`);
    if (companyInfo?.analysisText && !companyInfo.error && companyDataSources.length === 0) {
        // Käytä yleisanalyysia vain jos strukturoitua dataa ei juuri ollut
        companyDataSources.push(`- Yleisanalyysi: ${companyInfo.analysisText.substring(0, 500)}...`);
    }
    const companyDescription = companyDataSources.length > 0 ? companyDataSources.join("\n") : "Yleistietoja yrityksestä ei saatavilla.";


    let prompt = `Luo 10-16 räätälöityä, syvällistä kysymystä yrityksen "${companyName}" myyntikuntoisuuden arviointia varten. Hyödynnä alla olevia yrityksen taustatietoja sekä ohessa annettujen dokumenttien sisältöä (PDF-data annettu erikseen, tekstisisältö alla).

**KRIITTINEN SÄÄNTÖ: Jokainen kysymys saa sisältää VAIN YHDEN kysymyksen. Erityisesti:**
- numeric-tyyppi: VAIN numeroarvo, EI lisäkysymyksiä (esim. 'ja miten...')
- Jos haluat kysyä sekä määrän että strategian, tee KAKSI ERILLISTÄ kysymystä
- Konteksti kuuluu 'description'-kenttään, ei itse kysymykseen
RIKKOMINEN JOHTAA HYLKÄÄMISEEN.

**Arvioinnin tavoitteet:**
- Tuota monipuolinen arviointikehys, joka kartoittaa kattavasti yrityksen myyntikuntoisuuden kriittiset osa-alueet erityisesti suomalaisessa ja EU-kontekstissa.
- Kysymysten tulee paljastaa konkreettisia kehityskohteita, joita voidaan parantaa ennen myyntiprosessia.
- Hyödynnä tieteellisesti perusteltua lähestymistapaa, joka huomioi sekä myyjän että ostajan näkökulman.

**Kysymysten suunnitteluohjeet:**
1. Varmista, että kysymykset jakautuvat tasapainoisesti seuraavien SEITSEMÄN kriittisen osa-alueen kesken (vähintään 1-2 kysymystä jokaiselta):
   - Taloudellinen kunto (painotus: 20%)
   - Johto ja organisaatiorakenne (painotus: 15%)
   - Markkina-asema ja kilpailuetu (painotus: 15%)
   - Operatiivinen tehokkuus ja prosessit (painotus: 15%)
   - Oikeudelliset ja sääntelyn noudattamistekijät (painotus: 10%)
   - Asiakaskunnan laatu (painotus: 15%)
   - Digitaalinen valmius ja teknologiajärjestelmät (painotus: 10%)

2. Muotoile kysymykset niin, että ne:
   - Ovat spesifisiä ja konkreettisia, eivät yleisluontoisia
   - Paljastavat myyntikuntoon liittyviä riskejä ja kehitysmahdollisuuksia
   - Auttavat arvioimaan yrityksen arvoa ostajan näkökulmasta
   - Pohjautuvat saatuihin yritystietoihin ja dokumenttien sisältöön (mainitse tiedot jotka löytyivät)
   - Tuottavat toimintasuuntautunutta tietoa myyntikuntoisuuden parantamiseksi
   - ÄLÄ kysy numeroarvoja jotka ovat suoraan laskettavissa dokumenteista (esim. kasvuprosentit, keskiarvot)
   - ÄLÄ kysy "mikä selittää X tulosta" jos näet tilinpäätöksen - voit itse analysoida syyt
   - Kysy sen sijaan TULEVAISUUDEN SUUNNITELMIA ja TOIMENPITEITÄ

3. Sisällytä erityisesti pk-yrityksen erityispiirteitä huomioivia kysymyksiä kuten:
   - Omistajayrittäjän rooli ja riippuvuus
   - Rajoitettujen resurssien ja dokumentaation haasteet
   - Asiakkaiden ja toimittajien keskittymisriskit
   - Suppean johtoportaan vaikutukset

4. Käytä seuraavia kysymystyyppejä NÄIN JA VAIN NÄIN:
   - multiselect/select (40% kysymyksistä): Aina kun mahdollista! Anna konkreettiset vaihtoehdot.
     Esim. ✓ 'Mitkä prosessit on dokumentoitu?' ['Myynti', 'Projektinhallinta', 'Asiakaspalvelu', 'Taloushallinto']
   - boolean (20%): Selkeät kyllä/ei-kysymykset
     Esim. ✓ 'Onko yrityksellä kirjallinen jatkuvuussuunnitelma?'
   - numeric (20%): VAIN tarkka numero ilman selityksiä
     Esim. ✓ 'Kuinka monta työntekijää yrityksessä on?'
   - scale (15%): AINA lisää options-kenttään selitykset!
     Esim. ✓ options: ['1 - Ei lainkaan', '2 - Heikosti', '3 - Kohtalaisesti', '4 - Hyvin', '5 - Erinomaisesti']
   - text (5% MAX): Vain 1-2 kriittistä strategiakysymystä
     Esim. ✓ 'Mikä on exit-strategianne seuraavalle 3 vuodelle?'

5. Huomioi seuraavat erityiset näkökulmat joihin tulisi saada vastauksia:
   - Normalisoidut taloudelliset tulokset vs. kirjanpidolliset luvut
   - Johdon rooli ja jatkuvuus omistajanvaihdoksessa
   - Kilpailuetujen puolustettavuus ja erottuvuus
   - Operatiivisten prosessien dokumentointi ja skaalautuvuus
   - Oikeudellisten riskien ja vaatimusten kartoitus
   - Asiakaskannan rakenne ja siirrettävyys
   - Digitaalisten järjestelmien ajantasaisuus ja integraatio

6. Jokaisessa kysymyksessä tulisi olla selkeä yhteys myyntikuntoisuuteen - miten vastaus vaikuttaa yrityksen arvoon tai myyntiprosessin sujuvuuteen. Vältä kysymyksiä jotka eivät suoraan liity myyntikuntoon.

7. Räätälöi kysymykset saatujen tietojen perusteella. Jos esimerkiksi dokumenteissa mainittuja projekteja, avainhenkilöitä, prosesseja tai riskejä, sisällytä niihin liittyviä spesifisiä kysymyksiä.

**Yrityksen taustatiedot:**
${companyDescription}
`;

    // Lisää myyntikuntoisuuden pohjatiedot, jos saatavilla
    if (readinessForSaleData && !readinessForSaleData.error && readinessForSaleData.structuredData) {
       try {
            // Otetaan vain oleellisimmat osat promptiin, esim. ostajan näkökulma ja riippuvuudet
            const relevantReadiness = {
                ostajanNakokulma: readinessForSaleData.structuredData?.myyntikuntoon?.ostajanNakokulma,
                operatiivisetRiippuvuudet: readinessForSaleData.structuredData?.myyntikuntoon?.operatiivisetRiippuvuudet,
                kasvupotentiaali: readinessForSaleData.structuredData?.myyntikuntoon?.kasvupotentiaali
            };
             prompt += `\nMyyntikuntoisuuteen liittyviä esitietoja (Perplexityn analyysi):\n${JSON.stringify(relevantReadiness, null, 2)}\n`;
        } catch (stringifyError) {
             console.error("[generateAssessmentQuestions] Error stringifying readinessForSaleData for prompt:", stringifyError);
        }
    } else if (readinessForSaleData?.error) {
         prompt += `\nMyyntikuntoisuuteen liittyviä esitietoja ei saatu haettua virheen vuoksi: ${readinessForSaleData.error}\n`;
    }

    // Lisää arvonmääritystiedot, jos saatavilla
    if (valuationData) {
      try {
        // Lisätään arvonmääritystietojen olennainen sisältö
        prompt += "\n**Arvonmäärityksen tiedot:**\n";

        // Lisätään normalisointien yhteenveto
        if (valuationData.normalization_summary) {
          prompt += `\nTehdyt normalisoinnit: ${valuationData.normalization_summary}\n`;
        }

        // Lisätään käyttäjän vastaukset arvonmäärityksessä
        if (valuationData.user_answers && Object.keys(valuationData.user_answers).length > 0) {
          prompt += "\nArvonmäärityksessä annetut tiedot, joita tulee hyödyntää kysymysten laatimisessa:\n";
          Object.entries(valuationData.user_answers).forEach(([key, value]) => {
            prompt += `- ${key}: ${value}\n`;
          });

          // Ohjeistus ottaa huomioon normalisoinnit
          prompt += "\nKun laadit kysymyksiä, huomioi erityisesti ne asiat, joista on jo saatu tietoa arvonmäärityksessä, ja pyri syventämään niiden ymmärrystä myyntikuntoisuuden kannalta. Vältä kuitenkin toistamasta samoja kysymyksiä.\n";
        }

        console.log("[generateAssessmentQuestions] Added valuation data to prompt");
      } catch (valuationError) {
        console.error("[generateAssessmentQuestions] Error adding valuation data to prompt:", valuationError);
        prompt += "\nArvonmääritystietoja oli saatavilla, mutta niiden käsittelyssä tapahtui virhe.\n";
      }
    }

    prompt += `\nAnalyysissä huomioitavat dokumentit:\n${documentProcessingInfo.join('\n')}\n`;

    // Lisätään tekstidokumenttien sisältö promptin loppuun
    let textContentForPrompt = "";
     if (docsArray.length > 0) {
        docsArray.forEach(doc => {
            if (doc && doc.text && !doc.error && doc.text.trim().length > 0) {
                const MAX_TEXT_LENGTH = 60000; // Vielä tiukempi raja kysymyksille
                const truncatedText = doc.text.length > MAX_TEXT_LENGTH
                    ? doc.text.substring(0, MAX_TEXT_LENGTH) + "\n...(teksti lyhennetty)...\n"
                    : doc.text;
                textContentForPrompt += `\n--- DOKUMENTIN '${doc.name || "tuntematon"}' TEKSTISISÄLTÖ ---\n`;
                textContentForPrompt += truncatedText;
                textContentForPrompt += `\n--- DOKUMENTIN '${doc.name || "tuntematon"}' LOPPU ---\n`;
            }
        });
    }
    if (textContentForPrompt) {
        prompt += "\n" + textContentForPrompt;
    }

    prompt += `\n**TÄRKEÄÄ - Esimerkkejä OIKEISTA kysymyksistä per tyyppi:**

numeric:
✓ 'Mikä on keskimääräinen asiakassopimuksen kesto (kuukautta)?'
✓ 'Kuinka monta prosenttia liikevaihdosta tulee kolmelta suurimmalta asiakkaalta?'
✗ 'Mikä on asiakkaiden määrä ja miten ne jakautuvat?' → JAA KAHTEEN

text:
✓ 'Miten pyritte vähentämään riippuvuutta suurimmista asiakkaista?'
✓ 'Kuvailkaa johdon roolia omistajanvaihdostilanteessa'

boolean:
✓ 'Onko yrityksellä dokumentoitu jatkuvuussuunnitelma?'
✗ 'Onko suunnitelma ja miten sitä päivitetään?' → JAA KAHTEEN

**Vastauksen muoto:**
Palauta vastaus **ainoastaan ja ehdottomasti** validina JSON-objektina, joka noudattaa annettua skeemaa. Älä lisää mitään muuta tekstiä tai markdownia. Varmista, että kaikki vaaditut kentät (id, question, questionType) ovat mukana jokaisessa kysymyksessä. Anna tarvittavat vastausvaihtoehdot (options) select- ja multiselect-tyypeille. ID:n tulee olla uniikki merkkijono (esim. 'q1_sopimukset', 'q2_asiakkaat').`;


    // --- Skeema kysymyksille ---
    // *** KORJATTU: Lisätty type: 'OBJECT' juuritasolle ***
    const responseSchema = {
      type: 'OBJECT', // <--- LISÄTTY TÄMÄ RIVI
      properties: {
        questions: {
          type: 'ARRAY',
          description: "Lista generoiduista arviointikysymyksistä.",
          items: {
            type: 'OBJECT',
            properties: {
              id: {
                type: 'STRING',
                description: "Uniikki kysymyksen tunniste, esim. 'q1_sopimukset'. Vältä pelkkiä numeroita."
              },
              question: {
                type: 'STRING',
                description: "Itse kysymys selkeästi muotoiltuna käyttäjälle."
              },
              description: {
                type: 'STRING',
                description: "Lyhyt selite tai lisäohje kysymykseen liittyen (vapaaehtoinen, max 1-2 virkettä)."
              },
              questionType: {
                type: 'STRING',
                enum: ["scale", "text", "select", "multiselect", "numeric", "boolean"],
                description: "Kysymyksen tyyppi."
              },
              options: {
                type: 'ARRAY',
                description: "Vastausvaihtoehdot select/multiselect-tyypeille. Vähintään 2 vaihtoehtoa vaaditaan, jos tyyppi on select/multiselect.",
                items: { type: 'STRING' }
              },
              // Lisätään placeholder mahdollisille tuleville kentille
               category: {
                   type: 'STRING',
                   description: "Kysymyksen kategoria (esim. Sopimukset, Talous, Asiakkaat). Vapaaehtoinen.",
               }
            },
            required: ["id", "question", "questionType"] // Pakolliset kentät jokaiselle kysymykselle
          }
        }
      },
      required: ["questions"] // Pakollinen kenttä juuriobjektissa
    };
    // --- Skeema päättyy ---

    // Lisätään tekstiprompt osaksi parts-taulukkoa
    geminiParts.push({ text: prompt });

     // Luodaan lopullinen contents-rakenne
    const contents = [{ role: "user", parts: geminiParts }];


    // --- 3. Kutsu Gemini ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        safetySettings: safetySettings // Lisätään turvallisuusasetukset
    });

    const generationConfig = {
        temperature: 0.4, // Hieman luovuutta kysymysten muotoiluun
        maxOutputTokens: 4096, // Tilaa kysymyksille ja niiden kuvauksille
        responseSchema: responseSchema, // Käytetään määriteltyä skeemaa
        responseMimeType: "application/json" // Varmistetaan JSON-ulostulo
    };

    console.log(`[generateAssessmentQuestions] Sending request to Gemini (${GEMINI_MODEL}) with ${geminiParts.filter(p => p.inlineData).length} inline docs and text prompt length approx ${prompt.length} chars.`);

    const result = await model.generateContent({ contents, generationConfig });

    if (!result.response) {
        console.error("[generateAssessmentQuestions] Gemini response was missing.");
        throw new Error("Gemini API did not return a response.");
    }

     // Tarkistetaan turvallisuusblokit
    const safetyRatings = result.response.promptFeedback?.safetyRatings;
    if (result.response.promptFeedback?.blockReason || (safetyRatings && safetyRatings.some(rating => rating.blocked))) {
      console.error("[generateAssessmentQuestions] Gemini request/response was blocked due to safety settings.");
      console.error("Block Reason:", result.response.promptFeedback?.blockReason);
      console.error("Safety Ratings:", safetyRatings);
      throw new Error(`Gemini esti vastauksen turvallisuussyistä: ${result.response.promptFeedback?.blockReason || 'Tuntematon syy'}`);
    }

    const responseText = result.response.text();
    // console.log(`[generateAssessmentQuestions] Gemini raw response text: ${responseText}`); // Loggaa tarvittaessa

    // --- 4. Jäsennä ja validoi ---
    try {
      const data = JSON.parse(responseText);

      // Perustason tarkistus
      if (!data || !data.questions || !Array.isArray(data.questions)) {
        console.error("[generateAssessmentQuestions] Invalid questions format in response:", data);
        throw new Error("Vastauksen rakenne virheellinen: 'questions'-taulukko puuttuu tai ei ole taulukko.");
      }
      if (data.questions.length === 0) {
           console.warn("[generateAssessmentQuestions] Gemini returned an empty list of questions.");
           // Palautetaan tyhjä taulukko, tämä ei välttämättä ole virhe
           return [];
      }

      console.log(`[generateAssessmentQuestions] Successfully parsed ${data.questions.length} questions from Gemini response.`);

      // Yksinkertainen validointi/siivous (voidaan laajentaa tarvittaessa)
      const validatedQuestions = data.questions
        .map((q: any, index: number) => {
          // Varmista pakolliset kentät
          if (!q || typeof q !== 'object' || !q.id || !q.question || !q.questionType) {
            console.warn(`[generateAssessmentQuestions] Skipping invalid question at index ${index} due to missing required fields:`, q);
            return null; // Hylkää kysymys
          }
          // Varmista ID on merkkijono
          q.id = String(q.id);
           // Varmista, että select/multiselectilla on options (vähintään tyhjä taulukko)
          if ((q.questionType === 'select' || q.questionType === 'multiselect') && !Array.isArray(q.options)) {
            console.warn(`[generateAssessmentQuestions] Question ID ${q.id} is ${q.questionType} but missing 'options' array. Adding empty array.`);
            q.options = [];
          }
           // Varmista, että options-taulukon alkiot ovat merkkijonoja
          if (Array.isArray(q.options)) {
              q.options = q.options.map((opt: any) => String(opt));
          }

          // Palauta siivottu kysymys
          return {
            id: q.id,
            question: String(q.question),
            description: q.description ? String(q.description) : undefined, // Varmista string tai undefined
            questionType: String(q.questionType),
            options: q.options, // On jo varmistettu tai luotu yllä
            category: q.category ? String(q.category) : undefined,
          };
        })
        .filter((q: any): q is object => q !== null); // Poista hylätyt kysymykset

        if (validatedQuestions.length !== data.questions.length) {
             console.warn(`[generateAssessmentQuestions] Some questions were filtered out during validation. Original: ${data.questions.length}, Validated: ${validatedQuestions.length}`);
        }

      return validatedQuestions;

    } catch (parseError) {
      console.error("[generateAssessmentQuestions] Error parsing Gemini JSON response:", parseError);
      console.error("[generateAssessmentQuestions] Full Gemini raw response text on parse error:", responseText);
       return { error: `Kysymysten jäsentäminen epäonnistui: ${parseError.message}. Vastaus ei ollut validia JSON:ia.` };
    }

  } catch (error) {
    console.error(`[generateAssessmentQuestions] Error during question generation for ${companyName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     return { error: `Virhe kysymysten generoinnissa: ${errorMessage}` };
  }
}