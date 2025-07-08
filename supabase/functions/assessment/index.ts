
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAssessmentQuestions, analyzeAssessmentAnswers } from "./utils/assessment.ts";
import { getCompanyInfo } from "./utils/perplexity-api.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Assessment function called with method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Only proceed if we're handling a POST request
    if (req.method !== "POST") {
      throw new Error(`Unsupported method: ${req.method}`);
    }
    
    const requestData = await req.json();
    console.log("Received request data:", JSON.stringify({
      ...requestData,
      // Truncate potential large strings for logging
      companyName: requestData.companyName,
      companyData: requestData.companyData ? 
        `[${typeof requestData.companyData}:${requestData.companyData.length || 0} chars]` : 
        null,
      documents: requestData.documents ? 
        `[${requestData.documents.length} documents]` : 
        null,
      generateQuestions: requestData.generateQuestions,
      hasAnswers: !!requestData.answers
    }));

    const { 
      companyName, 
      companyData,
      generateQuestions,
      answers,
      fileData,
      fileBase64,
      fileMimeType,
      readinessForSaleData,
      documents
    } = requestData;
    
    if (!companyName) {
      throw new Error("Company name is required");
    }

    let companyInfo = null;
    if (!companyData) {
      try {
        console.log("Fetching company information for:", companyName);
        companyInfo = await getCompanyInfo(companyName);
      } catch (error) {
        console.error("Error fetching company info:", error);
        companyInfo = { error: error.message || "Failed to fetch company information" };
      }
    } else {
      console.log("Using provided company data, length:", companyData.length);
      companyInfo = { analysisText: companyData };
    }

    let result = {
      companyInfo,
      readinessForSaleInfo: readinessForSaleData || null
    };

    // Generate questions if requested
    if (generateQuestions === true) {
      console.log("Generating questions for company:", companyName);
      try {
        const questionsPayload = {
          documents
        };
        
        const questions = await generateAssessmentQuestions(
          companyName, 
          companyInfo || companyData,
          questionsPayload,
          readinessForSaleData
        );
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          console.error("No questions were generated or invalid response format");
          throw new Error("No questions were generated");
        }
        
        console.log(`Successfully generated ${questions.length} questions`);
        console.log("Parsed JSON questions count:", questions.length);
        console.log("Response preview:", JSON.stringify(questions).substring(0, 300) + "...");
        result.questions = questions;
      } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error(`Error generating questions: ${error.message}`);
      }
    } 
    // Analyze answers if provided
    else if (answers) {
      console.log("Analyzing answers for company:", companyName);
      try {
        const fileInfo = {
          fileData,
          fileBase64,
          fileMimeType,
          documents
        };
        
        const finalAnalysis = await analyzeAssessmentAnswers(
          companyName, 
          companyInfo || companyData,
          answers,
          fileInfo,
          readinessForSaleData
        );
        
        console.log("Analysis complete:", Object.keys(finalAnalysis));
        result.finalAnalysis = finalAnalysis;
      } catch (error) {
        console.error("Error analyzing answers:", error);
        throw new Error(`Error analyzing answers: ${error.message}`);
      }
    }

    console.log("Returning successful response with result keys:", Object.keys(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in assessment function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error",
      timestamp: new Date().toISOString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
