import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.0";
import { FinancialData } from "./types.ts";
import { 
  getQuestionsPrompt,
  getProcessingPrompt,
  getManualInputsPrompt,
  getAnalysisPrompt
} from "./prompts/index.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { saveFreeValuation, updateFreeValuation } from './database.ts';

// Tämä loki näkyy Replit-konsolissa varmasti
console.log("===== FREE-VALUATION FUNKTIO LADATTU =====");

// Create a custom logger for Replit console with output that will appear in Replit console
const logger = {
  log: (...args: any[]) => {
    // Tavallinen console.log näkyy Replit-konsolissa
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    console.log("VALUATION-LOG:", message);
    Deno.stdout.writeSync(new TextEncoder().encode(message + '\n'));
  },
  error: (...args: any[]) => {
    // console.error näkyy Replit-konsolissa
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    console.error("VALUATION-ERROR:", message);
    Deno.stderr.writeSync(new TextEncoder().encode('ERROR: ' + message + '\n'));
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.log("==============================================================");
    logger.log("FREE VALUATION FUNCTION CALLED - STARTING NEW EXECUTION CYCLE");
    logger.log("==============================================================");

    const requestData = await req.json();
    logger.log("Request data received:", {
      companyName: requestData.companyName,
      filePresent: !!requestData.fileBase64,
      fileMimeType: requestData.fileMimeType,
      manualInputsPresent: !!requestData.manualInputs,
      financialQuestionAnswers: !!requestData.financialQuestionAnswers,
      originalQuestionsPresent: !!requestData.originalQuestions,
      sessionId: requestData.sessionId
    });

    const { 
      companyName, 
      fileBase64, 
      fileMimeType, 
      manualInputs,
      financialQuestionAnswers,
      originalQuestions,
      sessionId
    } = requestData;

    if (!companyName) {
      throw new Error("Company name is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    logger.log("GoogleGenerativeAI initialized with API key");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    logger.log("Selected model: gemini-2.5-flash");

    // Check if we're in question generation phase (first file upload without answers)
    if (fileBase64 && !financialQuestionAnswers) {
      logger.log("=== GENERATING NORMALIZATION QUESTIONS ===");
      return await generateNormalizationQuestions(model, companyName, fileBase64, fileMimeType);
    }

    // If we have questions answers, proceed with normalization and valuation
    if (fileBase64 && financialQuestionAnswers) {
      logger.log("=== PROCESSING PDF WITH USER ANSWERS ===");

      // Process financial data and normalize in a single step
      const financialData = await processFinancialData(
        model, 
        companyName, 
        fileBase64, 
        fileMimeType, 
        financialQuestionAnswers,
        originalQuestions  // Add original questions to the processing
      );

      // Generate the analysis based on the processed data
      const finalResponse = await generateAnalysis(model, companyName, financialData, originalQuestions);

      // Added code to save valuation data to the database.  This section assumes the existence of necessary variables (clientIp, userAgent, referer, companyId, normalizationQuestions) which were not defined in the original code.  Consider adding these variables to the function's parameters or retrieving them elsewhere in the code.

      const companyId = requestData.companyId || null; // Added safe default
      const normalizationQuestions = requestData.normalizationQuestions || null; // Added safe default

      // Tallenna tiedot tietokantaan
      const valuationData = {
        company_name: companyName,
        company_id: companyId,
        has_file: !!fileBase64,
        file_type: fileMimeType,
        normalization_questions: normalizationQuestions,
        user_answers: financialQuestionAnswers,
        manual_inputs: manualInputs || null,
        processed_financial_data: finalResponse,
        valuation_results: finalResponse.valuation_analysis
      };

      console.log("Tallennetaan arviointi, yritys:", valuationData.company_name);
      console.log("Tallennettavien tietojen rakenne:", JSON.stringify({
        company_name: valuationData.company_name,
        company_id: valuationData.company_id,
        has_file: !!valuationData.file_content,
        has_manual_inputs: !!valuationData.manual_inputs
      }));

      console.log("======== VALUATION TALLENNUSPROSESSI ALKAA ========");
      const saveResult = await saveFreeValuation(valuationData);

      if (!saveResult.success) {
        console.error("======== VALUATION TALLENNUS EPÄONNISTUI ========");
        console.error("Tallennusoperaatio epäonnistui:", saveResult.error);
      } else {
        console.log("======== VALUATION TALLENNUS ONNISTUI ========");
        console.log("Tallennettu ID:llä:", saveResult.id);
      }

      // FIX: Wrap the response in a proper Response object with CORS headers
      return new Response(JSON.stringify(finalResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard manual input path
    if (manualInputs) {
      logger.log("=== PROCESSING MANUAL INPUTS ===");
      const companyId = requestData.companyId || null; // Haetaan mahdollinen companyId
      const analysisResult = await processManualInputs(model, companyName, manualInputs, companyId);

      // FIX: Wrap the response in a proper Response object with CORS headers
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid request: missing required parameters");
  } catch (error) {
    logger.error("Error in free-valuation function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Virhe valuaation laskennassa"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateNormalizationQuestions(model: any, companyName: string, fileBase64: string, fileMimeType?: string) {
  try {
    logger.log("Generating normalization questions for", companyName);

    // Using the prompt from the imported function
    let questionsPrompt = getQuestionsPrompt();

    // Prepare the content for Gemini
    const contents = [{ role: "user", parts: [] }];

    if (fileMimeType === "application/pdf") {
      logger.log("Processing PDF file with modern Gemini approach");

      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");

      contents[0].parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64
        }
      });

      contents[0].parts.push({ text: questionsPrompt });
    } else {
      // Handle non-PDF files as text
      const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
      const fileContent = atob(base64Data);

      contents[0].parts.push({ 
        text: `${questionsPrompt}\n\nTilinpäätöksen sisältö:\n${fileContent}`
      });
    }

    logger.log("Sending request to Gemini for questions generation");

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8096,
        topP: 0.95
      }
    });

    const response = result.response;
    const text = response.text();

    logger.log("=== RECEIVED QUESTIONS GENERATION RESPONSE ===");
    logger.log(text);

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in questions response");
      }

      const jsonStr = jsonMatch[0];
      const questionsData = JSON.parse(jsonStr);

      logger.log("Successfully parsed questions data:", questionsData);

      // Check if we have the expected structure
      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        throw new Error("Invalid questions structure in response");
      }

      // If we have less than 2 questions, create default ones
      if (questionsData.questions.length < 2) {
        logger.log("Not enough questions generated, adding default questions");

        // Add default questions
        const defaultQuestions = [
          {
            id: "owner_salary",
            category: "owner_salary",
            description: "Omistajan palkka ja sen vaikutus tulokseen",
            question: "Mikä on yrittäjän/omistajan nostama palkka tai palkkiot vuositasolla?",
            impact: "Omistajan palkka on olennainen normalisoitava erä arvonmäärityksessä",
            identified_values: { total_personnel_costs: questionsData.financial_analysis_summary?.total_revenue || 0 },
            normalization_purpose: "Omistajan palkan normalisointi markkinatasoon vaikuttaa yrityksen todelliseen kannattavuuteen"
          },
          {
            id: "premises_costs",
            category: "premises_costs",
            description: "Kiinteistö- ja toimitilakulut",
            question: "Omistaako yritys tai omistaja kiinteistöjä, joista maksetaan vuokraa, ja onko vuokra markkinahintainen?",
            impact: "Toimitilakulujen normalisointi markkinatasolle vaikuttaa kannattavuuteen",
            identified_values: { premises_costs: null },
            normalization_purpose: "Toimitilakulujen normalisointi markkinatasoon antaa realistisemman kuvan yrityksen kustannusrakenteesta"
          }
        ];

        // Keep any existing questions
        questionsData.questions = [
          ...questionsData.questions,
          ...defaultQuestions.slice(questionsData.questions.length)
        ];

        // Make sure we only have three questions
        questionsData.questions = questionsData.questions.slice(0, 2);
      }

      // Ensure we have financial_analysis_summary
      if (!questionsData.financial_analysis_summary) {
        questionsData.financial_analysis_summary = {
          total_revenue: null,
          operating_profit: null,
          fiscal_year: ""
        };
      }

      // Log the complete questionsData object to see what we have
      logger.log("Complete questionsData:", JSON.stringify(questionsData, null, 2));

      // Format response for frontend
      const response = {
        requiresUserInput: true,
        financialQuestions: questionsData.questions,
        initialFindings: {
          company_size: questionsData.financial_analysis_summary?.company_size || "Tuntematon",
          financial_health: questionsData.financial_analysis_summary?.financial_health || "Tarkennusta vaaditaan",
          primary_concerns: questionsData.financial_analysis_summary?.primary_concerns || ["Tiedot tarkennettava käyttäjän vastauksilla"],
          period_details: {
            latest_period_end: questionsData.financial_analysis_summary?.fiscal_year || "Ei tiedossa"
          }
        }
      };

      // Log what we're sending to frontend
      logger.log("initialFindings being sent to frontend:", JSON.stringify(response.initialFindings, null, 2));

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      logger.error("Error parsing questions response:", parseError);
      throw new Error(`Tilinpäätöksen analysointi epäonnistui: ${parseError.message}`);
    }
  } catch (error) {
    logger.error("Error generating questions:", error);
    throw new Error(`Kysymysten luonti epäonnistui: ${error.message}`);
  }
}

// New combined function to process financial data and normalize in one step
async function processFinancialData(
  model: any, 
  companyName: string, 
  fileBase64: string, 
  fileMimeType: string, 
  answers: any,
  originalQuestions?: any[]
): Promise<FinancialData> {
  logger.log("=== PROCESSING FINANCIAL DATA AND NORMALIZING ===");
  logger.log("Answers received:", answers);

  try {
    // Tarkempi loki vastauksista auttaa vianetsinnässä
    logger.log("Answer structure details:", Object.keys(answers).map(key => ({
      key,
      valueType: typeof answers[key],
      valueLength: typeof answers[key] === 'string' ? answers[key].length : null
    })));

    // UUSI KOODIBLOKKI: Yhdistä vastaukset alkuperäisiin kysymyksiin jos ne ovat saatavilla
    let formattedAnswers = "";

    if (originalQuestions && Array.isArray(originalQuestions) && originalQuestions.length > 0) {
      logger.log("Using original questions for enhanced context");

      // Yhdistä vastaukset alkuperäisiin kysymyksiin
      formattedAnswers = originalQuestions.map((question, index) => {
        const questionId = question.id || `question_${index + 1}`;
        const answer = answers[questionId] || 
                      answers[`${question.category}_${questionId}`] || 
                      answers[`${question.category}_${index + 1}`] || 
                      "Ei vastausta";

        return `Kysymys ${index + 1}:
Kategoria: ${question.category || "tuntematon"}
ID: ${questionId}
Kysymysteksti: ${question.question || question.description || ""}
Kuvaus: ${question.description || ""}
Tunnistetut arvot: ${JSON.stringify(question.identified_values || {})}
Vaikutus: ${question.impact || ""}
Vastaus: ${answer}`;
      }).join("\n\n");
    } 
    // VANHA KOODI: Käytetään tätä fallbackina jos alkuperäisiä kysymyksiä ei ole
    else {
      logger.log("No original questions available, using fallback formatting");

      // Korjattu vastausten muotoilu: säilytä enemmän kontekstia kysymyksistä
      formattedAnswers = Object.entries(answers)
        .map(([questionKey, answer], index) => {
          // Yritetään purkaa kysymyksestä enemmän tietoa
          let questionInfo = "Tuntematon kysymys";
          let category = "tuntematon";

          // Jos avain sisältää JSON-muotoista tietoa, yritetään jäsentää se
          if (questionKey.includes('{') && questionKey.includes('}')) {
            try {
              // Yritetään jäsentää JSON-muotoinen kysymystieto
              const questionData = JSON.parse(questionKey);
              questionInfo = questionData.question || questionKey;
              category = questionData.category || "tuntematon";
            } catch (e) {
              // Jatketaan tekstimuotoisena jos JSON-jäsennys epäonnistuu
              questionInfo = questionKey;
            }
          } 
          // Jos avaimessa on erottimia (|) yritetään jakaa tieto niiden mukaan
          else if (questionKey.includes('|')) {
            const parts = questionKey.split('|');
            category = parts[0] || "tuntematon";
            questionInfo = parts[1] || questionKey;
          }
          // Muussa tapauksessa käytetään koko avainta kysymyksenä
          else {
            questionInfo = questionKey;
          }

          return `Kategoria: ${category}\nKysymys ${index + 1}: ${questionInfo}\nVastaus: ${answer}`;
        })
        .join("\n\n");
    }

    logger.log("Formatted answers for processing (first 500 chars):", 
      formattedAnswers.length > 500 ? formattedAnswers.substring(0, 500) + "..." : formattedAnswers);

    // Using the prompt from the imported function
    const processingPrompt = getProcessingPrompt(companyName, formattedAnswers);

    // Prepare content for Gemini
    const contents = [{ role: "user", parts: [] }];

    if (fileMimeType === "application/pdf") {
      logger.log("Processing PDF file");
      const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");
      contents[0].parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: cleanBase64
        }
      });
      contents[0].parts.push({ text: processingPrompt });
    } else {
      // Handle non-PDF files as text
      const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
      const fileContent = atob(base64Data);
      contents[0].parts.push({ 
        text: `${processingPrompt}\n\nTilinpäätöksen sisältö:\n${fileContent}`
      });
    }

    logger.log("Sending request to Gemini for financial data processing");

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        topP: 0.95
      }
    });

    const response = result.response;
    const text = response.text();

    logger.log("=== RECEIVED FINANCIAL DATA PROCESSING RESPONSE ===");
    logger.log("Response first 1000 chars:");
    logger.log(text.substring(0, 1000));
    logger.log("Response last 1000 chars:");
    logger.log(text.substring(text.length - 1000));

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in processing response");
      }

      const jsonStr = jsonMatch[0];
      const processedData = JSON.parse(jsonStr);

      logger.log("Successfully parsed financial data from Gemini");

      // Check if we have the expected structure
      if (!processedData.tilinpaatos || !processedData.Arvioni) {
        throw new Error("Incomplete data structure in processing response");
      }

      // Ensure we have normalization data
      if (!processedData.normalization) {
        processedData.normalization = {
          status: {
            owner_salary_normalized: false,
            premises_costs_normalized: false,
            other_normalizations: false,
            normalization_impact: "Ei normalisointeja",
            original_values: {},
            adjusted_values: {},
            normalizations_explained: []
          }
        };
      }

      return processedData;
    } catch (parseError) {
      logger.error("Error parsing financial data processing response:", parseError);
      throw new Error(`Tilinpäätöksen jäsentäminen epäonnistui: ${parseError.message}`);
    }
  } catch (error) {
    logger.error("Error in financial data processing:", error);
    throw new Error(`Tilinpäätöstietojen käsittely epäonnistui: ${error.message}`);
  }
}

async function processManualInputs(model: any, companyName: string, manualInputs: any, companyId?: string) {
  logger.log("=== PROCESSING MANUAL INPUTS ===");
  logger.log("Manual inputs received:", manualInputs);

  const { revenue, profit, assets, liabilities } = manualInputs;

  if (typeof revenue !== 'number' || typeof profit !== 'number' || 
      typeof assets !== 'number' || typeof liabilities !== 'number') {
    logger.error("Invalid manual inputs:", manualInputs);
    throw new Error("Manuaaliset syötteet ovat virheellisiä");
  }

  // Using the prompt from the imported function
  const analysisPrompt = getManualInputsPrompt(companyName, revenue, profit, assets, liabilities);

  try {
    logger.log("Calling Gemini API for manual data...");
    const result = await model.generateContent(analysisPrompt);
    logger.log("Gemini API call for manual data completed successfully!");

    const response = result.response;
    const extractionText = response.text();

    logger.log("=== RECEIVED MANUAL DATA GEMINI RESPONSE ===");
    logger.log(extractionText);

    try {
      const jsonMatch = extractionText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error("No valid JSON found in manual data response");
        throw new Error("No valid JSON found in response");
      }

      const jsonStr = jsonMatch[0];
      logger.log("=== EXTRACTED JSON FROM MANUAL DATA ===");
      logger.log(jsonStr);

      const extractedData = JSON.parse(jsonStr);
      logger.log("Successfully parsed manual data analysis from Gemini");

      const analysisResult = await generateAnalysis(model, companyName, extractedData);
      
      // Tallenna manuaaliset syötteet ja tulokset tietokantaan
      logger.log("=== TALLENNETAAN MANUAALISET SYÖTTEET TIETOKANTAAN ===");
      const valuationData = {
        company_name: companyName,
        company_id: companyId || null,
        has_file: false,
        file_type: null,
        normalization_questions: null,
        user_answers: null,
        manual_inputs: {
          revenue: revenue,
          profit: profit,
          assets: assets,
          liabilities: liabilities
        },
        processed_financial_data: extractedData,
        valuation_results: analysisResult.valuation_analysis || null
      };

      console.log("Tallennetaan manuaaliset syötteet ja arviointi, yritys:", valuationData.company_name);
      const saveResult = await saveFreeValuation(valuationData);

      if (!saveResult.success) {
        logger.error("Manuaalisten syötteiden tallennus epäonnistui:", saveResult.error);
        // Jatketaan kuitenkin, koska tämä ei ole kriittinen virhe käyttäjälle
      } else {
        logger.log("Manuaalisten syötteiden tallennus onnistui, ID:", saveResult.id);
        // Lisää tallennus-ID tuloksiin
        analysisResult.saved_valuation_id = saveResult.id;
      }
      
      return analysisResult;
    } catch (parseError) {
      logger.error("Error parsing manual data Gemini response:", parseError);
      throw new Error(`Tietojen jäsentäminen epäonnistui: ${parseError.message}`);
    }
  } catch (geminiError) {
    logger.error("Error in manual data Gemini API call:", geminiError);
    throw new Error(`Virhe tietojen analysoinnissa: ${geminiError.message}`);
  }
}

// Apufunktio normalisoitujen arvojen hakemiseen turvallisesti
function getNormalizedValue(financialData, fieldName, originalValue) {
  // Tarkistetaan, onko normalization-rakenne olemassa
  if (financialData.normalization && 
      financialData.normalization.status &&
      financialData.normalization.status.adjusted_values) {

    // Tarkistetaan, onko kyseinen kenttä normalisoitu
    if (financialData.normalization.status.adjusted_values[fieldName] !== undefined) {
      return financialData.normalization.status.adjusted_values[fieldName];
    }
  }

  // Jos mitään normalisointeja ei löydy, palautetaan alkuperäinen arvo
  return originalValue;
}

async function generateAnalysis(model: any, companyName: string, financialData: FinancialData, originalQuestions?: any[]) {
  try {
    logger.log("=== GENERATING FINAL ANALYSIS BASED ON PROCESSED DATA ===");
    logger.log("Processed data for analysis:", financialData);

    // Haetaan alkuperäiset arvot tilinpäätöksestä
    const alkuperainenPysyvatVastaavat = financialData.tilinpaatos.tase.pysyvat_vastaavat.aineelliset_kayttoomaisuuserat + 
      financialData.tilinpaatos.tase.pysyvat_vastaavat.aineettomat_hyodykkeet + 
      financialData.tilinpaatos.tase.pysyvat_vastaavat.muut;

    const alkuperainenVaihtuvatVastaavat = financialData.tilinpaatos.tase.vaihtuvat_vastaavat;
    const alkuperainenLyhytaikaisetVelat = financialData.tilinpaatos.tase.velat.lyhytaikaiset;
    const alkuperainenPitkaaikaisetVelat = financialData.tilinpaatos.tase.velat.pitkataikaiset;
    const alkuperainenLiikevaihto = financialData.tilinpaatos.tuloslaskelma.liikevaihto;
    const alkuperainenEbit = financialData.tilinpaatos.tuloslaskelma.liikevoitto;

    // Käytetään apufunktiota normalisoitujen arvojen hakemiseen
    const pysyvatVastaavat = getNormalizedValue(financialData, 'pysyvat_vastaavat', alkuperainenPysyvatVastaavat);
    const vaihtuvatVastaavat = getNormalizedValue(financialData, 'vaihtuvat_vastaavat', alkuperainenVaihtuvatVastaavat);
    const lyhytaikaisetVelat = getNormalizedValue(financialData, 'lyhytaikaiset_velat', alkuperainenLyhytaikaisetVelat);
    const pitkaaikaisetVelat = getNormalizedValue(financialData, 'pitkaaikaiset_velat', alkuperainenPitkaaikaisetVelat);
    const liikevaihto = getNormalizedValue(financialData, 'liikevaihto', alkuperainenLiikevaihto);
    const ebit = getNormalizedValue(financialData, 'liikevoitto', alkuperainenEbit);

    // Loki normalisoitujen arvojen käytöstä
    logger.log("===== NORMALISOITUJEN ARVOJEN KÄYTTÖ LASKENNASSA =====");
    logger.log(`Alkuperäinen liikevoitto: ${alkuperainenEbit}, Normalisoitu liikevoitto: ${ebit}`);
    logger.log(`Alkuperäinen liikevaihto: ${alkuperainenLiikevaihto}, Normalisoitu liikevaihto: ${liikevaihto}`);
    logger.log(`Alkuperäiset pysyvät vastaavat: ${alkuperainenPysyvatVastaavat}, Normalisoidut: ${pysyvatVastaavat}`);
    logger.log(`Alkuperäiset vaihtuvat vastaavat: ${alkuperainenVaihtuvatVastaavat}, Normalisoidut: ${vaihtuvatVastaavat}`);
    logger.log(`Alkuperäiset lyhytaikaiset velat: ${alkuperainenLyhytaikaisetVelat}, Normalisoidut: ${lyhytaikaisetVelat}`);
    logger.log(`Alkuperäiset pitkäaikaiset velat: ${alkuperainenPitkaaikaisetVelat}, Normalisoidut: ${pitkaaikaisetVelat}`);

    const evKerroin = financialData.Arvioni.EV_kerroin;
    const evEbitKerroin = financialData.Arvioni.EV_EBIT_kerroin || 5.0;

    // Laskelmien tekeminen perustuen normalisoituun dataan
    const totalAssets = pysyvatVastaavat + vaihtuvatVastaavat;
    const totalLiabilities = lyhytaikaisetVelat + pitkaaikaisetVelat;

    const substanssiValue = totalAssets - totalLiabilities;
    const isSubstanssiNegative = substanssiValue < 0;
    const isEbitNegativeOrZero = ebit <= 0;

    let korjattuKerroin;
    if (evKerroin > 3) {
      korjattuKerroin = Math.min(3, evKerroin * 0.5);
    } else {
      korjattuKerroin = evKerroin;
    }

    const evLiikevaihtoValue = liikevaihto * korjattuKerroin;
    const evEbitValue = ebit > 0 ? ebit * evEbitKerroin : 0;

    let low, high;

    low = Math.min(substanssiValue, 0);

    const possibleHighValues = [
      isSubstanssiNegative ? 0 : substanssiValue,
      evLiikevaihtoValue,
      isEbitNegativeOrZero ? 0 : evEbitValue
    ].filter(val => val > 0);

    if (possibleHighValues.length > 0) {
      high = Math.max(...possibleHighValues);
    } else {
      high = 0;
    }

    logger.log("===== VALUATION CALCULATIONS =====");
    logger.log(`totalAssets: ${totalAssets}`);
    logger.log(`totalLiabilities: ${totalLiabilities}`);
    logger.log(`substanssiValue: ${substanssiValue}`);
    logger.log(`isSubstanssiNegative: ${isSubstanssiNegative}`);
    logger.log(`evKerroin: ${evKerroin}`);
    logger.log(`evEbitKerroin: ${evEbitKerroin}`);
    logger.log(`korjattuKerroin: ${korjattuKerroin}`);
    logger.log(`evLiikevaihtoValue: ${evLiikevaihtoValue}`);
    logger.log(`isEbitNegativeOrZero: ${isEbitNegativeOrZero}`);
    logger.log(`evEbitValue: ${evEbitValue}`);
    logger.log(`valuationRange: ${low} - ${high}`);
    logger.log("==================================");

    const valuationNumbers = {
      substanssi_value: substanssiValue,
      is_substanssi_negative: isSubstanssiNegative,
      ev_liikevaihto_value: Math.round(evLiikevaihtoValue),
      ev_ebit_value: Math.round(evEbitValue),
      is_ebit_negative_or_zero: isEbitNegativeOrZero,
      ev_kerroin: korjattuKerroin,
      ev_ebit_ratio: evEbitKerroin,
      range: {
        low: Math.round(low),
        high: Math.round(high)
      }
    };

    logger.log("Final valuation numbers object:", valuationNumbers);

    // Normalisointitietojen yhteenveto
    let normalizationSummary = "";
    if (financialData.normalization) {
      const norm = financialData.normalization.status;
      normalizationSummary = "Tehdyt normalisoinnit:\n";

      if (norm.owner_salary_normalized) {
        normalizationSummary += "- Omistajan palkka normalisoitu\n";
      }

      if (norm.premises_costs_normalized) {
        normalizationSummary += "- Toimitilakulut normalisoitu\n";
      }

      if (norm.other_normalizations) {
        normalizationSummary += "- Muita normalisointeja tehty\n";
      }

      normalizationSummary += `\nNormalisointien vaikutus: ${norm.normalization_impact || "Ei tiedossa"}\n\n`;

      // Lisää yksityiskohtainen selitys normalisoinneista, jos saatavilla
      if (norm.normalizations_explained && norm.normalizations_explained.length > 0) {
        normalizationSummary += "Yksityiskohtaiset selitykset tehdyistä normalisoinneista:\n";
        norm.normalizations_explained.forEach((item, index) => {
          normalizationSummary += `${index + 1}. Kategoria: ${item.category}\n`;
          normalizationSummary += `   Alkuperäinen arvo: ${item.original_value} €\n`;
          normalizationSummary += `   Normalisoitu arvo: ${item.normalized_value} €\n`;
          normalizationSummary += `   Selitys: ${item.explanation}\n\n`;
        });
      }
    }

    // Using the prompt from the imported function
    const analysisPrompt = getAnalysisPrompt(
      companyName, 
      financialData, 
      normalizationSummary,
      {
        substanssiValue,
        isSubstanssiNegative,
        evLiikevaihtoValue,
        korjattuKerroin,
        evEbitValue,
        isEbitNegativeOrZero,
        evEbitKerroin,
        low,
        high
      }
    );

    logger.log("Analysis prompt preparation complete, first 500 chars:");
    logger.log(analysisPrompt.substring(0, 500));

    logger.log("SENDING REQUEST TO GEMINI API for final analysis...");
    const result = await model.generateContent(analysisPrompt);
    logger.log("Gemini API call for final analysis completed successfully!");

    const response = result.response;
    const analysisText = response.text();

    logger.log("=== RECEIVED FULL FINAL ANALYSIS RESPONSE ===");
    logger.log(analysisText);
    logger.log("=== END OF FULL FINAL ANALYSIS RESPONSE ===");

    // Parannettu JSON-jäsennys, joka yrittää käsitellä erilaisia LLM-vastauksia
    let jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("No valid JSON found in analysis response");

      // Tarkistetaan onko vastaus muokattavissa JSON-muotoon
      const cleanedText = analysisText.replace(/```json|```/g, '').trim();
      if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
        jsonMatch = [cleanedText];
        logger.info("Extracted JSON from code block format");
      } else {
        // Jos JSON:ia ei löydy, palautetaan selkeä virheviesti käyttöliittymälle
        return {
          error: "Arvonmääritys epäonnistui: Vastauksen käsittelyssä ilmeni ongelma",
          rawResponse: analysisText
        };
      }
    }

    const jsonStr = jsonMatch[0];
    logger.log("=== FULL FINAL ANALYSIS JSON ===");
    logger.log(jsonStr);
    logger.log("=== END OF FULL FINAL ANALYSIS JSON ===");

    const analysis = JSON.parse(jsonStr);
    logger.log("Successfully parsed final analysis with keys:", Object.keys(analysis));

    if (!analysis.key_points || !analysis.valuation_analysis) {
      logger.error("Missing required fields in analysis", Object.keys(analysis));
      throw new Error("Incomplete data structure in analysis response");
    }

    const finalResponse = {
      ...analysis,
      valuation_numbers: valuationNumbers,
      normalization: financialData.normalization
    };

    logger.log("Final complete response data:", finalResponse);
    logger.log("==============================================================");
    logger.log("FREE VALUATION FUNCTION EXECUTION COMPLETED SUCCESSFULLY");
    logger.log("==============================================================");

    return finalResponse;
  } catch (error) {
    logger.error("Error in analysis generation:", error);
    throw new Error(`Virhe analyysin luomisessa: ${error.message}`);
  }
}