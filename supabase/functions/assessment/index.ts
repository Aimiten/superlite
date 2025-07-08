import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAssessmentQuestions, analyzeAssessmentAnswers } from "./utils/assessment.ts";
import { getCompanyInfo } from "./utils/perplexity-api.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests with more detailed headers
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request for assessment function");
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log("Assessment function called with method:", req.method);

    // Only proceed if we're handling a POST request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: `Unsupported method: ${req.method}`,
        timestamp: new Date().toISOString()
      }), {
        status: 405, // Method Not Allowed
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request data with better error handling
    let requestData;
    try {
      requestData = await req.json();
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
        hasAnswers: !!requestData.answers,
        hasValuationData: !!requestData.valuationData // Lisätty valuationData-tiedon loggaus
      }));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON payload", 
          details: parseError.message,
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      companyName, 
      companyData,
      generateQuestions,
      answers,
      fileData,
      fileBase64,
      fileMimeType,
      readinessForSaleData,
      documents,
      valuationData // Lisätty valuationData-parametri
    } = requestData;

    // Validate essential parameters
    if (!companyName) {
      console.error("Missing required field: companyName");
      return new Response(
        JSON.stringify({ error: "Company name is required", timestamp: new Date().toISOString() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company info with better error handling
    let companyInfo = null;
    let companyInfoError = null;

    if (!companyData) {
      try {
        console.log("Fetching company information for:", companyName);
        companyInfo = await getCompanyInfo(companyName);
        console.log("Company info retrieved successfully");

        // Check if there was an error in the response
        if (companyInfo.error) {
          companyInfoError = companyInfo.error;
          console.warn("Company info returned with error:", companyInfoError);
        }
      } catch (error) {
        console.error("Error retrieving company info:", error);
        // Don't throw - handle the error gracefully and continue
        companyInfoError = error.message || "Failed to fetch company information";
        companyInfo = { error: companyInfoError };
      }
    } else {
      console.log("Using provided company data, length:", companyData.length);
      companyInfo = { analysisText: companyData };
    }

    let result = {
      companyInfo,
      readinessForSaleInfo: readinessForSaleData || null
    };

    if (companyInfoError) {
      result.companyInfoError = companyInfoError;
    }

    // Generate questions if requested - with better error handling
    if (generateQuestions === true) {
      console.log("Generating questions for company:", companyName);
      // Kirjaa onko arvonmääritystietoa käytettävissä
      if (valuationData) {
        console.log("Valuation data available for question generation");
      }

      try {
        // Make sure documents is always an array - käytä let jotta muuttujaa voi muokata
        let documentsArray = Array.isArray(documents) ? documents : (documents ? [documents] : []);

        console.log(`Processing ${documentsArray.length} documents for question generation`);

        // Suodatetaan virheelliset dokumentit pois heti alussa
        if (documentsArray.length > 0) {
          const originalCount = documentsArray.length;
          documentsArray = documentsArray.filter(doc => {
            if (!doc) {
              console.warn("Skipping undefined/null document entry");
              return false;
            }
            if (doc.error) {
              console.warn(`Document '${doc.name || "tuntematon"}' has error: ${doc.error}`);
              return false;
            }
            return true;
          });

          if (documentsArray.length !== originalCount) {
            console.log(`Filtered out ${originalCount - documentsArray.length} documents with errors. Continuing with ${documentsArray.length} valid documents.`);
          }

          if (documentsArray.length > 0) {
            console.log("First document sample:", JSON.stringify(documentsArray[0]).substring(0, 200));

            // Tarkista ja varmista, että PDF-dokumenteilla on oikea mime-tyyppi
            documentsArray = documentsArray.map(doc => {
            if (doc.base64 && (!doc.file_type || !doc.mimeType) && 
                (doc.name?.toLowerCase().endsWith('.pdf'))) {
              console.log(`Setting mime-type for PDF document: ${doc.name}`);
              return {
                ...doc,
                file_type: 'application/pdf',
                mimeType: 'application/pdf'
              };
            }
            return doc;
            });
          }
        }

        // Jos dokumentteja on, varmistetaan että ne sisältävät tarvittavat kentät
        if (documentsArray.some(doc => !doc.name)) {
          console.error("Warning: Some documents are missing required 'name' field");
        }

        const questions = await generateAssessmentQuestions(
          companyName, 
          companyInfo,
          documentsArray, // Pass properly formatted documents array
          readinessForSaleData,
          valuationData // Välitetään arvonmääritystiedot generointifunktiolle
        );

        if (!questions || !Array.isArray(questions)) {
          console.error("Invalid response from question generator:", questions);
          return new Response(JSON.stringify({ 
            error: "Failed to generate valid questions", 
            timestamp: new Date().toISOString(),
            companyInfo: result.companyInfo
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (questions.length === 0) {
          console.warn("No questions were generated");
          // This might be an expected case, so we don't return an error
          // but we do let the client know
          result.warning = "No questions were generated";
        } else {
          console.log(`Successfully generated ${questions.length} questions`);
          console.log("Response preview:", JSON.stringify(questions).substring(0, 300) + "...");
        }

        result.questions = questions;
      } catch (error) {
        console.error("Error generating questions:", error);
        return new Response(JSON.stringify({ 
          error: `Error generating questions: ${error.message}`,
          timestamp: new Date().toISOString(),
          companyInfo: result.companyInfo
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } 
    // Analyze answers if provided - with better error handling
    else if (answers) {
      console.log("Analyzing answers for company:", companyName);
      // Kirjaa onko arvonmääritystietoa käytettävissä
      if (valuationData) {
        console.log("Valuation data available for analysis");
      }

      try {
        // Validate answers
        if (typeof answers !== 'object') {
          throw new Error("Answers must be an object");
        }

        // Make sure documents is always an array
        const documentsArray = Array.isArray(documents) ? documents : (documents ? [documents] : []);

        // Process file data if available
        if (documentsArray.length > 0) {
          console.log(`Processing ${documentsArray.length} documents for analysis`);
        }

        // ADDED CODE START - Fix for PDF MIME type in analysis phase
        // Tarkista ja varmista, että PDF-dokumenteilla on oikea mime-tyyppi
        const processedDocumentsArray = documentsArray.map(doc => {
          if (doc.base64 && (!doc.file_type || !doc.mimeType) && 
              (doc.name?.toLowerCase().endsWith('.pdf'))) {
            console.log(`Setting mime-type for PDF document: ${doc.name}`);
            return {
              ...doc,
              file_type: 'application/pdf',
              mimeType: 'application/pdf'
            };
          }
          return doc;
        });
        // ADDED CODE END

        const finalAnalysis = await analyzeAssessmentAnswers(
          companyName, 
          companyInfo || companyData,
          answers,
          processedDocumentsArray, // Changed to use processed documents array
          readinessForSaleData,
          valuationData // Välitetään arvonmääritystiedot analyysifunktiolle
        );

        if (!finalAnalysis) {
          throw new Error("Analysis returned no results");
        }

        console.log("Analysis complete, result keys:", finalAnalysis ? Object.keys(finalAnalysis) : "undefined");
        // FIXED LINE HERE: Extract the analysisReport from finalAnalysis
        result.finalAnalysis = finalAnalysis.analysisReport;
      } catch (error) {
        console.error("Error analyzing answers:", error);
        return new Response(JSON.stringify({ 
          error: `Error analyzing answers: ${error.message}`,
          timestamp: new Date().toISOString(),
          companyInfo: result.companyInfo  // Still return company info even on error
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Returning successful response with result keys:", Object.keys(result));
    return new Response(JSON.stringify(result), {
      status: 200, // Explicitly set 200 status
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    // Comprehensive error handling for unexpected errors
    console.error("Unhandled error in assessment function:", error);
    console.error("Error stack:", error.stack || "No stack trace available");

    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error",
      errorType: error.constructor?.name || "Unknown",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});