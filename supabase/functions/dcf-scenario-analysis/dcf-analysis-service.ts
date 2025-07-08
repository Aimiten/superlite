/**
 * DCF Analysis Service - V2 ACTIVE VERSION
 * 
 * This service coordinates the DCF scenario analysis process:
 * 1. Fetches valuation financial data from completed valuations
 * 2. Uses V2 parameter-based approach via variant-executor -> combined-executor-v2
 * 3. Uses parameter-prompts.ts and parameter-schemas.ts (not deprecated schemas)
 * 4. Integrates with DCFCalculator for actual calculations
 * 
 * Version: 2.0 - Parameter-based DCF with structured calculation flow
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DCFValidator, formatValidationResults } from "../_shared/dcf-validator.ts";
import { IndustryCache } from "../_shared/industry-cache.ts";
import { RealFinancialDataSources } from "../_shared/real-financial-data.ts";
import { selectDCFVariant } from "./orchestrator/method-selector.ts";
import { executeVariantAnalysis } from "./variants/variant-executor.ts";
import { CompanyData, FinancialData } from "./types/dcf-types.ts";
import { getLatestPeriod } from "../_shared/period-utils.ts";

// Unified logging function
function debugLog(area: string, message: string, data?: any) {
  console.log(`[dcf-analysis][${area}] ${message}`);
  if (data !== undefined) {
    console.log(`[dcf-analysis][${area}] Data:`, data);
  }
}

interface DCFAnalysisRequest {
  valuationId: string;
  companyId: string;
  userId: string;
}

// Interface for valuation financial data
interface ValuationFinancialData {
  company_name: string;
  documents: Array<{
    financial_periods: Array<{
      year: number;
      balance_sheet?: {
        total_assets?: number;
        total_liabilities?: number;
        total_equity?: number;
        current_assets?: number;
        current_liabilities?: number;
      };
      income_statement?: {
        revenue?: number;
        ebit?: number;
        ebitda?: number;
        net_income?: number;
        operating_income?: number;
      };
      valuation_metrics?: {
        equity_valuation_range?: {
          low: number;
          high: number;
        };
        average_equity_valuation?: number;
        calculated_net_debt?: number;
      };
    }>;
  }>;
  analysis?: any;
  scores?: any;
  totalScore?: number;
  recommendations?: any[];
}

// Function to fetch valuation financial data
async function fetchValuationFinancialData(
  valuationId: string,
  supabase: any
): Promise<ValuationFinancialData | null> {
  debugLog("DataFetch", `Fetching valuation financial data for ID: ${valuationId}`);
  
  try {
    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('*, company:companies(*)')
      .eq('id', valuationId)
      .single();
    
    if (error) {
      debugLog("DataFetch", `Error fetching valuation: ${error.message}`);
      return null;
    }
    
    if (!valuation || !valuation.results) {
      debugLog("DataFetch", "No valuation results found");
      return null;
    }
    
    // Extract financial data from results
    const results = valuation.results;
    debugLog("DataFetch", "Valuation results structure:", {
      hasFinancialAnalysis: !!results.financialAnalysis,
      hasDocuments: !!results.financialAnalysis?.documents,
      documentCount: results.financialAnalysis?.documents?.length || 0,
      hasValuationReport: !!results.valuationReport,
      companyName: valuation.company?.name
    });
    
    // Return the transformed valuation data
    return transformValuationData(valuation);
  } catch (error) {
    debugLog("DataFetch", `Exception fetching valuation data: ${error}`);
    return null;
  }
}

// Function to transform valuation data to expected format
function transformValuationData(valuation: any): ValuationFinancialData | null {
  if (!valuation.results?.financialAnalysis) {
    return null;
  }
  
  const financialAnalysis = valuation.results.financialAnalysis;
  const valuationReport = valuation.results.valuationReport;
  
  // Extract company name from various sources
  const companyName = valuation.company?.name || 
                      financialAnalysis.company_name || 
                      valuationReport?.company_name || 
                      'Unknown Company';
  
  return {
    company_name: companyName,
    documents: financialAnalysis.documents || [],
    analysis: financialAnalysis.analysis,
    scores: financialAnalysis.scores,
    totalScore: financialAnalysis.totalScore,
    recommendations: financialAnalysis.recommendations || []
  };
}

// Function to transform valuation data to FinancialData format
function transformValuationDataToFinancialData(
  financialData: ValuationFinancialData | null,
  companyData: CompanyData
): FinancialData | null {
  debugLog("Transform", "Transforming valuation data to FinancialData format");
  
  if (!financialData || !financialData.documents) {
    debugLog("Transform", "No financial data to transform");
    return null;
  }
  
  // Get all financial periods from the first document
  const allPeriods = financialData.documents[0]?.financial_periods || [];
  
  // Transform to FinancialData structure
  const transformedData: FinancialData = {
    company: {
      id: companyData.id,
      name: financialData.company_name || companyData.name,
      industry: companyData.industry,
      description: companyData.description,
      company_type: companyData.company_type
    },
    
    financial_periods: allPeriods.map(period => ({
      year: period.year,
      period_type: 'annual' as const,
      
      income_statement: {
        revenue: period.income_statement?.revenue || 0,
        gross_profit: period.income_statement?.gross_profit,
        operating_expenses: period.income_statement?.operating_expenses,
        ebitda: period.income_statement?.ebitda,
        ebit: period.income_statement?.ebit || period.income_statement?.operating_income,
        net_income: period.income_statement?.net_income || 0
      },
      
      balance_sheet: {
        total_assets: period.balance_sheet?.total_assets,
        current_assets: period.balance_sheet?.current_assets,
        total_liabilities: period.balance_sheet?.total_liabilities,
        current_liabilities: period.balance_sheet?.current_liabilities,
        shareholders_equity: period.balance_sheet?.total_equity
      },
      
      // Include valuation metrics for net debt extraction
      valuation_metrics: period.valuation_metrics
    } as any)),
    
    valuation_analysis: {
      valuation_date: new Date().toISOString(),
      valuation_method: 'DCF Scenario Analysis',
      recommendations: financialData.recommendations
    },
    
    data_quality: {
      completeness_score: financialData.totalScore || 0,
      periods_available: allPeriods.length,
      has_audited_financials: false,
      data_source: 'valuation_analysis',
      extraction_confidence: 0.9
    },
    
    // Extract calculated_metrics including net debt from the latest period
    calculated_metrics: {
      net_debt: allPeriods[0]?.valuation_metrics?.calculated_net_debt
    }
  };
  
  debugLog("Transform", "FinancialData created:", {
    company_name: transformedData.company.name,
    periods_count: transformedData.financial_periods.length,
    has_revenue: transformedData.financial_periods.some(p => p.income_statement.revenue > 0),
    has_assets: transformedData.financial_periods.some(p => (p.balance_sheet.total_assets || 0) > 0),
    has_net_debt: transformedData.calculated_metrics?.net_debt !== undefined
  });
  
  return transformedData;
}

export async function runDCFAnalysis(
  requestData: DCFAnalysisRequest,
  supabase: any
) {
  const { valuationId, companyId, userId } = requestData;
  let analysisId: string | null = null;

  debugLog("Init", `Starting DCF analysis for company ${companyId}, valuation ${valuationId}, user ${userId}`);

  // Check for existing processing record (like sales-analysis pattern)
  const { data: existingAnalysis } = await supabase
    .from('dcf_scenario_analyses')
    .select('id')
    .eq('company_id', companyId)
    .eq('valuation_id', valuationId)
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingAnalysis && existingAnalysis.length > 0) {
    // Use existing record
    analysisId = existingAnalysis[0].id;
    debugLog("DB", `Using existing analysis record with ID: ${analysisId}`);
  } else {
    // Create new record only if none exists
    const { data: analysisRecord, error: insertError } = await supabase
      .from('dcf_scenario_analyses')
      .insert({
        user_id: userId,
        company_id: companyId,
        valuation_id: valuationId,
        status: 'processing',
        analysis_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create analysis record: ${insertError.message}`);
    }

    analysisId = analysisRecord.id;
    debugLog("DB", `Created new analysis record with ID: ${analysisId}`);
  }

  try {
    // Phase 0A: Fetch company and valuation financial data
    debugLog("Phase0A", "Starting data gathering phase");
    
    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error(`Company not found: ${companyError?.message || 'No data'}`);
    }

    debugLog("Phase0A", `Company found: ${company.name}`);

    // Fetch valuation financial data from completed valuations
    debugLog("Phase0A", "Fetching valuation financial data from completed valuations");
    const valuationFinancialData = await fetchValuationFinancialData(valuationId, supabase);
    
    if (!valuationFinancialData) {
      throw new Error("No valuation financial data found. DCF analysis requires completed valuation data.");
    }
    
    debugLog("Phase0A", "Valuation financial data fetched successfully", {
      companyName: valuationFinancialData.company_name,
      documentCount: valuationFinancialData.documents?.length || 0,
      hasAnalysis: !!valuationFinancialData.analysis,
      hasScores: !!valuationFinancialData.scores
    });
    
    // Check memory usage
    const memBefore = Deno.memoryUsage();
    debugLog("Phase0A", `Memory usage: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB of ~150MB limit`);

    // Prepare company data
    const companyData: CompanyData = {
      id: company.id,
      name: company.name,
      industry: company.industry || company.business_description,
      description: company.business_description || '',
      company_type: company.company_type,
      created_at: company.created_at,
      updated_at: company.updated_at
    };

    // Transform valuation data to FinancialData format
    debugLog("Phase0A", "Transforming valuation financial data to FinancialData format");
    const financialDataForDCF = transformValuationDataToFinancialData(valuationFinancialData, companyData);
    
    if (!financialDataForDCF) {
      throw new Error("Failed to transform valuation data to FinancialData format");
    }
    
    debugLog("Phase0A", `Financial data prepared with ${financialDataForDCF.financial_periods.length} periods`);

    // Initialize services (not needed for static methods)

    // Orchestrator Phase 0: Select DCF variant
    debugLog("Orchestrator", "Selecting optimal DCF variant based on valuation data...");
    const variantSelection = await selectDCFVariant(companyData, financialDataForDCF);
    debugLog("Orchestrator", `Selected '${variantSelection.variant}' with confidence ${variantSelection.confidence_score}/10`);
    debugLog("Orchestrator", `Reasoning: ${variantSelection.reasoning}`);

    // Phase 0B: Get industry benchmark data
    debugLog("Phase0B", "Gathering industry benchmark data...");
    
    // Check cache first
    let industryBenchmarkData = IndustryCache.get(
      companyData.industry || 'unknown', 
      companyData.description || ''
    );
    
    if (industryBenchmarkData) {
      debugLog("Phase0B", "Using cached industry benchmark data");
    } else {
      debugLog("Phase0B", "Fetching fresh industry benchmark data");

      try {
        // Use Perplexity Sonar-pro for industry data search
        const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
        if (!PERPLEXITY_API_KEY) {
          throw new Error("PERPLEXITY_API_KEY not configured");
        }
        
        debugLog("Phase0B", "Using Perplexity Sonar-pro for industry data search");
        
        // Professional financial analyst prompt template
        const searchPrompt = `You are a financial analyst tasked with gathering key industry data for a specific company. The company's name is provided below:

<company_name>
${companyData.name}
</company_name>

Your task is to conduct a web search to find the most recent and relevant information about the industry in which this company operates. Focus on gathering data for the following key metrics and information:

Average EBITDA margins in the industry

Typical growth figures for the industry

WACC (Weighted Average Cost of Capital) estimates and capital costs for the industry

Average CAPEX (Capital Expenditure) levels relative to revenue in the industry

Industry outlook and trends for 2024-2025

Comparable companies in the same industry

Instructions:

Begin by searching for this information in Finnish sources.

If sufficient data is not available in Finnish, expand your search to include European data sources.

Ensure that the data you collect is as recent and relevant as possible.

Before providing your final response, conduct your research breakdown inside <research_breakdown> tags in your thinking block. This should include:

List potential search terms for each metric

The sources you've consulted, noting which were checked for Finnish data

Any challenges in finding specific data points

Document any data gaps and your decision to use European sources

Whether you had to resort to European data for any metrics

Your assessment of the data's reliability and relevance for each data point found

After your research breakdown, provide a comprehensive response based on your findings. Structure your response as follows:

<response>
1. Industry Average EBITDA Margins:
[Provide the information here]

2. Typical Industry Growth Figures:
[Provide the information here]

3. Industry WACC Estimates and Capital Costs:
[Provide the information here]

4. Average Industry CAPEX Levels (as % of Revenue):
[Provide the information here]

5. Industry Outlook and Trends (2024-2025):
[Provide the information here]

6. Comparable Companies:
[List 3-5 companies here]

Data Sources: [List your primary sources here]
</response>

Remember to provide clear, concise information based on your research findings. If certain data points are not available or are based on estimates, please indicate this in your response.

Your final output should consist only of the structured response and should not duplicate or rehash any of the work you did in the research breakdown section.`;
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [{ 
              role: 'user', 
              content: searchPrompt 
            }],
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Perplexity API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        // Extract the response from Perplexity
        let textContent = '';
        if (data.choices && data.choices[0] && data.choices[0].message) {
          textContent = data.choices[0].message.content;
        }
        
        debugLog("Phase0B", `Industry search completed, response length: ${textContent.length} characters`);
        
        if (textContent) {
          industryBenchmarkData = textContent;
          // Cache the result
          IndustryCache.set(
            companyData.industry || 'unknown',
            companyData.description || '',
            industryBenchmarkData
          );
        } else {
          debugLog("Phase0B", "WARNING: No text content in industry search response");
          industryBenchmarkData = "Toimialatietoja ei voitu hakea.";
        }
        
      } catch (error) {
        debugLog("Phase0B", `ERROR: Industry search failed: ${error}`);
        industryBenchmarkData = "Toimialatietojen haku epäonnistui.";
      }
    }
    
    debugLog("Phase0B", `Industry data gathering completed. Data length: ${industryBenchmarkData.length} characters`);

    // Phase 0C: Get comprehensive market data
    debugLog("Phase0C", "Fetching comprehensive market data...");
    const comprehensiveMarketData = await RealFinancialDataSources.fetchAllRealMarketData(
      companyData.industry,
      companyData.name,
      companyData.description
    );

    const marketBasedWACC = comprehensiveMarketData.costOfCapital.value;
    
    debugLog("Phase0C", `Comprehensive market data retrieved:`, {
      summary: comprehensiveMarketData.summary,
      dataQuality: comprehensiveMarketData.dataQuality,
      riskFreeRate: `${(comprehensiveMarketData.riskFreeRate.value * 100).toFixed(2)}% (${comprehensiveMarketData.riskFreeRate.source})`,
      industryBeta: `${comprehensiveMarketData.industryBeta.value.toFixed(2)} (${comprehensiveMarketData.industryBeta.source})`,
      inflation: `${(comprehensiveMarketData.inflation.value * 100).toFixed(2)}% (${comprehensiveMarketData.inflation.source})`,
      marketBasedWACC: `${(marketBasedWACC * 100).toFixed(2)}%`,
      recommendedTerminalGrowth: `${(comprehensiveMarketData.inflation.value * 100).toFixed(2)}%`
    });

    // Orchestrator: Execute selected variant analysis
    console.log("Orchestrator: Executing selected variant analysis pipeline...");
    
    // CRITICAL: Save variant selection BEFORE analysis to prevent data loss
    const { error: variantSaveError } = await supabase
      .from('dcf_scenario_analyses')
      .update({
        variant_selected: variantSelection.variant,
        variant_confidence: variantSelection.confidence_score,
        variant_reasoning: variantSelection.reasoning,
        market_data_used: {
          ...comprehensiveMarketData,
          marketBasedWACC: marketBasedWACC
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    if (variantSaveError) {
      console.error("Failed to save variant selection:", variantSaveError);
    }
    
    const variantResult = await executeVariantAnalysis(
      variantSelection,
      companyData,
      financialDataForDCF,
      industryBenchmarkData,
      comprehensiveMarketData,
      marketBasedWACC
    );

    console.log(`Orchestrator: ${variantResult.variant} analysis completed in ${variantResult.execution_time_ms}ms`);
    
    // Memory management optimized
    
    // Force garbage collection hint
    if (globalThis.gc) {
      globalThis.gc();
    }
    
    const memAfterAnalysis = Deno.memoryUsage();
    console.log(`Memory after analysis (docs freed): ${Math.round(memAfterAnalysis.heapUsed / 1024 / 1024)}MB`);

    // Save completed analysis
    console.log("Saving completed DCF analysis...");
    const { error: saveError } = await supabase
      .from('dcf_scenario_analyses')
      .update({
        status: 'completed',
        variant_selected: variantResult.variant,
        variant_confidence: variantSelection.confidence_score,
        variant_reasoning: variantSelection.reasoning,
        structured_data: variantResult.structured_data,
        market_data_used: {
          ...comprehensiveMarketData,
          marketBasedWACC: marketBasedWACC
        },
        execution_metadata: {
          completed_at: new Date().toISOString(),
          execution_time_ms: variantResult.execution_time_ms,
          model_used: variantResult.model_used,
          error_details: variantResult.error_details,
          market_data_quality: comprehensiveMarketData.dataQuality,
          api_calls_made: comprehensiveMarketData.successfulSources,
          total_data_points: comprehensiveMarketData.totalSources
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    if (saveError) {
      console.error("Failed to save analysis results:", saveError);
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    } else {
      console.log("DCF analysis saved successfully");
    }

    // Validate the structured data - validate each scenario separately
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    try {
      // Validate each scenario
      const scenarios = ['pessimistic', 'base', 'optimistic'] as const;
      for (const scenarioName of scenarios) {
        const scenario = variantResult.structured_data.scenario_projections[scenarioName];
        const scenarioValidation = DCFValidator.validateScenario(scenario);
        
        if (!scenarioValidation.isValid) {
          allErrors.push(...scenarioValidation.errors.map(e => `${scenarioName}: ${e}`));
        }
        allWarnings.push(...scenarioValidation.warnings.map(w => `${scenarioName}: ${w}`));
      }
    } catch (validationError) {
      console.error('Validation error:', validationError);
      allWarnings.push('DCF validation failed: ' + validationError.message);
    }
    
    const validationResults = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
    
    console.log(`Validation results - Valid: ${validationResults.isValid}, Errors: ${validationResults.errors.length}, Warnings: ${validationResults.warnings.length}`);
    
    if (!validationResults.isValid) {
      console.error("Validation errors found:");
      console.error(formatValidationResults(validationResults));
    }

    // Update with validation results
    const { error: updateError } = await supabase
      .from('dcf_scenario_analyses')
      .update({
        validation_results: validationResults,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    if (updateError) {
      throw new Error(`Failed to save analysis results: ${updateError.message}`);
    }

    console.log("DCF analysis completed and saved successfully");

    return {
      analysis_id: analysisId,
      variant: variantResult.variant,
      confidence: variantSelection.confidence_score,
      valuation_summary: variantResult.structured_data.valuation_summary,
      validation: {
        is_valid: validationResults.isValid,
        errors: validationResults.errors.length,
        warnings: validationResults.warnings.length
      }
    };

  } catch (error) {
    console.error("DCF analysis failed:", error);
    
    // Update status to failed
    if (analysisId) {
      await supabase
        .from('dcf_scenario_analyses')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);
    }
    
    throw error;
  }
}