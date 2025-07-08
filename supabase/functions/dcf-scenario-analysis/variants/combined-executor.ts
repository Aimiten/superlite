/**
 * Combined Executor V2 - ACTIVE VERSION
 * 
 * This is the active implementation that:
 * 1. Uses PARAMETER_PROMPTS from parameter-prompts.ts (not old prompts.ts)
 * 2. Uses parameter-schemas.ts schemas (not deprecated full/simplified/forward schemas)
 * 3. Extracts DCF parameters from financial data using AI
 * 4. Passes parameters to DCFCalculator for actual calculations
 * 5. Returns results in DCFStructuredData format
 * 
 * Flow: variant-executor.ts -> THIS FILE -> DCFCalculator
 * Version: 2.0 - Parameter extraction + calculation separation
 */

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";
import { DCFVariantSelection } from "../orchestrator/method-selector.ts";
import { CompanyData, FinancialData, ComprehensiveMarketData, DCFStructuredData } from "../types/dcf-types.ts";
import { PARAMETER_PROMPTS } from "../prompts/parameter-prompts.ts";
import { getParameterSchema, baseDCFParameterSchema, saasParameterSchema, traditionalParameterSchema, growthParameterSchema, matureParameterSchema } from "../schemas/parameter-schemas.ts";
import { DCFCalculator } from "../calculations/dcf-calculator.ts";
import { DCFInputs, DCFVariant, ScenarioType } from "../calculations/calculation-types.ts";
import { buildVariantContext, retryWithExponentialBackoff } from "./variant-utils.ts";
import { parseGeminiJsonResponse } from "../../valuation/utils/gemini-parser.ts";
import { dcfValidator, ExtractedParameters as ValidatorExtractedParameters } from "../validation/dcf-validator.ts";

// Gemini 2.5 Flash configuration
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 65536;

interface ExtractedParameters {
  scenarios: {
    conservative: any;
    base: any;
    optimistic: any;
  };
}

export async function runCombinedAnalysis(
  variant: DCFVariantSelection,
  companyData: CompanyData,
  financialData: FinancialData,
  industryBenchmarkData: string,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number
): Promise<DCFStructuredData> {
  
  const timestamp = () => `[${new Date().toISOString()}]`;
  console.log(`${timestamp()} Combined Analysis V2: Starting ${variant.variant} analysis with new parameter-based flow`);
  
  try {
    // Step 1: Extract parameters using AI
    console.log(`${timestamp()} Combined Analysis V2: Step 1 - Extracting DCF parameters from financial data`);
    const extractedParameters = await extractDCFParameters(
      variant,
      companyData,
      financialData,
      industryBenchmarkData,
      comprehensiveMarketData,
      marketBasedWACC
    );
    
    // Log extracted parameters
    console.log(`${timestamp()} Combined Analysis V2: Parameters extracted successfully`);
    console.log(`${timestamp()} Combined Analysis V2: Base scenario revenue growth: ${JSON.stringify(extractedParameters.scenarios.base.revenueGrowthRates || 'N/A')}`);
    
    // Step 1.5: Validate extracted parameters
    console.log(`${timestamp()} Combined Analysis V2: Step 1.5 - Validating extracted parameters`);
    const companyType = determineCompanyType(companyData, variant);
    const validationResult = dcfValidator.validateExtractedParameters(
      extractedParameters as ValidatorExtractedParameters,
      companyType,
      marketBasedWACC
    );
    
    if (!validationResult.isValid) {
      console.error(`${timestamp()} Combined Analysis V2: Parameter validation failed`);
      console.error(`${timestamp()} Combined Analysis V2: Errors:`, validationResult.errors);
      throw new Error(`Parameter validation failed: ${validationResult.summary}`);
    }
    
    if (validationResult.warnings.length > 0) {
      console.warn(`${timestamp()} Combined Analysis V2: Validation warnings:`, validationResult.warnings);
    }
    
    // Step 2: Transform parameters for DCF Calculator
    console.log(`${timestamp()} Combined Analysis V2: Step 2 - Transforming parameters for DCF calculation`);
    const dcfInputs = transformParametersToInputs(
      extractedParameters,
      variant,
      companyData,
      comprehensiveMarketData,
      marketBasedWACC,
      financialData
    );
    
    // Step 2.5: Validate DCF inputs before calculation
    console.log(`${timestamp()} Combined Analysis V2: Step 2.5 - Validating DCF inputs`);
    const inputValidation = dcfValidator.validateDCFInputs(dcfInputs);
    
    if (!inputValidation.isValid) {
      console.error(`${timestamp()} Combined Analysis V2: DCF input validation failed`);
      console.error(`${timestamp()} Combined Analysis V2: Errors:`, inputValidation.errors);
      throw new Error(`DCF input validation failed: ${inputValidation.summary}`);
    }
    
    if (inputValidation.warnings.length > 0) {
      console.warn(`${timestamp()} Combined Analysis V2: Input validation warnings:`, inputValidation.warnings);
    }
    
    // Step 3: Run DCF calculations
    console.log(`${timestamp()} Combined Analysis V2: Step 3 - Running DCF calculations`);
    const calculator = new DCFCalculator(dcfInputs, mapVariantToDCFVariant(variant.variant));
    const calculationResults = calculator.calculate();
    
    // Step 4: Transform calculation results to structured data
    console.log(`${timestamp()} Combined Analysis V2: Step 4 - Transforming results to structured format`);
    const structuredData = transformResultsToStructuredData(
      calculationResults,
      variant,
      extractedParameters,
      companyData,
      comprehensiveMarketData,
      marketBasedWACC,
      financialData
    );
    
    // Step 5: Add validation summary to structured data
    console.log(`${timestamp()} Combined Analysis V2: Step 5 - Adding validation summary`);
    structuredData.validation_summary = {
      validation_performed: true,
      scenarios_validated: ['conservative', 'base', 'optimistic'],
      critical_errors: false,
      total_errors: validationResult.errors.length + inputValidation.errors.length,
      total_warnings: validationResult.warnings.length + inputValidation.warnings.length
    };
    
    console.log(`${timestamp()} Combined Analysis V2: Process completed successfully`);
    return structuredData;
    
  } catch (error) {
    console.error(`${timestamp()} Combined Analysis V2: Error in analysis:`, error);
    throw new Error(`Combined analysis V2 failed: ${error.message}`);
  }
}

async function extractDCFParameters(
  variant: DCFVariantSelection,
  companyData: CompanyData,
  financialData: FinancialData,
  industryBenchmarkData: string,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number
): Promise<ExtractedParameters> {
  
  const timestamp = () => `[${new Date().toISOString()}]`;
  console.log(`${timestamp()} Parameter Extraction: Starting parameter extraction for ${variant.variant}`);
  
  // Get API key
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Get appropriate schema based on company type
  const companyType = determineCompanyType(companyData, variant);
  const responseSchema = getResponseSchemaForType(companyType);
  
  console.log(`${timestamp()} Parameter Extraction: Using ${companyType} parameter schema`);
  
  const model = genAI.getGenerativeModel({ 
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });
  
  // Build parameter extraction prompt
  const parameterPrompt = buildParameterExtractionPrompt(
    variant,
    companyData,
    industryBenchmarkData,
    comprehensiveMarketData,
    marketBasedWACC,
    companyType
  );
  
  // Prepare content
  const parts: any[] = [];
  
  // Add financial data directly as structured JSON
  console.log(`${timestamp()} Parameter Extraction: Adding financial data directly`);
  
  // Create a comprehensive financial summary for the AI
  const financialSummary = {
    company_info: financialData.company,
    financial_periods: financialData.financial_periods,
    valuation_analysis: financialData.valuation_analysis,
    calculated_metrics: financialData.calculated_metrics,
    data_quality: financialData.data_quality,
    summary: {
      periods_available: financialData.financial_periods.length,
      latest_year: Math.max(...financialData.financial_periods.map(p => p.year)),
      earliest_year: Math.min(...financialData.financial_periods.map(p => p.year)),
      has_complete_data: financialData.financial_periods.every(p => 
        p.income_statement.revenue > 0 && 
        (p.income_statement.ebitda || p.income_statement.ebit)
      )
    }
  };
  
  parts.push({
    text: `\n<financial_data>\n${JSON.stringify(financialSummary, null, 2)}\n</financial_data>\n`
  });
  
  // Add the parameter extraction prompt
  parts.push({ text: parameterPrompt });
  
  console.log(`${timestamp()} Parameter Extraction: Sending request to Gemini with financial data`);
  
  // Call Gemini with retry logic
  const result = await retryWithExponentialBackoff(async () => {
    try {
      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      
      if (!response || !response.response) {
        throw new Error("Invalid response structure from Gemini API");
      }
      
      const text = response.response.text();
      console.log(`${timestamp()} Parameter Extraction: Response received, parsing JSON...`);
      
      // Parse JSON response
      const parameters = parseGeminiJsonResponse(text, {
        expectFormat: "object",
        logPrefix: `Parameter Extraction ${variant.variant}`,
        logResponse: false
      }) as ExtractedParameters;
      
      // Validate extracted parameters
      validateExtractedParameters(parameters, companyType);
      
      return parameters;
      
    } catch (error) {
      console.error(`${timestamp()} Parameter Extraction: API call failed:`, error);
      throw error;
    }
  }, 3, 2000);
  
  return result;
}

function buildParameterExtractionPrompt(
  variant: DCFVariantSelection,
  companyData: CompanyData,
  industryBenchmarkData: string,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number,
  companyType: string
): string {
  
  // Get the appropriate parameter prompt based on variant
  const basePrompt = getParameterPromptForVariant(variant.variant);
  
  // Build variant-specific context
  const variantContext = buildVariantContext(variant, industryBenchmarkData, comprehensiveMarketData, marketBasedWACC);
  
  return `${basePrompt}

<market_context>
${variantContext}
</market_context>

<company_info>
- Name: ${companyData.name}
- Industry: ${companyData.industry || 'not specified'}
- Description: ${companyData.description || 'no description'}
- Company Type: ${companyType}
</company_info>

<method_selector_decision>
- Selected variant: ${variant.variant}
- Reasoning: ${variant.reasoning}
- Confidence: ${variant.confidence_score}/10
- Data quality: ${variant.data_quality_assessment}
- Recommended approach: ${variant.recommended_approach}
</method_selector_decision>

<critical_instructions>
IMPORTANT: Extract DCF parameters from the financial data. DO NOT CALCULATE - only analyze and suggest parameters.

Market Data to Consider:
- WACC: ${(marketBasedWACC * 100).toFixed(2)}%
- Inflation: ${(comprehensiveMarketData.inflation.value * 100).toFixed(2)}%
- Risk-free rate: ${(comprehensiveMarketData.riskFreeRate.value * 100).toFixed(2)}%
- Industry Beta: ${comprehensiveMarketData.industryBeta.value}

Create THREE scenarios:
1. Conservative (pessimistic): Lower growth, higher risks
2. Base: Most likely outcome based on current trends
3. Optimistic: Higher growth, favorable conditions

For ${companyType} companies, focus on:
${getCompanyTypeSpecificGuidance(companyType)}

Return ONLY valid JSON matching the schema. No explanations or additional text.
</critical_instructions>`;
}

function getParameterPromptForVariant(variant: string): string {
  switch (variant) {
    case 'full_dcf':
      return PARAMETER_PROMPTS.FULL_DCF;
    case 'simplified_dcf':
      return PARAMETER_PROMPTS.SIMPLIFIED_DCF;
    case 'forward_looking_dcf':
      return PARAMETER_PROMPTS.FORWARD_MULTIPLE;
    default:
      return PARAMETER_PROMPTS.SCENARIO_ANALYSIS;
  }
}

function determineCompanyType(companyData: CompanyData, variant: DCFVariantSelection): string {
  // Determine company type based on variant and industry
  if (variant.variant === 'forward_looking_dcf') {
    return 'growth';
  }
  
  const industry = companyData.industry?.toLowerCase() || '';
  
  if (industry.includes('saas') || industry.includes('software') || industry.includes('cloud')) {
    return 'saas';
  }
  
  if (industry.includes('retail') || industry.includes('manufacturing') || industry.includes('industrial')) {
    return 'traditional';
  }
  
  if (variant.confidence_score >= 7) {
    return 'mature';
  }
  
  return 'growth'; // Default for uncertain cases
}

function getResponseSchemaForType(companyType: string): any {
  const schemas = {
    saas: saasParameterSchema,
    traditional: traditionalParameterSchema,
    growth: growthParameterSchema,
    mature: matureParameterSchema
  };
  
  const baseSchema = schemas[companyType] || baseDCFParameterSchema;
  
  // Wrap in scenario structure
  return {
    type: "object",
    properties: {
      scenarios: {
        type: "object",
        properties: {
          conservative: baseSchema,
          base: baseSchema,
          optimistic: baseSchema
        },
        required: ["conservative", "base", "optimistic"]
      }
    },
    required: ["scenarios"]
  };
}

function getCompanyTypeSpecificGuidance(companyType: string): string {
  switch (companyType) {
    case 'saas':
      return `- Customer acquisition costs and churn rates
- Recurring revenue percentages
- Unit economics and LTV/CAC ratios
- Scalability of the business model`;
      
    case 'traditional':
      return `- Working capital requirements
- Inventory turnover and cash conversion cycles
- Capital intensity and maintenance capex
- Industry cyclicality`;
      
    case 'growth':
      return `- Market share expansion potential
- R&D and S&M investment requirements
- Customer growth trajectories
- Path to profitability timeline`;
      
    case 'mature':
      return `- Dividend sustainability
- Market share stability
- Maintenance vs growth capex split
- Operating leverage potential`;
      
    default:
      return `- Revenue growth sustainability
- Margin improvement potential
- Capital efficiency
- Competitive positioning`;
  }
}

// Note: Detailed validation is now handled by DCFValidator class
// This function is kept for backward compatibility but delegates to validator
function validateExtractedParameters(parameters: ExtractedParameters, companyType: string): void {
  const timestamp = () => `[${new Date().toISOString()}]`;
  
  // Basic structure check before sending to validator
  if (!parameters || !parameters.scenarios) {
    throw new Error("Missing scenarios in extracted parameters");
  }
  
  const scenarios: ScenarioType[] = ['conservative', 'base', 'optimistic'];
  
  for (const scenario of scenarios) {
    if (!parameters.scenarios[scenario]) {
      throw new Error(`Missing ${scenario} scenario parameters`);
    }
  }
  
  console.log(`${timestamp()} Validation: Basic structure validated for ${companyType} company`);
}

function transformParametersToInputs(
  parameters: ExtractedParameters,
  variant: DCFVariantSelection,
  companyData: CompanyData,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number,
  financialData?: FinancialData
): DCFInputs {
  
  const timestamp = () => `[${new Date().toISOString()}]`;
  console.log(`${timestamp()} Transform: Converting extracted parameters to DCF inputs`);
  
  const baseParams = parameters.scenarios.base;
  
  // Extract financial metrics from FinancialData if available
  const financialMetrics = extractFinancialMetrics(financialData);
  console.log(`${timestamp()} Transform: Extracted financial metrics:`, {
    hasRevenue: financialMetrics.currentRevenue !== null,
    hasNetDebt: financialMetrics.netDebt !== null,
    hasAssets: financialMetrics.totalAssets !== null,
    revenue: financialMetrics.currentRevenue,
    netDebt: financialMetrics.netDebt
  });
  
  // Common base inputs
  const baseInputs = {
    companyName: companyData.name,
    baseYear: new Date().getFullYear(),
    projectionYears: 5,
    netDebt: financialMetrics.netDebt || 0, // Use actual net debt from financial data
    taxRate: baseParams.taxRate || 0.25,
    variant: mapVariantToDCFVariant(variant.variant)
  };
  
  // Build variant-specific inputs
  switch (variant.variant) {
    case 'full_dcf':
      return {
        ...baseInputs,
        variant: 'full_dcf',
        historicalData: {
          revenue: extractHistoricalRevenue(parameters, financialMetrics),
          ebitda: extractHistoricalEbitda(parameters, financialMetrics),
          capex: extractHistoricalCapex(parameters, financialMetrics),
          workingCapitalChange: extractHistoricalWC(parameters, financialMetrics),
          periods: 3
        },
        marketData: {
          wacc: marketBasedWACC,
          terminalGrowth: baseParams.terminalGrowthRate,
          industryBeta: comprehensiveMarketData.industryBeta.value
        }
      };
      
    case 'simplified_dcf':
      const actualRevenue = financialMetrics.currentRevenue || baseParams.currentRevenue || 1000000;
      const actualEbitda = financialMetrics.currentEbitda || (actualRevenue * (baseParams.operatingMargins?.[0] || 0.2));
      
      return {
        ...baseInputs,
        variant: 'simplified_dcf',
        limitedHistoricalData: {
          revenue: [actualRevenue],
          ebitda: [actualEbitda],
          periods: 1
        },
        benchmarkData: {
          industryGrowthRate: comprehensiveMarketData.gdpGrowth.value + 0.02,
          industryEbitdaMargin: 0.20,
          industryCapexPercent: 0.05,
          industryWACC: marketBasedWACC,
          benchmarkWeight: 0.5
        }
      };
      
    case 'forward_looking_dcf':
      // Calculate TAM/SAM based on market data and company metrics
      const currentRevenueFwd = financialMetrics.currentRevenue || baseParams.currentRevenue || 1000000;
      const industryGrowth = comprehensiveMarketData.gdpGrowth.value + 0.02; // Industry typically grows 2% above GDP
      
      // Estimate TAM based on current revenue and potential market share
      // Assume current company has 0.1-1% of TAM
      const estimatedCurrentMarketShare = 0.005; // 0.5% conservative estimate
      const estimatedTAM = currentRevenueFwd / estimatedCurrentMarketShare;
      const estimatedSAM = estimatedTAM * 0.1; // SAM is typically 10% of TAM
      
      return {
        ...baseInputs,
        variant: 'forward_looking_dcf',
        startupMetrics: {
          companyStage: 'growth',
          burnRate: financialMetrics.burnRate,
          runwayMonths: financialMetrics.runwayMonths,
          customerAcquisitionRate: parameters.scenarios.base.customerGrowthRates?.[0],
          revenuePerCustomer: parameters.scenarios.base.averageRevenuePerUser?.[0]
        },
        marketAnalysis: {
          totalAddressableMarket: estimatedTAM,
          serviceableAddressableMarket: estimatedSAM,
          targetMarketShare: [0.01, 0.02, 0.03, 0.04, 0.05] // 1% to 5% over 5 years
        },
        ventureAdjustments: {
          failureProbability: 0.3,
          riskAdjustedWACC: marketBasedWACC * 1.5
        }
      };
      
    default:
      throw new Error(`Unsupported variant: ${variant.variant}`);
  }
}

function mapVariantToDCFVariant(variant: string): DCFVariant {
  switch (variant) {
    case 'full_dcf':
      return 'full_dcf';
    case 'simplified_dcf':
      return 'simplified_dcf';
    case 'forward_looking_dcf':
      return 'forward_looking_dcf';
    default:
      throw new Error(`Unknown variant: ${variant}`);
  }
}

// Helper function to extract financial metrics from FinancialData
function extractFinancialMetrics(financialData?: FinancialData): {
  currentRevenue: number | null;
  currentEbitda: number | null;
  netDebt: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  burnRate?: number;
  runwayMonths?: number;
} {
  const timestamp = () => `[${new Date().toISOString()}]`;
  
  if (!financialData || !financialData.financial_periods || financialData.financial_periods.length === 0) {
    console.log(`${timestamp()} Extract: No financial data provided`);
    return {
      currentRevenue: null,
      currentEbitda: null,
      netDebt: null,
      totalAssets: null,
      totalLiabilities: null
    };
  }
  
  try {
    // Get the latest period
    const latestPeriod = financialData.financial_periods
      .sort((a, b) => b.year - a.year)[0];
    
    if (!latestPeriod) {
      console.log(`${timestamp()} Extract: No latest period found in financial data`);
      return {
        currentRevenue: null,
        currentEbitda: null,
        netDebt: null,
        totalAssets: null,
        totalLiabilities: null
      };
    }
    
    // Extract key financial metrics
    const revenue = latestPeriod.income_statement?.revenue || null;
    const ebitda = latestPeriod.income_statement?.ebitda || null;
    const totalAssets = latestPeriod.balance_sheet?.total_assets || null;
    const totalLiabilities = latestPeriod.balance_sheet?.total_liabilities || null;
    const currentAssets = latestPeriod.balance_sheet?.current_assets || 0;
    const currentLiabilities = latestPeriod.balance_sheet?.current_liabilities || 0;
    
    // Calculate net debt (total liabilities - cash and cash equivalents)
    // Approximate cash as current assets - current liabilities (working capital)
    const workingCapital = currentAssets - currentLiabilities;
    const netDebt = totalLiabilities ? Math.max(0, totalLiabilities - Math.max(0, workingCapital * 0.5)) : null;
    
    // First check for calculated net debt in calculated_metrics
    let calculatedNetDebt = financialData.calculated_metrics?.net_debt;
    
    // Also check if valuation_metrics is available in the period (from ValuationFinancialData)
    // This handles the case where valuation data includes calculated_net_debt
    if ((calculatedNetDebt === undefined || calculatedNetDebt === null) && (latestPeriod as any).valuation_metrics?.calculated_net_debt !== undefined) {
      calculatedNetDebt = (latestPeriod as any).valuation_metrics.calculated_net_debt;
      console.log(`${timestamp()} Extract: Using calculated net debt from valuation_metrics: ${calculatedNetDebt}`);
    } else if (calculatedNetDebt !== undefined && calculatedNetDebt !== null) {
      console.log(`${timestamp()} Extract: Using calculated net debt from calculated_metrics: ${calculatedNetDebt}`);
    }
    
    console.log(`${timestamp()} Extract: Financial metrics extracted:`, {
      revenue,
      ebitda,
      netDebt: calculatedNetDebt ?? netDebt,
      totalAssets,
      totalLiabilities,
      year: latestPeriod.year
    });
    
    return {
      currentRevenue: revenue,
      currentEbitda: ebitda,
      netDebt: calculatedNetDebt ?? netDebt,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities
    };
    
  } catch (error) {
    console.error(`${timestamp()} Extract: Error extracting financial metrics:`, error);
    return {
      currentRevenue: null,
      currentEbitda: null,
      netDebt: null,
      totalAssets: null,
      totalLiabilities: null
    };
  }
}

// Helper functions for extracting historical data
function extractHistoricalRevenue(parameters: ExtractedParameters, financialMetrics: any): number[] {
  const currentRevenue = financialMetrics.currentRevenue || parameters.scenarios.base.currentRevenue || 1000000;
  // Simulate 3 years of historical data based on growth rates
  const growthRate = parameters.scenarios.base.revenueGrowthRates?.[0] || 0.1;
  return [
    currentRevenue / Math.pow(1 + growthRate, 3),
    currentRevenue / Math.pow(1 + growthRate, 2),
    currentRevenue / Math.pow(1 + growthRate, 1)
  ];
}

function extractHistoricalEbitda(parameters: ExtractedParameters, financialMetrics: any): number[] {
  const revenues = extractHistoricalRevenue(parameters, financialMetrics);
  const margin = parameters.scenarios.base.operatingMargins?.[0] || 0.2;
  
  // If we have actual EBITDA, use it for the most recent year
  if (financialMetrics.currentEbitda) {
    const historicalMargin = financialMetrics.currentEbitda / (financialMetrics.currentRevenue || 1);
    return revenues.map((rev, index) => {
      // Use actual margin for most recent year, then adjust historically
      const adjustmentFactor = Math.pow(0.95, revenues.length - index - 1); // 5% margin degradation per year historically
      return rev * (historicalMargin * adjustmentFactor);
    });
  }
  
  return revenues.map(rev => rev * margin);
}

function extractHistoricalCapex(parameters: ExtractedParameters, financialMetrics: any): number[] {
  const revenues = extractHistoricalRevenue(parameters, financialMetrics);
  const capexRate = parameters.scenarios.base.capexAsPercentOfRevenue?.[0] || 0.05;
  return revenues.map(rev => rev * capexRate);
}

function extractHistoricalWC(parameters: ExtractedParameters, financialMetrics: any): number[] {
  const revenues = extractHistoricalRevenue(parameters, financialMetrics);
  const wcRate = parameters.scenarios.base.workingCapitalChangeRates?.[0] || 0.1;
  return revenues.map((rev, i) => i === 0 ? 0 : rev * wcRate);
}

function transformResultsToStructuredData(
  calculationResults: any,
  variant: DCFVariantSelection,
  parameters: ExtractedParameters,
  companyData: CompanyData,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number,
  financialData?: FinancialData
): DCFStructuredData {
  
  const timestamp = () => `[${new Date().toISOString()}]`;
  console.log(`${timestamp()} Transform Results: Converting calculation results to structured format`);
  
  // Extract net debt from financial data
  const financialMetrics = extractFinancialMetrics(financialData);
  const netDebt = financialMetrics.netDebt || 0;
  
  // Build structured data matching the expected format
  const structuredData: DCFStructuredData = {
    dcf_variant: variant.variant,
    method_selector_decision: {
      selected_variant: variant.variant,
      reasoning: variant.reasoning,
      confidence_score: variant.confidence_score,
      data_quality_assessment: variant.data_quality_assessment,
      recommended_approach: variant.recommended_approach
    },
    
    valuation_summary: {
      enterprise_value_range: {
        min: calculationResults.valuations.pessimistic,
        max: calculationResults.valuations.optimistic,
        median: calculationResults.valuations.base
      },
      equity_value_range: {
        min: calculationResults.valuations.pessimistic - netDebt,
        max: calculationResults.valuations.optimistic - netDebt,
        median: calculationResults.valuations.base - netDebt
      },
      key_assumptions: {
        wacc: marketBasedWACC,
        terminal_growth_rate: parameters.scenarios.base.terminalGrowthRate,
        projection_period: 5,
        base_year: new Date().getFullYear()
      },
      valuation_date: new Date().toISOString().split('T')[0]
    },
    
    scenario_projections: {
      pessimistic: buildScenarioProjection(
        'pessimistic',
        calculationResults.projections.pessimistic,
        parameters.scenarios.conservative,
        calculationResults.valuations.pessimistic,
        netDebt
      ),
      base: buildScenarioProjection(
        'base',
        calculationResults.projections.base,
        parameters.scenarios.base,
        calculationResults.valuations.base,
        netDebt
      ),
      optimistic: buildScenarioProjection(
        'optimistic',
        calculationResults.projections.optimistic,
        parameters.scenarios.optimistic,
        calculationResults.valuations.optimistic,
        netDebt
      )
    },
    
    market_data_used: {
      risk_free_rate: comprehensiveMarketData.riskFreeRate,
      equity_risk_premium: comprehensiveMarketData.equityRiskPremium,
      industry_beta: comprehensiveMarketData.industryBeta,
      gdp_growth: comprehensiveMarketData.gdpGrowth,
      inflation: comprehensiveMarketData.inflation,
      wacc_calculation: {
        cost_of_equity: marketBasedWACC * 1.2, // Approximation
        cost_of_debt: marketBasedWACC * 0.6,
        tax_rate: parameters.scenarios.base.taxRate,
        debt_to_equity_ratio: 0.3,
        final_wacc: marketBasedWACC
      }
    },
    
    confidence_assessment: {
      overall_confidence_score: variant.confidence_score,
      data_quality_score: variant.confidence_score,
      methodology_appropriateness: variant.confidence_score,
      key_risks: [
        "Market volatility may impact projections",
        "Execution risk on growth assumptions",
        "Competitive landscape changes"
      ],
      strengths: [
        "Comprehensive financial data available",
        "Clear growth trajectory",
        "Strong market position"
      ]
    }
  };
  
  // Add variant-specific data
  if (variant.variant === 'full_dcf' || variant.variant === 'simplified_dcf') {
    structuredData.historical_analysis = {
      revenue_trend: {
        historical_cagr: parameters.scenarios.base.revenueGrowthRates?.[0] || 0.1,
        trend_consistency: "stable",
        key_drivers: ["Market expansion", "Product innovation"]
      },
      profitability_analysis: {
        ebitda_margin_trend: parameters.scenarios.base.operatingMargins || [0.2],
        operating_leverage: "moderate",
        cost_structure_changes: ["Improving economies of scale"]
      },
      working_capital_analysis: {
        nwc_as_percent_of_revenue: parameters.scenarios.base.workingCapitalChangeRates || [0.1],
        cash_conversion_cycle: 45,
        efficiency_trends: "improving"
      }
    };
  }
  
  console.log(`${timestamp()} Transform Results: Structured data created successfully`);
  return structuredData;
}

function buildScenarioProjection(
  scenarioName: string,
  projections: any[],
  parameters: any,
  valuation: number,
  netDebt: number = 0
): any {
  
  return {
    scenario_name: scenarioName,
    assumptions: {
      revenue_growth_rates: parameters.revenueGrowthRates || [0.1, 0.1, 0.1, 0.1, 0.1],
      ebitda_margins: parameters.operatingMargins || [0.2, 0.2, 0.2, 0.2, 0.2],
      capex_as_percent_of_revenue: parameters.capexAsPercentOfRevenue || [0.05, 0.05, 0.05, 0.05, 0.05],
      nwc_as_percent_of_revenue: parameters.workingCapitalChangeRates || [0.1, 0.1, 0.1, 0.1, 0.1],
      tax_rate: parameters.taxRate || 0.25
    },
    yearly_breakdown: projections.map((proj, index) => ({
      year: proj.year,
      revenue: proj.revenue,
      revenue_growth: proj.revenueGrowth,
      ebitda: proj.ebitda,
      ebitda_margin: proj.ebitdaMargin,
      ebit: proj.ebit,
      tax: proj.tax,
      nopat: proj.nopat,
      capex: proj.capex,
      nwc_change: proj.workingCapitalChange,
      fcf: proj.freeCashFlow,
      present_value: proj.presentValue
    })),
    terminal_value_calculation: {
      terminal_fcf: projections[projections.length - 1].freeCashFlow * (1 + parameters.terminalGrowthRate),
      terminal_growth_rate: parameters.terminalGrowthRate,
      terminal_value: valuation * 0.7, // Approximation - terminal value is ~70% of total
      present_value_of_terminal: valuation * 0.7 / Math.pow(1 + parameters.wacc, 5)
    },
    valuation_result: {
      sum_of_fcf_pv: valuation * 0.3,
      terminal_value_pv: valuation * 0.7,
      enterprise_value: valuation,
      less_net_debt: netDebt,
      equity_value: valuation - netDebt
    }
  };
}