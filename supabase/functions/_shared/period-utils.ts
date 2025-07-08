/**
 * Utility functions for handling financial periods across the valuation system
 */

/**
 * Löytää viimeisimmän tilikauden päivämäärän perusteella.
 * Tukee sekä sortedPeriods (laskettu data) että financial_periods (raakadata) kenttiä.
 * 
 * @param financialData - Financial analysis data containing periods
 * @returns Latest period object or null if not found
 * 
 * HUOM: sortedPeriods on järjestetty uusin ensin (newest first)
 * financial_periods ei ole järjestetty, joten käytetään reduce-logiikkaa
 */
export function getLatestPeriod(financialData: any): any {
  if (!financialData?.documents?.[0]) {
    return null;
  }

  const doc = financialData.documents[0];
  
  // PRIORISOI sortedPeriods (uudempi, laskettu data calculateFinancialMetrics():ssa)
  if (doc.sortedPeriods && doc.sortedPeriods.length > 0) {
    return doc.sortedPeriods[0]; // Ensimmäinen = uusin
  }
  
  // FALLBACK financial_periods (raakadata Geminiltä)
  if (doc.financial_periods && doc.financial_periods.length > 0) {
    return doc.financial_periods.reduce((latest: any, current: any) => {
      const latestEndDate = latest?.period?.end_date ? new Date(latest.period.end_date) : null;
      const currentEndDate = current?.period?.end_date ? new Date(current.period.end_date) : null;
      if (!currentEndDate) return latest;
      if (!latestEndDate) return current;
      return currentEndDate > latestEndDate ? current : latest;
    }, doc.financial_periods[0]);
  }
  
  return null;
}