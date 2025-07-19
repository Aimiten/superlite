// Financial data scraper for Finnish sources
import { firecrawlService } from '../company-preview/firecrawl-service.ts';

interface FinancialData {
  revenue: Array<{ year: number; value: number }>;
  operatingProfit: Array<{ year: number; value: number }>;
  employees?: number;
}

export async function scrapeFinancialData(
  source: 'finder' | 'asiakastieto',
  companyName: string,
  businessId: string
): Promise<FinancialData> {
  let url: string;
  
  if (source === 'finder') {
    url = `https://www.finder.fi/search?what=${encodeURIComponent(companyName)}`;
  } else {
    // Asiakastieto uses business ID in URL
    const cleanBusinessId = businessId.replace('-', '');
    url = `https://www.asiakastieto.fi/yritykset/fi/${companyName.toLowerCase().replace(/\s+/g, '-')}/${cleanBusinessId}/taloustiedot`;
  }

  console.log(`Scraping ${source} from: ${url}`);
  
  const result = await firecrawlService.scrapeUrl(url);
  
  if (!result.success || !result.content) {
    console.error(`Failed to scrape ${source}`);
    return { revenue: [], operatingProfit: [] };
  }

  return parseFinancialData(result.content, source);
}

function parseFinancialData(content: string, source: string): FinancialData {
  const data: FinancialData = {
    revenue: [],
    operatingProfit: []
  };

  if (source === 'finder') {
    // Finder.fi patterns
    // Revenue: "Liikevaihto (2023): 850 000 €"
    const revenueMatches = content.matchAll(/Liikevaihto\s*\((\d{4})\)[\s:]*(\d+(?:\s\d+)*)\s*€/gi);
    for (const match of revenueMatches) {
      const year = parseInt(match[1]);
      const value = parseInt(match[2].replace(/\s/g, ''));
      data.revenue.push({ year, value });
    }

    // Operating profit: "Liiketulos (2023): 45 000 €"
    const profitMatches = content.matchAll(/Liiketulos\s*\((\d{4})\)[\s:]*(-?\d+(?:\s\d+)*)\s*€/gi);
    for (const match of profitMatches) {
      const year = parseInt(match[1]);
      const value = parseInt(match[2].replace(/\s/g, ''));
      data.operatingProfit.push({ year, value });
    }

    // Employees: "Henkilöstö: 6"
    const employeeMatch = content.match(/Henkilöstö[\s:]*(\d+)/i);
    if (employeeMatch) {
      data.employees = parseInt(employeeMatch[1]);
    }
  } else {
    // Asiakastieto.fi patterns (may vary)
    // Try table format first
    const tableMatch = content.match(/Tilikausi[\s\S]*?(\d{4})[\s\S]*?Liikevaihto[\s\S]*?([\d\s]+)/i);
    if (tableMatch) {
      // Parse table format
      const years = content.match(/\b(20\d{2})\b/g);
      const revenues = content.match(/Liikevaihto[\s\S]*?([\d\s]+(?:\s\d{3})*)/gi);
      
      if (years && revenues) {
        years.forEach((year, index) => {
          if (revenues[index]) {
            const value = parseInt(revenues[index].replace(/\D/g, ''));
            data.revenue.push({ year: parseInt(year), value });
          }
        });
      }
    }
  }

  // If no data from primary patterns, try generic patterns
  if (data.revenue.length === 0) {
    // Generic pattern: "2023: 850000" or "850 000 € (2023)"
    const genericMatches = content.matchAll(/(?:(\d{4})[\s:]+(\d+(?:\s\d+)*)\s*€)|(?:(\d+(?:\s\d+)*)\s*€\s*\((\d{4})\))/gi);
    for (const match of genericMatches) {
      const year = parseInt(match[1] || match[4]);
      const value = parseInt((match[2] || match[3]).replace(/\s/g, ''));
      if (year >= 2020 && year <= new Date().getFullYear()) {
        data.revenue.push({ year, value });
      }
    }
  }

  return data;
}