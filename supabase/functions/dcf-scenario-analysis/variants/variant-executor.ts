/**
 * Variant Executor - Integration point for DCF analysis
 * 
 * This module now uses the V2 parameter-based approach:
 * 1. AI extracts parameters from financial data using structured schemas
 * 2. DCFCalculator performs calculations based on extracted parameters
 * 3. Results are formatted into DCFStructuredData format
 * 
 * The interface remains unchanged to maintain backward compatibility.
 */

import { DCFVariantSelection } from "../orchestrator/method-selector.ts";
import { CompanyData, FinancialData, ComprehensiveMarketData, DCFStructuredData } from "../types/dcf-types.ts";
import { runCombinedAnalysis } from "./combined-executor.ts";
import { logMemoryUsage } from "./variant-utils.ts";

export interface VariantExecutionResult {
  variant: string;
  structured_data: DCFStructuredData;
  execution_time_ms: number;
  model_used: string;
  error_details?: string;
}

export async function executeVariantAnalysis(
  variant: DCFVariantSelection,
  companyData: CompanyData,
  financialData: FinancialData,
  industryBenchmarkData: string,
  comprehensiveMarketData: ComprehensiveMarketData,
  marketBasedWACC: number
): Promise<VariantExecutionResult> {
  
  const startTime = Date.now();
  
  console.log(`Variant Executor: Starting ${variant.variant} analysis with Gemini 2.5 Flash...`);
  console.log(`Variant Executor: Using NEW parameter-based calculation flow (V2)`);
  
  // Monitor memory usage
  logMemoryUsage("Variant Executor: Starting memory");
  
  try {
    // Run combined analysis V2 with new parameter-based approach
    console.log(`Variant Executor: Calling runCombinedAnalysis with parameter extraction and DCFCalculator`);
    const structuredResult = await runCombinedAnalysis(
      variant,
      companyData,
      financialData,
      industryBenchmarkData,
      comprehensiveMarketData,
      marketBasedWACC
    );
    
    const endTime = Date.now();
    
    console.log(`Variant Executor: V2 Analysis completed successfully in ${endTime - startTime}ms`);
    console.log(`Variant Executor: Successfully used parameter extraction + DCFCalculator approach`);
    
    return {
      variant: variant.variant,
      structured_data: structuredResult,
      execution_time_ms: endTime - startTime,
      model_used: "gemini-2.5-flash",
      error_details: undefined
    };
    
  } catch (error) {
    console.error(`Variant Executor: ${variant.variant} V2 analysis failed`);
    console.error(`Variant Executor: Error in parameter-based flow:`, error);
    
    // No fallback - just throw the error
    throw new Error(`DCF V2 analysis failed: ${error?.message || 'Unknown error'}`);
    
  } finally {
    // Clean up memory
    console.log(`Variant Executor: Memory cleanup completed`);
    
    if (globalThis.gc) {
      globalThis.gc();
    }
    
    logMemoryUsage("Variant Executor: Final memory");
  }
}