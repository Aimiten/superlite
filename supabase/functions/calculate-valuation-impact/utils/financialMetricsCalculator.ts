// supabase/functions/calculate-valuation-impact/utils/financialMetricsCalculator.ts

import { OriginalValuationSnapshot } from '../../_shared/types.ts';

export function calculateMetricsForPeriod(
  period: any, 
  multiplesToUse: { revenue: number; ebit: number; ebitda: number; pe?: number; }, 
  originalValuationSnapshot?: OriginalValuationSnapshot
): any {
  const calculatedMetrics: any = {
      range: { low: 0, high: 0 },
      average_valuation: 0
  };

  try {
    console.log("Starting metrics calculation with original valuation snapshot");

    // --- UUSI: Käytä alkuperäisiä menetelmien arvoja ja skaalaa ne ---
    const originalValues = originalValuationSnapshot?.originalMethodValues;
    const methodsUsed = originalValuationSnapshot?.methodsUsedInAverage || [];
    const methodsToInclude = [];

    if (originalValues && methodsUsed.length > 0) {
      console.log("Using original method values with scaling");
      console.log("Original values:", originalValues);
      console.log("Methods used:", methodsUsed);
      console.log("Original multiples:", originalValuationSnapshot?.multiplesUsed);
      console.log("New multiples:", multiplesToUse);

      for (const method of methodsUsed) {
        let adjustedValue = 0;

        switch (method) {
          case 'book_value':
            // Book value ei muutu kertoimien mukana
            adjustedValue = originalValues.book_value;
            console.log(`Book value (unchanged): ${adjustedValue}`);
            break;

          case 'asset_based_value':
            // Asset-based value ei muutu kertoimien mukana
            adjustedValue = originalValues.asset_based_value;
            console.log(`Asset-based value (unchanged): ${adjustedValue}`);
            break;

          case 'revenue':
            // Skaalaa alkuperäinen arvo uudella kertoimella
            if (originalValuationSnapshot?.multiplesUsed.revenue &&
originalValuationSnapshot.multiplesUsed.revenue > 0) {
              const scaleFactor = multiplesToUse.revenue / originalValuationSnapshot.multiplesUsed.revenue;
              adjustedValue = originalValues.equity_value_from_revenue * scaleFactor;
              console.log(`Revenue: ${originalValues.equity_value_from_revenue} × ${scaleFactor} = 
${adjustedValue}`);
            }
            break;

          case 'ebit':
            if (originalValuationSnapshot?.multiplesUsed.ebit && originalValuationSnapshot.multiplesUsed.ebit >
0) {
              const scaleFactor = multiplesToUse.ebit / originalValuationSnapshot.multiplesUsed.ebit;
              adjustedValue = originalValues.equity_value_from_ebit * scaleFactor;
              console.log(`EBIT: ${originalValues.equity_value_from_ebit} × ${scaleFactor} = ${adjustedValue}`);
            }
            break;

          case 'ebitda':
            if (originalValuationSnapshot?.multiplesUsed.ebitda &&
originalValuationSnapshot.multiplesUsed.ebitda > 0) {
              const scaleFactor = multiplesToUse.ebitda / originalValuationSnapshot.multiplesUsed.ebitda;
              adjustedValue = originalValues.equity_value_from_ebitda * scaleFactor;
              console.log(`EBITDA: ${originalValues.equity_value_from_ebitda} × ${scaleFactor} = 
${adjustedValue}`);
            }
            break;

          case 'pe':
            if (originalValuationSnapshot?.multiplesUsed.pe && originalValuationSnapshot.multiplesUsed.pe > 0) {
              const scaleFactor = multiplesToUse.pe / originalValuationSnapshot.multiplesUsed.pe;
              adjustedValue = originalValues.equity_value_from_pe * scaleFactor;
              console.log(`P/E: ${originalValues.equity_value_from_pe} × ${scaleFactor} = ${adjustedValue}`);
            }
            break;
        }

        if (adjustedValue > 0) {
          methodsToInclude.push(adjustedValue);
        }
      }

      // Tallenna yksittäiset arvot debug-tarkoituksiin
      if (originalValues.book_value > 0 && methodsUsed.includes('book_value')) {
        calculatedMetrics.book_value = originalValues.book_value;
      }
      if (originalValues.asset_based_value > 0 && methodsUsed.includes('asset_based_value')) {
        calculatedMetrics.asset_based_value = originalValues.asset_based_value;
      }

    } else {
      // Fallback alkuperäiseen logiikkaan jos ei ole tallennettuja arvoja
      console.log("Falling back to calculated method values (no original values available)");

      // Varmistetaan, että tarvittavat objektit ovat olemassa
      const balanceSheet = period.balance_sheet || {};
      const incomeStatement = period.income_statement || {};
      const dcfItems = period.dcf_items || { cash: 0, interest_bearing_debt: 0 };

      // Käytä weighted_financials jos saatavilla
      const weightedFinancials = period.weighted_financials || {};

      const revenue = parseFloat(weightedFinancials.revenue || incomeStatement.revenue || 0);
      const ebit = parseFloat(weightedFinancials.ebit || incomeStatement.ebit || 0);
      let ebitda = parseFloat(weightedFinancials.ebitda || period.calculated_fields?.ebitda ||
incomeStatement.ebitda || 0);
      const netIncome = parseFloat(weightedFinancials.net_income || incomeStatement.net_income || 0);

      const totalAssets = parseFloat(balanceSheet.assets_total || 0);
      const totalLiabilities = parseFloat(balanceSheet.liabilities_total || 0);
      const bookValue = totalAssets - totalLiabilities;

      calculatedMetrics.book_value = isNaN(bookValue) ? 0 : bookValue;

      // Nettovelka
      const cash = parseFloat(dcfItems.cash || 0);
      const interestBearingDebt = parseFloat(dcfItems.interest_bearing_debt || 0);
      const netDebt = interestBearingDebt - cash;
      calculatedMetrics.calculated_net_debt = isNaN(netDebt) ? 0 : netDebt;

      // Asset-based value
      const assetBasedValue = Math.max(0, -netDebt);
      calculatedMetrics.asset_based_value = assetBasedValue;

      // EBITDA estimointi
      if (ebitda === 0 && ebit !== 0 && incomeStatement.depreciation) {
        ebitda = ebit + parseFloat(incomeStatement.depreciation);
        calculatedMetrics.ebitda_estimated = true;
      }

      // Laske equity values
      let equity_from_revenue = 0;
      let equity_from_ebit = 0;
      let equity_from_ebitda = 0;

      if (revenue * multiplesToUse.revenue > 0) {
        equity_from_revenue = Math.max(0, (revenue * multiplesToUse.revenue) - netDebt);
      }

      if (ebit > 0) {
        equity_from_ebit = Math.max(0, (ebit * multiplesToUse.ebit) - netDebt);
      }

      if (ebitda > 0) {
        equity_from_ebitda = Math.max(0, (ebitda * multiplesToUse.ebitda) - netDebt);
      }

      const equity_from_pe = (netIncome > 0 && multiplesToUse.pe > 0) ? (netIncome * multiplesToUse.pe) : 0;

      calculatedMetrics.equity_value_from_revenue = equity_from_revenue;
      calculatedMetrics.equity_value_from_ebit = equity_from_ebit;
      calculatedMetrics.equity_value_from_ebitda = equity_from_ebitda;
      if (equity_from_pe > 0) calculatedMetrics.equity_value_from_pe = equity_from_pe;

      // Käytä business_based filtteröintiä
      const valuationMethods = originalValuationSnapshot?.valuationMethods || {
        revenue: 'business_based',
        ebit: 'business_based',
        ebitda: 'business_based',
        pe: 'business_based'
      };

      if (calculatedMetrics.book_value > 0) {
        methodsToInclude.push(calculatedMetrics.book_value);
      }
      if (calculatedMetrics.asset_based_value > 0) {
        methodsToInclude.push(calculatedMetrics.asset_based_value);
      }
      if (equity_from_revenue > 0 && valuationMethods.revenue === 'business_based') {
        methodsToInclude.push(equity_from_revenue);
      }
      if (equity_from_ebit > 0 && valuationMethods.ebit === 'business_based') {
        methodsToInclude.push(equity_from_ebit);
      }
      if (equity_from_ebitda > 0 && valuationMethods.ebitda === 'business_based') {
        methodsToInclude.push(equity_from_ebitda);
      }
      if (equity_from_pe > 0 && valuationMethods.pe === 'business_based') {
        methodsToInclude.push(equity_from_pe);
      }
    }

    // Laske keskiarvo
    let averageEquityValuation = 0;
    let includedMethodsCount = methodsToInclude.length;

    if (includedMethodsCount > 0) {
      const sum = methodsToInclude.reduce((a, b) => a + b, 0);
      averageEquityValuation = sum / includedMethodsCount;
      console.log(`Average from ${includedMethodsCount} methods: ${averageEquityValuation}`);
      console.log(`Individual values: [${methodsToInclude.join(', ')}]`);
    } else if (calculatedMetrics.book_value > 0) {
      // Jos kaikki arvot suodatettiin pois, käytä kirjanpitoarvoa
      averageEquityValuation = calculatedMetrics.book_value;
      includedMethodsCount = 1;
      console.log(`Fallback to book value: ${averageEquityValuation}`);
    }

    calculatedMetrics.average_equity_valuation = isNaN(averageEquityValuation) ? 0 : averageEquityValuation;
    calculatedMetrics.valuation_methods_in_average = includedMethodsCount;

    // Laske Range
    const rangeFactor = 0.20; // +/- 20%
    const lowBound = averageEquityValuation * (1 - rangeFactor);
    const highBound = averageEquityValuation * (1 + rangeFactor);

    calculatedMetrics.equity_valuation_range = {
      low: averageEquityValuation < 0 ? lowBound : Math.max(0, lowBound),
      high: highBound
    };

    // Nimeä kentät vastaamaan frontendin odotuksia
    calculatedMetrics.range = calculatedMetrics.equity_valuation_range;
    calculatedMetrics.average_valuation = calculatedMetrics.average_equity_valuation;

    console.log("Final calculated metrics:", {
      average_valuation: calculatedMetrics.average_valuation,
      methods_count: calculatedMetrics.valuation_methods_in_average,
      range: calculatedMetrics.range
    });

  } catch (error) {
    console.error("Error calculating metrics for period:", error);
    calculatedMetrics.error = `Virhe laskennassa: ${error.message}`;
  }

  return calculatedMetrics;
}
