// Utility functions for DCF variant analysis

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries = 3, 
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let lastError: any = null;

  while (true) {
    try {
      console.log(`${getTimestamp()} Attempt ${retries + 1}/${maxRetries + 1}...`);
      return await fn();
    } catch (error) {
      lastError = error;
      retries++;

      console.error(`${getTimestamp()} Attempt ${retries} failed:`, {
        name: error.name,
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });

      if (retries >= maxRetries) {
        console.error(`${getTimestamp()} Max retries (${maxRetries}) reached. Giving up.`);
        console.error(`${getTimestamp()} Final error details:`, {
          name: lastError.name,
          message: lastError.message,
          stack: lastError.stack,
          status: lastError.status,
          statusText: lastError.statusText,
          response: lastError.response
        });
        throw lastError;
      }

      // Exponential backoff makes sense for rate limits and server errors
      const delay = initialDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
      console.log(`${getTimestamp()} Retry ${retries}/${maxRetries} after ${Math.round(delay)}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function createEnhancedError(message: string, originalError?: any): Error {
  return new Error(message, {
    cause: originalError
  });
}

export function getTimestamp(): string {
  return `[${new Date().toISOString()}]`;
}

export function logMemoryUsage(label: string): void {
  const memory = Deno.memoryUsage();
  console.log(`${getTimestamp()} ${label}: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
}

export function freeMemory(objects: any[]): void {
  for (const obj of objects) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        delete obj[key];
      }
    }
  }
  
  // Force garbage collection hint
  if (globalThis.gc) {
    globalThis.gc();
  }
}

export function buildVariantContext(
  variant: any,
  industryBenchmarkData: string,
  comprehensiveMarketData: any,
  marketBasedWACC: number
): string {
  return `
TOIMIALAVERTAILUTIEDOT:
${industryBenchmarkData}

REAALIAIKAINEN MARKET DATA (ECB + Eurostat + Damodaran + FRED):
- Risk-free rate (10v AAA euroalue): ${(comprehensiveMarketData.riskFreeRate.value * 100).toFixed(2)}% (${comprehensiveMarketData.riskFreeRate.source})
- EU inflaatio (HICP): ${(comprehensiveMarketData.inflation.value * 100).toFixed(2)}% (${comprehensiveMarketData.inflation.source})
- Toimialan beta: ${comprehensiveMarketData.industryBeta.value.toFixed(2)} (${comprehensiveMarketData.industryBeta.source})
- Toimialan cost of capital: ${(comprehensiveMarketData.costOfCapital.value * 100).toFixed(2)}% (${comprehensiveMarketData.costOfCapital.source})
- Corporate credit spread: ${(comprehensiveMarketData.creditSpread.value * 100).toFixed(0)} bps (${comprehensiveMarketData.creditSpread.source})
- Market risk premium: ${(comprehensiveMarketData.marketRiskPremium.value * 100).toFixed(1)}% (${comprehensiveMarketData.marketRiskPremium.source})
- Toimialan D/E ratio: ${(comprehensiveMarketData.debtToEquity.value * 100).toFixed(0)}% (${comprehensiveMarketData.debtToEquity.source})
- Laskettu market-based WACC: ${(marketBasedWACC * 100).toFixed(2)}%
- Suositeltu terminaalikasvu: ${(comprehensiveMarketData.inflation.value * 100).toFixed(2)}% (inflaation mukaan)
- Datan laatu: ${comprehensiveMarketData.dataQuality}

KÄYTÄ NÄITÄ MARKET-POHJAISIA ARVOJA WACC-laskennassa ja terminaalikasvussa.`;
}