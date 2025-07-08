
/**
 * This file handles the calculation of financial metrics for valuation.
 * It takes financial data analysis results and enhances them with valuation metrics.
 */

// Calculate financial metrics based on analyzed financial data
export function calculateFinancialMetrics(financialAnalysis: any, companyInfo: any): void {
  if (!financialAnalysis || !financialAnalysis.documents || financialAnalysis.documents.length === 0) {
    console.error("No valid financial data found for metrics calculation");
    return;
  }
  
  // Process each document
  for (const document of financialAnalysis.documents) {
    if (document.financial_periods && document.financial_periods.length > 0) {
      // Process each financial period, starting with the most recent
      for (const period of document.financial_periods) {
        try {
          console.log(`Calculating metrics for period: ${period.period?.start_date} to ${period.period?.end_date}`);
          
          // Make sure required objects exist
          if (!period.valuation_metrics) {
            period.valuation_metrics = {};
          }
          
          // Extract basic financial data
          const balanceSheet = period.balance_sheet || {};
          const incomeStatement = period.income_statement || {};
          
          // Extract and calculate key values with fallbacks
          const revenue = incomeStatement.revenue || 0;
          const ebit = incomeStatement.ebit || incomeStatement.operating_profit || 0;
          const totalAssets = balanceSheet.assets_total || balanceSheet.total_assets || 0;
          const totalLiabilities = balanceSheet.liabilities_total || balanceSheet.total_liabilities || 0;
          const equity = balanceSheet.equity || (totalAssets - totalLiabilities) || 0;
          
          console.log(`Revenue: ${revenue}, EBIT: ${ebit}, Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${equity}`);
          
          // Calculate basic valuation metrics
          const substanssiValue = equity;
          const evRevenueMultiple = getAppropriateRevenueMultiple(companyInfo);
          const evEbitMultiple = getAppropriateEbitMultiple(companyInfo);
          
          const evRevenueValue = revenue * evRevenueMultiple;
          const evEbitValue = ebit > 0 ? ebit * evEbitMultiple : 0;
          
          // Set flags for negative or zero values
          const isSubstanssiNegative = substanssiValue < 0;
          const isEbitNegativeOrZero = ebit <= 0;
          
          // Calculate valuation range
          // Low value is the max of 0 and the lowest positive valuation method
          let lowValue = 0;
          const positiveValues = [
            substanssiValue > 0 ? substanssiValue : Number.MAX_VALUE,
            evRevenueValue > 0 ? evRevenueValue : Number.MAX_VALUE,
            evEbitValue > 0 ? evEbitValue : Number.MAX_VALUE
          ].filter(v => v !== Number.MAX_VALUE);
          
          if (positiveValues.length > 0) {
            lowValue = Math.min(...positiveValues);
          }
          
          // High value is the maximum of all valuation methods
          const highValue = Math.max(0, substanssiValue, evRevenueValue, evEbitValue);
          
          // Store the calculated metrics
          period.valuation_metrics = {
            substanssi_value: substanssiValue,
            is_substanssi_negative: isSubstanssiNegative,
            ev_revenue_value: evRevenueValue,
            ev_ebit_value: evEbitValue,
            is_ebit_negative_or_zero: isEbitNegativeOrZero,
            ev_revenue_multiple: evRevenueMultiple,
            ev_ebit_multiple: evEbitMultiple,
            range: {
              low: lowValue,
              high: highValue
            }
          };
          
          console.log("Valuation metrics calculated:", period.valuation_metrics);
        } catch (error) {
          console.error("Error calculating financial metrics for period:", error);
          period.valuation_metrics = {
            error: error.message || "Virhe tunnuslukujen laskennassa"
          };
        }
      }
    }
  }
}

// Helper function to determine the appropriate revenue multiple based on company info
function getAppropriateRevenueMultiple(companyInfo: any): number {
  // Default multiple if no company info is available
  const defaultMultiple = 0.5;
  
  if (!companyInfo) {
    return defaultMultiple;
  }
  
  try {
    // Extract industry and other potential information from companyInfo
    const industry = companyInfo.industry?.toLowerCase() || "";
    const size = companyInfo.size?.toLowerCase() || "";
    const growth = companyInfo.growth_rate || 0;
    
    // Industry-specific multiples (simplified)
    const industryMultiples: {[key: string]: number} = {
      "technology": 2.0,
      "software": 3.0,
      "retail": 0.5,
      "manufacturing": 0.7,
      "healthcare": 1.5,
      "construction": 0.4,
      "real estate": 1.0,
      "finance": 1.0,
      "restaurant": 0.4,
      "service": 0.8
    };
    
    // Find matching industry
    for (const [key, multiple] of Object.entries(industryMultiples)) {
      if (industry.includes(key)) {
        return multiple;
      }
    }
    
    // If no industry match, use the default
    return defaultMultiple;
  } catch (error) {
    console.error("Error determining revenue multiple:", error);
    return defaultMultiple;
  }
}

// Helper function to determine the appropriate EBIT multiple based on company info
function getAppropriateEbitMultiple(companyInfo: any): number {
  // Default multiple if no company info is available
  const defaultMultiple = 5.0;
  
  if (!companyInfo) {
    return defaultMultiple;
  }
  
  try {
    // Extract industry and other potential information from companyInfo
    const industry = companyInfo.industry?.toLowerCase() || "";
    const size = companyInfo.size?.toLowerCase() || "";
    const growth = companyInfo.growth_rate || 0;
    
    // Industry-specific multiples (simplified)
    const industryMultiples: {[key: string]: number} = {
      "technology": 10.0,
      "software": 12.0,
      "retail": 6.0,
      "manufacturing": 5.0,
      "healthcare": 8.0,
      "construction": 4.0,
      "real estate": 7.0,
      "finance": 7.0,
      "restaurant": 4.0,
      "service": 6.0
    };
    
    // Find matching industry
    for (const [key, multiple] of Object.entries(industryMultiples)) {
      if (industry.includes(key)) {
        return multiple;
      }
    }
    
    // If no industry match, use the default
    return defaultMultiple;
  } catch (error) {
    console.error("Error determining EBIT multiple:", error);
    return defaultMultiple;
  }
}
