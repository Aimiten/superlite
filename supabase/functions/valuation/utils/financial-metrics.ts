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
          const ebitda = period.calculated_fields?.ebitda || (ebit + (balanceSheet.depreciation || 0)) || 0;
          const totalAssets = balanceSheet.assets_total || balanceSheet.total_assets || 0;
          const totalLiabilities = balanceSheet.liabilities_total || balanceSheet.total_liabilities || 0;
          const equity = balanceSheet.equity || (totalAssets - totalLiabilities) || 0;

          console.log(`Revenue: ${revenue}, EBIT: ${ebit}, EBITDA: ${ebitda}, Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${equity}`);

          // Calculate basic valuation metrics - Use Gemini's recommended multipliers when available
          const substanssiValue = equity;

          // Get multipliers from Gemini analysis with fallbacks
          const revenueMultiple = period.valuation_multiples?.revenue_multiple?.multiple || 
                                  period.valuation_multiples?.revenue?.multiple || 
                                  getAppropriateRevenueMultiple(companyInfo);

          const evEbitMultiple = period.valuation_multiples?.ev_ebit?.multiple || 
                                getAppropriateEbitMultiple(companyInfo);

          const evEbitdaMultiple = period.valuation_multiples?.ev_ebitda?.multiple || 
                                  getAppropriateEbitdaMultiple(companyInfo);

          console.log(`Using multiples: Revenue=${revenueMultiple}, EBIT=${evEbitMultiple}, EBITDA=${evEbitdaMultiple}`);

          // Calculate valuations using multipliers
          const evRevenueValue = revenue * revenueMultiple;
          const evEbitValue = ebit > 0 ? ebit * evEbitMultiple : 0;
          const evEbitdaValue = ebitda > 0 ? ebitda * evEbitdaMultiple : 0;

          // Set flags for negative or zero values
          const isSubstanssiNegative = substanssiValue < 0;
          const isEbitNegativeOrZero = ebit <= 0;
          const isEbitdaNegativeOrZero = ebitda <= 0;

          // Calculate valuation range
          // Low value is the max of 0 and the lowest positive valuation method
          let lowValue = 0;
          const positiveValues = [
            substanssiValue > 0 ? substanssiValue : Number.MAX_VALUE,
            evRevenueValue > 0 ? evRevenueValue : Number.MAX_VALUE,
            evEbitValue > 0 ? evEbitValue : Number.MAX_VALUE,
            evEbitdaValue > 0 ? evEbitdaValue : Number.MAX_VALUE
          ].filter(v => v !== Number.MAX_VALUE);

          if (positiveValues.length > 0) {
            lowValue = Math.min(...positiveValues);
          }

          // High value is the maximum of all valuation methods
          const highValue = Math.max(0, substanssiValue, evRevenueValue, evEbitValue, evEbitdaValue);

          // Store the calculated metrics
          period.valuation_metrics = {
            substanssi_value: substanssiValue,
            is_substanssi_negative: isSubstanssiNegative,
            ev_revenue_value: evRevenueValue,
            ev_ebit_value: evEbitValue,
            ev_ebitda_value: evEbitdaValue,
            is_ebit_negative_or_zero: isEbitNegativeOrZero,
            is_ebitda_negative_or_zero: isEbitdaNegativeOrZero,
            revenue_multiple: revenueMultiple,
            ev_ebit_multiple: evEbitMultiple,
            ev_ebitda_multiple: evEbitdaMultiple,
            range: {
              low: lowValue,
              high: highValue
            },
            // Calculate average valuation from valid positive values
            average_valuation: positiveValues.length > 0 ? 
              positiveValues.reduce((sum, val) => sum + val, 0) / positiveValues.length : 0
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
  const defaultMultiple = 0.8;

  if (!companyInfo) {
    return defaultMultiple;
  }

  try {
    // Extract industry and other potential information from companyInfo
    const industry = companyInfo.structuredData?.industry?.toLowerCase() || "";
    const size = companyInfo.structuredData?.size?.toLowerCase() || "";

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
    const industry = companyInfo.structuredData?.industry?.toLowerCase() || "";

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

// Helper function to determine the appropriate EBITDA multiple based on company info
function getAppropriateEbitdaMultiple(companyInfo: any): number {
  // Default multiple if no company info is available
  const defaultMultiple = 6.0;

  if (!companyInfo) {
    return defaultMultiple;
  }

  try {
    // Extract industry from companyInfo
    const industry = companyInfo.structuredData?.industry?.toLowerCase() || "";

    // Industry-specific multiples (simplified)
    const industryMultiples: {[key: string]: number} = {
      "technology": 12.0,
      "software": 14.0,
      "retail": 7.0,
      "manufacturing": 6.0,
      "healthcare": 10.0,
      "construction": 5.0,
      "real estate": 9.0,
      "finance": 8.0,
      "restaurant": 5.0,
      "service": 7.0
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
    console.error("Error determining EBITDA multiple:", error);
    return defaultMultiple;
  }
}