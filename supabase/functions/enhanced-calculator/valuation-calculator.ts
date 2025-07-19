// Valuation calculation logic
// Mirrors the simple-calculator logic for consistency

interface ValuationCalculations {
  avgRevenue: number;
  avgOperatingProfit: number;
  revenueValuations: {
    min: number;
    avg: number;
    max: number;
  };
  evEbitValuations: {
    min: number;
    avg: number;
    max: number;
  };
}

export function calculateValuations(
  financialData: any,
  multipliers: any
): ValuationCalculations {
  
  // Calculate averages from available data
  const revenues = financialData.revenue || [];
  const validRevenues = revenues.filter((item: any) => 
    item.value !== null && item.value !== undefined && item.value > 0
  );
  
  const avgRevenue = validRevenues.length > 0
    ? validRevenues.reduce((sum: number, item: any) => sum + item.value, 0) / validRevenues.length
    : 0;

  // Calculate average operating profit
  const profits = financialData.operatingProfit || [];
  const validProfits = profits.filter((item: any) => 
    item.value !== null && item.value !== undefined
  );
  
  const avgOperatingProfit = validProfits.length > 0
    ? validProfits.reduce((sum: number, item: any) => sum + item.value, 0) / validProfits.length
    : 0;

  // Revenue-based valuations
  const revenueMultipliers = multipliers.revenue || getDefaultMultipliers().revenue;
  const revenueValuations = {
    min: Math.round(avgRevenue * revenueMultipliers.min),
    avg: Math.round(avgRevenue * revenueMultipliers.avg),
    max: Math.round(avgRevenue * revenueMultipliers.max)
  };

  // EV/EBIT valuations
  const evEbitMultipliers = multipliers.evEbit || getDefaultMultipliers().evEbit;
  const evEbitValuations = {
    min: Math.round(avgOperatingProfit * evEbitMultipliers.min),
    avg: Math.round(avgOperatingProfit * evEbitMultipliers.avg),
    max: Math.round(avgOperatingProfit * evEbitMultipliers.max)
  };

  return {
    avgRevenue,
    avgOperatingProfit,
    revenueValuations,
    evEbitValuations
  };
}

function getDefaultMultipliers() {
  return {
    revenue: { min: 0.5, avg: 0.8, max: 1.2 },
    evEbit: { min: 4.0, avg: 6.0, max: 8.0 }
  };
}