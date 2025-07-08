
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";
import { createAnalysisPrompt, createCorporationPrompt, createPartnershipPrompt } from "./utils/gemini-prompts.ts";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Analyzes financial PDF documents with Gemini API to identify questions for user
 * @param companyName Name of the company
 * @param fileData Optional text representation of the financial data
 * @param fileBase64 Optional base64 encoded PDF data
 * @param fileMimeType Optional MIME type of the file
 * @param companyType Optional type of company (corporation or partnership)
 * @returns Analysis results or questions that need user input
 */
export async function analyzeFinancialData(
  companyName: string,
  fileData?: string,
  fileBase64?: string,
  fileMimeType?: string,
  companyType?: string
) {
  console.log(`Analyzing financial data for ${companyName}`);
  
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
    
    // Create the appropriate prompt based on company type
    const prompt = isPartnership 
      ? createPartnershipPrompt(companyName) 
      : createCorporationPrompt(companyName);
    
    console.log("Preparing content for Gemini analysis");
    
    // Create the content structure for Gemini 2.0
    const contents = [{ role: "user", parts: [] }];
    
    // If we have base64 PDF data and a valid MIME type, use the native PDF processing
    if (fileBase64 && fileMimeType === "application/pdf") {
      console.log("Using PDF data for analysis");
      // Extract just the base64 data part without the data URL prefix
      const base64Data = fileBase64.split(",")[1] || fileBase64;
      
      contents[0].parts.push({
        text: ""
      });
      
      contents[0].parts.push({
        inline_data: {
          mime_type: fileMimeType,
          data: base64Data
        }
      });
    } 
    // If we have text data, use that instead
    else if (fileData) {
      console.log("Using text data for analysis");
      contents[0].parts.push({
        text: `Financial statement data:\n${fileData}`
      });
    } else {
      throw new Error("No valid financial data provided");
    }
    
    // Add the prompt as the last content part
    contents[0].parts.push({ text: prompt });
    
    console.log(`Sending request to Gemini (${GEMINI_MODEL}) with ${contents[0].parts.length} content parts`);
    
    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 8000,
    };

    const result = await model.generateContent({
      contents,
      generationConfig
    });

    const response = result.response;
    const text = response.text();
    
    console.log(`Received response from Gemini, length: ${text.length} characters`);
    console.log("Full Gemini response:", text);

    // Process the response to extract questions
    try {
      // Try to find a JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response");
      }
      
      const jsonString = jsonMatch[0];
      const parsedData = JSON.parse(jsonString);
      
      console.log("Parsed JSON data from Gemini response:", JSON.stringify(parsedData, null, 2));
      
      // ALWAYS check for questions, regardless of whether we have complete data
      // This is the key change to ensure we never bypass the questions phase
      if (parsedData.questions && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
        console.log(`Identified ${parsedData.questions.length} questions for user input`);
        
        return {
          status: "questions_identified",
          questions: parsedData.questions,
          initialFindings: parsedData.initialFindings || {},
          company_name: companyName
        };
      }
      
      // Only if the questions array is explicitly empty, which shouldn't happen with our new prompt
      console.log("WARNING: No questions found in the Gemini response despite prompt instructions");
      
      // Create a default question about owner salary to ensure we never bypass the question phase
      const defaultQuestions = [
        {
          id: "owner_salary_impact",
          category: "income_statement",
          description: "Mikä on omistajan palkan vaikutus yrityksen tulokseen?",
          question: "Mikä on yrittäjän/omistajan nostama palkka tai palkkiot, ja miten se vaikuttaa yrityksen tulokseen?",
          impact: "Omistajan palkka on olennainen normalisoitava erä arvonmäärityksessä"
        },
        {
          id: "extraordinary_items",
          category: "income_statement",
          description: "Sisältääkö tilinpäätös kertaluonteisia eriä?",
          question: "Onko tuloslaskelmassa kertaluonteisia tuottoja tai kuluja, jotka eivät kuulu normaaliin liiketoimintaan?",
          impact: "Kertaluonteiset erät vääristävät arvonmääritystä"
        }
      ];
      
      return {
        status: "questions_identified",
        questions: defaultQuestions,
        initialFindings: parsedData.initialFindings || parsedData,
        company_name: companyName
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", text);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in analyzeFinancialData:", error);
    return { 
      error: error.message || "Unknown error analyzing financial data",
      status: "error" 
    };
  }
}

/**
 * Analyzes financial PDF with user-provided answers to normalize financial data
 * @param companyName Name of the company
 * @param fileBase64 Base64 encoded PDF data
 * @param answers User answers to financial questions
 * @param fileMimeType MIME type of the file
 * @param companyType Optional type of company (corporation or partnership)
 * @returns Normalized financial analysis
 */
export async function analyzeFinancialPDFWithAnswers(
  companyName: string,
  fileBase64: string,
  answers: { id: string; category: string; answer: string }[],
  fileMimeType?: string,
  companyType?: string
) {
  console.log(`Analyzing financial data with user answers for ${companyName}`);
  console.log(`User provided ${answers.length} answers`);
  
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    // Format the user answers for the prompt
    const formattedAnswers = answers.map(a => 
      `Question ID: ${a.id}, Category: ${a.category}\nAnswer: ${a.answer}`
    ).join("\n\n");
    
    // Create the analysis prompt with the answers
    const prompt = createAnalysisPrompt(companyName, formattedAnswers, companyType);
    
    console.log("Preparing content for second Gemini analysis");
    
    // Create the content structure for Gemini 2.0
    const contents = [{ role: "user", parts: [] }];
    
    // Include PDF data if available
    if (fileBase64 && fileMimeType === "application/pdf") {
      console.log("Using PDF data for analysis");
      // Extract just the base64 data part without the data URL prefix
      const base64Data = fileBase64.split(",")[1] || fileBase64;
      
      contents[0].parts.push({
        text: ""
      });
      
      contents[0].parts.push({
        inline_data: {
          mime_type: fileMimeType,
          data: base64Data
        }
      });
    } else {
      console.warn("No PDF data available for second analysis phase");
    }
    
    // Add the prompt with user answers
    contents[0].parts.push({ text: prompt });
    
    console.log(`Sending request to Gemini (${GEMINI_MODEL}) with user answers`);
    
    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 8000,
    };

    const result = await model.generateContent({
      contents,
      generationConfig
    });

    const response = result.response;
    const text = response.text();
    
    console.log(`Received response from Gemini, length: ${text.length} characters`);
    
    // Process the response to extract normalized financial data
    try {
      // Try to find a JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response");
      }
      
      const jsonString = jsonMatch[0];
      const parsedData = JSON.parse(jsonString);
      
      console.log("Successfully parsed normalized financial data from Gemini response");
      return parsedData;
    } catch (parseError) {
      console.error("Error parsing Gemini response in second phase:", parseError);
      console.log("Raw response sample:", text.substring(0, 500) + "...");
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in analyzeFinancialPDFWithAnswers:", error);
    return { 
      error: error.message || "Unknown error analyzing financial data with answers",
      status: "error" 
    };
  }
}

/**
 * Calculates financial metrics based on the financial analysis
 * @param financialAnalysis Financial analysis data
 * @param companyInfo Company information
 */
export function calculateFinancialMetrics(financialAnalysis: any, companyInfo: any) {
  if (!financialAnalysis || !financialAnalysis.documents || !financialAnalysis.documents[0] || !financialAnalysis.documents[0].financial_periods) {
    console.error("Invalid financial analysis data for metrics calculation");
    return;
  }

  try {
    // Get the first document and the first financial period for simplicity
    const document = financialAnalysis.documents[0];
    const period = document.financial_periods[0];
    
    if (!period) {
      console.error("No financial periods found in analysis data");
      return;
    }
    
    console.log("Calculating financial metrics for period:", period.year || "unknown year");
    
    // Initialize valuation_metrics if it doesn't exist
    if (!period.valuation_metrics) {
      period.valuation_metrics = {};
    }
    
    // Extract balance sheet and income statement data
    const balanceSheet = period.balance_sheet || {};
    const incomeStatement = period.income_statement || {};
    
    // Get key financial values, defaulting to 0 if not available
    const totalAssets = balanceSheet.total_assets || 0;
    const totalLiabilities = balanceSheet.total_liabilities || 0;
    const revenue = incomeStatement.revenue || 0;
    const ebit = incomeStatement.ebit || 0;
    
    console.log("Key financial values for calculation:");
    console.log(`Total Assets: ${totalAssets}`);
    console.log(`Total Liabilities: ${totalLiabilities}`);
    console.log(`Revenue: ${revenue}`);
    console.log(`EBIT: ${ebit}`);
    
    // Calculate equity
    const equity = totalAssets - totalLiabilities;
    
    // Calculate basic valuation metrics
    
    // 1. Asset-Based Valuation (Book Value)
    period.valuation_metrics.book_value = equity;
    
    // 2. Revenue Multiple (typically 0.5-2x for small businesses)
    const revenueMultiple = 1.0; // Default multiplier
    period.valuation_metrics.revenue_multiple_valuation = revenue * revenueMultiple;
    
    // 3. EBIT Multiple (typically 3-6x for small businesses)
    const ebitMultiple = 4.0; // Default multiplier
    period.valuation_metrics.ebit_multiple_valuation = ebit * ebitMultiple;
    
    // Calculate the average valuation across methods
    const valuations = [
      period.valuation_metrics.book_value,
      period.valuation_metrics.revenue_multiple_valuation,
      period.valuation_metrics.ebit_multiple_valuation
    ].filter(v => v > 0); // Filter out negative valuations
    
    // Average the valuations, defaulting to 0 if no valid valuations
    if (valuations.length > 0) {
      const sum = valuations.reduce((a, b) => a + b, 0);
      period.valuation_metrics.average_valuation = sum / valuations.length;
    } else {
      period.valuation_metrics.average_valuation = 0;
    }
    
    console.log("Calculated valuation metrics:");
    console.log(period.valuation_metrics);
    
    // If there's company info available, add extra context to the valuation
    if (companyInfo && companyInfo.structuredData) {
      const industry = companyInfo.structuredData.industry;
      if (industry) {
        console.log(`Adding industry context: ${industry}`);
        period.valuation_metrics.industry = industry;
      }
    }
  } catch (error) {
    console.error("Error calculating financial metrics:", error);
  }
}
