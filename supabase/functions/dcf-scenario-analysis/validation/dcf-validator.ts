/**
 * DCF Parameter Validator
 * 
 * Comprehensive validation module for DCF scenario analysis parameters.
 * Validates all inputs before calculation to ensure data integrity and
 * prevent calculation errors.
 */

import { 
  DCFInputs, 
  DCFVariant,
  isFullDCFInputs,
  isSimplifiedDCFInputs,
  isForwardLookingDCFInputs
} from '../calculations/calculation-types.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  field: string;
  value: any;
  message: string;
  suggestion?: string;
}

export interface ExtractedParameterScenario {
  // Base parameters
  revenueGrowthRates?: number[];
  operatingMargins?: number[];
  capexAsPercentOfRevenue?: number[];
  workingCapitalChangeRates?: number[];
  terminalGrowthRate?: number;
  wacc?: number;
  currentRevenue?: number;
  taxRate?: number;
  
  // SaaS specific
  customerAcquisitionCost?: number[];
  churnRates?: number[];
  averageRevenuePerUser?: number[];
  recurringRevenuePercentage?: number;
  
  // Traditional business specific
  inventoryTurnover?: number[];
  daysInventoryOutstanding?: number[];
  daysReceivablesOutstanding?: number[];
  daysPayablesOutstanding?: number[];
  
  // Growth company specific
  marketShareGrowth?: number[];
  researchAndDevelopmentExpense?: number[];
  salesAndMarketingExpense?: number[];
  customerGrowthRates?: number[];
  
  // Mature company specific
  dividendPayoutRatio?: number;
  assetUtilizationRate?: number[];
  maintenanceCapexRatio?: number[];
  marketShareStability?: number[];
}

export interface ExtractedParameters {
  scenarios: {
    conservative: ExtractedParameterScenario;
    base: ExtractedParameterScenario;
    optimistic: ExtractedParameterScenario;
  };
}

export class DCFValidator {
  private readonly MAX_GROWTH_RATE = 2.0; // 200%
  private readonly MIN_GROWTH_RATE = -0.5; // -50%
  private readonly MAX_MARGIN = 0.5; // 50%
  private readonly MIN_MARGIN = -0.5; // -50%
  private readonly MAX_WACC = 0.3; // 30%
  private readonly MIN_WACC = 0.02; // 2%
  private readonly MAX_TERMINAL_GROWTH = 0.05; // 5%
  private readonly MIN_TERMINAL_GROWTH = -0.02; // -2%
  private readonly MAX_TAX_RATE = 0.5; // 50%
  private readonly MIN_TAX_RATE = 0; // 0%
  
  /**
   * Validate extracted parameters from Gemini before DCF calculation
   */
  validateExtractedParameters(
    parameters: ExtractedParameters,
    companyType: string,
    marketWACC?: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const timestamp = () => `[${new Date().toISOString()}]`;
    console.log(`${timestamp()} Validator: Starting validation for ${companyType} company`);
    
    // Validate structure
    if (!parameters || !parameters.scenarios) {
      errors.push({
        field: 'parameters',
        value: parameters,
        message: 'Missing parameters or scenarios structure',
        severity: 'critical'
      });
      return {
        isValid: false,
        errors,
        warnings,
        summary: 'Critical structure validation failure'
      };
    }
    
    // Validate each scenario
    const scenarios = ['conservative', 'base', 'optimistic'] as const;
    for (const scenario of scenarios) {
      if (!parameters.scenarios[scenario]) {
        errors.push({
          field: `scenarios.${scenario}`,
          value: null,
          message: `Missing ${scenario} scenario`,
          severity: 'critical'
        });
        continue;
      }
      
      const scenarioParams = parameters.scenarios[scenario];
      this.validateScenarioParameters(
        scenarioParams, 
        scenario, 
        companyType, 
        errors, 
        warnings,
        marketWACC
      );
    }
    
    // Cross-scenario validation
    if (parameters.scenarios.conservative && parameters.scenarios.base && parameters.scenarios.optimistic) {
      this.validateScenarioConsistency(parameters.scenarios, errors, warnings);
    }
    
    const isValid = errors.length === 0;
    const summary = this.generateValidationSummary(errors, warnings);
    
    console.log(`${timestamp()} Validator: Validation complete - ${errors.length} errors, ${warnings.length} warnings`);
    
    return { isValid, errors, warnings, summary };
  }
  
  /**
   * Validate DCF inputs before calculation
   */
  validateDCFInputs(inputs: DCFInputs): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const timestamp = () => `[${new Date().toISOString()}]`;
    console.log(`${timestamp()} Validator: Validating DCF inputs for ${inputs.variant} variant`);
    
    // Common validations
    this.validateCommonInputs(inputs, errors, warnings);
    
    // Variant-specific validations
    switch (inputs.variant) {
      case 'full_dcf':
        if (isFullDCFInputs(inputs)) {
          this.validateFullDCFInputs(inputs, errors, warnings);
        }
        break;
      case 'simplified_dcf':
        if (isSimplifiedDCFInputs(inputs)) {
          this.validateSimplifiedDCFInputs(inputs, errors, warnings);
        }
        break;
      case 'forward_looking_dcf':
        if (isForwardLookingDCFInputs(inputs)) {
          this.validateForwardLookingInputs(inputs, errors, warnings);
        }
        break;
    }
    
    const isValid = errors.length === 0;
    const summary = this.generateValidationSummary(errors, warnings);
    
    return { isValid, errors, warnings, summary };
  }
  
  private validateScenarioParameters(
    params: ExtractedParameterScenario,
    scenario: string,
    companyType: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    marketWACC?: number
  ): void {
    // Required fields validation
    this.validateRequiredFields(params, scenario, companyType, errors);
    
    // Revenue growth rates
    if (params.revenueGrowthRates) {
      this.validateGrowthRates(params.revenueGrowthRates, `${scenario}.revenueGrowthRates`, errors, warnings);
    }
    
    // Operating margins
    if (params.operatingMargins) {
      this.validateMargins(params.operatingMargins, `${scenario}.operatingMargins`, errors, warnings);
    }
    
    // WACC validation
    if (params.wacc !== undefined) {
      this.validateWACC(params.wacc, `${scenario}.wacc`, errors, warnings, marketWACC);
      
      // Terminal growth must be less than WACC
      if (params.terminalGrowthRate !== undefined && params.terminalGrowthRate >= params.wacc) {
        errors.push({
          field: `${scenario}.terminalGrowthRate`,
          value: params.terminalGrowthRate,
          message: `Terminal growth rate (${(params.terminalGrowthRate * 100).toFixed(1)}%) must be less than WACC (${(params.wacc * 100).toFixed(1)}%)`,
          severity: 'error'
        });
      }
    }
    
    // Terminal growth rate
    if (params.terminalGrowthRate !== undefined) {
      this.validateTerminalGrowth(params.terminalGrowthRate, `${scenario}.terminalGrowthRate`, errors, warnings);
    }
    
    // Current revenue
    if (params.currentRevenue !== undefined) {
      this.validateRevenue(params.currentRevenue, `${scenario}.currentRevenue`, errors, warnings);
    }
    
    // Tax rate
    if (params.taxRate !== undefined) {
      this.validateTaxRate(params.taxRate, `${scenario}.taxRate`, errors, warnings);
    }
    
    // Company type specific validations
    this.validateCompanyTypeSpecific(params, scenario, companyType, errors, warnings);
  }
  
  private validateRequiredFields(
    params: ExtractedParameterScenario,
    scenario: string,
    companyType: string,
    errors: ValidationError[]
  ): void {
    const requiredFields = [
      'revenueGrowthRates',
      'operatingMargins',
      'capexAsPercentOfRevenue',
      'workingCapitalChangeRates',
      'terminalGrowthRate',
      'wacc',
      'currentRevenue',
      'taxRate'
    ];
    
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null) {
        errors.push({
          field: `${scenario}.${field}`,
          value: undefined,
          message: `Missing required field: ${field}`,
          severity: 'critical'
        });
      }
    }
    
    // Check array lengths
    const arrayFields = [
      'revenueGrowthRates',
      'operatingMargins',
      'capexAsPercentOfRevenue',
      'workingCapitalChangeRates'
    ];
    
    for (const field of arrayFields) {
      const array = params[field];
      if (Array.isArray(array) && array.length !== 5) {
        errors.push({
          field: `${scenario}.${field}`,
          value: array,
          message: `Expected 5 values for ${field}, got ${array.length}`,
          severity: 'error'
        });
      }
    }
  }
  
  private validateGrowthRates(
    rates: number[],
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (let i = 0; i < rates.length; i++) {
      const rate = rates[i];
      
      if (rate > this.MAX_GROWTH_RATE) {
        errors.push({
          field: `${field}[${i}]`,
          value: rate,
          message: `Growth rate ${(rate * 100).toFixed(1)}% exceeds maximum of ${(this.MAX_GROWTH_RATE * 100)}%`,
          severity: 'error'
        });
      } else if (rate < this.MIN_GROWTH_RATE) {
        errors.push({
          field: `${field}[${i}]`,
          value: rate,
          message: `Growth rate ${(rate * 100).toFixed(1)}% below minimum of ${(this.MIN_GROWTH_RATE * 100)}%`,
          severity: 'error'
        });
      } else if (rate > 0.5) {
        warnings.push({
          field: `${field}[${i}]`,
          value: rate,
          message: `Growth rate ${(rate * 100).toFixed(1)}% seems very high`,
          suggestion: 'Consider if this growth rate is sustainable'
        });
      }
      
      // Check for declining growth pattern (common best practice)
      if (i > 0 && rate > rates[i - 1] * 1.2) {
        warnings.push({
          field: `${field}[${i}]`,
          value: rate,
          message: `Growth rate increases significantly from year ${i} to ${i + 1}`,
          suggestion: 'Growth rates typically decline over time'
        });
      }
    }
  }
  
  private validateMargins(
    margins: number[],
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (let i = 0; i < margins.length; i++) {
      const margin = margins[i];
      
      if (margin > this.MAX_MARGIN) {
        errors.push({
          field: `${field}[${i}]`,
          value: margin,
          message: `Margin ${(margin * 100).toFixed(1)}% exceeds maximum of ${(this.MAX_MARGIN * 100)}%`,
          severity: 'error'
        });
      } else if (margin < this.MIN_MARGIN) {
        warnings.push({
          field: `${field}[${i}]`,
          value: margin,
          message: `Negative margin ${(margin * 100).toFixed(1)}% indicates losses`,
          suggestion: 'Ensure path to profitability is realistic'
        });
      } else if (margin > 0.35) {
        warnings.push({
          field: `${field}[${i}]`,
          value: margin,
          message: `Margin ${(margin * 100).toFixed(1)}% is very high`,
          suggestion: 'Verify margin sustainability with industry benchmarks'
        });
      }
    }
  }
  
  private validateWACC(
    wacc: number,
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    marketWACC?: number
  ): void {
    if (wacc > this.MAX_WACC) {
      errors.push({
        field,
        value: wacc,
        message: `WACC ${(wacc * 100).toFixed(1)}% exceeds maximum of ${(this.MAX_WACC * 100)}%`,
        severity: 'error'
      });
    } else if (wacc < this.MIN_WACC) {
      errors.push({
        field,
        value: wacc,
        message: `WACC ${(wacc * 100).toFixed(1)}% below minimum of ${(this.MIN_WACC * 100)}%`,
        severity: 'error'
      });
    }
    
    // Compare with market WACC if available
    if (marketWACC !== undefined) {
      const deviation = Math.abs(wacc - marketWACC) / marketWACC;
      if (deviation > 0.3) {
        warnings.push({
          field,
          value: wacc,
          message: `WACC ${(wacc * 100).toFixed(1)}% deviates significantly from market WACC ${(marketWACC * 100).toFixed(1)}%`,
          suggestion: 'Consider using market-based WACC for consistency'
        });
      }
    }
  }
  
  private validateTerminalGrowth(
    rate: number,
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (rate > this.MAX_TERMINAL_GROWTH) {
      errors.push({
        field,
        value: rate,
        message: `Terminal growth ${(rate * 100).toFixed(1)}% exceeds maximum of ${(this.MAX_TERMINAL_GROWTH * 100)}%`,
        severity: 'error'
      });
    } else if (rate < this.MIN_TERMINAL_GROWTH) {
      warnings.push({
        field,
        value: rate,
        message: `Negative terminal growth ${(rate * 100).toFixed(1)}% implies long-term decline`,
        suggestion: 'Consider if long-term decline is realistic'
      });
    } else if (rate > 0.035) {
      warnings.push({
        field,
        value: rate,
        message: `Terminal growth ${(rate * 100).toFixed(1)}% is above typical GDP growth`,
        suggestion: 'Terminal growth typically should not exceed long-term GDP growth (2-3%)'
      });
    }
  }
  
  private validateRevenue(
    revenue: number,
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (revenue <= 0) {
      errors.push({
        field,
        value: revenue,
        message: 'Current revenue must be positive',
        severity: 'critical'
      });
    } else if (revenue < 100000) {
      warnings.push({
        field,
        value: revenue,
        message: 'Revenue seems very low',
        suggestion: 'Verify revenue is in correct currency units'
      });
    } else if (revenue > 1000000000000) { // 1 trillion
      warnings.push({
        field,
        value: revenue,
        message: 'Revenue seems extremely high',
        suggestion: 'Verify revenue is in correct currency units'
      });
    }
  }
  
  private validateTaxRate(
    rate: number,
    field: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (rate < this.MIN_TAX_RATE || rate > this.MAX_TAX_RATE) {
      errors.push({
        field,
        value: rate,
        message: `Tax rate ${(rate * 100).toFixed(1)}% must be between 0% and 50%`,
        severity: 'error'
      });
    } else if (rate < 0.15) {
      warnings.push({
        field,
        value: rate,
        message: `Tax rate ${(rate * 100).toFixed(1)}% seems low`,
        suggestion: 'Verify tax rate with local regulations'
      });
    }
  }
  
  private validateCompanyTypeSpecific(
    params: ExtractedParameterScenario,
    scenario: string,
    companyType: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (companyType) {
      case 'saas':
        this.validateSaaSMetrics(params, scenario, errors, warnings);
        break;
      case 'traditional':
        this.validateTraditionalMetrics(params, scenario, errors, warnings);
        break;
      case 'growth':
        this.validateGrowthMetrics(params, scenario, errors, warnings);
        break;
      case 'mature':
        this.validateMatureMetrics(params, scenario, errors, warnings);
        break;
    }
  }
  
  private validateSaaSMetrics(
    params: ExtractedParameterScenario,
    scenario: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Churn rates
    if (params.churnRates) {
      for (let i = 0; i < params.churnRates.length; i++) {
        const churn = params.churnRates[i];
        if (churn > 0.3) {
          warnings.push({
            field: `${scenario}.churnRates[${i}]`,
            value: churn,
            message: `Churn rate ${(churn * 100).toFixed(1)}% is very high for SaaS`,
            suggestion: 'High churn may indicate product-market fit issues'
          });
        }
      }
    }
    
    // Recurring revenue percentage
    if (params.recurringRevenuePercentage !== undefined && params.recurringRevenuePercentage < 0.7) {
      warnings.push({
        field: `${scenario}.recurringRevenuePercentage`,
        value: params.recurringRevenuePercentage,
        message: `Recurring revenue ${(params.recurringRevenuePercentage * 100).toFixed(1)}% is low for SaaS`,
        suggestion: 'SaaS businesses typically have >80% recurring revenue'
      });
    }
  }
  
  private validateTraditionalMetrics(
    params: ExtractedParameterScenario,
    scenario: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Inventory turnover
    if (params.inventoryTurnover) {
      for (let i = 0; i < params.inventoryTurnover.length; i++) {
        const turnover = params.inventoryTurnover[i];
        if (turnover < 2) {
          warnings.push({
            field: `${scenario}.inventoryTurnover[${i}]`,
            value: turnover,
            message: `Low inventory turnover ${turnover.toFixed(1)}x may indicate excess inventory`,
            suggestion: 'Consider inventory management improvements'
          });
        }
      }
    }
    
    // Cash conversion cycle
    if (params.daysInventoryOutstanding && params.daysReceivablesOutstanding && params.daysPayablesOutstanding) {
      const lastYear = params.daysInventoryOutstanding.length - 1;
      const ccc = params.daysInventoryOutstanding[lastYear] + 
                  params.daysReceivablesOutstanding[lastYear] - 
                  params.daysPayablesOutstanding[lastYear];
      
      if (ccc > 90) {
        warnings.push({
          field: `${scenario}.cashConversionCycle`,
          value: ccc,
          message: `Cash conversion cycle ${ccc.toFixed(0)} days is high`,
          suggestion: 'Long cash cycles may strain working capital'
        });
      }
    }
  }
  
  private validateGrowthMetrics(
    params: ExtractedParameterScenario,
    scenario: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // R&D expense
    if (params.researchAndDevelopmentExpense) {
      const avgRD = params.researchAndDevelopmentExpense.reduce((a, b) => a + b, 0) / params.researchAndDevelopmentExpense.length;
      if (avgRD < 0.05) {
        warnings.push({
          field: `${scenario}.researchAndDevelopmentExpense`,
          value: avgRD,
          message: `Low R&D spend ${(avgRD * 100).toFixed(1)}% for growth company`,
          suggestion: 'Growth companies typically invest heavily in R&D'
        });
      }
    }
    
    // Customer growth vs revenue growth consistency
    if (params.customerGrowthRates && params.revenueGrowthRates) {
      for (let i = 0; i < Math.min(params.customerGrowthRates.length, params.revenueGrowthRates.length); i++) {
        const customerGrowth = params.customerGrowthRates[i];
        const revenueGrowth = params.revenueGrowthRates[i];
        
        if (Math.abs(customerGrowth - revenueGrowth) > 0.2) {
          warnings.push({
            field: `${scenario}.growthConsistency[${i}]`,
            value: { customerGrowth, revenueGrowth },
            message: 'Large gap between customer and revenue growth',
            suggestion: 'Ensure ARPU assumptions are realistic'
          });
        }
      }
    }
  }
  
  private validateMatureMetrics(
    params: ExtractedParameterScenario,
    scenario: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Dividend payout ratio
    if (params.dividendPayoutRatio !== undefined) {
      if (params.dividendPayoutRatio > 0.8) {
        warnings.push({
          field: `${scenario}.dividendPayoutRatio`,
          value: params.dividendPayoutRatio,
          message: `High dividend payout ${(params.dividendPayoutRatio * 100).toFixed(1)}% may limit growth`,
          suggestion: 'Ensure sufficient retained earnings for investment'
        });
      }
    }
    
    // Market share stability
    if (params.marketShareStability) {
      const avgStability = params.marketShareStability.reduce((a, b) => a + b, 0) / params.marketShareStability.length;
      if (avgStability < 0.9) {
        warnings.push({
          field: `${scenario}.marketShareStability`,
          value: avgStability,
          message: `Market share erosion expected`,
          suggestion: 'Consider competitive threats and mitigation strategies'
        });
      }
    }
  }
  
  private validateScenarioConsistency(
    scenarios: ExtractedParameters['scenarios'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Conservative should be worse than base
    if (scenarios.conservative.wacc && scenarios.base.wacc && scenarios.conservative.wacc < scenarios.base.wacc) {
      warnings.push({
        field: 'scenario.consistency',
        value: { conservative: scenarios.conservative.wacc, base: scenarios.base.wacc },
        message: 'Conservative WACC should typically be higher than base',
        suggestion: 'Higher WACC reflects higher risk in conservative scenario'
      });
    }
    
    // Optimistic should be better than base
    if (scenarios.optimistic.terminalGrowthRate && scenarios.base.terminalGrowthRate && 
        scenarios.optimistic.terminalGrowthRate < scenarios.base.terminalGrowthRate) {
      warnings.push({
        field: 'scenario.consistency',
        value: { optimistic: scenarios.optimistic.terminalGrowthRate, base: scenarios.base.terminalGrowthRate },
        message: 'Optimistic terminal growth should be higher than base',
        suggestion: 'Ensure scenario assumptions are internally consistent'
      });
    }
  }
  
  private validateCommonInputs(
    inputs: DCFInputs,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Company name
    if (!inputs.companyName || inputs.companyName.trim().length === 0) {
      errors.push({
        field: 'companyName',
        value: inputs.companyName,
        message: 'Company name is required',
        severity: 'error'
      });
    }
    
    // Base year
    const currentYear = new Date().getFullYear();
    if (inputs.baseYear < currentYear - 5 || inputs.baseYear > currentYear + 1) {
      warnings.push({
        field: 'baseYear',
        value: inputs.baseYear,
        message: `Base year ${inputs.baseYear} seems unusual`,
        suggestion: `Consider using current year ${currentYear}`
      });
    }
    
    // Projection years
    if (inputs.projectionYears < 3 || inputs.projectionYears > 10) {
      warnings.push({
        field: 'projectionYears',
        value: inputs.projectionYears,
        message: `Projection period ${inputs.projectionYears} years is unusual`,
        suggestion: 'Typical DCF uses 5-7 year projections'
      });
    }
    
    // Net debt
    if (inputs.netDebt < 0) {
      warnings.push({
        field: 'netDebt',
        value: inputs.netDebt,
        message: 'Negative net debt indicates net cash position',
        suggestion: 'Verify cash and debt amounts are correct'
      });
    }
    
    // Tax rate
    if (inputs.taxRate !== undefined) {
      this.validateTaxRate(inputs.taxRate, 'taxRate', errors, warnings);
    }
  }
  
  private validateFullDCFInputs(
    inputs: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Historical data validation
    if (!inputs.historicalData) {
      errors.push({
        field: 'historicalData',
        value: null,
        message: 'Historical data required for full DCF',
        severity: 'critical'
      });
      return;
    }
    
    const { revenue, ebitda, capex, workingCapitalChange, periods } = inputs.historicalData;
    
    // Check array lengths match periods
    if (revenue.length !== periods) {
      errors.push({
        field: 'historicalData.revenue',
        value: revenue,
        message: `Revenue array length ${revenue.length} doesn't match periods ${periods}`,
        severity: 'error'
      });
    }
    
    // Validate historical revenue trend
    if (revenue.length >= 2) {
      const cagr = this.calculateCAGR(revenue);
      if (cagr < -0.2) {
        warnings.push({
          field: 'historicalData.revenue',
          value: cagr,
          message: `Historical revenue declining at ${(cagr * 100).toFixed(1)}% CAGR`,
          suggestion: 'Ensure turnaround assumptions are realistic'
        });
      }
    }
    
    // Validate market data
    if (!inputs.marketData) {
      errors.push({
        field: 'marketData',
        value: null,
        message: 'Market data required for full DCF',
        severity: 'critical'
      });
    } else {
      this.validateWACC(inputs.marketData.wacc, 'marketData.wacc', errors, warnings);
      this.validateTerminalGrowth(inputs.marketData.terminalGrowth, 'marketData.terminalGrowth', errors, warnings);
    }
  }
  
  private validateSimplifiedDCFInputs(
    inputs: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Limited historical data
    if (!inputs.limitedHistoricalData) {
      errors.push({
        field: 'limitedHistoricalData',
        value: null,
        message: 'Limited historical data required for simplified DCF',
        severity: 'critical'
      });
      return;
    }
    
    // Benchmark data validation
    if (!inputs.benchmarkData) {
      errors.push({
        field: 'benchmarkData',
        value: null,
        message: 'Benchmark data required for simplified DCF',
        severity: 'critical'
      });
    } else {
      // Validate benchmark weight
      if (inputs.benchmarkData.benchmarkWeight > 0.8) {
        warnings.push({
          field: 'benchmarkData.benchmarkWeight',
          value: inputs.benchmarkData.benchmarkWeight,
          message: 'High reliance on benchmarks',
          suggestion: 'Consider if company-specific adjustments are needed'
        });
      }
    }
  }
  
  private validateForwardLookingInputs(
    inputs: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Startup metrics validation
    if (!inputs.startupMetrics) {
      errors.push({
        field: 'startupMetrics',
        value: null,
        message: 'Startup metrics required for forward-looking DCF',
        severity: 'critical'
      });
      return;
    }
    
    // Burn rate vs runway consistency
    if (inputs.startupMetrics.burnRate && inputs.startupMetrics.runwayMonths) {
      if (inputs.startupMetrics.runwayMonths < 12) {
        warnings.push({
          field: 'startupMetrics.runwayMonths',
          value: inputs.startupMetrics.runwayMonths,
          message: 'Less than 12 months runway',
          suggestion: 'Consider funding risk in valuation'
        });
      }
    }
    
    // Market analysis validation
    if (!inputs.marketAnalysis) {
      errors.push({
        field: 'marketAnalysis',
        value: null,
        message: 'Market analysis required for forward-looking DCF',
        severity: 'critical'
      });
    } else {
      // TAM/SAM relationship
      if (inputs.marketAnalysis.serviceableAddressableMarket > inputs.marketAnalysis.totalAddressableMarket) {
        errors.push({
          field: 'marketAnalysis',
          value: inputs.marketAnalysis,
          message: 'SAM cannot exceed TAM',
          severity: 'error'
        });
      }
      
      // Market share assumptions
      const targetShares = inputs.marketAnalysis.targetMarketShare;
      if (targetShares && targetShares.length > 0) {
        const finalShare = targetShares[targetShares.length - 1];
        if (finalShare > 0.2) {
          warnings.push({
            field: 'marketAnalysis.targetMarketShare',
            value: finalShare,
            message: `Target market share ${(finalShare * 100).toFixed(1)}% seems aggressive`,
            suggestion: 'Consider competitive dynamics and barriers to entry'
          });
        }
      }
    }
    
    // Venture adjustments
    if (inputs.ventureAdjustments) {
      if (inputs.ventureAdjustments.failureProbability > 0.5) {
        warnings.push({
          field: 'ventureAdjustments.failureProbability',
          value: inputs.ventureAdjustments.failureProbability,
          message: 'High failure probability significantly impacts valuation',
          suggestion: 'Consider using probability-weighted scenarios'
        });
      }
    }
  }
  
  private calculateCAGR(values: number[]): number {
    if (values.length < 2 || values[0] <= 0 || values[values.length - 1] <= 0) {
      return 0;
    }
    
    const periods = values.length - 1;
    const startValue = values[0];
    const endValue = values[values.length - 1];
    
    return Math.pow(endValue / startValue, 1 / periods) - 1;
  }
  
  private generateValidationSummary(errors: ValidationError[], warnings: ValidationWarning[]): string {
    if (errors.length === 0 && warnings.length === 0) {
      return 'Validation passed with no issues';
    }
    
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const regularErrors = errors.filter(e => e.severity === 'error').length;
    
    let summary = '';
    
    if (criticalErrors > 0) {
      summary += `${criticalErrors} critical error(s) found. `;
    }
    
    if (regularErrors > 0) {
      summary += `${regularErrors} error(s) found. `;
    }
    
    if (warnings.length > 0) {
      summary += `${warnings.length} warning(s) found. `;
    }
    
    if (errors.length > 0) {
      summary += 'Please fix errors before proceeding.';
    } else {
      summary += 'Review warnings and proceed with caution.';
    }
    
    return summary.trim();
  }
}

// Export singleton instance for convenience
export const dcfValidator = new DCFValidator();