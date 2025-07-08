
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { getCompanyInfo } from "./utils/perplexity-api.ts";
import { analyzeFinancialData, calculateFinancialMetrics, analyzeFinancialPDFWithAnswers } from "./financial-analysis.ts";
import { completePartnershipData } from "./utils/partnership-handler.ts";

// Simplified CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request for valuation");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Valuation edge function called with method:", req.method);
    
    // Parse request data
    let requestData;
    try {
      requestData = await req.json();
      // Truncate large data fields for logging
      console.log("Received request data:", JSON.stringify({
        companyName: requestData.companyName,
        companyType: requestData.companyType,
        hasFileData: !!requestData.fileData,
        hasFileBase64: !!requestData.fileBase64 ? `[Base64 data: ${requestData.fileBase64 ? requestData.fileBase64.substring(0, 50) + '...' : 'none'}]` : false,
        fileMimeType: requestData.fileMimeType,
        hasPartnershipInputs: !!requestData.partnershipInputs,
        hasFinancialQuestionAnswers: !!requestData.financialQuestionAnswers,
        hasManualData: !!(requestData.manualFinancialData || requestData.manualInputData)
      }));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { 
      companyName, 
      companyType, 
      fileData, 
      fileBase64, 
      fileMimeType, 
      partnershipInputs,
      financialQuestionAnswers,
      manualFinancialData,
      manualInputData
    } = requestData;
    
    // Basic validation
    if (!companyName) {
      console.error("Missing required field: companyName");
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const manualData = manualFinancialData || manualInputData;
    
    // Simplified logging
    console.log(`Processing valuation request for: ${companyName}, type: ${companyType || "not specified"}`);

    if (manualData) {
      console.log("Manual financial data received:", JSON.stringify(manualData));
    }

    let companyInfo = null;
    let financialAnalysis = null;
    let isPartnership = companyType === "toiminimi" || companyType === "henkilöyhtiö" || companyType === "avoin yhtiö" || companyType === "kommandiittiyhtiö";
    let requiresUserInput = false;

    // Get company info if company name is provided
    if (companyName) {
      try {
        companyInfo = await getCompanyInfo(companyName);
        console.log("Company info retrieved successfully from Perplexity");
      } catch (error) {
        console.error("Error retrieving company info:", error);
        companyInfo = { error: error.message || "Virhe yritystietojen haussa" };
      }
    }

    // Process file data if available
    if (fileData || fileBase64) {
      try {
        if (financialQuestionAnswers && fileBase64) {
          console.log("Performing second phase analysis with user answers");
          
          const formattedAnswers = [];
          for (const [key, value] of Object.entries(financialQuestionAnswers)) {
            const parts = key.split('_');
            const category = parts[0];
            const id = parts.slice(1).join('_');
            
            formattedAnswers.push({
              id,
              category,
              answer: value
            });
          }
          
          financialAnalysis = await analyzeFinancialPDFWithAnswers(
            companyName,
            fileBase64,
            formattedAnswers,
            fileMimeType,
            companyType
          );
          
          console.log("Second phase financial analysis completed successfully");
        } else {
          if (fileBase64 && fileMimeType) {
            console.log("Using native PDF processing with Gemini, fileBase64 length:", fileBase64.length);
            console.log("File MIME type:", fileMimeType);
            financialAnalysis = await analyzeFinancialData(companyName, fileData, fileBase64, fileMimeType, companyType);
          } else {
            console.log("Using text-based processing with Gemini, fileData length:", fileData.length);
            financialAnalysis = await analyzeFinancialData(companyName, fileData, undefined, undefined, companyType);
          }
          
          console.log("Financial analysis phase 1 completed");
          
          if (financialAnalysis?.status === "questions_identified" && financialAnalysis.questions) {
            requiresUserInput = true;
            console.log("Analysis requires user input - phase 1 completed with questions");
            
            if (fileBase64) {
              financialAnalysis.fileBase64 = fileBase64;
              financialAnalysis.mimeType = fileMimeType;
            }
          } else if (!financialAnalysis?.status || financialAnalysis?.status !== "error") {
            calculateFinancialMetrics(financialAnalysis, companyInfo);
            console.log("Financial metrics calculated");
          }
        }
      } catch (error) {
        console.error("Error analyzing financial data:", error);
        financialAnalysis = { error: error.message || "Virhe tilinpäätöstietojen analysoinnissa" };
      }
    } else if (manualData) {
      try {
        console.log("Processing manually entered financial data");
        
        const period = {
          year: new Date().getFullYear() - 1,
          balance_sheet: {
            total_assets: manualData.assets || 0,
            total_liabilities: manualData.liabilities || 0
          },
          income_statement: {
            revenue: manualData.revenue || 0,
            ebit: manualData.profit || 0
          }
        };
        
        financialAnalysis = {
          company_name: companyName,
          documents: [{
            financial_periods: [period]
          }]
        };
        
        console.log("Prepared manual data for analysis");
        
        calculateFinancialMetrics(financialAnalysis, companyInfo);
        console.log("Financial metrics calculated for manual data");
      } catch (error) {
        console.error("Error processing manual financial data:", error);
        financialAnalysis = { error: error.message || "Virhe manuaalisten tietojen käsittelyssä" };
      }
    }
    
    if (isPartnership && partnershipInputs && financialAnalysis && !financialAnalysis.error) {
      try {
        console.log("Processing partnership inputs");
        financialAnalysis = await completePartnershipData(companyName, financialAnalysis, partnershipInputs);
        console.log("Partnership data completed and validated");
      } catch (error) {
        console.error("Error processing partnership inputs:", error);
        return new Response(JSON.stringify({ 
          error: error.message,
          financialAnalysis 
        }), {
          headers: corsHeaders
        });
      }
    }

    if (isPartnership && financialAnalysis && !financialAnalysis.error && !partnershipInputs &&
        !requiresUserInput && !financialQuestionAnswers) {
      
      const hasMissingData = financialAnalysis.documents?.[0]?.financial_periods?.[0]?.validation?.missing_data?.length > 0;
      
      if (hasMissingData) {
        console.log("Partnership has missing data, user needs to provide additional information");
        return new Response(JSON.stringify({
          companyInfo: companyInfo,
          financialAnalysis: financialAnalysis,
          requiresPartnershipInputs: true,
          missingData: financialAnalysis.documents[0].financial_periods[0].validation.missing_data
        }), {
          headers: corsHeaders
        });
      }
    }
    
    const responseData = {
      companyInfo: companyInfo,
      financialAnalysis: financialAnalysis,
      requiresUserInput: requiresUserInput,
      financialQuestions: financialAnalysis?.questions || [],
      initialFindings: financialAnalysis?.initialFindings || {}
    };
    
    console.log("Returning valuation response with keys:", Object.keys(responseData));
    
    return new Response(JSON.stringify(responseData), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Error in valuation function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
