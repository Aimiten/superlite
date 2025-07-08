// financial-analysis.ts
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";
import { createAnalysisPrompt, createCorporationPrompt, createPartnershipPrompt, createManualMultiplierPrompt } from "./utils/gemini-prompts.ts";
import { parseGeminiJsonResponse } from "./utils/gemini-parser.ts";
import { callClaudeModel } from "../analyze-sales-readiness/utils/claude-client.ts";
import { shouldUseManualMultipliers } from "../_shared/multiplier-utils.ts";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Interface for file data expected from client
 */
interface FileData {
  id?: string;
  name?: string;
  data?: string; // Text content
  base64?: string; // Base64 encoded content
  mimeType?: string; // MIME type, e.g., "application/pdf"
}

/**
 * Analyzes multiple financial documents with Gemini API to identify questions for user
 * @param companyName Name of the company
 * @param files Array of file data objects containing text and/or base64 data
 * @param companyType Optional type of company (corporation or partnership)
 * @returns Analysis results or questions that need user input
 */
export async function analyzeFinancialData(
  companyName: string,
  files: FileData[],
  companyType?: string,
  multiplierMethod?: 'ai' | 'manual',
  customMultipliers?: any
) {
  // Funktio pysyy muuttamattomana
  console.log(`Analyzing ${files.length} financial documents for ${companyName}`);

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Determine if we're dealing with a partnership or corporation
    const isPartnership = companyType === "toiminimi" ||
                          companyType === "henkilöyhtiö" ||
                          companyType === "avoin yhtiö" ||
                          companyType === "kommandiittiyhtiö";

    console.log(`Company type: ${companyType}, is partnership: ${isPartnership}`);

    // Create the appropriate prompt based on company type and multiplier method
    const useManualMultipliers = shouldUseManualMultipliers(multiplierMethod, customMultipliers);

    const prompt = useManualMultipliers
      ? createManualMultiplierPrompt(companyName, customMultipliers, companyType)
      : isPartnership
        ? createPartnershipPrompt(companyName)
        : createCorporationPrompt(companyName);

    console.log(`Preparing content for Gemini analysis with ${files.length} documents`);

    // Create the content structure for Gemini
    const contents = [{ role: "user", parts: [] as any[] }];

    // Process each file and add to the content
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name || `document-${i+1}.pdf`;

      contents[0].parts.push({
        text: `\n\n--- DOCUMENT ${i+1}: ${fileName} ---\n\n`
      });

      if (file.base64 && file.mimeType === "application/pdf") {
        console.log(`Adding PDF data for document ${i+1}: ${fileName} (${file.base64.length} chars)`);
        let base64Data = file.base64;
        if (base64Data.includes(',')) {
            base64Data = base64Data.split(",")[1] || base64Data;
        }
        contents[0].parts.push({
          inline_data: { mime_type: file.mimeType, data: base64Data }
        });
      } else if (file.data && file.data.length > 0 && file.mimeType !== "application/pdf") {
        // Vain tekstitiedostoille (ei PDF:lle) ja vain jos on sisältöä
        console.log(`Adding text data for document ${i+1}: ${fileName} (${file.data.length} chars)`);
        contents[0].parts.push({
          text: `Financial statement data:\n${file.data}`
        });
      } else {
        console.warn(`Document ${i+1} (${fileName}) has no usable content`);
      }
    }

    if (contents[0].parts.filter(p => p.inline_data || (p.text && !p.text.startsWith('\n\n--- DOCUMENT'))).length === 0) {
        console.error("No documents with valid content found after processing.");
        throw new Error("Yhdessäkään tiedostossa ei ollut kelvollista sisältöä analysoitavaksi");
    }

    contents[0].parts.push({
      text: `\n\n--- ANALYSIS INSTRUCTIONS ---\n\n${prompt}\n\nPlease analyze all ${files.length} documents provided above as a complete set of financial data.`
    });

    console.log(`Sending request to Gemini (${GEMINI_MODEL}) with ${contents[0].parts.length} content parts`);

    const generationConfig = {
      temperature: 0.1,
      maxOutputTokens: 55000,
    };

    // Retry configuration
    const MAX_GEMINI_ATTEMPTS = 2;
    const RETRY_DELAY_MS = 1000;
    let lastError = null;
    
    // Helper function to validate and return successful response
    const validateAndReturn = (parsedData: any, attempt: number, source: string) => {
      if (parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
        console.log(`${source} attempt ${attempt} successful: ${parsedData.questions.length} questions identified`);
        return {
          status: "questions_identified",
          questions: parsedData.questions,
          initialFindings: parsedData.initialFindings || {},
          company_name: companyName,
          _rawAnalysisData: parsedData
        };
      }

      if (parsedData.documents && Array.isArray(parsedData.documents) && parsedData.documents.length > 0) {
        console.log(`${source} attempt ${attempt} successful: complete analysis`);
        parsedData.status = "completed_no_questions";
        return {
          ...parsedData,
          company_name: companyName
        };
      }

      return null; // Invalid data
    };
    
    // Gemini retry loop
    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
      try {
        console.log(`Gemini attempt ${attempt}/2`);
        const result = await model.generateContent({ contents, generationConfig });
        const response = result.response;

        if (!response || response.promptFeedback?.blockReason) {
          const blockReason = response?.promptFeedback?.blockReason || "Unknown reason";
          const safetyRatings = response?.candidates?.[0]?.safetyRatings || "No safety ratings";
          console.error(`Gemini request blocked on attempt ${attempt}. Reason: ${blockReason}`, safetyRatings);
          lastError = new Error(`Tekoälypyyntö estettiin turvallisuussyistä: ${blockReason}`);
          continue;
        }

        const text = response.text();
        console.log(`Received response from Gemini attempt ${attempt}, length: ${text.length} characters`);

        try {
          const parsedData = parseGeminiJsonResponse(text, {
            expectFormat: "object",
            logPrefix: "financial-analysis"
          });

          // Validate parsed data
          const validResponse = validateAndReturn(parsedData, attempt, "Gemini");
          if (validResponse) {
            return validResponse;
          }

          // If we reach here, parsing succeeded but data is incomplete
          console.warn(`Gemini attempt ${attempt} parsed but incomplete data`);
          lastError = new Error("Osittainen vastaus Geminiltä");
          if (attempt < MAX_GEMINI_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
        } catch (parseError) {
          console.error(`Gemini attempt ${attempt} parse failed:`, parseError);
          console.log("Raw response sample:", text.substring(0, 500) + "...");
          lastError = parseError;
          if (attempt < MAX_GEMINI_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
        }
      } catch (error) {
        console.error(`Gemini attempt ${attempt} failed:`, error);
        lastError = error;
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
      }
    }

    // Claude fallback
    console.log("Gemini failed, trying Claude fallback...");
    try {
      const claudePrompt = isPartnership ? 
        createPartnershipPrompt(companyName) : 
        createCorporationPrompt(companyName);
      
      const claudeDocuments = files.map(file => ({
        name: file.name || 'document.pdf',
        base64: file.base64,
        mime_type: file.mimeType,
        content: file.data
      }));

      const claudeResult = await callClaudeModel(claudePrompt, claudeDocuments);
      const claudeText = claudeResult.response.text();
      
      console.log(`Claude fallback successful, length: ${claudeText ? claudeText.length : 0} characters`);
      
      const parsedData = parseGeminiJsonResponse(claudeText, {
        expectFormat: "object",
        logPrefix: "claude-fallback"
      });
      
      const validResponse = validateAndReturn(parsedData, 1, "Claude");
      if (validResponse) {
        return validResponse;
      }
      
    } catch (claudeError) {
      console.error("Claude fallback also failed:", claudeError);
    }

    // Final fallback to default questions
    console.warn("WARNING: Both Gemini and Claude failed. Falling back to default questions.");
    return {
      status: "questions_identified",
      questions: [
        {
          id: "owner_salary_default",
          category: "owner_salary",
          question: "Mikä on yrittäjän markkinaehtoinen palkka vuodessa?",
          impact: "Vaikuttaa normalisoituun tulokseen ja arvostukseen",
          normalization_purpose: "Normalisoidaan markkinaehtoiseen palkkaan"
        },
        {
          id: "one_time_items_default", 
          category: "one_time_items",
          question: "Onko tilinpäätöksessä kertaluontoisia eriä viimeisen 3 vuoden aikana?",
          impact: "Kertaluonteiset erät poistetaan normalisoinnissa",
          normalization_purpose: "Saadaan kuva jatkuvasta suorituskyvystä"
        },
        {
          id: "premises_default",
          category: "premises_costs", 
          question: "Kuinka paljon markkinaehtoinen vuokra olisi?",
          impact: "Vaikuttaa normalisoituun tulokseen",
          normalization_purpose: "Normalisoidaan markkinaehtoiseen vuokraan"
        }
      ],
      initialFindings: {
        company_size: "Tuntematon",
        financial_health: "Vaatii tarkennusta", 
        primary_concerns: ["Normalisointi tarvitaan"],
        fallback_reason: `Sekä Gemini että Claude epäonnistuivat: ${lastError?.message || "Tuntematon virhe"}`
      },
      company_name: companyName
    };
  } catch (error) {
    console.error("Error in analyzeFinancialData:", error);
    return {
      error: error.message || "Tuntematon virhe tilinpäätöstietojen analysoinnissa",
      status: "error"
    };
  }
}

/**
 * Analyzes financial documents with user-provided answers to normalize financial data
 * @param companyName Name of the company
 * @param files Array of file data objects containing text and/or base64 data
 * @param answers User answers to financial questions (object format directly from frontend)
 * @param companyType Optional type of company (corporation or partnership)
 * @param questions Optional original questions that were asked to the user for better context
 * @returns Normalized financial analysis
 */
export async function analyzeFinancialPDFWithAnswers(
  companyName: string,
  files: FileData[],
  answers: Record<string, string>, // MUUTETTU: Vastaukset objektina suoraan frontendistä
  companyType?: string,
  questions?: { id: string; category: string; question: string; impact?: string }[],
  multiplierMethod?: 'ai' | 'manual',
  customMultipliers?: any
) {
  console.log(`Analyzing ${files.length} financial documents with user answers for ${companyName}`);
  console.log(`User provided ${Object.keys(answers).length} answers`);

  if (!files || !Array.isArray(files) || files.length === 0) {
    console.error("No files provided to analyzeFinancialPDFWithAnswers");
    return { error: "Tilinpäätöstiedostoja ei löytynyt toiseen vaiheeseen", status: "error_no_files_phase2" };
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      console.warn("No answers provided for phase 2 analysis, proceeding without them.");
      throw new Error("Vastauksia ei annettu toisen vaiheen analyysiin");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Logaa kysymykset
    console.log("Questions structure:", questions 
      ? questions.map(q => ({id: q.id, category: q.category})) 
      : "No questions");

    // YKSINKERTAISTETTU: Muodosta vastaukset kysymysten perusteella
    let formattedAnswers = "";
    if (questions && Array.isArray(questions) && questions.length > 0) {
      console.log(`Formatting answers using ${questions.length} original questions.`);

      formattedAnswers = questions.map(q => {
        // Muodosta avain samassa muodossa kuin frontend sen lähettää
        const key = `${q.category}_${q.id}`;

        // Etsi vastaus tällä avaimella
        const answer = answers[key] || "Ei vastausta";

        console.log(`Question: ${q.question}, Key: ${key}, Has answer: ${answers[key] ? 'YES' : 'NO'}`);

        return `Kysymys: ${q.question}\nVastauksen vaikutus: ${q.impact || "Vaikuttaa yrityksen arvonmääritykseen"}\nVastaus: ${answer}`;
      }).join("\n\n");
    } else {
      console.log("Formatting answers without original questions (using keys).");
      // Jos ei ole kysymyksiä, käytä suoraan avaimia
      formattedAnswers = Object.entries(answers).map(([key, value]) => {
        const parts = key.split('_');
        const category = parts.length > 1 ? parts[0] : 'general';
        const id = parts.length > 1 ? parts.slice(1).join('_') : key;

        return `Kysymys: Kysymys kategoriassa ${category} (ID: ${id})\nVastaus: ${value}`;
      }).join("\n\n");
    }

    console.log("Formatted answers sample:", formattedAnswers.substring(0, 200) + 
                (formattedAnswers.length > 200 ? "..." : ""));

    // Create the appropriate prompt based on multiplier method
    const useManualMultipliers = shouldUseManualMultipliers(multiplierMethod, customMultipliers);

    const prompt = useManualMultipliers
      ? createManualMultiplierPrompt(companyName, customMultipliers, companyType)
      : createAnalysisPrompt(companyName, formattedAnswers, companyType, questions);

    console.log(`Preparing content for second Gemini analysis with ${files.length} documents`);

    const contents = [{ role: "user", parts: [] as any[] }];

    // Process each file and add to the content
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name || `document-${i+1}.pdf`;
        contents[0].parts.push({ text: `\n\n--- DOCUMENT ${i+1}: ${fileName} ---\n\n` });
        if (file.base64 && file.mimeType === "application/pdf") {
            let base64Data = file.base64;
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(",")[1] || base64Data;
            }
            contents[0].parts.push({ inline_data: { mime_type: file.mimeType, data: base64Data } });
        } else if (file.data && file.data.length > 0 && file.mimeType !== "application/pdf") {
            // Vain tekstitiedostoille (ei PDF:lle) ja vain jos on sisältöä
            contents[0].parts.push({ text: `Financial statement data:\n${file.data}` });
        } else {
            console.warn(`Document ${i+1} (${fileName}) has no usable content`);
        }
      }

    if (contents[0].parts.filter(p => p.inline_data || (p.text && !p.text.startsWith('\n\n--- DOCUMENT'))).length === 0) {
        console.error("No documents with valid content found after processing for phase 2.");
        throw new Error("Yhdessäkään tiedostossa ei ollut kelvollista sisältöä toisen vaiheen analysoitavaksi");
    }

    contents[0].parts.push({
      text: `\n\n--- ANALYSIS INSTRUCTIONS WITH USER ANSWERS ---\n\n${prompt}\n\nPlease analyze all ${files.length} documents provided above as a complete set of financial data, using the answers provided.`
    });

    console.log(`Sending request to Gemini (${GEMINI_MODEL}) with ${contents[0].parts.length} content parts and user answers`);

    const generationConfig = {
      temperature: 0.1,
      maxOutputTokens: 18192,
    };

    let result;
    try {
      result = await model.generateContent({ contents, generationConfig });
      console.log("Gemini API second phase call successful");
    } catch (apiError) {
      console.error("ERROR CALLING GEMINI API (second phase):", apiError);
      return { error: `Toisen vaiheen API-kutsu epäonnistui: ${apiError.message || "Tuntematon API-virhe"}`, status: "api_error_phase2" };
    }

    const response = result.response;

    if (!response || response.promptFeedback?.blockReason) {
      const blockReason = response?.promptFeedback?.blockReason || "Unknown reason";
      const safetyRatings = response?.candidates?.[0]?.safetyRatings || "No safety ratings";
      console.error(`Gemini request blocked (phase 2). Reason: ${blockReason}`, safetyRatings);
      return { error: `Toisen vaiheen tekoälypyyntö estettiin turvallisuussyistä: ${blockReason}`, status: "blocked_phase2" };
    }

    const text = response.text();
    console.log(`Received phase 2 response from Gemini, length: ${text ? text.length : 0} characters`);

    if (!text || text.length < 10) {
      console.error("Received empty or very short response from Gemini in phase 2");
      return { error: "Tekoäly palautti tyhjän tai liian lyhyen vastauksen toisessa vaiheessa", status: "empty_response_phase2" };
    }

    try {
      // KORVAA VANHA JSON-PARSINTA TÄLLÄ:
      const parsedData = parseGeminiJsonResponse(text, {
        expectFormat: "object",
        logPrefix: "financial-analysis-phase2"
      });

      // IMPORTANT: Set status to 'completed' after successful phase 2 analysis and normalization
      parsedData.status = "completed";
      return parsedData; // Return the normalized data

    } catch (processingError) {
        console.error("Unexpected error processing Gemini response in second phase:", processingError);
        return { error: `Odottamaton virhe toisen vaiheen vastauksen käsittelyssä: ${processingError.message}`, status: "processing_error_phase2" };
      }
  } catch (error) {
    console.error("Error in analyzeFinancialPDFWithAnswers:", error);
    return { error: error.message || "Tuntematon virhe analysoitaessa tilinpäätöstietoja vastauksilla", status: "error_phase2" };
  }
}

/**
 * Combines all financial periods from all documents into a single array
 * @param financialAnalysis Financial analysis data from Gemini (should be normalized)
 * @returns Array of all financial periods from all documents
 */
function combineAllFinancialPeriods(financialAnalysis: any): any[] {
  if (!financialAnalysis?.documents || !Array.isArray(financialAnalysis.documents)) {
    return [];
  }

  const allPeriods = [];
  for (const doc of financialAnalysis.documents) {
    if (doc.financial_periods && Array.isArray(doc.financial_periods)) {
      allPeriods.push(...doc.financial_periods);
    }
  }

  return allPeriods;
}

/**
 * Calculates financial metrics based on the **NORMALIZED** financial analysis.
 * Focuses on calculating EQUITY VALUE.
 * @param financialAnalysis Financial analysis data from Gemini (should be normalized)
 * @param companyInfo Optional company information (e.g., from Perplexity)
 */
export function calculateFinancialMetrics(financialAnalysis: any, companyInfo?: any) {
  // Check for errors or missing data from the analysis phase
  if (!financialAnalysis || financialAnalysis.error || !financialAnalysis.documents || !Array.isArray(financialAnalysis.documents) || financialAnalysis.documents.length === 0) {
    console.error("Invalid or missing financial analysis data for metrics calculation. Analysis data:", financialAnalysis);
    // Ensure error message is propagated if it exists
    if (financialAnalysis && financialAnalysis.error && !financialAnalysis.error_metrics) {
        financialAnalysis.error_metrics = `Metrics calculation skipped due to previous error: ${financialAnalysis.error}`;
    } else if (!financialAnalysis?.error) {
        financialAnalysis = financialAnalysis || {}; // Ensure object exists
        financialAnalysis.error_metrics = "Metrics calculation skipped: Invalid or missing financial data.";
    }
    return; // Stop calculation
  }

  // Check if analysis is actually completed (status should be 'completed' or 'completed_no_questions')
  // If questions were identified but not answered, calculation should not proceed.
  if (financialAnalysis.status === 'questions_identified') {
      console.warn("Metrics calculation skipped: Financial analysis requires user input (status: questions_identified).");
      financialAnalysis.error_metrics = "Metrics calculation skipped: User input required for normalization.";
      return;
  }

  try {
    // Process each document in the analysis
    financialAnalysis.documents.forEach((document: any, docIndex: number) => {
      if (!document.financial_periods || !Array.isArray(document.financial_periods) || document.financial_periods.length === 0) {
        console.warn(`Document ${docIndex + 1} has no financial periods, skipping metrics calculation for it.`);
        return; // Skip this document
      }

      // Get all periods from all documents and sort by date from newest to oldest
      const allPeriods = combineAllFinancialPeriods(financialAnalysis);
      const sortedPeriods = [...allPeriods].sort((a: any, b: any) => {
        const aEndDate = a?.period?.end_date ? new Date(a.period.end_date) : new Date(0);
        const bEndDate = b?.period?.end_date ? new Date(b.period.end_date) : new Date(0);
        return bEndDate.getTime() - aEndDate.getTime(); // Newest first
      });

      // Store sorted periods in the document for reference
      document.sortedPeriods = sortedPeriods;
      document.period_count = sortedPeriods.length;

      // Determine business pattern (growth/cyclical/stable) to set appropriate weighting
      const patternInfo = determineBusinessPattern(sortedPeriods);

      // Set alpha based on business pattern
      let alpha: number;
      if (patternInfo.pattern === "growth") {
        alpha = 0.9; // Strong focus on latest period for growth companies
      } else if (patternInfo.pattern === "cyclical") {
        alpha = 0.5; // More even distribution for cyclical companies
      } else {
        alpha = 0.7; // Standard exponential weighting for stable companies
      }

      // Calculate weights for each period
      const weights = sortedPeriods.map((_: any, index: number) => Math.pow(1 - alpha, index));
      const weightSum = weights.reduce((sum: number, w: number) => sum + w, 0);
      const normalizedWeights = weights.map(w => w / weightSum);

      // Store weighting information
      document.period_weighting = {
        method: "exponential",
        alpha: alpha,
        business_pattern: patternInfo.pattern,
        volatility_score: patternInfo.volatilityScore,
        growth_rate: patternInfo.growthRate,
        explanation: getWeightingExplanation(patternInfo.pattern),
        weights: normalizedWeights.map(w => Number(w.toFixed(4))),
        period_count: sortedPeriods.length
      };

      // Calculate weighted financial values
      const weightedValues = {
        revenue: 0,
        ebit: 0,
        ebitda: 0,
        net_income: 0
      };

      // UUSI: Estimoi puuttuvat EBITDA:t ENNEN painotuslaskentaa
      sortedPeriods.forEach((period: any) => {
        if (!period.calculated_fields) period.calculated_fields = {};

        const incomeStatement = period.income_statement || {};
        const calculatedFields = period.calculated_fields || {};

        const ebit = parseFloat(incomeStatement.ebit || 0);
        let ebitda = parseFloat(incomeStatement.ebitda || calculatedFields.ebitda_estimated || 0);

        // Estimate EBITDA if missing and EBIT exists
        if (ebitda === 0 && ebit !== 0 && incomeStatement.depreciation) {
          ebitda = ebit - parseFloat(incomeStatement.depreciation);
          period.calculated_fields.ebitda_estimated = ebitda;
          console.log(`Pre-calculated EBITDA for period ending ${period.period?.end_date}: ${ebitda}`);
        }
      });

      // Apply weights to each period's values
      sortedPeriods.forEach((period: any, index: number) => {
        const weight = normalizedWeights[index];

        // Initialize calculated_fields if missing
        if (!period.calculated_fields) period.calculated_fields = {};

        // Store weight on the period
        period.weight = weight;

        // Get income statement values
        const incomeStatement = period.income_statement || {};
        const calculatedFields = period.calculated_fields || {};

        // Add weighted values
        weightedValues.revenue += (parseFloat(incomeStatement.revenue || 0) * weight);
        weightedValues.ebit += (parseFloat(incomeStatement.ebit || 0) * weight);

        // EBITDA can be direct or calculated
        const ebitda = parseFloat(incomeStatement.ebitda || calculatedFields.ebitda_estimated || 0);
        weightedValues.ebitda += (ebitda * weight);

        weightedValues.net_income += (parseFloat(incomeStatement.net_income || 0) * weight);
      });

      // Store weighted values in latest period (the one used for valuation)
      const latestPeriod = sortedPeriods[0];
      latestPeriod.weighted_financials = {
        revenue: Number(weightedValues.revenue.toFixed(2)),
        ebit: Number(weightedValues.ebit.toFixed(2)),
        ebitda: Number(weightedValues.ebitda.toFixed(2)),
        net_income: Number(weightedValues.net_income.toFixed(2))
      };

      // Continue with standard metric calculation, but use weighted values
      console.log(`Calculating metrics for ${sortedPeriods.length} periods of document ${docIndex + 1}`);

      // Process the latest period (with weighted values)
      const period = latestPeriod;
      const periodIdentifier = `Doc ${docIndex + 1}, Period ending ${period?.period?.end_date || 'N/A'}`;

      // Ensure necessary structures exist
      if (!period.balance_sheet) period.balance_sheet = {};
      if (!period.income_statement) period.income_statement = {};
      period.valuation_metrics = {}; // Reset to ensure fresh calculation
      period.calculated_fields = period.calculated_fields || {}; // Keep existing calculated fields

      if (!period.dcf_items) period.dcf_items = { cash: 0, interest_bearing_debt: 0 };
      if (!period.valuation_multiples) period.valuation_multiples = {};

      // Extract data from NORMALIZED analysis
      const balanceSheet = period.balance_sheet;
      const incomeStatement = period.income_statement;
      const dcfItems = period.dcf_items;
      const valuationMultiples = period.valuation_multiples;
      const calculatedFields = period.calculated_fields;

      // --- Key Financial Figures ---
      const totalAssets = parseFloat(balanceSheet.assets_total || 0);
      const totalLiabilities = parseFloat(balanceSheet.liabilities_total || 0);
      const equityValue = parseFloat(balanceSheet.equity || 0);

      // Käytä ensisijaisesti suoraa equity-arvoa, sitten vasta laskennallista
      const bookValue = equityValue > 0 ? equityValue : (totalAssets - totalLiabilities);
      period.valuation_metrics.book_value = isNaN(bookValue) ? 0 : bookValue;

      // --- Net Debt Calculation ---
      const cash = parseFloat(dcfItems.cash || 0);
      const interestBearingDebt = parseFloat(dcfItems.interest_bearing_debt || 0);
      const netDebt = interestBearingDebt - cash;
      period.valuation_metrics.calculated_net_debt = isNaN(netDebt) ? 0 : netDebt;

      // Laske ja tallenna aina asset based value (nettovarat)
      period.valuation_metrics.asset_based_value = Math.max(0, -netDebt);

      // Estimate EBITDA ONLY if missing and EBIT is present (as a last resort)
      const revenue = weightedValues.revenue || parseFloat(incomeStatement.revenue || 0);
      const ebit = weightedValues.ebit || parseFloat(incomeStatement.ebit || calculatedFields.ebit || 0);
      let ebitda = weightedValues.ebitda || parseFloat(incomeStatement.ebitda || calculatedFields.ebitda || 0);
      const netIncome = weightedValues.net_income || parseFloat(incomeStatement.net_income || 0);

      // POISTETTU: Redundantti EBITDA-estimointi (tehdään nyt aiemmin rivilla ~352-365)
        // if (ebitda === 0 && ebit !== 0 && incomeStatement.depreciation) {
        //   ebitda = ebit - parseFloat(incomeStatement.depreciation);
        //   console.log(`Estimated EBITDA for ${periodIdentifier} based on EBIT and Depreciation: ${ebitda}`);
        //   period.calculated_fields.ebitda_estimated = ebitda;
        // }

      console.log(`Key financial values for ${periodIdentifier}:`);
      console.log(`  Revenue: ${revenue} (Weighted: ${weightedValues.revenue})`);
      console.log(`  EBIT: ${ebit} (Weighted: ${weightedValues.ebit})`);
      console.log(`  EBITDA: ${ebitda} (Weighted: ${weightedValues.ebitda})`);
      console.log(`  Net Income: ${netIncome} (Weighted: ${weightedValues.net_income})`);
      console.log(`  Book Value: ${bookValue}`);

      // --- Valuation Multiples ---
      const safeDefaultMultiples = {
        revenue_multiple: { multiple: 0, justification: "Default (0) - Multiple missing" },
        ev_ebit: { multiple: 0, justification: "Default (0) - Multiple missing" },
        ev_ebitda: { multiple: 0, justification: "Default (0) - Multiple missing" },
        p_e: { multiple: 0, justification: "Default (0) - Multiple missing" }
      };

      const revenueMultipleData = valuationMultiples.revenue_multiple || safeDefaultMultiples.revenue_multiple;
      const ebitMultipleData = valuationMultiples.ev_ebit || safeDefaultMultiples.ev_ebit;
      const ebitdaMultipleData = valuationMultiples.ev_ebitda || safeDefaultMultiples.ev_ebitda;
      const peMultipleData = valuationMultiples.p_e || safeDefaultMultiples.p_e;

      const revenueMultiple = parseFloat(revenueMultipleData.multiple || 0);
      const ebitMultiple = parseFloat(ebitMultipleData.multiple || 0);
      const ebitdaMultiple = parseFloat(ebitdaMultipleData.multiple || 0);
      const peMultiple = parseFloat(peMultipleData.multiple || 0);

      // Store used multiples for transparency
      period.valuation_metrics.used_revenue_multiple = { value: revenueMultiple, justification: revenueMultipleData.justification };
      period.valuation_metrics.used_ev_ebit_multiple = { value: ebitMultiple, justification: ebitMultipleData.justification };
      period.valuation_metrics.used_ev_ebitda_multiple = { value: ebitdaMultiple, justification: ebitdaMultipleData.justification };
      if (peMultiple > 0) {
        period.valuation_metrics.used_p_e_multiple = { value: peMultiple, justification: peMultipleData.justification };
      }

      // --- Calculate Valuations ---
      // Laske enterprise value vain jos arvot ja kertoimet ovat positiivisia
      const ev_from_revenue = (revenue > 0 && revenueMultiple > 0) ? (revenue * revenueMultiple) : 0;
      const ev_from_ebit = (ebit > 0 && ebitMultiple > 0) ? (ebit * ebitMultiple) : 0;
      const ev_from_ebitda = (ebitda > 0 && ebitdaMultiple > 0) ? (ebitda * ebitdaMultiple) : 0;

      // Tallenna ja merkitse, perustuvatko arvot liiketoimintaan vai nettovarallisuuteen
      if (ev_from_revenue > 0) {
        period.valuation_metrics.equity_value_from_revenue = Math.max(0, ev_from_revenue - netDebt);
        period.valuation_metrics.revenue_valuation_method = "business_based";
      } else if (netDebt < 0) {
        // Jos EV=0 ja on nettovaroja, niin arvoksi tulee nettovarallisuus
        period.valuation_metrics.equity_value_from_revenue = 0; // Ei käytetä keskiarvossa
        period.valuation_metrics.revenue_valuation_method = "not_applicable";
      }

      if (ev_from_ebit > 0) {
        period.valuation_metrics.equity_value_from_ebit = Math.max(0, ev_from_ebit - netDebt);
        period.valuation_metrics.ebit_valuation_method = "business_based";
      } else if (netDebt < 0) {
        period.valuation_metrics.equity_value_from_ebit = 0; // Ei käytetä keskiarvossa
        period.valuation_metrics.ebit_valuation_method = "not_applicable";
      }

      if (ev_from_ebitda > 0) {
        period.valuation_metrics.equity_value_from_ebitda = Math.max(0, ev_from_ebitda - netDebt);
        period.valuation_metrics.ebitda_valuation_method = "business_based";
      } else if (netDebt < 0) {
        period.valuation_metrics.equity_value_from_ebitda = 0; // Ei käytetä keskiarvossa
        period.valuation_metrics.ebitda_valuation_method = "not_applicable";
      }

      // Equity Value-based valuations
      const equity_from_pe = (netIncome > 0 && peMultiple > 0) ? (netIncome * peMultiple) : 0;
      if (equity_from_pe > 0) {
        period.valuation_metrics.equity_value_from_pe = isNaN(equity_from_pe) ? 0 : equity_from_pe;
        period.valuation_metrics.pe_valuation_method = "business_based";
      } else {
        period.valuation_metrics.equity_value_from_pe = 0;
        period.valuation_metrics.pe_valuation_method = "not_applicable";
      }

      // --- Calculate Average EQUITY VALUE ---
      const equityValuations = [];

      // Lisää aina kirja-arvo jos positiivinen
      if (period.valuation_metrics.book_value > 0) {
        equityValuations.push(period.valuation_metrics.book_value);
      }

      // Lisää aina nettovarat jos positiivinen
      if (period.valuation_metrics.asset_based_value > 0) {
        equityValuations.push(period.valuation_metrics.asset_based_value);
      }

      // Lisää vain ne EV-perusteiset arvot, joissa on todella käytetty liiketoiminnan arvoa
      if (period.valuation_metrics.equity_value_from_revenue > 0 && 
          period.valuation_metrics.revenue_valuation_method === "business_based") {
        equityValuations.push(period.valuation_metrics.equity_value_from_revenue);
      }

      if (period.valuation_metrics.equity_value_from_ebit > 0 && 
          period.valuation_metrics.ebit_valuation_method === "business_based") {
        equityValuations.push(period.valuation_metrics.equity_value_from_ebit);
      }

      if (period.valuation_metrics.equity_value_from_ebitda > 0 && 
          period.valuation_metrics.ebitda_valuation_method === "business_based") {
        equityValuations.push(period.valuation_metrics.equity_value_from_ebitda);
      }

      // Jos equity_value_from_pe on olemassa ja käytetty business_based-methodia, käytä sitä
      if (period.valuation_metrics.equity_value_from_pe > 0 &&
          period.valuation_metrics.pe_valuation_method === "business_based") {
        equityValuations.push(period.valuation_metrics.equity_value_from_pe);
      }

      // Jos kaikki ne puuttuvat, käytä vähintään kirja-arvoa ja nettovaroja
      if (equityValuations.length === 0) {
        if (period.valuation_metrics.book_value > 0) {
          equityValuations.push(period.valuation_metrics.book_value);
        }
        if (period.valuation_metrics.asset_based_value > 0) {
          equityValuations.push(period.valuation_metrics.asset_based_value);
        }
      }

      let averageEquityValuation = 0;
      let includedMethodsCount = 0;

      if (equityValuations.length > 0) {
        const sum = equityValuations.reduce((a, b) => a + b, 0);
        averageEquityValuation = sum / equityValuations.length;
        includedMethodsCount = equityValuations.length;
        console.log(`Averaging ${includedMethodsCount} non-zero equity valuation methods for ${periodIdentifier}.`);
      } else if (typeof period.valuation_metrics.book_value === 'number' && !isNaN(period.valuation_metrics.book_value)) {
        averageEquityValuation = period.valuation_metrics.book_value;
        includedMethodsCount = 1;
      }

      period.valuation_metrics.average_equity_valuation = isNaN(averageEquityValuation) ? 0 : averageEquityValuation;
      period.valuation_metrics.valuation_methods_in_average = includedMethodsCount;

      // --- Calculate Valuation Range ---
      const rangeFactor = 0.20;
      const lowBound = averageEquityValuation * (1 - rangeFactor);
      const highBound = averageEquityValuation * (1 + rangeFactor);

      period.valuation_metrics.equity_valuation_range = {
        low: averageEquityValuation < 0 ? lowBound : Math.max(0, lowBound),
        high: highBound
      };

      // Store the weighting method in metrics for transparency
      period.valuation_metrics.weighting_method = document.period_weighting;

      console.log(`Final Equity Valuation Metrics for ${periodIdentifier}:`);
      console.log(`  Average Equity Valuation: ${period.valuation_metrics.average_equity_valuation}`);
      console.log(`  Equity Valuation Range: ${period.valuation_metrics.equity_valuation_range.low} - ${period.valuation_metrics.equity_valuation_range.high}`);
      console.log(`  Business Pattern: ${document.period_weighting.business_pattern}, Alpha: ${document.period_weighting.alpha}`);
    });

  } catch (error) {
    console.error("Error calculating financial metrics:", error);
    if (financialAnalysis && !financialAnalysis.error_metrics) {
        financialAnalysis.error_metrics = `Metrics calculation failed: ${error.message}`;
    }
  }
}

/**
 * Determines the business pattern (growth, cyclical, or stable) based on financial data
 */
function determineBusinessPattern(sortedPeriods: any[]): { 
  pattern: "cyclical" | "growth" | "stable",
  volatilityScore: number,
  growthRate: number
} {
  // Need at least 2 periods for pattern analysis
  if (!sortedPeriods || sortedPeriods.length < 2) {
    return { pattern: "stable", volatilityScore: 0, growthRate: 0 };
  }

  // Collect revenue data (newest to oldest)
  const revenues = sortedPeriods.map(p => p?.income_statement?.revenue || 0).filter(v => v > 0);

  // Collect EBIT data
  const ebits = sortedPeriods.map(p => p?.income_statement?.ebit || 0);

  // Calculate volatility
  let volatilityScore = 0;
  if (revenues.length >= 2) {
    const avgRevenue = revenues.reduce((sum, v) => sum + v, 0) / revenues.length;
    const revenueVariance = revenues.reduce((sum, v) => sum + Math.pow(v - avgRevenue, 2), 0) / revenues.length;
    volatilityScore = Math.sqrt(revenueVariance) / avgRevenue;
  }

  // Calculate average growth rate (CAGR)
  let growthRate = 0;
  if (revenues.length >= 2) {
    const newestRevenue = revenues[0];
    const oldestRevenue = revenues[revenues.length - 1];
    const years = revenues.length - 1;

    if (oldestRevenue > 0 && years > 0) {
      growthRate = Math.pow(newestRevenue / oldestRevenue, 1/years) - 1;
    }
  }

  // Check for EBIT sign changes (strong indicator of cyclicality)
  const hasSignChanges = ebits.length >= 2 && ebits.some((val, i) => 
    i > 0 && ((val < 0 && ebits[i-1] > 0) || (val > 0 && ebits[i-1] < 0)));

  // Determine business pattern
  if (growthRate > 0.15) { // Over 15% growth indicates growth company
    return { 
      pattern: "growth", 
      volatilityScore: volatilityScore,
      growthRate: growthRate
    };
  } else if (hasSignChanges || volatilityScore > 0.25) {
    return { 
      pattern: "cyclical", 
      volatilityScore: volatilityScore,
      growthRate: growthRate
    };
  } else {
    return { 
      pattern: "stable", 
      volatilityScore: volatilityScore,
      growthRate: growthRate
    };
  }
}

/**
 * Returns explanation text for the weighting method based on business pattern
 */
function getWeightingExplanation(pattern: string): string {
  switch (pattern) {
    case "growth":
      return "Painotuksessa korostettu vahvasti viimeisimpiä tilikausia kasvuyrityksen luonteen vuoksi.";
    case "cyclical":
      return "Painotuksessa käytetty tasaisempaa jakaumaa johtuen tunnuslukujen syklisyydestä eri tilikausien välillä.";
    default:
      return "Painotuksessa käytetty eksponentiaalista mallia vakaan liiketoiminnan perusteella.";
  }
}