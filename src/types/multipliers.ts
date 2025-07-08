/**
 * Multiplier settings types and validation
 */

export interface CustomMultipliers {
  revenue_multiple: number;
  ev_ebit: number;
  ev_ebitda: number;
  p_e?: number;
}

export interface MultiplierSettings {
  method: 'ai' | 'manual';
  customMultipliers?: CustomMultipliers;
}

export interface MultiplierValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates custom multipliers
 */
export function validateCustomMultipliers(multipliers: any): MultiplierValidationResult {
  if (!multipliers || typeof multipliers !== 'object') {
    return { isValid: false, error: 'Kertoimet puuttuvat tai virheellinen muoto' };
  }

  const requiredFields = ['revenue_multiple', 'ev_ebit', 'ev_ebitda'] as const;
  
  for (const field of requiredFields) {
    const value = multipliers[field];
    if (typeof value !== 'number' || isNaN(value) || value <= 0 || value > 100) {
      return { 
        isValid: false, 
        error: `${field} täytyy olla numero välillä 0.1-100`,
        field 
      };
    }
  }

  // P/E is optional
  if (multipliers.p_e !== undefined) {
    const pe = multipliers.p_e;
    if (typeof pe !== 'number' || isNaN(pe) || pe <= 0 || pe > 100) {
      return { 
        isValid: false, 
        error: 'P/E kerroin täytyy olla numero välillä 0.1-100',
        field: 'p_e' 
      };
    }
  }

  return { isValid: true };
}

/**
 * Determines if manual multipliers should be used
 */
export function shouldUseManualMultipliers(
  method?: string, 
  customMultipliers?: any
): boolean {
  if (method !== 'manual') return false;
  
  const validation = validateCustomMultipliers(customMultipliers);
  return validation.isValid;
}