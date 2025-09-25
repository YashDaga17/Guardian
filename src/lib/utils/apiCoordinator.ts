/**
 * Centralized API Coordinator for Tradely DeFi Platform
 * Manages all API calls to prevent excessive network requests and improve performance
 */

import { realMarketDataService } from '@/lib/market/realMarketDataService';
import { geminiAI } from '@/lib/ai/geminiService';

interface APICoordinatorConfig {
  marketDataInterval: number;
  aiInsightsInterval: number;
  portfolioInterval: number;
  maxConcurrentRequests: number;
  requestDeduplication: boolean;
}

interface RequestQueue {
  id: string;
  type: 'market' | 'ai' | 'portfolio';
  priority: number;
  timestamp: number;
  promise?: Promise<unknown>;
}

class APICoordinator {
  private config: APICoordinatorConfig = {
    marketDataInterval: 5 * 60 * 1000, // 5 minutes
    aiInsightsInterval: 2 * 60 * 60 * 1000, // 2 hours  
    portfolioInterval: 3 * 60 * 1000, // 3 minutes
    maxConcurrentRequests: 3,
    requestDeduplication: true
  };

  private activeRequests = new Map<string, Promise<unknown>>();
  private requestQueue: RequestQueue[] = [];
  private lastRequestTimes = new Map<string, number>();
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private isEnabled = true;

  constructor() {
    this.startCoordination();
  }

  /**
   * Start the API coordination system
   */
  private startCoordination(): void {
    console.log('🎯 Starting API Coordinator with optimized intervals');
    
    // Market data coordination - every 5 minutes
    this.intervals.set('market', setInterval(() => {
      if (this.shouldFetch('market', this.config.marketDataInterval)) {
        this.queueRequest({
          id: 'market-data',
          type: 'market',
          priority: 1,
          timestamp: Date.now()
        });
      }
    }, this.config.marketDataInterval));

    // Portfolio data coordination - every 3 minutes
    this.intervals.set('portfolio', setInterval(() => {
      if (this.shouldFetch('portfolio', this.config.portfolioInterval)) {
        this.queueRequest({
          id: 'portfolio-data',
          type: 'portfolio', 
          priority: 2,
          timestamp: Date.now()
        });
      }
    }, this.config.portfolioInterval));

    // AI insights coordination - every 2 hours
    this.intervals.set('ai', setInterval(() => {
      if (this.shouldFetch('ai', this.config.aiInsightsInterval)) {
        this.queueRequest({
          id: 'ai-insights',
          type: 'ai',
          priority: 3,
          timestamp: Date.now()
        });
      }
    }, this.config.aiInsightsInterval));
  }

  /**
   * Check if we should fetch data based on timing
   */
  private shouldFetch(type: string, interval: number): boolean {
    const lastRequest = this.lastRequestTimes.get(type) || 0;
    const now = Date.now();
    return (now - lastRequest) >= interval;
  }

  /**
   * Queue API request with deduplication
   */
  private queueRequest(request: RequestQueue): void {
    if (!this.isEnabled) return;

    // Check for duplicate requests
    if (this.config.requestDeduplication) {
      const existingRequest = this.requestQueue.find(r => r.id === request.id);
      if (existingRequest || this.activeRequests.has(request.id)) {
        console.log(`⚡ Deduplicating request: ${request.id}`);
        return;
      }
    }

    this.requestQueue.push(request);
    this.processQueue();
  }

  /**
   * Process queued requests respecting concurrency limits
   */
  private async processQueue(): Promise<void> {
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }

    // Sort by priority and timestamp
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.timestamp - b.timestamp;
    });

    const nextRequest = this.requestQueue.shift();
    if (!nextRequest) return;

    await this.executeRequest(nextRequest);
    
    // Process next request if queue has more
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Execute individual API request
   */
  private async executeRequest(request: RequestQueue): Promise<void> {
    const cacheKey = `${request.type}-${request.id}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`💾 Using cached data for: ${request.id}`);
      return;
    }

    try {
      console.log(`🚀 Executing API request: ${request.id}`);
      
      let promise: Promise<unknown>;
      
      switch (request.type) {
        case 'market':
          promise = this.fetchMarketData();
          break;
        case 'portfolio':
          promise = this.fetchPortfolioData();
          break;
        case 'ai':
          promise = this.fetchAIInsights();
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      this.activeRequests.set(request.id, promise);
      const result = await promise;
      
      // Cache successful results
      this.setCache(cacheKey, result, this.getCacheTTL(request.type));
      this.lastRequestTimes.set(request.type, Date.now());
      
      console.log(`✅ API request completed: ${request.id}`);
      
    } catch (error) {
      console.error(`❌ API request failed: ${request.id}`, error);
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Fetch market data
   */
  private async fetchMarketData(): Promise<unknown> {
    const symbols = ['BTC', 'ETH', 'USDC', 'LINK', 'UNI', 'AAVE', 'SOL', 'ADA', 'DOT', 'MATIC'];
    return await realMarketDataService.getMarketData(symbols);
  }

  /**
   * Fetch portfolio data
   */
  private async fetchPortfolioData(): Promise<unknown> {
    // This would connect to wallet/portfolio service
    return { status: 'mock-portfolio-data' };
  }

  /**
   * Fetch AI insights
   */
  private async fetchAIInsights(): Promise<unknown> {
    try {
      const marketData = await this.getFromCache('market-data') || [];
      if (Array.isArray(marketData) && marketData.length > 0) {
        return await geminiAI.analyzeMarket(marketData);
      }
    } catch (error) {
      console.error('AI insights request failed:', error);
    }
    return null;
  }

  /**
   * Get cache TTL based on data type
   */
  private getCacheTTL(type: string): number {
    switch (type) {
      case 'market': return 4 * 60 * 1000; // 4 minutes
      case 'portfolio': return 2 * 60 * 1000; // 2 minutes
      case 'ai': return 90 * 60 * 1000; // 90 minutes
      default: return 60 * 1000; // 1 minute
    }
  }

  /**
   * Cache management
   */
  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getFromCache(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = (Date.now() - entry.timestamp) > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Get current status
   */
  public getStatus(): {
    activeRequests: number;
    queuedRequests: number;
    cacheSize: number;
    lastRequests: Record<string, number>;
  } {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      cacheSize: this.cache.size,
      lastRequests: Object.fromEntries(this.lastRequestTimes)
    };
  }

  /**
   * Manual refresh for specific data type
   */
  public async refresh(type: 'market' | 'portfolio' | 'ai'): Promise<void> {
    const request: RequestQueue = {
      id: `${type}-manual-refresh`,
      type,
      priority: 0, // Highest priority
      timestamp: Date.now()
    };
    
    this.queueRequest(request);
  }

  /**
   * Enable/disable API coordination
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.cleanup();
    } else if (!this.intervals.size) {
      this.startCoordination();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.activeRequests.clear();
    this.requestQueue.length = 0;
  }

  /**
   * Destroy coordinator
   */
  public destroy(): void {
    this.cleanup();
    this.cache.clear();
    this.lastRequestTimes.clear();
  }
}

// Create singleton instance
export const apiCoordinator = new APICoordinator();

// React hook for components to access coordinated data
export function useAPICoordinator() {
  return {
    refresh: (type: 'market' | 'portfolio' | 'ai') => apiCoordinator.refresh(type),
    getStatus: () => apiCoordinator.getStatus(),
    setEnabled: (enabled: boolean) => apiCoordinator.setEnabled(enabled)
  };
}

export default apiCoordinator;
