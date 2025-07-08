/**
 * Parameter schemas for DCF scenario analysis
 * Compatible with Gemini's responseSchema format
 */

// Base DCF parameter schema (shared across all variants)
export const baseDCFParameterSchema = {
  type: "object",
  properties: {
    // Revenue projections (5 years)
    revenueGrowthRates: {
      type: "array",
      items: { type: "number" },
      description: "Annual revenue growth rates for years 1-5 (as decimals, e.g., 0.15 for 15%)"
    },
    
    // Operating metrics
    operatingMargins: {
      type: "array",
      items: { type: "number" },
      description: "Operating margin percentages for years 1-5 (as decimals)"
    },
    
    // Capital efficiency
    capexAsPercentOfRevenue: {
      type: "array",
      items: { type: "number" },
      description: "CapEx as % of revenue for years 1-5 (as decimals)"
    },
    
    // Working capital
    workingCapitalChangeRates: {
      type: "array",
      items: { type: "number" },
      description: "Working capital change as % of revenue for years 1-5"
    },
    
    // Terminal value parameters
    terminalGrowthRate: {
      type: "number",
      description: "Terminal growth rate (as decimal)"
    },
    
    // Discount rate
    wacc: {
      type: "number",
      description: "Weighted average cost of capital (as decimal)"
    },
    
    // Base values
    currentRevenue: {
      type: "number",
      description: "Current annual revenue in currency units"
    },
    
    // Additional considerations
    taxRate: {
      type: "number",
      description: "Corporate tax rate (as decimal)"
    }
  },
  required: [
    "revenueGrowthRates",
    "operatingMargins",
    "capexAsPercentOfRevenue",
    "workingCapitalChangeRates",
    "terminalGrowthRate",
    "wacc",
    "currentRevenue",
    "taxRate"
  ]
};

// SaaS-specific parameters
export const saasParameterSchema = {
  type: "object",
  properties: {
    ...baseDCFParameterSchema.properties,
    
    // SaaS-specific metrics
    customerAcquisitionCost: {
      type: "array",
      items: { type: "number" },
      description: "CAC projections for years 1-5"
    },
    
    churnRates: {
      type: "array",
      items: { type: "number" },
      description: "Annual churn rates for years 1-5 (as decimals)"
    },
    
    averageRevenuePerUser: {
      type: "array",
      items: { type: "number" },
      description: "ARPU projections for years 1-5"
    },
    
    recurringRevenuePercentage: {
      type: "number",
      description: "Percentage of revenue that is recurring (as decimal)"
    }
  },
  required: [
    ...baseDCFParameterSchema.required,
    "customerAcquisitionCost",
    "churnRates",
    "averageRevenuePerUser",
    "recurringRevenuePercentage"
  ]
};

// Traditional business parameters
export const traditionalParameterSchema = {
  type: "object",
  properties: {
    ...baseDCFParameterSchema.properties,
    
    // Traditional business metrics
    inventoryTurnover: {
      type: "array",
      items: { type: "number" },
      description: "Inventory turnover ratios for years 1-5"
    },
    
    daysInventoryOutstanding: {
      type: "array",
      items: { type: "number" },
      description: "DIO projections for years 1-5"
    },
    
    daysReceivablesOutstanding: {
      type: "array",
      items: { type: "number" },
      description: "DRO projections for years 1-5"
    },
    
    daysPayablesOutstanding: {
      type: "array",
      items: { type: "number" },
      description: "DPO projections for years 1-5"
    }
  },
  required: [
    ...baseDCFParameterSchema.required,
    "inventoryTurnover",
    "daysInventoryOutstanding",
    "daysReceivablesOutstanding",
    "daysPayablesOutstanding"
  ]
};

// Growth company parameters
export const growthParameterSchema = {
  type: "object",
  properties: {
    ...baseDCFParameterSchema.properties,
    
    // Growth-specific metrics
    marketShareGrowth: {
      type: "array",
      items: { type: "number" },
      description: "Market share growth rates for years 1-5 (as decimals)"
    },
    
    researchAndDevelopmentExpense: {
      type: "array",
      items: { type: "number" },
      description: "R&D as % of revenue for years 1-5 (as decimals)"
    },
    
    salesAndMarketingExpense: {
      type: "array",
      items: { type: "number" },
      description: "S&M as % of revenue for years 1-5 (as decimals)"
    },
    
    customerGrowthRates: {
      type: "array",
      items: { type: "number" },
      description: "Customer base growth rates for years 1-5 (as decimals)"
    }
  },
  required: [
    ...baseDCFParameterSchema.required,
    "marketShareGrowth",
    "researchAndDevelopmentExpense",
    "salesAndMarketingExpense",
    "customerGrowthRates"
  ]
};

// Mature company parameters
export const matureParameterSchema = {
  type: "object",
  properties: {
    ...baseDCFParameterSchema.properties,
    
    // Mature company metrics
    dividendPayoutRatio: {
      type: "number",
      description: "Dividend payout ratio (as decimal)"
    },
    
    assetUtilizationRate: {
      type: "array",
      items: { type: "number" },
      description: "Asset utilization rates for years 1-5 (as decimals)"
    },
    
    maintenanceCapexRatio: {
      type: "array",
      items: { type: "number" },
      description: "Maintenance CapEx as % of revenue for years 1-5"
    },
    
    marketShareStability: {
      type: "array",
      items: { type: "number" },
      description: "Expected market share retention for years 1-5 (as decimals)"
    }
  },
  required: [
    ...baseDCFParameterSchema.required,
    "dividendPayoutRatio",
    "assetUtilizationRate",
    "maintenanceCapexRatio",
    "marketShareStability"
  ]
};

// Scenario wrapper schema (for all variants)
export const scenarioWrapperSchema = (parameterSchema: any) => ({
  type: "object",
  properties: {
    conservative: {
      type: "object",
      properties: parameterSchema.properties,
      required: parameterSchema.required,
      description: "Conservative scenario parameters"
    },
    
    base: {
      type: "object",
      properties: parameterSchema.properties,
      required: parameterSchema.required,
      description: "Base case scenario parameters"
    },
    
    optimistic: {
      type: "object",
      properties: parameterSchema.properties,
      required: parameterSchema.required,
      description: "Optimistic scenario parameters"
    }
  },
  required: ["conservative", "base", "optimistic"]
});

// Complete parameter schemas for each variant
export const parameterSchemas = {
  saas: {
    type: "object",
    properties: {
      scenarios: scenarioWrapperSchema(saasParameterSchema)
    },
    required: ["scenarios"]
  },
  
  traditional: {
    type: "object",
    properties: {
      scenarios: scenarioWrapperSchema(traditionalParameterSchema)
    },
    required: ["scenarios"]
  },
  
  growth: {
    type: "object",
    properties: {
      scenarios: scenarioWrapperSchema(growthParameterSchema)
    },
    required: ["scenarios"]
  },
  
  mature: {
    type: "object",
    properties: {
      scenarios: scenarioWrapperSchema(matureParameterSchema)
    },
    required: ["scenarios"]
  }
};

// Helper function to get parameter schema for a specific variant
export function getParameterSchema(variant: 'saas' | 'traditional' | 'growth' | 'mature') {
  return parameterSchemas[variant];
}

// Export individual schemas for direct use
export {
  parameterSchemas as geminiParameterSchemas
};