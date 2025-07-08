// Industry benchmark data caching
// Reduces web search API calls for common industries

interface CachedIndustryData {
  industry: string;
  data: string;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const cache = new Map<string, CachedIndustryData>();

export class IndustryCache {
  
  static getCacheKey(industry: string, description: string): string {
    // Normalize industry for caching
    const normalizedIndustry = industry?.toLowerCase().trim() || 'unknown';
    
    // Extract key terms from description for better caching
    const keyTerms = description?.toLowerCase()
      .match(/\b(saas|software|biotech|pharma|manufacturing|retail|services|consulting|real estate|fintech)\b/g)
      ?.join('-') || '';
    
    return `${normalizedIndustry}-${keyTerms}`.slice(0, 100); // Limit key length
  }
  
  static get(industry: string, description: string): string | null {
    const key = this.getCacheKey(industry, description);
    const cached = cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    console.log(`Industry cache HIT for key: ${key}`);
    return cached.data;
  }
  
  static set(industry: string, description: string, data: string): void {
    const key = this.getCacheKey(industry, description);
    const now = Date.now();
    
    cache.set(key, {
      industry,
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    });
    
    console.log(`Industry cache SET for key: ${key}, data length: ${data.length}`);
    
    // Simple cache size management
    if (cache.size > 100) {
      this.cleanup();
    }
  }
  
  static cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of cache.entries()) {
      if (now > value.expiresAt) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    // If still too large, remove oldest entries
    if (cache.size > 100) {
      const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = cache.size - 80; // Keep 80 entries
      for (let i = 0; i < toRemove; i++) {
        cache.delete(entries[i][0]);
        cleaned++;
      }
    }
    
    console.log(`Industry cache cleanup: removed ${cleaned} entries, ${cache.size} remaining`);
  }
  
  static getStats(): { size: number; oldestEntry: number; newestEntry: number } {
    if (cache.size === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }
    
    const timestamps = Array.from(cache.values()).map(v => v.timestamp);
    return {
      size: cache.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}