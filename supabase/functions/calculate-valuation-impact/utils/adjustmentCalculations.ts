// supabase/functions/calculate-valuation-impact/utils/adjustmentCalculations.ts

import { SalesReadinessAnalysis, AdjustmentFactors } from '../../_shared/types.ts';

/**
 * Laskee korjauskertoimet myyntikuntoisuusanalyysin perusteella, tukien sekä
 * kokonaiskertoimia että menetelmäkohtaisia kertoimia eri valuaatiomenetelmille.
 */
export function calculateAdjustmentFactors(analysis: SalesReadinessAnalysis): AdjustmentFactors {
  try {
    console.log("Calculating adjustment factors from sales readiness analysis");

    if (!analysis.kvantitatiivisetArviot || !analysis.kategoriapainotus) {
      console.warn("Missing required data in sales readiness analysis");
      return getDefaultFactors();
    }

    // Hae arvovaikutukset ja painot rakenteesta
    const categoryImpacts: {[key: string]: number} = {};
    const categoryWeights = analysis.kategoriapainotus;

    // Varmistetaan, että kaikki painot ovat määritelty ja summa on ~1.0
    let totalWeight = 0;
    Object.values(categoryWeights).forEach(weight => {
      if (typeof weight === 'number') totalWeight += weight;
    });

    if (Math.abs(totalWeight - 1.0) > 0.05) {
      console.warn(`Category weights don't sum to 1.0 (sum: ${totalWeight}), normalizing...`);
    }

    // Kerää vaikutusprosentit
    const metrics = analysis.kvantitatiivisetArviot;

    if (metrics.taloudelliset?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.financial = metrics.taloudelliset.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.juridiset?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.legal = metrics.juridiset.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.asiakaskeskittyneisyys?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.customer = metrics.asiakaskeskittyneisyys.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.henkilosto?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.personnel = metrics.henkilosto.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.operatiiviset?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.operations = metrics.operatiiviset.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.dokumentaatio?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.documentation = metrics.dokumentaatio.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.strategiset?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.strategic = metrics.strategiset.arvovaikutus.vaikutusprosentti;
    }

    if (metrics.sopimusrakenne?.arvovaikutus?.vaikutusprosentti !== undefined) {
      categoryImpacts.contract = metrics.sopimusrakenne.arvovaikutus.vaikutusprosentti;
    }

    // Laske painotettu kokonaisvaikutus
    let weightedImpact = 0;
    let usedWeightSum = 0;

    if (categoryWeights.taloudelliset && categoryImpacts.financial !== undefined) {
      weightedImpact += categoryImpacts.financial * categoryWeights.taloudelliset;
      usedWeightSum += categoryWeights.taloudelliset;
    }

    if (categoryWeights.juridiset && categoryImpacts.legal !== undefined) {
      weightedImpact += categoryImpacts.legal * categoryWeights.juridiset;
      usedWeightSum += categoryWeights.juridiset;
    }

    if (categoryWeights.asiakaskeskittyneisyys && categoryImpacts.customer !== undefined) {
      weightedImpact += categoryImpacts.customer * categoryWeights.asiakaskeskittyneisyys;
      usedWeightSum += categoryWeights.asiakaskeskittyneisyys;
    }

    if (categoryWeights.henkilosto && categoryImpacts.personnel !== undefined) {
      weightedImpact += categoryImpacts.personnel * categoryWeights.henkilosto;
      usedWeightSum += categoryWeights.henkilosto;
    }

    if (categoryWeights.operatiiviset && categoryImpacts.operations !== undefined) {
      weightedImpact += categoryImpacts.operations * categoryWeights.operatiiviset;
      usedWeightSum += categoryWeights.operatiiviset;
    }

    if (categoryWeights.dokumentaatio && categoryImpacts.documentation !== undefined) {
      weightedImpact += categoryImpacts.documentation * categoryWeights.dokumentaatio;
      usedWeightSum += categoryWeights.dokumentaatio;
    }

    if (categoryWeights.strategiset && categoryImpacts.strategic !== undefined) {
      weightedImpact += categoryImpacts.strategic * categoryWeights.strategiset;
      usedWeightSum += categoryWeights.strategiset;
    }

    if (categoryWeights.sopimusrakenne && categoryImpacts.contract !== undefined) {
      weightedImpact += categoryImpacts.contract * categoryWeights.sopimusrakenne;
      usedWeightSum += categoryWeights.sopimusrakenne;
    }

    // Normalisoi painotettu vaikutus, jos painoja käytettiin
    const finalWeightedImpact = usedWeightSum > 0 ? weightedImpact / usedWeightSum : 0;

    // Muunna vaikutusprosentti kokonaiskertoimeksi (esim. +5% -> 1.05, -10% -> 0.9)
    const overallFactor = 1 + (finalWeightedImpact / 100);

    console.log(`Final weighted impact: ${finalWeightedImpact.toFixed(2)}% -> factor: ${overallFactor.toFixed(3)}`);

    // Laske menetelmäkohtaiset kertoimet
    const revenueMultipleFactor = calculateRevenueMultipleFactor(categoryImpacts);
    const ebitMultipleFactor = calculateEbitMultipleFactor(categoryImpacts);
    const ebitdaMultipleFactor = calculateEbitdaMultipleFactor(categoryImpacts);
    const peMultipleFactor = calculatePeMultipleFactor(categoryImpacts);

    // Palauta kategoriavaikutukset kertoimina
    // HUOMAA: Sisältää sekä yksittäiset kertoimet (backward-yhteensopivuus) että uudet menetelmäkohtaiset kertoimet
    return {
      customerConcentrationFactor: 1 + (categoryImpacts.customer || 0) / 100,
      keyPersonDependencyFactor: 1 + (categoryImpacts.personnel || 0) / 100,
      contractStructureFactor: 1 + (categoryImpacts.contract || 0) / 100,
      financialFactor: 1 + (categoryImpacts.financial || 0) / 100,
      legalFactor: 1 + (categoryImpacts.legal || 0) / 100,
      operationalFactor: 1 + (categoryImpacts.operations || 0) / 100,
      strategicFactor: 1 + (categoryImpacts.strategic || 0) / 100,
      documentationAdjustmentFactor: 1 + (categoryImpacts.documentation || 0) / 100,
      overallMultipleAdjustmentFactor: overallFactor, // Sisältää jo dokumentaation vaikutuksen

      // Uudet menetelmäkohtaiset kertoimet
      revenueMultipleFactor,
      ebitMultipleFactor,
      ebitdaMultipleFactor,
      peMultipleFactor
    };
  } catch (error) {
    console.error("Error calculating adjustment factors:", error);
    return getDefaultFactors();
  }
}

/**
 * Laskee liikevaihtokertoimen korjauskertoimen painottaen myyntikuntoisuuden eri kategorioita
 * liikevaihtopohjaiselle arvostusmenetelmälle sopivalla tavalla.
 * Revenue-kerroin painottaa erityisesti asiakaskeskittyneisyyttä, sopimusrakennetta ja strategiaa.
 */
function calculateRevenueMultipleFactor(impacts: {[key: string]: number}): number {
  // Painotukset perustuvat yritysvaluaatiomenetelmien dokumentaatioon
  const revenueFactor = 1 + (
    ((impacts.customer || 0) * 0.35) + 
    ((impacts.contract || 0) * 0.30) + 
    ((impacts.strategic || 0) * 0.25) +
    ((impacts.documentation || 0) * 0.10)
  ) / 100;

  return revenueFactor;
}

/**
 * Laskee EBIT-kertoimen korjauskertoimen painottaen myyntikuntoisuuden eri kategorioita
 * EBIT-pohjaiselle arvostusmenetelmälle sopivalla tavalla.
 * EBIT-kerroin painottaa operatiivisia, taloudellisia ja henkilöstökysymyksiä.
 */
function calculateEbitMultipleFactor(impacts: {[key: string]: number}): number {
  // Painotukset perustuvat yritysvaluaatiomenetelmien dokumentaatioon
  const ebitFactor = 1 + (
    ((impacts.operations || 0) * 0.30) + 
    ((impacts.financial || 0) * 0.30) + 
    ((impacts.personnel || 0) * 0.25) +
    ((impacts.documentation || 0) * 0.15)
  ) / 100;

  return ebitFactor;
}

/**
 * Laskee EBITDA-kertoimen korjauskertoimen painottaen myyntikuntoisuuden eri kategorioita
 * EBITDA-pohjaiselle arvostusmenetelmälle sopivalla tavalla.
 * EBITDA-kerroin painottaa samoja tekijöitä kuin EBIT hieman eri painotuksilla.
 */
function calculateEbitdaMultipleFactor(impacts: {[key: string]: number}): number {
  // Painotukset perustuvat yritysvaluaatiomenetelmien dokumentaatioon
  const ebitdaFactor = 1 + (
    ((impacts.operations || 0) * 0.35) + 
    ((impacts.financial || 0) * 0.25) + 
    ((impacts.personnel || 0) * 0.25) +
    ((impacts.documentation || 0) * 0.15)
  ) / 100;

  return ebitdaFactor;
}

/**
 * Laskee P/E-kertoimen korjauskertoimen painottaen myyntikuntoisuuden eri kategorioita
 * P/E-pohjaiselle arvostusmenetelmälle sopivalla tavalla.
 * P/E-kerroin painottaa taloudellisia ja juridisia tekijöitä.
 */
function calculatePeMultipleFactor(impacts: {[key: string]: number}): number {
  // Painotukset perustuvat yritysvaluaatiomenetelmien dokumentaatioon
  const peFactor = 1 + (
    ((impacts.financial || 0) * 0.40) + 
    ((impacts.legal || 0) * 0.25) + 
    ((impacts.operations || 0) * 0.20) +
    ((impacts.documentation || 0) * 0.15)
  ) / 100;

  return peFactor;
}

/**
 * Oletuskertoimet, jos laskenta epäonnistuu
 */
function getDefaultFactors(): AdjustmentFactors {
  return {
    customerConcentrationFactor: 1.0,
    keyPersonDependencyFactor: 1.0,
    contractStructureFactor: 1.0,
    financialFactor: 1.0,
    legalFactor: 1.0,
    operationalFactor: 1.0,
    strategicFactor: 1.0,
    documentationAdjustmentFactor: 1.0,
    overallMultipleAdjustmentFactor: 1.0,
    // Lisätään uudet kertoimet myös oletusarvoihin
    revenueMultipleFactor: 1.0,
    ebitMultipleFactor: 1.0,
    ebitdaMultipleFactor: 1.0,
    peMultipleFactor: 1.0
  };
}