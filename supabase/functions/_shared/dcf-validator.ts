// DCF Calculation Validator
// Validates DCF calculations for accuracy and consistency

// Import actual types from the DCF module
import type { 
  DCFScenario, 
  DetailedCalculations,
  YearlyBreakdown,
  ValuationBridge,
  ScenarioAssumptions
} from "../dcf-scenario-analysis/types/dcf-types.ts";

export interface DCFValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

export class DCFValidator {
  
  static validateScenario(scenario: DCFScenario): DCFValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];
    
    // 1. Basic sanity checks
    this.validateBasicAssumptions(scenario.assumptions, errors, warnings);
    
    // 2. Mathematical consistency checks
    this.validateCalculations(scenario, errors, warnings);
    
    // 3. Valuation bridge validation
    if (scenario.detailed_calculations?.valuation_bridge) {
      this.validateValuationBridge(scenario.detailed_calculations, errors, warnings);
    }
    
    // 4. FCF calculation validation
    if (scenario.detailed_calculations?.yearly_breakdown) {
      this.validateFCFCalculations(
        scenario.detailed_calculations.yearly_breakdown,
        scenario.assumptions,
        errors,
        warnings
      );
    }
    
    // 5. Market reasonableness checks
    this.validateMarketReasonableness(scenario, errors, warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }
  
  private static validateBasicAssumptions(
    assumptions: ScenarioAssumptions, 
    errors: string[], 
    warnings: string[]
  ) {
    // WACC sanity check
    if (assumptions.wacc < 0.03 || assumptions.wacc > 0.30) {
      errors.push(`WACC ${(assumptions.wacc * 100).toFixed(1)}% is unrealistic (should be 3-30%)`);
    }
    
    // Terminal growth sanity check
    if (assumptions.terminal_growth < -0.02 || assumptions.terminal_growth > 0.06) {
      errors.push(`Terminal growth ${(assumptions.terminal_growth * 100).toFixed(1)}% is unrealistic (should be -2% to 6%)`);
    }
    
    // Terminal growth vs WACC
    if (assumptions.terminal_growth >= assumptions.wacc) {
      errors.push(`Terminal growth (${(assumptions.terminal_growth * 100).toFixed(1)}%) cannot exceed WACC (${(assumptions.wacc * 100).toFixed(1)}%)`);
    }
    
    // Revenue growth sanity check - handle both single value and array
    const revenueGrowths = Array.isArray(assumptions.revenue_growth) 
      ? assumptions.revenue_growth 
      : [assumptions.revenue_growth];
    
    revenueGrowths.forEach((growth, index) => {
      if (typeof growth === 'number') {
        if (growth < -0.50 || growth > 2.00) {
          warnings.push(`Year ${index + 1} revenue growth ${(growth * 100).toFixed(1)}% seems extreme`);
        }
      }
    });
    
    // EBITDA margin sanity check - handle both single value and array
    const ebitdaMargins = Array.isArray(assumptions.ebitda_margin)
      ? assumptions.ebitda_margin
      : [assumptions.ebitda_margin];
      
    ebitdaMargins.forEach((margin, index) => {
      if (typeof margin === 'number') {
        if (margin < -0.50 || margin > 0.80) {
          warnings.push(`Year ${index + 1} EBITDA margin ${(margin * 100).toFixed(1)}% seems extreme`);
        }
      }
    });
    
    // Tax rate sanity check
    if (assumptions.tax_rate < 0 || assumptions.tax_rate > 0.50) {
      warnings.push(`Tax rate ${(assumptions.tax_rate * 100).toFixed(1)}% seems unusual`);
    }
  }
  
  private static validateCalculations(scenario: DCFScenario, errors: string[], warnings: string[]) {
    const { assumptions, projections, detailed_calculations } = scenario;
    
    if (!detailed_calculations) {
      warnings.push("No detailed calculations provided for validation");
      return;
    }
    
    // Check if projections exist
    if (!projections) {
      warnings.push("No projections provided for calculation validation");
      return;
    }
    
    // Check if assumptions exist
    if (!assumptions) {
      errors.push("No assumptions provided for calculation validation");
      return;
    }
    
    // Validate revenue calculations
    if (projections.revenue && projections.revenue.length > 0) {
      const baseRevenue = projections.revenue[0];
      for (let i = 1; i < projections.revenue.length; i++) {
        // Handle both single value and array formats
        const growthRate = Array.isArray(assumptions.revenue_growth) 
          ? assumptions.revenue_growth[i] || assumptions.revenue_growth[0]
          : assumptions.revenue_growth;
        
        const expectedRevenue = projections.revenue[i - 1] * (1 + growthRate);
        const actualRevenue = projections.revenue[i];
        const tolerance = Math.abs(expectedRevenue - actualRevenue) / expectedRevenue;
        
        if (tolerance > 0.05) { // 5% tolerance
          errors.push(`Year ${i + 1} revenue calculation error: expected ${expectedRevenue.toFixed(0)}, got ${actualRevenue.toFixed(0)}`);
        }
      }
    }
    
    // Validate EBITDA calculations
    if (projections.ebitda && projections.ebitda.length > 0 && projections.revenue && projections.revenue.length > 0) {
      for (let i = 0; i < projections.ebitda.length; i++) {
        // Handle both single value and array formats
        const margin = Array.isArray(assumptions.ebitda_margin)
          ? assumptions.ebitda_margin[i] || assumptions.ebitda_margin[0]
          : assumptions.ebitda_margin;
          
        const expectedEbitda = projections.revenue[i] * margin;
        const actualEbitda = projections.ebitda[i];
        const tolerance = Math.abs(expectedEbitda - actualEbitda) / Math.abs(expectedEbitda);
        
        if (tolerance > 0.05) {
          errors.push(`Year ${i + 1} EBITDA calculation error: expected ${expectedEbitda.toFixed(0)}, got ${actualEbitda.toFixed(0)}`);
        }
      }
    }
    
    // Validate terminal value calculation
    if (detailed_calculations.terminal_value_calculation) {
      const terminalCalc = detailed_calculations.terminal_value_calculation;
      if (terminalCalc.terminal_fcf && terminalCalc.terminal_growth_rate !== undefined && 
          terminalCalc.wacc && terminalCalc.terminal_value) {
        const expectedTerminalValue = terminalCalc.terminal_fcf * (1 + terminalCalc.terminal_growth_rate) / 
                                      (terminalCalc.wacc - terminalCalc.terminal_growth_rate);
        const tolerance = Math.abs(expectedTerminalValue - terminalCalc.terminal_value) / expectedTerminalValue;
        
        if (tolerance > 0.05) {
          errors.push(`Terminal value calculation error: expected ${expectedTerminalValue.toFixed(0)}, got ${terminalCalc.terminal_value.toFixed(0)}`);
        }
      }
    }
    
    // Validate discount factors
    if (detailed_calculations.yearly_breakdown && detailed_calculations.yearly_breakdown.length > 0) {
      detailed_calculations.yearly_breakdown.forEach((year, index) => {
        if (year.discount_factor && assumptions.wacc) {
          const expectedDiscountFactor = Math.pow(1 + assumptions.wacc, -(index + 1));
          const tolerance = Math.abs(expectedDiscountFactor - year.discount_factor) / expectedDiscountFactor;
          
          if (tolerance > 0.01) {
            errors.push(`Year ${index + 1} discount factor error: expected ${expectedDiscountFactor.toFixed(4)}, got ${year.discount_factor.toFixed(4)}`);
          }
        }
      });
    }
  }
  
  private static validateMarketReasonableness(scenario: DCFScenario, errors: string[], warnings: string[]) {
    // Check if projections exist and have required data
    if (!scenario.projections) {
      warnings.push("No projections provided for market reasonableness validation");
      return;
    }
    
    if (!scenario.projections.revenue || scenario.projections.revenue.length === 0) {
      warnings.push("No revenue projections available for market reasonableness validation");
      return;
    }
    
    if (!scenario.projections.enterprise_value || scenario.projections.enterprise_value === 0) {
      warnings.push("No enterprise value available for market reasonableness validation");
      return;
    }
    
    // EV/Revenue multiple check (rough sanity check)
    const finalRevenue = scenario.projections.revenue[scenario.projections.revenue.length - 1];
    if (finalRevenue && finalRevenue !== 0) {
      const evRevenueMultiple = scenario.projections.enterprise_value / finalRevenue;
      
      if (evRevenueMultiple > 20) {
        warnings.push(`EV/Revenue multiple of ${evRevenueMultiple.toFixed(1)}x seems very high`);
      }
      
      if (evRevenueMultiple < 0.5) {
        warnings.push(`EV/Revenue multiple of ${evRevenueMultiple.toFixed(1)}x seems very low`);
      }
    }
    
    // FCF margin reasonableness
    if (scenario.projections.free_cash_flows && scenario.projections.free_cash_flows.length > 0) {
      let validFcfCount = 0;
      let fcfMarginSum = 0;
      
      scenario.projections.free_cash_flows.forEach((fcf, index) => {
        if (scenario.projections.revenue[index] && scenario.projections.revenue[index] !== 0) {
          fcfMarginSum += fcf / scenario.projections.revenue[index];
          validFcfCount++;
        }
      });
      
      if (validFcfCount > 0) {
        const avgFcfMargin = fcfMarginSum / validFcfCount;
        
        if (avgFcfMargin > 0.40) {
          warnings.push(`Average FCF margin of ${(avgFcfMargin * 100).toFixed(1)}% seems very high`);
        }
        
        if (avgFcfMargin < -0.20) {
          warnings.push(`Average FCF margin of ${(avgFcfMargin * 100).toFixed(1)}% indicates persistent negative cash flow`);
        }
      }
    }
  }
  
  // Add valuation bridge validation
  private static validateValuationBridge(
    detailed_calculations: DetailedCalculations,
    errors: string[],
    warnings: string[]
  ) {
    const { valuation_bridge } = detailed_calculations;
    
    // Validate EV calculation: EV = sum of PV FCFs + Terminal PV
    const calculatedEV = valuation_bridge.sum_pv_fcf + valuation_bridge.terminal_pv;
    const evTolerance = Math.abs(calculatedEV - valuation_bridge.enterprise_value) / 
                        Math.abs(valuation_bridge.enterprise_value);
    
    if (evTolerance > 0.01) { // 1% tolerance
      errors.push(
        `Enterprise value calculation error: ` +
        `${calculatedEV.toFixed(0)} (calculated) ≠ ${valuation_bridge.enterprise_value.toFixed(0)} (stated)`
      );
    }
    
    // Validate equity value: Equity = EV - Net Debt
    const calculatedEquity = valuation_bridge.enterprise_value - valuation_bridge.net_debt;
    const equityTolerance = Math.abs(calculatedEquity - valuation_bridge.equity_value) / 
                            Math.abs(valuation_bridge.equity_value);
    
    if (equityTolerance > 0.01) { // 1% tolerance
      errors.push(
        `Equity value calculation error: ` +
        `${calculatedEquity.toFixed(0)} (EV - debt) ≠ ${valuation_bridge.equity_value.toFixed(0)} (stated)`
      );
    }
  }
  
  // Add FCF calculation validation
  private static validateFCFCalculations(
    yearly_breakdown: YearlyBreakdown[],
    assumptions: ScenarioAssumptions,
    errors: string[],
    warnings: string[]
  ) {
    yearly_breakdown.forEach((year, index) => {
      // Validate NOPAT calculation: NOPAT = EBIT * (1 - tax_rate)
      const expectedNopat = year.ebit * (1 - assumptions.tax_rate);
      const nopatTolerance = Math.abs(expectedNopat - year.nopat) / Math.abs(year.nopat);
      
      if (nopatTolerance > 0.02) { // 2% tolerance
        errors.push(
          `Year ${year.year} NOPAT calculation error: ` +
          `${expectedNopat.toFixed(0)} (expected) vs ${year.nopat.toFixed(0)} (actual)`
        );
      }
      
      // Validate FCF calculation: FCF = NOPAT - CapEx - WC Change
      // Note: We're not adding back D&A because we're starting from EBIT, not EBITDA
      const calculatedFCF = year.nopat - year.capex - year.working_capital_change;
      const fcfTolerance = Math.abs(calculatedFCF - year.free_cash_flow) / 
                           Math.abs(year.free_cash_flow);
      
      if (fcfTolerance > 0.05) { // 5% tolerance for FCF
        warnings.push(
          `Year ${year.year} FCF calculation variance: ` +
          `${calculatedFCF.toFixed(0)} (calculated) vs ${year.free_cash_flow.toFixed(0)} (stated)`
        );
      }
      
      // Validate present value calculation
      const expectedPV = year.free_cash_flow * year.discount_factor;
      const pvTolerance = Math.abs(expectedPV - year.present_value_fcf) / 
                          Math.abs(year.present_value_fcf);
      
      if (pvTolerance > 0.01) { // 1% tolerance
        errors.push(
          `Year ${year.year} PV calculation error: ` +
          `FCF ${year.free_cash_flow.toFixed(0)} × DF ${year.discount_factor.toFixed(4)} = ` +
          `${expectedPV.toFixed(0)} ≠ ${year.present_value_fcf.toFixed(0)}`
        );
      }
    });
  }
  
  // Calculate independent DCF value for comparison
  static calculateIndependentDCF(scenario: DCFScenario): number {
    const { assumptions, projections } = scenario;
    
    // Check for required data
    if (!assumptions || !projections || !projections.free_cash_flows || 
        projections.free_cash_flows.length === 0) {
      throw new Error("Missing required data for DCF calculation");
    }
    
    if (!assumptions.wacc || !assumptions.terminal_growth) {
      throw new Error("Missing WACC or terminal growth rate for DCF calculation");
    }
    
    // Validate WACC vs terminal growth
    if (assumptions.terminal_growth >= assumptions.wacc) {
      throw new Error("Terminal growth rate cannot exceed WACC");
    }
    
    // Calculate present value of projected FCFs
    let pvFcfs = 0;
    for (let i = 0; i < projections.free_cash_flows.length; i++) {
      const discountFactor = Math.pow(1 + assumptions.wacc, -(i + 1));
      pvFcfs += projections.free_cash_flows[i] * discountFactor;
    }
    
    // Calculate terminal value
    const terminalFcf = projections.free_cash_flows[projections.free_cash_flows.length - 1];
    const terminalValue = terminalFcf * (1 + assumptions.terminal_growth) / 
                          (assumptions.wacc - assumptions.terminal_growth);
    const terminalPv = terminalValue / Math.pow(1 + assumptions.wacc, projections.free_cash_flows.length);
    
    return pvFcfs + terminalPv;
  }
}

// Helper function to format validation results for logging
export function formatValidationResults(results: DCFValidationResult): string {
  let output = `DCF Validation: ${results.isValid ? 'PASSED' : 'FAILED'}\n`;
  
  if (results.errors.length > 0) {
    output += `\nERRORS:\n${results.errors.map(e => `- ${e}`).join('\n')}`;
  }
  
  if (results.warnings.length > 0) {
    output += `\nWARNINGS:\n${results.warnings.map(w => `- ${w}`).join('\n')}`;
  }
  
  return output;
}