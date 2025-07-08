import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCompanyInfo } from "./utils/perplexity-api.ts";
import { analyzeFinancialData, calculateFinancialMetrics, analyzeFinancialPDFWithAnswers } from "./financial-analysis.ts";
import { completePartnershipData } from "./utils/partnership-handler.ts";
import { generateFinalAnalysis } from "./utils/valuation-analysis.ts";
import { getLatestPeriod } from '../_shared/period-utils.ts';

// getLatestPeriod function has been moved to _shared/period-utils.ts

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
        hasFiles: !!requestData.files && Array.isArray(requestData.files) ? requestData.files.length : 0,
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
      files,
      partnershipInputs,
      financialQuestionAnswers,
      originalQuestions,
      manualFinancialData,
      manualInputData,
      multiplierMethod,
      customMultipliers,
      analysisId,
      // Backward compatibility
      fileData,
      fileBase64,
      fileMimeType
    } = requestData;

    // Basic validation
    if (!companyName) {
      console.error("Missing required field: companyName");
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare files array - handle both new format and legacy format
    let processedFiles = [];

    if (files && Array.isArray(files) && files.length > 0) {
      processedFiles = files;
      console.log(`Processing ${files.length} files in modern format`);
    } else if (fileData || fileBase64) {
      // Legacy format support - convert to new format
      console.log("Converting legacy file format to new format");
      processedFiles = [{
        id: "legacy-file",
        name: "document.pdf",
        data: fileData || "",
        base64: fileBase64 || undefined,
        mimeType: fileMimeType || undefined
      }];
    }

    const manualData = manualFinancialData || manualInputData;

    // Simplified logging
    console.log(`Processing valuation request for: ${companyName}, type: ${companyType || "not specified"}`);
    console.log(`Files provided: ${processedFiles.length}`);
    console.log(`Multiplier method from request: ${multiplierMethod || 'not provided'}`);
    console.log(`Custom multipliers from request:`, customMultipliers || 'not provided');

    if (manualData) {
      console.log("Manual financial data received:", JSON.stringify(manualData));
    }

    let companyInfo = null;
    let financialAnalysis = null;
    let finalAnalysis = null;
    let isPartnership = companyType === "toiminimi" || companyType === "henkilöyhtiö" || companyType === "avoin yhtiö" || companyType === "kommandiittiyhtiö";
    let requiresUserInput = false;

    // Initialize multiplier settings - will be loaded from database if analysisId provided
    let finalMultiplierMethod = multiplierMethod || null;
    let finalCustomMultipliers = customMultipliers || null;

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
    if (processedFiles.length > 0) {
      try {
        if (financialQuestionAnswers) {
          console.log("Performing second phase analysis with user answers");

          // Logi vastaukset ja niiden avaimet
          if (typeof financialQuestionAnswers === 'object') {
            console.log("Question answer keys:", Object.keys(financialQuestionAnswers));
            console.log("Sample answers:", Object.entries(financialQuestionAnswers).slice(0, 2));
          }

          // Käytä pyynnön mukana tulleita kysymyksiä, jos ne ovat saatavilla
          let questions = [];
          if (originalQuestions && Array.isArray(originalQuestions) && originalQuestions.length > 0) {
            questions = originalQuestions;
            console.log(`Using ${questions.length} original questions from request`);
          } else if (requestData.previousAnalysis?.questions) {
            questions = requestData.previousAnalysis.questions;
            console.log(`Using ${questions.length} original questions from previous analysis`);
          }

          // Varasuunnitelman kysymykset jos niitä ei löydy
          if (questions.length === 0) {
            console.log("No original questions found, creating basic question objects");
            questions = Object.keys(financialQuestionAnswers).map(key => {
              const parts = key.split('_');
              const category = parts.length > 1 ? parts[0] : 'general';
              const id = parts.length > 1 ? parts.slice(1).join('_') : key;
              return {
                id: id,
                category: category,
                question: `Kysymys kategoriassa ${category}`,
                impact: "Vaikuttaa yrityksen arvon määritykseen"
              };
            });
          }

          // HAE KERTOIMET VAIHEESTA 1 (jos analysisId on annettu)
          if (analysisId) {
            console.log(`Fetching multiplier settings for analysis ID: ${analysisId}`);
            
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
            const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
          
            try {
              const { data: analysisData, error: dbError } = await supabase
                .from('valuation_document_analysis')  
                .select('multiplier_method, custom_multipliers')
                .eq('id', analysisId)  // Hae JUURI TÄMÄ analyysi
                .single();
              
              if (!dbError && analysisData) {
                finalMultiplierMethod = analysisData.multiplier_method;
                finalCustomMultipliers = analysisData.custom_multipliers;
                console.log(`Found multiplier settings for analysis ${analysisId}: method=${finalMultiplierMethod}, hasCustom=${!!finalCustomMultipliers}`);
                console.log(`Loaded multipliers from DB:`, finalCustomMultipliers);
              } else {
                console.log(`No multiplier settings found for analysis ${analysisId}:`, dbError);
                // Set defaults if not found
                finalMultiplierMethod = 'ai';
                finalCustomMultipliers = null;
              }
            } catch (error) {
              console.warn("Failed to fetch multiplier settings:", error);
              // Set defaults on error
              finalMultiplierMethod = 'ai';
              finalCustomMultipliers = null;
            }
          } else {
            console.log(`Using multiplier settings from request: method=${finalMultiplierMethod}, hasCustom=${!!finalCustomMultipliers}`);
          }

          // YKSINKERTAISTETTU: Välitetään vastaukset alkuperäisessä muodossa
          console.log(`Sending ${processedFiles.length} files to Gemini with ${questions.length} questions`);
          console.log(`Questions sample:`, questions.slice(0, 2));

          financialAnalysis = await analyzeFinancialPDFWithAnswers(
            companyName,
            processedFiles,
            financialQuestionAnswers, // Välitetään vastaukset suoraan objektina
            companyType,
            questions,
            finalMultiplierMethod,
            finalCustomMultipliers
          );

          console.log("Second phase financial analysis completed successfully");

          // Luo lopullinen analyysi jos tiedot ovat saatavilla
          if (financialAnalysis && !financialAnalysis.error) {
            console.log("Calculating metrics for normalized data");
            calculateFinancialMetrics(financialAnalysis, companyInfo);

            // Käytä getLatestPeriod funktiota viimeisimmän tilikauden hakemiseen
            const latestPeriod = getLatestPeriod(financialAnalysis);

            // Luodaan lopullinen analyysi
            finalAnalysis = {
              scores: financialAnalysis.scores || {},
              totalScore: financialAnalysis.totalScore || 0,
              key_points: financialAnalysis.key_points || {
                title: "Keskeiset havainnot",
                content: "Arvonmääritys suoritettu käyttäen yrityksen normalisoituja taloustietoja."
              },
              analysis: financialAnalysis.analysis || {},
              recommendations: financialAnalysis.recommendations || [],
              normalization_explanations: financialAnalysis.normalization_explanations || null,
              valuation_numbers: {
                range: {
                  low: latestPeriod?.valuation_metrics?.equity_valuation_range?.low || 0,
                  high: latestPeriod?.valuation_metrics?.equity_valuation_range?.high || 0
                },
                most_likely_value: latestPeriod?.valuation_metrics?.average_equity_valuation || 0,
                valuation_rationale: financialAnalysis.normalization_explanations?.summary || 
                  "Arvonmääritys perustuu yrityksen normalisoituihin taloustietoihin ja toimialakohtaisiin kertoimiin."
              }
            };
            console.log("Final analysis created successfully");
          }
        } else {
          // First phase analysis with multiple files
          console.log(`Analyzing ${processedFiles.length} files with Gemini`);

          // DEBUG: Tulosta ensimmäisen tiedoston tietoja (jos tiedostoja on)
          if (processedFiles.length > 0 && processedFiles[0]) {
            console.log("First file info:", {
              id: processedFiles[0].id,
              name: processedFiles[0].name,
              dataLength: processedFiles[0].data?.length || 0,
              hasBase64: !!processedFiles[0].base64,
              mimeType: processedFiles[0].mimeType
            });
          }

          try {
            financialAnalysis = await analyzeFinancialData(companyName, processedFiles, companyType, finalMultiplierMethod, finalCustomMultipliers);
            // Logataan analyysin tulos tiivistetysti
            console.log("Gemini analysis result:", JSON.stringify({
              status: financialAnalysis?.status,
              hasQuestions: !!(financialAnalysis?.questions && financialAnalysis.questions.length > 0),
              questionCount: financialAnalysis?.questions?.length || 0,
              hasError: !!financialAnalysis?.error,
              documentCount: financialAnalysis?.documents?.length || 0,
              firstPeriodYear: financialAnalysis?.documents?.[0]?.financial_periods?.[0]?.year || 'N/A'
            }));
          } catch (geminiError) {
            console.error("GEMINI API ERROR:", geminiError);
            throw new Error(`Gemini API error: ${geminiError.message || geminiError}`);
          }

          // Tarkistus, että financialAnalysis ei ole null tai undefined
          if (!financialAnalysis) {
            console.error("CRITICAL: Gemini returned null or undefined");
            throw new Error("Tekoälyanalyysi epäonnistui: tyhjä vastaus");
          }

          // Tarkistus, jos Gemini palautti virheen omassa rakenteessaan
          if (financialAnalysis.error) {
            console.error("CRITICAL: Gemini analysis reported error:", financialAnalysis.error);
            throw new Error(`Tekoälyanalyysi epäonnistui: ${financialAnalysis.error}`);
          }

          console.log("Financial analysis phase 1 completed");

          if (financialAnalysis?.status === "questions_identified" && financialAnalysis.questions) {
            requiresUserInput = true;
            console.log("Analysis requires user input - phase 1 completed with questions");

            // Store file info for second phase if needed
            if (processedFiles.some(file => file.base64)) {
              financialAnalysis.fileData = {
                files: processedFiles.map(file => ({
                  base64: file.base64,
                  mimeType: file.mimeType,
                  name: file.name,
                  id: file.id
                }))
              };
              console.log("Stored file references for potential second phase.");
            }
          } else if (!financialAnalysis?.status || (financialAnalysis?.status !== "error" && financialAnalysis?.status !== "questions_identified")) {
            console.log("No questions identified or analysis complete, proceeding with direct metrics calculation");
            calculateFinancialMetrics(financialAnalysis, companyInfo);
            console.log("Financial metrics calculated");

            // Käytä getLatestPeriod funktiota viimeisimmän tilikauden hakemiseen
            const latestPeriod = getLatestPeriod(financialAnalysis);

            // Luodaan lopullinen analyysi myös suorassa prosessissa
            finalAnalysis = {
              scores: financialAnalysis.scores || {},
              totalScore: financialAnalysis.totalScore || 0,
              key_points: {
                title: "Keskeiset havainnot",
                content: "Arvonmääritys suoritettu käyttäen yrityksen taloustietoja."
              },
              analysis: financialAnalysis.analysis || {},
              recommendations: financialAnalysis.recommendations || [],
              valuation_numbers: {
                range: {
                  low: latestPeriod?.valuation_metrics?.equity_valuation_range?.low || 0,
                  high: latestPeriod?.valuation_metrics?.equity_valuation_range?.high || 0
                },
                most_likely_value: latestPeriod?.valuation_metrics?.average_equity_valuation || 0,
                valuation_rationale: "Arvonmääritys perustuu yrityksen taloustietoihin ja toimialakohtaisiin kertoimiin."
              }
            };
            console.log("Direct final analysis created successfully");
          } else {
              // Tänne tullaan jos status on jotain muuta odottamatonta, esim. pelkkä 'error' ilman kysymyksiä
              console.warn("Financial analysis phase 1 completed with unexpected status:", financialAnalysis?.status);
          }
        }
      } catch (error) {
        console.error("Error analyzing financial data:", error);
        financialAnalysis = {
          error: error.message || "Virhe tilinpäätöstietojen analysoinnissa",
          status: "error_detailed"
        };
        finalAnalysis = { error: financialAnalysis.error };
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

        // Käytä getLatestPeriod funktiota viimeisimmän tilikauden hakemiseen
        const latestPeriod = getLatestPeriod(financialAnalysis);

        // Luodaan myös lopullinen analyysi manuaalisille tiedoille
        finalAnalysis = {
          scores: {},
          key_points: {
            title: "Keskeiset havainnot",
            content: "Arvonmääritys suoritettu käyttäen manuaalisesti syötettyjä taloustietoja."
          },
          analysis: {},
          recommendations: [],
          valuation_numbers: {
            range: {
              low: latestPeriod?.valuation_metrics?.equity_valuation_range?.low || 0,
              high: latestPeriod?.valuation_metrics?.equity_valuation_range?.high || 0
            },
            most_likely_value: latestPeriod?.valuation_metrics?.average_equity_valuation || 0,
            valuation_rationale: "Arvonmääritys perustuu syötettyihin taloustietoihin ja toimialakohtaisiin kertoimiin."
          }
        };
        console.log("Final analysis created for manual data");
      } catch (error) {
        console.error("Error processing manual financial data:", error);
        financialAnalysis = { error: error.message || "Virhe manuaalisten tietojen käsittelyssä" };
        finalAnalysis = { error: financialAnalysis.error };
      }
    }

    // Henkilöyhtiöiden käsittely (jos financialAnalysis onnistui)
    if (isPartnership && partnershipInputs && financialAnalysis && !financialAnalysis.error) {
      try {
        console.log("Processing partnership inputs");
        financialAnalysis = await completePartnershipData(companyName, financialAnalysis, partnershipInputs);
        console.log("Partnership data completed and validated");

        // Päivitetään lopullinen analyysi myös henkilöyhtiön tiedoilla, jos finalAnalysis on olemassa
        if (finalAnalysis && !finalAnalysis.error) {
          // Käytä getLatestPeriod funktiota viimeisimmän tilikauden hakemiseen
          const latestPeriod = getLatestPeriod(financialAnalysis);

          console.log("Updating final analysis with partnership valuation numbers.");
          if (latestPeriod?.valuation_metrics) {
            finalAnalysis.valuation_numbers = {
              range: {
                low: latestPeriod.valuation_metrics.equity_valuation_range?.low || 0,
                high: latestPeriod.valuation_metrics.equity_valuation_range?.high || 0
              },
              most_likely_value: latestPeriod.valuation_metrics.average_equity_valuation || 0,
              valuation_rationale: "Arvonmääritys perustuu henkilöyhtiön normalisoituihin taloustietoihin ja toimialakohtaisiin kertoimiin."
            };
          }
        }
      } catch (error) {
        console.error("Error processing partnership inputs:", error);
        return new Response(JSON.stringify({
          error: `Virhe henkilöyhtiön tietojen käsittelyssä: ${error.message}`,
          financialAnalysis
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Tarkistetaan puuttuvat tiedot henkilöyhtiöltä
    if (isPartnership && financialAnalysis && !financialAnalysis.error && !partnershipInputs &&
        !requiresUserInput && !financialQuestionAnswers) {

      // Tarkistetaan, onko validointi ajettu ja löytyykö puuttuvia tietoja
      const missingData = financialAnalysis.documents?.[0]?.financial_periods?.[0]?.validation?.missing_data;
      const hasMissingData = Array.isArray(missingData) && missingData.length > 0;

      if (hasMissingData) {
        console.log("Partnership has missing data, user needs to provide additional information");
        return new Response(JSON.stringify({
          companyInfo: companyInfo,
          financialAnalysis: financialAnalysis,
          requiresPartnershipInputs: true,
          missingData: missingData
        }), {
          headers: corsHeaders
        });
      }
    }

    // Generoi kattavampi valuation analyysi, jos käyttäjävastaukset on jo käsitelty
    if (!requiresUserInput && financialAnalysis && !financialAnalysis.error && finalAnalysis && !finalAnalysis.error) {
      try {
        console.log("Generating enhanced valuation analysis...");

        // Kerää käyttäjän vastaukset selkeään muotoon
        let userAnswers = {};
        if (financialQuestionAnswers) {
          userAnswers = financialQuestionAnswers;
        }

        // Kerää alkuperäiset kysymykset
        let originalQuestionsList = [];
        if (financialAnalysis.questions && Array.isArray(financialAnalysis.questions)) {
          originalQuestionsList = financialAnalysis.questions;
        }

        // Generoi kattavampi analyysi
        const enhancedAnalysis = await generateFinalAnalysis(
          companyName,
          financialAnalysis,
          companyInfo,
          originalQuestionsList,
          userAnswers
        );

        // Jos analyysi onnistui, korvaa finalAnalysis
        if (enhancedAnalysis && !enhancedAnalysis.error) {
          console.log("Enhanced valuation analysis generated successfully");
          finalAnalysis = enhancedAnalysis;
        } else {
          console.warn("Enhanced analysis failed, using original analysis:", 
                      enhancedAnalysis?.error || "Unknown error");
        }
      } catch (error) {
        console.error("Error generating enhanced valuation analysis:", error);
      }
    }

    // Kootaan lopullinen vastaus
    const responseData = {
      companyInfo: companyInfo,
      financialAnalysis: financialAnalysis,
      finalAnalysis: financialAnalysis?.error ? { error: financialAnalysis.error } : finalAnalysis,
      requiresUserInput: requiresUserInput,
      financialQuestions: requiresUserInput ? (financialAnalysis?.questions || []) : [],
      initialFindings: requiresUserInput ? (financialAnalysis?.initialFindings || {}) : {}
    };

    // Tarkistetaan, onko analyysissä tai lopullisessa analyysissä virhe
    const hasError = !!(financialAnalysis?.error || finalAnalysis?.error);

    console.log(`Returning valuation response. Has error: ${hasError}. Requires user input: ${requiresUserInput}. Keys:`, Object.keys(responseData));

    // Varmistetaan että kaikki oleelliset tiedot sisältyvät financialAnalysis-objektiin
    if (financialAnalysis && !financialAnalysis.error) {
      financialAnalysis._rawInitialData = financialAnalysis._rawAnalysisData || financialAnalysis.initialFindings || null;
      financialAnalysis.normalization_explanations = financialAnalysis.normalization_explanations || null;

      if (financialAnalysis.documents && financialAnalysis.documents.length > 0) {
        console.log("Talousdokumentit säilytetään vastauksessa tietojen säilyttämiseksi.");
      }

      financialAnalysis.user_answers = financialQuestionAnswers || null;
      financialAnalysis.original_questions = financialAnalysis.questions || null;
    }

    return new Response(JSON.stringify(responseData), {
      status: hasError && !requiresUserInput ? 500 : 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("Unhandled error in valuation function:", error);
    return new Response(JSON.stringify({
      error: error.message || "Tuntematon palvelinvirhe",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});