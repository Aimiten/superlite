// supabase/functions/calculate-valuation-impact/utils/valuationAdjustments.ts

import {
  OriginalValuationSnapshot,
  AdjustmentFactors,
  AdjustedValuationResult
} from '../../_shared/types.ts';
import { calculateMetricsForPeriod } from './financialMetricsCalculator.ts';

/**
 * Soveltaa lasketut korjauskertoimet alkuperäiseen arvonmääritykseen
 * käyttäen menetelmäkohtaisia kertoimia eri valuaatiomenetelmille.
 */
export function applyValuationAdjustments(
  originalValuationSnapshot: OriginalValuationSnapshot,
  adjustmentFactors: AdjustmentFactors,
  originalPeriodData: any
): AdjustedValuationResult {
  try {
    console.log("Applying adjustments to original valuation using adjustment factors");

    if (!originalPeriodData) {
      throw new Error("Original financial period data is required for recalculation.");
    }

    // Määritä korjatut kertoimet käyttäen menetelmäkohtaisia kertoimia
    const adjustedMultiples = {
      revenue: (originalValuationSnapshot.multiplesUsed.revenue || 0) *
               (adjustmentFactors.revenueMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor),

      ebit: (originalValuationSnapshot.multiplesUsed.ebit || 0) *
            (adjustmentFactors.ebitMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor),

      ebitda: (originalValuationSnapshot.multiplesUsed.ebitda || 0) *
              (adjustmentFactors.ebitdaMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor),

      pe: (originalValuationSnapshot.multiplesUsed.pe || 0) *
          (adjustmentFactors.peMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor),
    };

    console.log("Original Multiples:", originalValuationSnapshot.multiplesUsed);
    console.log("Adjustment Factors:", {
      revenue: adjustmentFactors.revenueMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor,
      ebit: adjustmentFactors.ebitMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor,
      ebitda: adjustmentFactors.ebitdaMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor,
      pe: adjustmentFactors.peMultipleFactor || adjustmentFactors.overallMultipleAdjustmentFactor
    });
    console.log("Adjusted Multiples:", adjustedMultiples);

    // KORJAUS: POISTETTU book value -säädöt kokonaan
    // Book value pysyy alkuperäisenä, dokumentaatio vaikuttaa vain kertoimien kautta

    // Laske metriikat uudelleen käyttäen korjattuja kertoimia
    // Välitä originalValuationSnapshot jotta voidaan käyttää valuationMethods tietoja
    const recalculatedMetrics = calculateMetricsForPeriod(
      originalPeriodData,
      adjustedMultiples,
      originalValuationSnapshot
    );

    if (recalculatedMetrics.error) {
      console.error("Error during recalculation with adjusted multiples:", recalculatedMetrics.error);
      throw new Error(`Recalculation failed: ${recalculatedMetrics.error}`);
    }

    console.log("Recalculated Metrics:", recalculatedMetrics);

    // Lopullinen korjattu keskiarvo
    const finalAverage = recalculatedMetrics.average_valuation || 0;

    // Käytä alkuperäisen arvion suhteellista haarukkaa uuden haarukan määrittämiseen
    // Jos alkuperäinen avg on 0, käytä määritettyä oletushaarukkaa
    let originalLowFactor = 0.8;  // Oletushaarukka -20%
    let originalHighFactor = 1.2; // Oletushaarukka +20%

    if (originalValuationSnapshot.averageValuation > 0) {
      originalLowFactor = originalValuationSnapshot.valuationRange.low /
originalValuationSnapshot.averageValuation;
      originalHighFactor = originalValuationSnapshot.valuationRange.high /
originalValuationSnapshot.averageValuation;
    }

    // Sovella samoja suhteellisia kertoimia korjattuun arvoon
    const finalRange = {
      low: finalAverage * originalLowFactor,
      high: finalAverage * originalHighFactor
    };

    // Varmistetaan ei-negatiivisuus (paitsi jos keskiarvo on negatiivinen)
    finalRange.low = finalAverage < 0 ? finalRange.low : Math.max(0, finalRange.low);
    finalRange.high = Math.max(0, finalRange.high);

    const finalAverageNonNegative = finalAverage < 0 ? finalAverage : Math.max(0, finalAverage);

    console.log(`Final Adjusted Valuation (after all adjustments): Avg=${finalAverageNonNegative.toFixed(0)}, 
Range=${finalRange.low.toFixed(0)}-${finalRange.high.toFixed(0)}`);

    // Lisätään debug-lokiin tieto painotusten ja menetelmien käytöstä
    if (recalculatedMetrics.valuation_methods_in_average) {
      console.log(`Methods used in average: ${recalculatedMetrics.valuation_methods_in_average}`);
    }
    if (recalculatedMetrics.equity_valuation_range) {
      console.log(`Equity valuation range: ${JSON.stringify(recalculatedMetrics.equity_valuation_range)}`);
    }

    // Palauta AdjustedValuationResult
    return {
      averageValuation: finalAverageNonNegative,
      valuationRange: finalRange,
      adjustedMultiples: adjustedMultiples
    };
  } catch (error) {
    console.error("Error in valuation adjustment:", error);
    throw error;
  }
}
