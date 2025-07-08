
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.0-flash";

export async function analyzeAssessmentAnswers(
  companyName: string,
  companyInfo: any,
  answers: Record<string, any>,
  fileInfo?: {
    fileData?: string;
    fileBase64?: string;
    fileMimeType?: string;
    documents?: any[];
  },
  readinessForSaleData?: any
) {
  console.log("Starting assessment analysis");

  try {
    const companyDescription = companyInfo?.structuredData?.description || companyInfo?.analysisText || "Ei tietoja saatavilla.";

    let prompt = `Analysoi seuraavat tiedot ja arvioi yrityksen "${companyName}" myyntikuntoisuus. Anna kokonaisarvio sekä perustelut esitettyihin johtopäätöksiin.

    Yrityksen kuvaus: ${companyDescription}

    Vastaukset kysymyksiin:
    ${Object.entries(answers)
      .map(([questionId, answer]) => {
        if (Array.isArray(answer)) {
          return `- Kysymys ${questionId}: [${answer.join(", ")}]`;
        } else if (typeof answer === 'object') {
          return `- Kysymys ${questionId}: ${JSON.stringify(answer)}`;
        }
        return `- Kysymys ${questionId}: ${answer}`;
      })
      .join("\n")}
    `;
    
    if (readinessForSaleData && !readinessForSaleData.error) {
      prompt += `\n\nMyyntikuntotietoja yrityksestä:
      ${JSON.stringify(readinessForSaleData.structuredData || readinessForSaleData, null, 2)}`;
    }

    console.log("Preparing documents for Gemini analysis...");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Luodaan sisältötaulukko Geminiä varten
    const contents: any[] = [];

    // Lisätään dokumentit jos niitä on
    if (fileInfo?.documents && Array.isArray(fileInfo.documents)) {
      console.log(`Processing ${fileInfo.documents.length} documents for Gemini`);
      
      for (const doc of fileInfo.documents) {
        if (doc.base64 && doc.mimeType === 'application/pdf') {
          console.log(`Adding PDF document: ${doc.name}`);
          contents.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: doc.base64
            }
          });
        }
      }
    }

    // Lisätään prompt viimeisenä
    contents.push({ text: prompt });

    console.log(`Sending analysis request to Gemini (${GEMINI_MODEL}) with documents`);
    const result = await model.generateContent(contents);
    const response = result.response;
    const text = response.text();

    console.log("Gemini response received:", text.substring(0, 200) + "... (truncated)");

    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No valid JSON found in response");
      }
      
      const jsonStr = text.substring(jsonStart, jsonEnd);
      const analysis = JSON.parse(jsonStr);
      
      console.log("Parsed JSON analysis keys:", Object.keys(analysis));
      return analysis;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse assessment analysis");
    }

  } catch (error) {
    console.error("Error in assessment analysis:", error);
    throw new Error(`Virhe myyntikuntoisuuden analysoinnissa: ${error.message}`);
  }
}

export async function generateAssessmentQuestions(
  companyName: string,
  companyInfo: any,
  fileInfo?: {
    documents?: any[];
  },
  readinessForSaleData?: any
) {
  console.log("Starting assessment question generation");

  try {
    // Kerää kattava yritystietojen kuvaus eri lähteistä
    const companyDataSources = [];
    
    if (companyInfo?.structuredData?.description) {
      companyDataSources.push(`Liiketoiminnan kuvaus: ${companyInfo.structuredData.description}`);
    }
    
    if (companyInfo?.structuredData?.market_position) {
      companyDataSources.push(`Asiakkaat ja markkinat: ${companyInfo.structuredData.market_position}`);
    }
    
    if (companyInfo?.analysisText) {
      companyDataSources.push(`Yritysanalyysi: ${companyInfo.analysisText}`);
    }
    
    // Muodostetaan yhdistetty yrityskuvaus
    const companyDescription = companyDataSources.join("\n\n") || companyInfo || "Ei tietoja saatavilla.";
    console.log("Company description length:", companyDescription ? companyDescription.length : 0);

    let prompt = `Luo räätälöityjä, älykästä tietoa kerääviä kysymyksiä yrityksen "${companyName}" myyntikuntoisuuden arviointia varten.
    Kysymysten tulee olla:
    1. Räätälöityjä juuri tälle yritykselle ja toimialalle
    2. Suunniteltu keräämään käyttökelpoista tietoa yrityksen todellisesta myyntikuntoisuudesta
    3. Monipuolisia kysymystyyppejä: osa kysymyksistä voi olla asteikolla 1-5, osa voi olla avoimia tekstikysymyksiä, 
       osa monivalintoja, osa kyllä/ei-tyyppisiä, osa numeerisia arvoja kerääviä
    
    Alla olevat yritystiedot:
    
    ${companyDescription}
    `;
    
    // Lisää myyntikunto- ja taloustiedot jos saatavilla
    if (readinessForSaleData && !readinessForSaleData.error) {
      prompt += `\n\nYrityksen talous- ja myyntikuntotietoja:
      ${JSON.stringify(readinessForSaleData.structuredData || readinessForSaleData, null, 2)}`;
    }
    
    // Lisää dokumentaatiotiedot jos saatavilla
    if (fileInfo?.documents && Array.isArray(fileInfo.documents) && fileInfo.documents.length > 0) {
      prompt += `\n\nYrityksestä toimitetut dokumentit (${fileInfo.documents.length} kpl):`;
      
      fileInfo.documents.forEach((doc, index) => {
        prompt += `\n\nDokumentti ${index + 1}: ${doc.name} (tyyppi: ${doc.documentType})`;
        
        if (doc.text) {
          const truncatedText = doc.text.length > 5000 ? 
            doc.text.substring(0, 5000) + `\n... (teksti jatkuu, yhteensä ${doc.text.length} merkkiä)` : 
            doc.text;
          prompt += `\nSisältö: ${truncatedText}`;
        } else if (doc.error) {
          prompt += `\nVirhe dokumentin käsittelyssä: ${doc.error}`;
        }
      });
    }

    prompt += `\n\nLuo 5-8 erittäin spesifistä kysymystä, jotka auttavat arvioimaan yrityksen myyntikuntoisuutta.
    Kysymysten tulee käsitellä seuraavia osa-alueita:
    
    1. Dokumentaatio ja sopimukset - esim. onko asiakas- ja toimittajasopimukset selkeitä ja dokumentoituja?
    2. Liiketoimintaprosessit - miten selkeitä, toistettavia ja henkilöriippumattomia prosessit ovat?
    3. Taloudellinen tilanne - mm. kassavirta, tulorakenteen ennustettavuus, kannattavuus
    4. Asiakaskunta - mm. asiakaskannan monipuolisuus, asiakasriippuvuudet
    5. Kasvu ja tulevaisuudennäkymät - kasvu, markkina-asema, kilpailutilanne
    
    Huomioithan:
    - Jos kyseessä on palveluyritys, painota henkilöstöön, osaamisen siirtoon ja prosesseihin liittyviä kysymyksiä
    - Jos kyseessä on tuoteyritys, painota tuotteisiin, toimitusketjuun ja IPR-oikeuksiin liittyviä kysymyksiä
    - Hyödynnä tarkkoja yksityiskohtia yrityksen toimialasta ja tilanteesta kysymysten personoinnissa
    - Kysymysten tulee olla tarkkoja ja yksiselitteisiä, vältä yleisiä kysymyksiä
    
    TÄRKEÄÄ: Luo erilaisia kysymystyyppejä, ei pelkästään asteikolla 1-5. Käytä seuraavia kysymystyyppejä:
    - scale: Asteikko 1-5, jossa jokainen taso on kuvattu (kuten alla)
    - text: Avoin tekstikysymys
    - select: Yksittäisen vaihtoehdon valinta listasta
    - multiselect: Usean vaihtoehdon valinta listasta
    - numeric: Numeerinen arvo, mahdollisesti min ja max rajoilla
    - boolean: Kyllä/ei-kysymys`;

    console.log("Prompt length for question generation:", prompt.length);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Määritellään kysymysten JSON-rakenne
    const responseSchema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              description: { type: "string" },
              questionType: { 
                type: "string", 
                enum: ["scale", "text", "multiselect", "select", "numeric", "boolean"] 
              },
              answerOptions: { 
                type: "array", 
                items: { 
                  type: "object", 
                  properties: { 
                    value: { type: "string" }, 
                    label: { type: "string" } 
                  },
                  required: ["value", "label"]
                },
                nullable: true
              },
              min: { type: "number", nullable: true },
              max: { type: "number", nullable: true },
              placeholder: { type: "string", nullable: true }
            },
            required: ["id", "question", "description", "questionType"]
          }
        }
      },
      required: ["questions"]
    };

    console.log(`Sending question generation request to Gemini (${GEMINI_MODEL}) with structured schema...`);
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 16000,
      responseSchema: responseSchema,
      responseMimeType: "application/json"
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });

    const response = result.response;
    const text = response.text();

    console.log(`Gemini response received with structured schema, length: ${text.length}`);
    console.log("Response preview:", text.substring(0, 500) + "... (truncated)");

    try {
      // Jäsennetään JSON-vastaus
      const data = JSON.parse(text);
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.error("Invalid questions format in parsed data:", data);
        throw new Error("Invalid questions format in response");
      }
      
      console.log("Parsed JSON questions count:", data.questions.length);
      
      // Validate each question
      data.questions.forEach((q: any, index: number) => {
        if (!q.question) {
          console.error(`Question ${index} is missing question text:`, q);
        }
        if (!q.questionType) {
          console.error(`Question ${index} is missing questionType:`, q);
        }
        
        // Varmista että scale-kysymyksillä on vastausvaihtoehdot
        if (q.questionType === 'scale' && (!q.answerOptions || !Array.isArray(q.answerOptions))) {
          console.warn(`Scale question ${index} missing answerOptions, adding defaults:`, q);
          q.answerOptions = [
            { value: 1, label: "Heikko taso" },
            { value: 2, label: "Välttävä taso" },
            { value: 3, label: "Tyydyttävä taso" },
            { value: 4, label: "Hyvä taso" },
            { value: 5, label: "Erinomainen taso" }
          ];
        }
        
        // Varmista että multiselect/select kysymyksillä on vastausvaihtoehdot
        if ((q.questionType === 'multiselect' || q.questionType === 'select') && 
            (!q.answerOptions || !Array.isArray(q.answerOptions) || q.answerOptions.length === 0)) {
          console.warn(`${q.questionType} question ${index} missing answerOptions, question may not work correctly:`, q);
        }
      });
      
      return data.questions;
    } catch (parseError) {
      console.error("Error parsing Gemini structured response:", parseError);
      
      // Yritetään fallback vanhaan jäsennysmenetelmään jos strukturoitu vastaus epäonnistui
      console.log("Attempting fallback JSON extraction from text response");
      try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd === -1) {
          console.error("No valid JSON found in fallback response. Full response:", text);
          throw new Error("No valid JSON found in response");
        }
        
        const jsonStr = text.substring(jsonStart, jsonEnd);
        console.log("Extracted JSON string:", jsonStr.substring(0, 500) + "... (truncated)");
        
        const data = JSON.parse(jsonStr);
        
        if (!data.questions || !Array.isArray(data.questions)) {
          console.error("Invalid questions format in fallback parsed data:", data);
          throw new Error("Invalid questions format in response");
        }
        
        console.log("Fallback parsing successful. Questions count:", data.questions.length);
        return data.questions;
      } catch (fallbackError) {
        console.error("Both structured schema and fallback parsing failed:", fallbackError);
        throw new Error(`Failed to parse generated questions: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.error("Error in question generation:", error);
    throw new Error(`Virhe kysymysten generoinnissa: ${error.message}`);
  }
}
