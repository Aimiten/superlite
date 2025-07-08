// supabase/functions/analyze-sales-readiness/utils/gemini-client.ts
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "https://esm.sh/@google/generative-ai@0.23.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-pro"; // Käytä uusinta mallia

// Turvallisuusasetukset - käytetään BLOCK_ONLY_HIGH DD-riskianalyyseille
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Retry logic with exponential backoff
async function retryWithExponentialBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let lastError = null;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;

      if (retries >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Giving up.`);
        throw lastError; // Throw the last error encountered
      }

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
      console.log(`Retry ${retries}/${maxRetries} after ${Math.round(delay)}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Debuggaus-funktio JSON-stringille joka näyttää tarkasti ongelmakohdan
function debugJSON(jsonString, errorPosition) {
  if (typeof jsonString !== 'string' || !errorPosition) return;

  const position = parseInt(errorPosition);
  if (isNaN(position)) return;

  const start = Math.max(0, position - 50);
  const end = Math.min(jsonString.length, position + 50);
  const errorContext = jsonString.substring(start, position) + "<<<ERROR TÄSSÄ>>>" + jsonString.substring(position, end);

  console.log("JSON ERROR CONTEXT:");
  console.log(errorContext);

  // Löydä rivi ja sarake
  const upToError = jsonString.substring(0, position);
  const lines = upToError.split('\n');
  const lineNumber = lines.length;
  const columnNumber = lines[lines.length - 1].length + 1;

  console.log(`Error position: character ${position}, line ${lineNumber}, column ${columnNumber}`);
}

// Loki raa'alle JSON-vastaukselle jaettuna osiin
function logRawJsonResponse(jsonString) {
  if (typeof jsonString !== 'string') return;

  console.log("=============== RAAKA GEMINI VASTAUS (ALKU) ================");

  // Pilko ja logita koko vastaus 2000 merkin palasina
  for (let i = 0; i < jsonString.length; i += 2000) {
    const chunk = jsonString.substring(i, i + 2000);
    console.log(`OSA ${Math.floor(i/2000) + 1}/${Math.ceil(jsonString.length/2000)}:`, chunk);
  }

  console.log("=============== RAAKA GEMINI VASTAUS (LOPPU) ================");
}

export async function callGeminiModel(prompt: string, documents = []) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API key");
  }

  // Add explicit JSON formatting instructions to the prompt
  const enhancedPrompt = `${prompt}\n\nTÄRKEÄ: Vastaa vain validissa JSON-muodossa. Vastauksessasi EI saa olla mitään muuta tekstiä, kuten markdown-merkintöjä, koodinäytteitä tai selityksiä - vain puhdas JSON-vastaus. Varmista, että KAIKKI merkkijonot on suljettu lainausmerkeillä ja kaikki JSON-syntaksi on täysin validia. Tarkista erityisesti pitkät tekstikentät varmistaaksesi, että kaikki lainausmerkit ovat oikein suljettu.`;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    safetySettings,
  });

  // Tarkista onko mukana PDF-dokumentteja
  const hasPdfDocuments = documents && documents.some(doc => 
    doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf') || doc.mime_type?.includes('application/pdf'))
  );

  if (documents && documents.length > 0) {
    console.log("Document diagnostics:");
    documents.forEach((doc, index) => {
      console.log(`Doc ${index}: has base64=${!!doc.base64}, mime=${doc.mime_type}, file_type=${doc.file_type}`);
    });
  }

  // Use retry logic
  return await retryWithExponentialBackoff(async () => {
    try {
      // Suorita generointipyyntö tilanteen mukaan
      let result;

      if (hasPdfDocuments) {
        console.log("Using multipart content for PDF documents");

        // Valmistele moniosainen sisältö PDF-dokumenteille
        const contents = [{ role: "user", parts: [] as any[] }];

        // Lisää pääprompt ensin
        contents[0].parts.push({ text: enhancedPrompt });

        // Lisää dokumentit
        documents.forEach((doc, index) => {
          if (doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf'))) {
            // Lisää dokumenttikuvaus
            contents[0].parts.push({
              text: `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n`
            });

            // Lisää PDF-sisältö oikealla MIME-tyypillä
            contents[0].parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: doc.base64
              }
            });

            console.log(`Added PDF document ${index + 1}: ${doc.name}`);
          } else if (doc.content) {
            // Lisää tekstitiedostot suoraan promptiin
            contents[0].parts.push({
              text: `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n${doc.content}`
            });

            console.log(`Added text document ${index + 1}: ${doc.name}`);
          }
        });

        // Suorita generointipyyntö moniosaisella sisällöllä
        result = await model.generateContent({
          contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 55000,
            responseMimeType: "application/json",
          },
        });
      } else {
        // Käytä tavallista tekstipromptia, jos ei ole PDF-dokumentteja
        console.log(`Document processing: ${documents?.length || 0} documents provided, ${hasPdfDocuments ? 'using' : 'not using'} multipart format`);
        console.log("Using standard text prompt (no multipart PDF documents found)");

        // Lisää tekstitiedostojen sisältö suoraan promptiin jos niitä on
        let textPrompt = enhancedPrompt;

        if (documents && documents.length > 0) {
          documents.forEach((doc, index) => {
            if (doc.content) {
              textPrompt += `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n${doc.content}`;
              console.log(`Added text content for document ${index + 1}: ${doc.name}`);
            }
          });
        }

        // Suorita generointipyyntö parannetuilla asetuksilla
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: textPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 55000,
            responseMimeType: "application/json",
          },
        });
      }

      // Log response properties
      console.log("Gemini response structure:", JSON.stringify({
        responseType: typeof result.response,
        hasResponse: !!result.response,
        hasParsed: !!result.response?.parsed,
        candidatesCount: result.response?.candidates?.length || 0
      }));

      // ENSISIJAINEN KÄSITTELY: Käytä response.parsed (Geminin natiivi jäsennys)
      if (result.response?.parsed) {
        console.log("Using native response.parsed from Gemini 05-06 model");
        const parsedData = result.response.parsed;

        // Lokita vain pieni osa vastausta debuggausta varten
        console.log("Response.parsed preview:", JSON.stringify(parsedData).substring(0, 200) + "...");

        // Palauta yhteensopivassa muodossa
        return {
          response: {
            text: () => JSON.stringify(parsedData),
            structuredJson: parsedData
          }
        };
      }

      // VAIHTOEHTOINEN KÄSITTELY: function call muodossa olevat vastaukset
      if (result.response?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        const functionCall = result.response.candidates[0].content.parts[0].functionCall;
        console.log("Using structured output from functionCall");

        try {
          const structuredData = functionCall.args || {};
          console.log("FunctionCall preview:", JSON.stringify(structuredData).substring(0, 200) + "...");

          // Palauta yhteensopivassa muodossa
          return {
            response: {
              text: () => JSON.stringify(structuredData),
              structuredJson: structuredData
            }
          };
        } catch (parseError) {
          console.warn("Error with function call response:", parseError);
          // Jatka tekstimuotoiseen käsittelyyn
        }
      }

      // FALLBACK: Tekstimuotoinen vastaus
      if (result.response) {
        const responseText = result.response.text();
        console.log("Falling back to text response processing");

        // TÄRKEÄ: Lokita koko raaka vastaus
        logRawJsonResponse(responseText);

        try {
          // Kokeile jäsentää tekstivastaus JSONiksi
          const parsedData = JSON.parse(responseText);

          // Palauta yhteensopivassa muodossa
          return {
            response: {
              text: () => responseText,
              structuredJson: parsedData
            }
          };
        } catch (parseError) {
          console.error("Text response is not valid JSON:", parseError);

          // Näytä virhekohta
          const position = parseError.message.match(/position (\d+)/)?.[1];
          if (position) {
            debugJSON(responseText, position);
          }

          // Luo selkeä virheviesti alkuperäisen virheen kanssa
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      }

      return result; // Fallback, normaalisti ei pitäisi päätyä tähän
    } catch (apiError) {
      console.error("Gemini API error:", apiError);
      throw apiError;
    }
  }, 3, 1000); // 3 yritystä, alkaen 1000ms viiveellä
}