import { 
  DCFInputs, 
  DCFVariant, 
  ScenarioType as DCFScenario,
  AnnualProjection as ProjectionYear,
  isFullDCFInputs,
  isSimplifiedDCFInputs,
  isForwardLookingDCFInputs
} from './calculation-types.ts';

export interface DCFResult {
  valuations: {
    [key in DCFScenario]: number;
  };
  projections: {
    [key in DCFScenario]: ProjectionYear[];
  };
}

export class DCFCalculator {
  private input: DCFInputs;
  private variant: DCFVariant;
  private readonly timestamp = () => `[${new Date().toISOString()}]`;
  
  constructor(input: DCFInputs, variant: DCFVariant) {
    this.input = input;
    this.variant = variant;
    console.log(`${this.timestamp()} DCF Calculator: Initialized for ${variant} variant`);
    
    // Basic validation in constructor
    if (!input) {
      throw new Error('DCF Calculator: Input cannot be null or undefined');
    }
    
    if (!variant) {
      throw new Error('DCF Calculator: Variant cannot be null or undefined');
    }
  }

  calculate(): DCFResult {
    console.log(`${this.timestamp()} DCF Calculator: Starting calculation for ${this.variant} variant`);
    
    try {
      const scenarios: DCFScenario[] = ['pessimistic', 'base', 'optimistic'];
      const results: DCFResult = {
        valuations: {},
        projections: {}
      };

      for (const scenario of scenarios) {
        console.log(`${this.timestamp()} DCF Calculator: Processing ${scenario} scenario`);
        
        try {
          // Calculate projections
          const projections = this.calculateProjections(scenario);
          results.projections[scenario] = projections;
          
          // Validate projections
          if (!projections || projections.length === 0) {
            throw new Error(`No projections generated for ${scenario} scenario`);
          }
          
          // Calculate terminal value
          const terminalValue = this.calculateTerminalValue(projections, scenario);
          console.log(`${this.timestamp()} DCF Calculator: Terminal value for ${scenario}: ${terminalValue.toFixed(2)}`);
          
          // Validate terminal value
          if (!isFinite(terminalValue)) {
            throw new Error(`Invalid terminal value for ${scenario}: ${terminalValue}`);
          }
          
          // Calculate NPV
          const npv = this.calculateNPV(projections, terminalValue);
          
          // Apply DLOM (Discount for Lack of Marketability) for private companies
          // Pk-yritykset eivät ole likvidejä sijoituksia -> tarvitaan alennus
          const dlom = this.variant === 'forward_looking_dcf' ? 0.30 : 0.20; // 30% startups, 20% muut
          const adjustedNPV = npv * (1 - dlom);
          
          console.log(`${this.timestamp()} DCF Calculator: Applied DLOM of ${(dlom * 100).toFixed(0)}% for private company`);
          console.log(`${this.timestamp()} DCF Calculator: NPV before DLOM: ${npv.toFixed(0)}, after DLOM: ${adjustedNPV.toFixed(0)}`);
          
          results.valuations[scenario] = adjustedNPV;
          
          // Validate NPV
          if (!isFinite(adjustedNPV)) {
            throw new Error(`Invalid NPV for ${scenario}: ${adjustedNPV}`);
          }
          
          console.log(`${this.timestamp()} DCF Calculator: Final NPV for ${scenario}: ${adjustedNPV.toFixed(2)}`);
          
        } catch (error) {
          console.error(`${this.timestamp()} DCF Calculator: Error in ${scenario} scenario:`, error);
          throw new Error(`Calculation failed for ${scenario} scenario: ${error.message}`);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error(`${this.timestamp()} DCF Calculator: Fatal error in calculation:`, error);
      throw error;
    }
  }

  private calculateProjections(scenario: DCFScenario): ProjectionYear[] {
    console.log(`${this.timestamp()} DCF Calculator: Calculating projections for ${scenario} scenario`);
    
    const projections: ProjectionYear[] = [];
    const years = this.getProjectionYears();
    
    let previousRevenue = this.getCurrentRevenue();
    let previousWorkingCapital = this.getCurrentWorkingCapital();
    
    // Validate starting values
    if (previousRevenue <= 0) {
      throw new Error(`Invalid starting revenue: ${previousRevenue}`);
    }
    
    if (!isFinite(previousRevenue)) {
      throw new Error(`Non-finite starting revenue: ${previousRevenue}`);
    }
    
    for (let i = 0; i < years; i++) {
      const year = new Date().getFullYear() + i + 1;
      
      // Calculate revenue based on variant
      const revenue = this.calculateRevenue(previousRevenue, i, scenario);
      
      // Validate revenue is positive
      if (revenue <= 0) {
        throw new Error(`Invalid revenue calculation for year ${year}: ${revenue}`);
      }
      
      // Calculate EBITDA
      const ebitdaMargin = this.getEbitdaMargin(i, scenario);
      const ebitda = revenue * ebitdaMargin;
      
      // Calculate additional fields for AnnualProjection
      const revenueGrowth = i === 0 ? 
        this.getInitialGrowthRate(scenario) : 
        (revenue / previousRevenue - 1);
      
      // More accurate EBIT calculation
      const depreciation = revenue * 0.02; // 2% of revenue as default
      const ebit = ebitda - depreciation;
      
      // Tax calculation with proper handling of negative EBIT
      const tax = ebit > 0 ? ebit * (this.input.taxRate || 0.25) : 0;
      const nopat = ebit - tax;
      
      // CapEx calculation
      const capex = revenue * this.getCapexRate();
      
      // Working Capital calculation - CHANGE not absolute value
      // Käytämme toimialakohtaista WC-tasoa pk-yrityksille
      const wcRate = this.getWorkingCapitalRate(scenario);
      const currentWorkingCapital = revenue * wcRate;
      const workingCapitalChange = currentWorkingCapital - previousWorkingCapital;
      
      // Dokumentoi WC-laskennan logiikka
      if (i === 0) {
        console.log(`${this.timestamp()} DCF Calculator: Using WC rate of ${(wcRate * 100).toFixed(1)}% for ${scenario} scenario`);
      }
      
      // FCF = NOPAT + Depreciation - CapEx - WC Change
      const fcf = nopat + depreciation - capex - workingCapitalChange;
      
      // Calculate present value
      const discountFactor = Math.pow(1 + this.getWACC(), i + 1);
      const presentValue = fcf / discountFactor;
      
      projections.push({
        year,
        revenue,
        revenueGrowth,
        ebitda,
        ebitdaMargin,
        ebit,
        tax,
        nopat,
        capex,
        workingCapitalChange,
        freeCashFlow: fcf,
        discountFactor,
        presentValue
      });
      
      previousRevenue = revenue;
      previousWorkingCapital = currentWorkingCapital;
      
      // Validate calculated values
      if (!isFinite(revenue) || !isFinite(fcf) || !isFinite(presentValue)) {
        throw new Error(`Invalid calculation for year ${year}: revenue=${revenue}, fcf=${fcf}, pv=${presentValue}`);
      }
      
      console.log(`${this.timestamp()} DCF Calculator: Year ${year}: Revenue=${revenue.toFixed(0)}, WC Change=${workingCapitalChange.toFixed(0)}, FCF=${fcf.toFixed(0)}, PV=${presentValue.toFixed(0)}`);
    }
    
    return projections;
  }

  private calculateRevenue(baseRevenue: number, yearIndex: number, scenario: DCFScenario): number {
    let growthRate: number;
    
    if (this.variant === 'full_dcf' && isFullDCFInputs(this.input)) {
      // Full variant: Use historical CAGR if available
      growthRate = this.calculateHistoricalCAGR() || this.getDefaultGrowthRate(scenario);
      
      // Apply scenario adjustments
      const scenarioMultiplier = scenario === 'pessimistic' ? 0.8 : scenario === 'optimistic' ? 1.2 : 1.0;
      growthRate *= scenarioMultiplier;
    } else if (this.variant === 'simplified_dcf' && isSimplifiedDCFInputs(this.input)) {
      // Use industry benchmarks for simplified DCF
      const industryGrowth = this.input.benchmarkData.industryGrowthRate;
      
      // For simplified variant, calculate proper compound growth
      if (yearIndex === 0) {
        growthRate = industryGrowth;
      } else {
        // Apply decay factor for more realistic projections
        const decayFactor = 0.9; // Growth rate decays by 10% each year
        growthRate = industryGrowth * Math.pow(decayFactor, yearIndex);
      }
      
      // Adjust for scenario
      const scenarioMultiplier = scenario === 'pessimistic' ? 0.7 : scenario === 'optimistic' ? 1.3 : 1.0;
      growthRate *= scenarioMultiplier;
    } else {
      // Forward-looking: Use market analysis with declining growth
      const initialGrowth = 0.25; // Higher initial growth for startups
      const decayRate = 0.85; // Growth decays faster for startups
      
      growthRate = initialGrowth * Math.pow(decayRate, yearIndex);
      
      const scenarioAdjustment = scenario === 'pessimistic' ? -0.05 : scenario === 'optimistic' ? 0.05 : 0;
      growthRate += scenarioAdjustment;
    }
    
    // Ensure growth rate is reasonable
    growthRate = Math.max(-0.50, Math.min(growthRate, 1.0)); // Between -50% and 100%
    
    // Calculate year-over-year growth (not cumulative!)
    // baseRevenue on JO edellisen vuoden revenue, joten käytä vain yhden vuoden kasvua
    const newRevenue = baseRevenue * (1 + growthRate);
    
    // Validate calculated revenue
    if (!isFinite(newRevenue) || newRevenue <= 0) {
      console.error(`${this.timestamp()} DCF Calculator: Invalid revenue calculation: base=${baseRevenue}, growth=${growthRate}, year=${yearIndex}`);
      throw new Error(`Invalid revenue calculation for year ${yearIndex + 1}`);
    }
    
    return newRevenue;
  }

  private getEbitdaMargin(yearIndex: number, scenario: DCFScenario): number {
    const baseMargin = this.getCurrentEbitdaMargin();
    const targetMargin = this.getTargetEbitdaMargin();
    
    // Handle negative base margins
    if (baseMargin < 0) {
      // For negative margins, project path to profitability
      const yearsToBreakeven = 3; // Assume 3 years to breakeven
      if (yearIndex < yearsToBreakeven) {
        // Linear improvement to 0
        const improvement = baseMargin * ((yearsToBreakeven - yearIndex) / yearsToBreakeven);
        return baseMargin - improvement; // Gets less negative
      }
    }
    
    // Gradual improvement over time with S-curve
    const years = this.getProjectionYears();
    const progress = yearIndex / years;
    
    // S-curve formula for more realistic margin expansion
    const sCurveProgress = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
    const improvement = (targetMargin - Math.max(baseMargin, 0)) * sCurveProgress;
    
    // Scenario adjustments
    const scenarioAdjustment = scenario === 'pessimistic' ? -0.02 : scenario === 'optimistic' ? 0.02 : 0;
    
    const projectedMargin = Math.max(baseMargin, 0) + improvement + scenarioAdjustment;
    
    // Ensure margin is within reasonable bounds (-20% to 50%)
    return Math.min(Math.max(projectedMargin, -0.20), 0.50);
  }

  // This method is no longer needed as FCF calculation is now done in calculateProjections

  private calculateTerminalValue(projections: ProjectionYear[], scenario: DCFScenario): number {
    if (!projections || projections.length === 0) {
      throw new Error('Cannot calculate terminal value without projections');
    }
    
    const lastProjection = projections[projections.length - 1];
    if (!lastProjection) {
      throw new Error('Invalid last projection');
    }
    
    const terminalGrowth = this.getTerminalGrowthRate(scenario);
    const wacc = this.getWACC();
    
    // Validate terminal growth rate
    if (terminalGrowth >= wacc) {
      console.warn(`${this.timestamp()} DCF Calculator: Terminal growth rate (${terminalGrowth}) must be less than WACC (${wacc}). Adjusting to ${wacc - 0.01}`);
      const adjustedGrowth = wacc - 0.01;
      return this.calculateTerminalValueWithGrowth(lastProjection, adjustedGrowth, wacc);
    }
    
    // Ensure terminal growth is reasonable (typically 2-3%)
    if (terminalGrowth > 0.05) {
      console.warn(`[DCF Calculator] Terminal growth rate (${terminalGrowth}) seems high. Consider using 2-3%`);
    }
    
    return this.calculateTerminalValueWithGrowth(lastProjection, terminalGrowth, wacc);
  }
  
  private calculateTerminalValueWithGrowth(lastProjection: ProjectionYear, growth: number, wacc: number): number {
    // Normalize FCF for terminal value (remove one-time effects)
    let normalizedFCF = lastProjection.freeCashFlow;
    
    // If FCF is negative, use a normalized estimate
    if (normalizedFCF < 0) {
      // Use NOPAT as a proxy with sustainable capex and WC
      const sustainableCapexRate = 0.03; // Maintenance capex
      const sustainableWCRate = 0.01; // Minimal WC growth
      normalizedFCF = lastProjection.nopat - 
                     (lastProjection.revenue * sustainableCapexRate) - 
                     (lastProjection.revenue * sustainableWCRate * growth);
      
      console.log(`${this.timestamp()} DCF Calculator: Normalized negative FCF from ${lastProjection.freeCashFlow} to ${normalizedFCF}`);
    }
    
    // Terminal FCF
    const terminalFCF = normalizedFCF * (1 + growth);
    
    // Terminal value using perpetuity formula
    const terminalValue = terminalFCF / (wacc - growth);
    
    // Sanity check
    if (terminalValue < 0) {
      console.warn(`${this.timestamp()} DCF Calculator: Negative terminal value calculated. This indicates structural profitability issues.`);
    }
    
    if (!isFinite(terminalValue)) {
      throw new Error(`Non-finite terminal value: FCF=${terminalFCF}, growth=${growth}, WACC=${wacc}`);
    }
    
    return terminalValue;
  }

  private calculateNPV(projections: ProjectionYear[], terminalValue: number): number {
    // Sum of PV of FCFs
    const pvOfFCFs = projections.reduce((sum, p) => sum + p.presentValue, 0);
    
    // PV of terminal value
    const years = projections.length;
    const pvOfTerminalValue = terminalValue / Math.pow(1 + this.getWACC(), years);
    
    // Validate calculations
    if (!isFinite(pvOfFCFs)) {
      throw new Error(`Invalid PV of FCFs: ${pvOfFCFs}`);
    }
    
    if (!isFinite(pvOfTerminalValue)) {
      throw new Error(`Invalid PV of terminal value: ${pvOfTerminalValue}`);
    }
    
    console.log(`${this.timestamp()} DCF Calculator: PV of FCFs: ${pvOfFCFs.toFixed(0)}, PV of Terminal: ${pvOfTerminalValue.toFixed(0)}`);
    
    return pvOfFCFs + pvOfTerminalValue;
  }

  private getProjectionYears(): number {
    return this.variant === 'forward_looking_dcf' ? 7 : 5;
  }

  private getDefaultGrowthRate(scenario: DCFScenario): number {
    const baseGrowth = 0.20;
    return scenario === 'pessimistic' ? baseGrowth * 0.7 : 
           scenario === 'optimistic' ? baseGrowth * 1.3 : 
           baseGrowth;
  }

  private getTerminalGrowthRate(scenario: DCFScenario): number {
    // Terminal growth ei saa ylittää pitkän aikavälin BKT-kasvua
    // Pk-yrityksille käytetään konservatiivisempaa maksimia
    const maxTerminalGrowth = 0.025; // 2.5% max pk-yrityksille (EU GDP ~2%)
    const baseRate = 0.02; // 2% base (ECB inflation target)
    
    let terminalGrowth = scenario === 'pessimistic' ? baseRate - 0.005 : 
                         scenario === 'optimistic' ? baseRate + 0.005 : 
                         baseRate;
    
    // Varmista että ei ylitä maksimia
    terminalGrowth = Math.min(terminalGrowth, maxTerminalGrowth);
    
    // Varmista että terminal growth on riittävästi alle WACC:in
    const wacc = this.getWACC();
    if (terminalGrowth >= wacc - 0.02) {
      console.warn(`${this.timestamp()} DCF Calculator: Terminal growth (${(terminalGrowth * 100).toFixed(1)}%) too close to WACC (${(wacc * 100).toFixed(1)}%)`);
      terminalGrowth = wacc - 0.02; // Varmista vähintään 2% ero
    }
    
    console.log(`${this.timestamp()} DCF Calculator: Terminal growth rate for ${scenario}: ${(terminalGrowth * 100).toFixed(1)}%`);
    
    return terminalGrowth;
  }

  // Helper methods to access variant-specific data
  private getCurrentRevenue(): number {
    if (isFullDCFInputs(this.input)) {
      const revenues = this.input.historicalData.revenue;
      return revenues[revenues.length - 1] || 1000000;
    } else if (isSimplifiedDCFInputs(this.input)) {
      const revenues = this.input.limitedHistoricalData.revenue;
      return revenues[revenues.length - 1] || 1000000;
    } else if (isForwardLookingDCFInputs(this.input)) {
      // For startups, use burn rate or initial revenue estimate
      return 100000; // Default startup revenue
    }
    return 1000000; // Default fallback
  }

  private getCurrentEbitdaMargin(): number {
    if (isFullDCFInputs(this.input)) {
      const revenues = this.input.historicalData.revenue;
      const ebitdas = this.input.historicalData.ebitda;
      if (revenues.length > 0 && ebitdas.length > 0) {
        const lastRevenue = revenues[revenues.length - 1];
        const lastEbitda = ebitdas[ebitdas.length - 1];
        
        // Handle zero revenue edge case
        if (lastRevenue <= 0) {
          console.warn(`${this.timestamp()} DCF Calculator: Zero or negative revenue detected, using default margin`);
          return 0.20;
        }
        
        const margin = lastEbitda / lastRevenue;
        
        // Validate margin
        if (!isFinite(margin)) {
          console.warn(`${this.timestamp()} DCF Calculator: Invalid margin calculation, using default`);
          return 0.20;
        }
        
        return margin;
      }
    } else if (isSimplifiedDCFInputs(this.input)) {
      return this.input.benchmarkData.industryEbitdaMargin;
    } else if (isForwardLookingDCFInputs(this.input)) {
      // Startups often have negative margins initially
      return -0.10; // -10% for early stage
    }
    return 0.20; // Default 20% margin
  }

  private getTargetEbitdaMargin(): number {
    if (isSimplifiedDCFInputs(this.input)) {
      return this.input.benchmarkData.industryEbitdaMargin * 1.2; // 20% improvement
    }
    return 0.30; // Default target of 30%
  }

  private getWACC(): number {
    let wacc: number;
    let sizePremium = 0;
    
    // Hae perus-WACC variantin mukaan
    if (isFullDCFInputs(this.input)) {
      wacc = this.input.marketData.wacc;
    } else if (isSimplifiedDCFInputs(this.input)) {
      wacc = this.input.benchmarkData.industryWACC;
    } else if (isForwardLookingDCFInputs(this.input)) {
      wacc = this.input.ventureAdjustments.riskAdjustedWACC;
    } else {
      wacc = 0.10; // Default 10% WACC
    }
    
    // Laske size premium pk-yrityksille (paitsi forward-looking, jossa on jo korkea WACC)
    if (this.variant !== 'forward_looking_dcf') {
      const currentRevenue = this.getCurrentRevenue();
      
      if (currentRevenue < 5_000_000) {
        sizePremium = 0.05; // 5% mikroyrityksille (<5M€)
      } else if (currentRevenue < 10_000_000) {
        sizePremium = 0.04; // 4% hyvin pienille yrityksille (5-10M€)
      } else if (currentRevenue < 50_000_000) {
        sizePremium = 0.025; // 2.5% pienille yrityksille (10-50M€)
      } else if (currentRevenue < 100_000_000) {
        sizePremium = 0.01; // 1% pieni-keskisuurille (50-100M€)
      }
      
      if (sizePremium > 0) {
        console.log(`${this.timestamp()} DCF Calculator: Applied size premium of ${(sizePremium * 100).toFixed(1)}% to WACC for company with revenue ${(currentRevenue / 1_000_000).toFixed(1)}M€`);
      }
    }
    
    // Lisää size premium WACC:iin
    wacc = wacc + sizePremium;
    
    // Validate WACC
    if (!isFinite(wacc) || wacc <= 0 || wacc > 0.50) {
      console.error(`${this.timestamp()} DCF Calculator: Invalid WACC: ${wacc}`);
      throw new Error(`Invalid WACC value: ${wacc}`);
    }
    
    return wacc;
  }

  private getCapexRate(): number {
    if (isFullDCFInputs(this.input)) {
      const revenues = this.input.historicalData.revenue;
      const capex = this.input.historicalData.capex;
      if (revenues.length > 0 && capex.length > 0) {
        // Use average of last few years to smooth out lumpy capex
        const periods = Math.min(3, revenues.length);
        let totalCapexRate = 0;
        for (let i = revenues.length - periods; i < revenues.length; i++) {
          if (revenues[i] > 0) {
            totalCapexRate += capex[i] / revenues[i];
          }
        }
        return totalCapexRate / periods;
      }
    } else if (isSimplifiedDCFInputs(this.input)) {
      return this.input.benchmarkData.industryCapexPercent;
    } else if (isForwardLookingDCFInputs(this.input)) {
      // Higher capex for growth stage companies
      return 0.05; // 5% for startups
    }
    return 0.03; // Default 3% of revenue
  }
  
  private getCurrentWorkingCapital(): number {
    const currentRevenue = this.getCurrentRevenue();
    const wcRate = this.variant === 'forward_looking_dcf' ? 0.08 : 0.05;
    return currentRevenue * wcRate;
  }
  
  private calculateHistoricalCAGR(): number | null {
    if (isFullDCFInputs(this.input)) {
      const revenues = this.input.historicalData.revenue;
      if (revenues.length >= 2) {
        const periods = revenues.length - 1;
        const startRevenue = revenues[0];
        const endRevenue = revenues[revenues.length - 1];
        
        if (startRevenue > 0 && endRevenue > 0) {
          // CAGR = (Ending Value / Beginning Value)^(1/n) - 1
          const cagr = Math.pow(endRevenue / startRevenue, 1 / periods) - 1;
          
          // Validate CAGR
          if (!isFinite(cagr)) {
            console.warn(`${this.timestamp()} DCF Calculator: Invalid CAGR calculation`);
            return null;
          }
          
          return cagr;
        }
      }
    } else if (isSimplifiedDCFInputs(this.input)) {
      const revenues = this.input.limitedHistoricalData.revenue;
      if (revenues.length >= 2) {
        const periods = revenues.length - 1;
        const startRevenue = revenues[0];
        const endRevenue = revenues[revenues.length - 1];
        
        if (startRevenue > 0 && endRevenue > 0) {
          return Math.pow(endRevenue / startRevenue, 1 / periods) - 1;
        }
      }
    }
    return null;
  }
  
  private getInitialGrowthRate(scenario: DCFScenario): number {
    // Calculate or estimate the growth rate for year 1
    const historicalCAGR = this.calculateHistoricalCAGR();
    if (historicalCAGR !== null) {
      const scenarioMultiplier = scenario === 'pessimistic' ? 0.8 : scenario === 'optimistic' ? 1.2 : 1.0;
      return historicalCAGR * scenarioMultiplier;
    }
    return this.getDefaultGrowthRate(scenario);
  }
  
  private getWorkingCapitalRate(scenario: DCFScenario): number {
    let baseRate = 0.05; // Default 5%
    
    // Forward-looking variant käyttää korkeampaa WC-tasoa
    if (this.variant === 'forward_looking_dcf') {
      baseRate = 0.08;
    } 
    // Toimialakohtaiset WC-tasot pk-yrityksille
    else if (isSimplifiedDCFInputs(this.input)) {
      const industry = this.input.benchmarkData.industry?.toLowerCase() || '';
      
      // Toimialakohtaiset käyttöpääomatarpeet
      const industryWCRates: { [key: string]: number } = {
        'retail': 0.08,          // Korkea varastotarve
        'vähittäiskauppa': 0.08,
        'software': 0.03,        // Matala WC-tarve
        'ohjelmisto': 0.03,
        'saas': 0.02,           // Erittäin matala WC
        'manufacturing': 0.12,   // Korkea varasto + saamiset
        'valmistus': 0.12,
        'teollisuus': 0.10,
        'services': 0.04,        // Matala WC-tarve
        'palvelu': 0.04,
        'wholesale': 0.10,       // Korkea WC-tarve
        'tukkukauppa': 0.10,
        'construction': 0.15,    // Projektiliiketoiminta
        'rakennus': 0.15,
        'restaurant': 0.06,      // Keskitaso
        'ravintola': 0.06,
        'technology': 0.05,      // Keskitaso
        'teknologia': 0.05
      };
      
      // Etsi vastaava toimiala
      for (const [key, rate] of Object.entries(industryWCRates)) {
        if (industry.includes(key)) {
          baseRate = rate;
          console.log(`${this.timestamp()} DCF Calculator: Using industry-specific WC rate of ${(rate * 100).toFixed(0)}% for ${industry}`);
          break;
        }
      }
    }
    
    // Skenaariokohtaiset säädöt
    const scenarioMultiplier = scenario === 'pessimistic' ? 1.2 :   // +20% huonompi WC-hallinta
                               scenario === 'optimistic' ? 0.8 :     // -20% parempi WC-hallinta
                               1.0;
    
    return baseRate * scenarioMultiplier;
  }
}