// Simplified Firecrawl service for company preview
// Only scrapes what we need for quick preview

interface ScrapeResult {
  url: string;
  content: string;
  success: boolean;
  error?: string;
}

class FirecrawlService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = Deno.env.get('FIRECRAWL_API_KEY') || '';
    if (!this.apiKey) {
      console.warn('FIRECRAWL_API_KEY not set');
    }
  }
  
  async scrapeUrl(url: string): Promise<ScrapeResult> {
    if (!this.apiKey) {
      return {
        url,
        content: '',
        success: false,
        error: 'Firecrawl API key not configured'
      };
    }

    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          pageOptions: {
            onlyMainContent: true,
            waitFor: 1000 // Quick wait
          },
          extractorOptions: {
            mode: 'markdown'
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
      }
      
      const result = await response.json();
      
      return {
        url,
        content: result.data?.markdown || result.data?.content || '',
        success: true
      };
      
    } catch (error) {
      console.error('Firecrawl scraping failed:', error);
      return {
        url,
        content: '',
        success: false,
        error: error.message
      };
    }
  }
}

export const firecrawlService = new FirecrawlService();