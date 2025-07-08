import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinancialData {
  tilinpaatos: {
    tase: {
      pysyvat_vastaavat: {
        aineelliset_kayttoomaisuuserat: number;
        aineettomat_hyodykkeet: number;
        muut: number;
      };
      vaihtuvat_vastaavat: number;
      velat: {
        lyhytaikaiset: number;
        pitkataikaiset: number;
      };
    };
    tuloslaskelma: {
      liikevaihto: number;
      liiketoiminnan_muut_tuotot: number;
      liiketoiminnan_kulut: {
        materiaalit: number;
        henkilostokulut: number;
        poistot: number;
        muut_kulut: number;
      };
      liikevoitto: number;
    };
  };
  Arvioni: {
    EV_kerroin: number; // EV/Liikevaihto kerroin
    EV_EBIT_kerroin: number; // Lisätty EV/EBIT kerroin
    liquidation: {
      pysyvat_vastaavat_discount: number;
      vaihtuvat_vastaavat_discount: number;
    };
  };
  normalization?: {
    status: {
      owner_salary_normalized: boolean;
      premises_costs_normalized: boolean;
      normalization_impact: string;
      original_values: Record<string, number>;
      adjusted_values: Record<string, number>;
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("==============================================================");
    console.log("FREE VALUATION FUNCTION CALLED - STARTING NEW EXECUTION CYCLE");
    console.log("==============================================================");
    
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify({
      companyName: requestData.companyName,
      filePresent: !!requestData.fileBase64,
      fileMimeType: requestData.fileMimeType,
      manualInputsPresent: !!requestData.manualInputs,
      financialQuestionAnswers: !!requestData.financialQuestionAnswers,
    }));

    const { 
      companyName, 
      fileBase64, 
      fileMimeType, 
      manualInputs,
      financialQuestionAnswers
    } = requestData;
    
    if (!companyName) {
      throw new Error("Company name is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log("GoogleGenerativeAI initialized with API key");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("Selected model: gemini-2.0-flash");

    // Check if we're in question generation phase (first file upload without answers)
    if (fileBase64 && !financialQuestionAnswers) {
      console.log("=== GENERATING NORMALIZATION QUESTIONS ===");
      return await generateNormalizationQuestions(model, companyName, fileBase64, fileMimeType);
    }
    
    // If we have questions answers, proceed with normalization and valuation
    if (fileBase64 && financialQuestionAnswers) {
      console.log("=== PROCESSING PDF WITH USER ANSWERS ===");
      
      // Extract financial data first
      const extractedData = await extractFinancialData(model, companyName, fileBase64, fileMimeType);
      
      // Then normalize based on user answers
      const normalizedData = await normalizeFinancialData(model, extractedData, financialQuestionAnswers);
      
      // Finally generate the analysis
      return await generateAnalysis(model, companyName, normalizedData);
    }
    
    // Standard manual input path
    if (manualInputs) {
      console.log("=== PROCESSING MANUAL INPUTS ===");
      return await processManualInputs(model, companyName, manualInputs);
    }
    
    throw new Error("Invalid request: missing required parameters");
  } catch (error) {
    console.error("Error in free-valuation function:", error);
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
    console.log("Generating normalization questions for", companyName);
    
    let questionsPrompt = `Analysoi annettu tilinpäätös huolellisesti ja muodosta kaksi tärkeää normalisointikysymystä JSON-muodossa seuraavaa rakennetta noudattaen:
    1. Tunnista tilinpäätöksestä:
       - Henkilöstökulut kokonaissummana
       - Mahdolliset tiedot omistajista
       - Kiinteistö- ja toimitilakulut vuositasolla
       - Yrityksen toimiala ja koko
    2. Luo kaksi kohdennettua kysymystä:
       - Yksi omistajan palkkaan liittyen
       - Yksi kiinteistö- tai toimitilakuluihin liittyen
    3. Palauta analyysi ja kysymykset JSON-muodossa, jossa on seuraavat avaimet:
       - questions: lista, jossa kaksi kysymysobjektia
       - financial_analysis_summary: yhteenveto tunnistetuista tilinpäätösluvuista
    Jokaisen kysymysobjektin tulee sisältää:
       - id: kysymyksen tunniste (owner_salary tai premises_costs)  
       - category: kysymyksen kategoria (owner_salary tai premises_costs)
       - description: lyhyt kuvaus kysymyksen aiheesta
       - question: selkeä kysymysteksti, joka sisältää tunnistetut summat
       - impact: selitys, miksi tämä kysymys on tärkeä normalisoinnin kannalta
       - identified_values: objekti, joka sisältää tilinpäätöksestä tunnistetut arvot
       - normalization_purpose: lyhyt selitys oikaisun tarkoituksesta

    Varmista, että palautat vastauksen validina JSON-objektina, ilman saatetekstiä.`;
    
    // Prepare the content for Gemini
    const contents = [{ role: "user", parts: [] }];
    
    if (fileMimeType === "application/pdf") {
      console.log("Processing PDF file with modern Gemini approach");
      
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
    
    console.log("Sending request to Gemini for questions generation");
    
    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40
      }
    });
    
    const response = result.response;
    const text = response.text();
    
    console.log("=== RECEIVED QUESTIONS GENERATION RESPONSE ===");
    console.log(text);
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in questions response");
      }
      
      const jsonStr = jsonMatch[0];
      const questionsData = JSON.parse(jsonStr);
      
      console.log("Successfully parsed questions data:", questionsData);
      
      // Check if we have the expected structure
      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        throw new Error("Invalid questions structure in response");
      }
      
      // If we have less than 2 questions, create default ones
      if (questionsData.questions.length < 2) {
        console.log("Not enough questions generated, adding default questions");
        
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
        
        // Make sure we only have two questions
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
      
      // Format response for frontend
      const response = {
        requiresUserInput: true,
        financialQuestions: questionsData.questions,
        initialFindings: {
          company_size: "Tuntematon",
          financial_health: "Tarkennusta vaaditaan",
          primary_concerns: ["Tiedot tarkennettava käyttäjän vastauksilla"],
          period_details: {
            latest_period_end: questionsData.financial_analysis_summary.fiscal_year || "Ei tiedossa"
          }
        }
      };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Error parsing questions response:", parseError);
      throw new Error(`Tilinpäätöksen analysointi epäonnistui: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error(`Kysymysten luonti epäonnistui: ${error.message}`);
  }
}

async function extractFinancialData(model: any, companyName: string, fileBase64: string, fileMimeType?: string): Promise<FinancialData> {
  console.log("Extracting financial data from PDF for", companyName);
  
  let extractionPrompt = `Analysoi tämä tilinpäätös ja palauta yrityksen taloudelliset tiedot strukturoidussa JSON-muodossa. 
  Yrityksen nimi: "${companyName}"
  
  Palauta kaikki data seuraavassa JSON-muodossa (täytä puuttuvat arvot, jos mahdollista):
  {
    "tilinpaatos": {
      "tase": {
        "pysyvat_vastaavat": {
          "aineelliset_kayttoomaisuuserat": 0,
          "aineettomat_hyodykkeet": 0,
          "muut": 0
        },
        "vaihtuvat_vastaavat": 0,
        "velat": {
          "lyhytaikaiset": 0,
          "pitkataikaiset": 0
        }
      },
      "tuloslaskelma": {
        "liikevaihto": 0,
        "liiketoiminnan_muut_tuotot": 0,
        "liiketoiminnan_kulut": {
          "materiaalit": 0,
          "henkilostokulut": 0,
          "poistot": 0,
          "muut_kulut": 0
        },
        "liikevoitto": 0
      }
    },
    "Arvioni": {
      "EV_kerroin": 0,
      "EV_EBIT_kerroin": 0,
      "liquidation": {
        "pysyvat_vastaavat_discount": 1.0,
        "vaihtuvat_vastaavat_discount": 1.0
      }
    }
  }

  Analysoi tilinpäätös huolellisesti ja täytä kaikki kentät mahdollisimman tarkasti. EV_kerroin-kohdassa anna arvio EV/Liikevaihto -KERTOIMESTA (ei suoraa enterprise value -arvoa). Tyypillisesti tämä kerroin vaihtelee välillä 0.5-5 riippuen toimialasta ja kannattavuudesta.
  Anna myös EV_EBIT_kerroin, joka on arvio EV/EBIT -kertoimesta. Tyypillisesti tämä kerroin vaihtelee välillä 4-12 riippuen toimialasta ja yrityksen kasvunäkymistä.
  liquidation-kentässä arvioi, kuinka suuri osa varallisuuden kirjanpitoarvosta olisi realisoitavissa likvidaatiotilanteessa (esim. 0.8 = 80%).
  Palauta VAIN JSON ilman selityksiä.`;
  
  // Prepare content for Gemini
  const contents = [{ role: "user", parts: [] }];
  
  if (fileMimeType === "application/pdf") {
    console.log("Processing PDF file with modern Gemini approach");
    
    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, "");
    
    contents[0].parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: cleanBase64
      }
    });
    
    contents[0].parts.push({ text: extractionPrompt });
  } else {
    // Handle non-PDF files as text
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const fileContent = atob(base64Data);
    
    contents[0].parts.push({ 
      text: `${extractionPrompt}\n\nTilinpäätöksen sisältö:\n${fileContent}`
    });
  }
  
  console.log("Sending request to Gemini for financial data extraction");
  
  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    }
  });
  
  const response = result.response;
  const text = response.text();
  
  console.log("=== RECEIVED FINANCIAL DATA EXTRACTION RESPONSE ===");
  console.log(text);
  
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in extraction response");
    }
    
    const jsonStr = jsonMatch[0];
    const extractedData = JSON.parse(jsonStr);
    
    console.log("Successfully parsed financial data from Gemini");
    
    // Check if we have the expected structure
    if (!extractedData.tilinpaatos || !extractedData.Arvioni) {
      throw new Error("Incomplete data structure in extraction response");
    }
    
    return extractedData;
  } catch (parseError) {
    console.error("Error parsing financial data extraction response:", parseError);
    throw new Error(`Tilinpäätöksen jäsentäminen epäonnistui: ${parseError.message}`);
  }
}

async function normalizeFinancialData(model: any, extractedData: FinancialData, answers: any): Promise<FinancialData> {
  console.log("Normalizing financial data based on user answers");
  
  // Format the answers for the prompt
  const formattedAnswers = Object.entries(answers).map(([key, value]) => {
    // Split the key to get category and id
    const [category, id] = key.split('_');
    return `Question ID: ${id}, Category: ${category}\nAnswer: ${value}`;
  }).join("\n\n");
  
  const normalizationPrompt = `Analysoi alla olevat taloudelliset tiedot ja käyttäjän vastaukset normalisointikysymyksiin. 
  Normalisoi tilinpäätöstiedot käyttäjän vastausten perusteella (erityisesti omistajan palkkaan ja kiinteistökuluihin liittyen).
  
  Alkuperäiset tilinpäätöstiedot:
  ${JSON.stringify(extractedData, null, 2)}
  
  Käyttäjän vastaukset normalisointikysymyksiin:
  ${formattedAnswers}
  
  Tehtäväsi:
  1. Analysoi vastaukset ja tunnista normalisointitarpeet (erityisesti omistajan palkka ja toimitilakulut)
  2. Tee tarvittavat normalisoinnit tilinpäätöstietoihin
  3. Lisää normalisointitiedot 'normalization' -objektina
  4. Palauta normalisoidut tiedot alkuperäisessä JSON-rakenteessa
  
  Normalization-objektin tulee sisältää seuraavat tiedot:
  - status: {
    owner_salary_normalized: boolean, // oliko omistajan palkassa normalisointia
    premises_costs_normalized: boolean, // oliko toimitilakuluissa normalisointia
    normalization_impact: string, // lyhyt kuvaus normalisoinnin vaikutuksesta tulokseen
    original_values: {}, // alkuperäiset arvot
    adjusted_values: {} // muokatut arvot
  }
  
  Palauta VAIN JSON ilman selityksiä.`;
  
  console.log("Sending request to Gemini for financial data normalization");
  
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: normalizationPrompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    }
  });
  
  const response = result.response;
  const text = response.text();
  
  console.log("=== RECEIVED FINANCIAL DATA NORMALIZATION RESPONSE ===");
  console.log(text);
  
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in normalization response");
    }
    
    const jsonStr = jsonMatch[0];
    const normalizedData = JSON.parse(jsonStr);
    
    console.log("Successfully parsed normalized financial data from Gemini");
    
    // Check if we have the expected structure
    if (!normalizedData.tilinpaatos || !normalizedData.Arvioni) {
      throw new Error("Incomplete data structure in normalization response");
    }
    
    return normalizedData;
  } catch (parseError) {
    console.error("Error parsing normalization response:", parseError);
    throw new Error(`Tietojen normalisointi epäonnistui: ${parseError.message}`);
  }
}

async function processManualInputs(model: any, companyName: string, manualInputs: any) {
  console.log("=== PROCESSING MANUAL INPUTS ===");
  console.log("Manual inputs received:", JSON.stringify(manualInputs));
  
  const { revenue, profit, assets, liabilities } = manualInputs;
  
  if (typeof revenue !== 'number' || typeof profit !== 'number' || 
      typeof assets !== 'number' || typeof liabilities !== 'number') {
    console.error("Invalid manual inputs:", manualInputs);
    throw new Error("Manuaaliset syötteet ovat virheellisiä");
  }
  
  const analysisPrompt = `Analysoi nämä yksinkertaiset taloudelliset tiedot ja palauta arvio JSON-muodossa. 
  Yrityksen nimi: "${companyName}"
  
  Taloudelliset tiedot:
  - Liikevaihto: ${revenue} euroa
  - Tulos: ${profit} euroa
  - Varat: ${assets} euroa
  - Velat: ${liabilities} euroa
  
  Palauta arvio seuraavassa JSON-muodossa:
  {
    "tilinpaatos": {
      "tase": {
        "pysyvat_vastaavat": {
          "aineelliset_kayttoomaisuuserat": 0,
          "aineettomat_hyodykkeet": 0,
          "muut": 0
        },
        "vaihtuvat_vastaavat": 0,
        "velat": {
          "lyhytaikaiset": 0,
          "pitkataikaiset": 0
        }
      },
      "tuloslaskelma": {
        "liikevaihto": ${revenue},
        "liiketoiminnan_muut_tuotot": 0,
        "liiketoiminnan_kulut": {
          "materiaalit": 0,
          "henkilostokulut": 0,
          "poistot": 0,
          "muut_kulut": 0
        },
        "liikevoitto": ${profit}
      }
    },
    "Arvioni": {
      "EV_kerroin": 0,
      "EV_EBIT_kerroin": 0,
      "liquidation": {
        "pysyvat_vastaavat_discount": 0.8,
        "vaihtuvat_vastaavat_discount": 0.9
      }
    }
  }
  
  Arvion tulee perustua annettuihin lukuihin. EV_kerroin-kohdassa anna arvio EV/Liikevaihto -KERTOIMESTA (ei suoraa enterprise value -arvoa). Tyypillisesti tämä kerroin vaihtelee välillä 0.5-5 riippuen toimialasta ja kannattavuudesta.
  Anna myös EV_EBIT_kerroin, joka on arvio EV/EBIT -kertoimesta. Tyypillisesti tämä kerroin vaihtelee välillä 4-12 riippuen toimialasta ja yrityksen kasvunäkymistä.
  Palauta VAIN JSON ilman selityksiä.`;
  
  try {
    console.log("Calling Gemini API for manual data...");
    const result = await model.generateContent(analysisPrompt);
    console.log("Gemini API call for manual data completed successfully!");
    
    const response = result.response;
    const extractionText = response.text();
    
    console.log("=== RECEIVED FULL MANUAL DATA GEMINI RESPONSE ===");
    console.log(extractionText);
    
    try {
      const jsonStart = extractionText.indexOf('{');
      const jsonEnd = extractionText.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error("No valid JSON found in manual data response");
        throw new Error("No valid JSON found in response");
      }
      
      const jsonStr = extractionText.substring(jsonStart, jsonEnd);
      console.log("=== EXTRACTED JSON FROM MANUAL DATA ===");
      console.log(jsonStr);
      
      const extractedData = JSON.parse(jsonStr);
      console.log("Successfully parsed manual data analysis from Gemini");
      
      return await generateAnalysis(model, companyName, extractedData);
    } catch (parseError) {
      console.error("Error parsing manual data Gemini response:", parseError);
      throw new Error(`Tietojen jäsentäminen epäonnistui: ${parseError.message}`);
    }
  } catch (geminiError) {
    console.error("Error in manual data Gemini API call:", geminiError);
    throw new Error(`Virhe tietojen analysoinnissa: ${geminiError.message}`);
  }
}

async function generateAnalysis(model: any, companyName: string, extractedData: FinancialData) {
  try {
    console.log("=== GENERATING FINAL ANALYSIS BASED ON EXTRACTED DATA ===");
    console.log("Extracted data for analysis:");
    console.log(JSON.stringify(extractedData, null, 2));
    
    const pysyvatVastaavat = 
      (extractedData.tilinpaatos.tase.pysyvat_vastaavat.aineelliset_kayttoomaisuuserat +
      extractedData.tilinpaatos.tase.pysyvat_vastaavat.aineettomat_hyodykkeet +
      extractedData.tilinpaatos.tase.pysyvat_vastaavat.muut) * 
      extractedData.Arvioni.liquidation.pysyvat_vastaavat_discount;
    
    const vaihtuvatVastaavat = extractedData.tilinpaatos.tase.vaihtuvat_vastaavat * 
      extractedData.Arvioni.liquidation.vaihtuvat_vastaavat_discount;
    
    const totalAssets = pysyvatVastaavat + vaihtuvatVastaavat;
    const totalLiabilities = extractedData.tilinpaatos.tase.velat.lyhytaikaiset + 
      extractedData.tilinpaatos.tase.velat.pitkataikaiset;
    
    const substanssiValue = totalAssets - totalLiabilities;
    const isSubstanssiNegative = substanssiValue < 0;
    
    const liikevaihto = extractedData.tilinpaatos.tuloslaskelma.liikevaihto;
    const ebit = extractedData.tilinpaatos.tuloslaskelma.liikevoitto;
    const evKerroin = extractedData.Arvioni.EV_kerroin;
    const evEbitKerroin = extractedData.Arvioni.EV_EBIT_kerroin || 5.0;
    
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
    
    console.log("===== VALUATION CALCULATIONS =====");
    console.log(`pysyvatVastaavat: ${pysyvatVastaavat}`);
    console.log(`vaihtuvatVastaavat: ${vaihtuvatVastaavat}`);
    console.log(`totalAssets: ${totalAssets}`);
    console.log(`totalLiabilities: ${totalLiabilities}`);
    console.log(`substanssiValue: ${substanssiValue}`);
    console.log(`isSubstanssiNegative: ${isSubstanssiNegative}`);
    console.log(`liikevaihto: ${liikevaihto}`);
    console.log(`evKerroin: ${evKerroin}`);
    console.log(`evEbitKerroin: ${evEbitKerroin}`);
    console.log(`korjattuKerroin: ${korjattuKerroin}`);
    console.log(`evLiikevaihtoValue: ${evLiikevaihtoValue}`);
    console.log(`ebit: ${ebit}`);
    console.log(`isEbitNegativeOrZero: ${isEbitNegativeOrZero}`);
    console.log(`evEbitValue: ${evEbitValue}`);
    console.log(`valuationRange: ${low} - ${high}`);
    console.log("==================================");
    
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
    
    console.log("Final valuation numbers object:");
    console.log(JSON.stringify(valuationNumbers, null, 2));
    
    const premiumServiceDescription = `
1. Tarkempi yrityksen arvonmääritys
Käymme läpi useamman tilikauden tilinpäätökset tai muut dokumentit, tarjoten kattavan analyysin tuloksista action pointteineen sekä toimialavertailun.

• Tekoäly analysoi tilinpäätökset sekunnissa ja tunnistaa automaattisesti keskeiset tunnusluvut
• Kehittynyt algoritmi vertaa tuloksia toimialan dataan ja tunnistaa poikkeamat
• Eriytetty laskentamoottori takaa tarkat ja luotettavat arvonmääritykset

2. AI-avusteinen myyntikuntoisuuden arviointi
Osaamme poimia juuri sinun yrityksesi kannalta oleelliset seikat, luomme arvion nykyisestä myyntikunnosta ja autamme sinua parantamaan yrityksesi arvoa.

• käymme läpi yrityksestä löytyvää tietoa yrityksen dokumentaatiota ai-avusteisesti sekä selvitämme toimialan erikoispiirteet ja potentiaalisen ostajan aikeet automaattisesti 

3. Kehityssuunnitelma ja tehtävät
Automaattisesti generoitu tehtävälista myyntikuntoisuuden parantamiseksi, jotka voit toteuttaa ja saada palautteen kuinka paljon ne potentiaalisesti vaikuttavat yrityksen arvoon tai onko jotain kriittisiä esteitä.

• Tekoäly priorisoi tehtävät niiden vaikuttavuuden ja toteutettavuuden perusteella
• Automaattinen seuranta ja ennuste toimenpiteiden vaikutuksesta yrityksen arvoon

4. Henkilökohtainen tekoälyassistentti
Uusinta Gemini 2.0 teknologiaa hyödyntävä assistentti:
* Tuntee yrityksen perustiedot ja taloudellisen tilanteen
* Vastaa kysymyksiin arvonmäärityksestä ja myyntiprosessista
* Tarjoaa räätälöityjä neuvoja yrityksen kehittämiseen
* Auttaa dokumentaation ja prosessien parantamisessa
* Suomenkielinen vuorovaikutus
* Kontekstuaalinen ymmärrys yrityksen tilanteesta

5. Master-raportointi
Kattavan PDF-muotoisen Master-raportin luonti, joka sisältää:
* Yksityiskohtaisen yritysanalyysin
* Myyntikuntoisuuden arvioinnin osa-alueittain
* Graafiset esitykset ja visualisoinnit

6. Monipuoliset jakamisominaisuudet
* Raportin jakaminen sähköpostilla
* Jaettavien linkkien generointi
* Datan ja kommentointimahdollisuuksien hallinta
* Mukautettavat saateviestit

Premium-version edut:
* Pääsy kaikkiin palvelun ominaisuuksiin
* Master-raportin luonnin ja jakamisen
* Rajoittamattoman käytön tekoälyassistentille
* Laajemmat analysointityökalut
* Yksityiskohtaisemmat raportit ja visualisoinnit
* Kattavat jakamisominaisuudet potentiaalisille ostajille
* Mahdollisuuden tallentaa ja seurata kehitystä ajan mittaan
Meidän myyntikuntoon.com auttaa yrittäjiä ymmärtämään yrityksensä arvon, kehittämään myyntikuntoisuutta ja jakamaan tiedot hallitusti potentiaalisten osta`;

    const analysisPrompt = `Tarkastele seuraavat yritystiedot ja taloudelliset laskelmat ja laadi yksityiskohtainen kommentointi niistä. Yrityksen nimi: "${companyName}"

Taloudelliset tiedot:
${JSON.stringify(extractedData, null, 2)}

Arvonmäärityksen tulokset:
- Substanssiarvo: ${Math.round(substanssiValue)} euroa ${isSubstanssiNegative ? "(NEGATIIVINEN - velat ylittävät varat)" : ""}
- EV/Revenue-arvo: ${Math.round(evLiikevaihtoValue)} euroa (käytetty liikevaihtokerroin: ${korjattuKerroin.toFixed(2)})
- EV/EBIT-arvo: ${isEbitNegativeOrZero ? "Ei laskettavissa (negatiivinen tai nolla EBIT)" : Math.round(evEbitValue) + " euroa"} ${!isEbitNegativeOrZero ? `(käytetty EBIT-kerroin: ${evEbitKerroin.toFixed(2)})` : ""}
- Arvon vaihteluväli: ${low === 0 && high === 0 ? "Ei laskettavissa (kaikki mittarit negatiivisia/nolla)" : `${Math.round(low)} - ${Math.round(high)} euroa`}

${isSubstanssiNegative ? "HUOMIO: Yrityksen substanssiarvo on negatiivinen, mikä tarkoittaa että velat ylittävät yrityksen varat." : ""}
${isEbitNegativeOrZero ? "HUOMIO: Yrityksen EBIT (liikevoitto) on negatiivinen tai nolla, mikä vaikuttaa merkittävästi arvonmääritykseen." : ""}

Luo yksityiskohtainen kommentointi näistä tuloksista JSON-muodossa seuraavasti:

{
  "key_points": {
    "title": "Keskeiset havainnot",
    "content": "Tiivis kuvaus arvonmäärityksen päätuloksista ja kokonaiskuva"
  },
  "valuation_analysis": {
    "substanssi_analysis": {
      "title": "Substanssiarvon analyysi",
      "content": "Yksityiskohtainen kommentti substanssiarvosta ja sen merkityksestä yritykselle"
    },
    "ev_revenue_analysis": {
      "title": "EV/Revenue-arvon analyysi",
      "content": "Yksityiskohtainen kommentti EV/Revenue-arvosta ja sen merkityksestä yritykselle"
    },
    "ev_ebit_analysis": {
      "title": "EV/EBIT-arvon analyysi",
      "content": "Yksityiskohtainen kommentti EV/EBIT-arvosta ja sen merkityksestä yritykselle"
    }
  },
  "myyntikuntoon_recommendation": {
    "personalized_title": "Juuri sinun yrityksellesi räätälöity otsikko",
    "catchy_subtitle": "Houkutteleva alaotsikko",
    "main_benefit_description": "Kuvaus siitä, miten MYYNTIKUNTOON-palvelun maksullinen versio auttaisi juuri tätä yritystä parantamaan arvoaan",
    "bullet_points": {
      "bullet_point_1": "Tärkeä hyöty 1",
      "bullet_point_2": "Tärkeä hyöty 2",
      "bullet_point_3": "Tärkeä hyöty 3"
    },
    "call_to_action": "Aloita Myyntikuntoon-palvelu nyt"
  },
  "recommendations": [
    {
      "title": "Suosituksen otsikko",
      "description": "Toimenpidesuositus yritykselle arvon parantamiseksi"
    }
  ]
}

Ohjeet:
1. Kommentoi annettuja lukuarvoja - älä laske uusia arvoja
2. Selitä arvonmäärityksen tuloksia ja eri menetelmien merkitystä tämän yrityksen kohdalla
3. Sisällytä erilliseen osioon (myyntikuntoon_recommendation) spesifinen suositus MYYNTIKUNTOON-palvelun maksullisesta versiosta perustuen seuraaviin tietoihin palvelustamme:
${premiumServiceDescription}
4. Sisällytä 1-3 toimenpidesuositusta recommendations-osioon
5. Analyysin tulee olla suomeksi
6. Pidä teksti positiivisena ja kannustavana${isSubstanssiNegative || isEbitNegativeOrZero ? ", mutta rehellisesti huomioi myös taloudelliset haasteet" : ""}
7. Muotoile myyntikuntoon_recommendation-osio erityisen houkuttelevaksi ja vakuuttavaksi - tämä on tärkeä osa arvonmääritysraporttia.
8. Personoi kaikki teksti koskemaan juuri kyseistä yritystä ja sen tilannetta.`;

    console.log("Analysis prompt preparation complete, first 500 chars:");
    console.log(analysisPrompt.substring(0, 500));
    
    console.log("SENDING REQUEST TO GEMINI API for final analysis...");
    const result = await model.generateContent(analysisPrompt);
    console.log("Gemini API call for final analysis completed successfully!");
    
    const response = result.response;
    const analysisText = response.text();
    
    console.log("=== RECEIVED FULL FINAL ANALYSIS RESPONSE ===");
    console.log(analysisText);
    console.log("=== END OF FULL FINAL ANALYSIS RESPONSE ===");
    
    const jsonStart = analysisText.indexOf('{');
    const jsonEnd = analysisText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No valid JSON found in analysis response");
      console.error("Full analysis response:", analysisText);
      throw new Error("No valid JSON found in analysis response");
    }
    
    const jsonStr = analysisText.substring(jsonStart, jsonEnd);
    console.log("=== FULL FINAL ANALYSIS JSON ===");
    console.log(jsonStr);
    console.log("=== END OF FULL FINAL ANALYSIS JSON ===");
    
    const analysis = JSON.parse(jsonStr);
    console.log("Successfully parsed final analysis with keys:", Object.keys(analysis));
    
    if (!analysis.key_points || !analysis.valuation_analysis) {
      console.error("Missing required fields in analysis", Object.keys(analysis));
      throw new Error("Incomplete data structure in analysis response");
    }
    
    const finalResponse = {
      ...analysis,
      valuation_numbers: valuationNumbers
    };
    
    console.log("Final complete response data:");
    console.log(JSON.stringify(finalResponse, null, 2));
    console.log("==============================================================");
    console.log("FREE VALUATION FUNCTION EXECUTION COMPLETED SUCCESSFULLY");
    console.log("==============================================================");
    
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analysis generation:", error);
    throw new Error(`Virhe analyysin luomisessa: ${error.message}`);
  }
}
