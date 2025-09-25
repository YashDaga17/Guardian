// Enhanced Market Data Service with Real-time Data and Database Storage
// Combines multiple data sources with performance optimizations

import { marketDataService as dbMarketDataService } from '@/lib/database/services';

interface MarketDataPoint {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

interface CachedData {
  data: MarketDataPoint;
  timestamp: number;
}

export class EnhancedMarketDataService {
  private cache: Map<string, CachedData> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private readonly coinApiKey: string;
  private readonly alphaVantageKey: string;

  constructor() {
    this.coinApiKey = process.env.NEXT_PUBLIC_COINAPI_KEY || '';
    this.alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';
  }

  /**
   * Get market data with caching to reduce API calls and re-renders
   */
  async getMarketData(symbols: string[]): Promise<MarketDataPoint[]> {
    const results: MarketDataPoint[] = [];
    const uncachedSymbols: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.cache.get(symbol);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        results.push(cached.data);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached data
    if (uncachedSymbols.length > 0) {
      const freshData = await this.fetchFreshData(uncachedSymbols);
      results.push(...freshData);
    }

    return results.sort((a, b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol));
  }

  /**
   * Fetch fresh data from multiple sources
   */
  private async fetchFreshData(symbols: string[]): Promise<MarketDataPoint[]> {
    const results: MarketDataPoint[] = [];

    for (const symbol of symbols) {
      try {
        let data: MarketDataPoint | null = null;

        // Try CoinAPI first for crypto
        if (this.isCryptoSymbol(symbol)) {
          data = await this.fetchFromCoinAPI(symbol);
        }

        // Fallback to Alpha Vantage for stocks or if CoinAPI fails
        if (!data && this.alphaVantageKey) {
          data = await this.fetchFromAlphaVantage(symbol);
        }

        // Final fallback to enhanced mock data
        if (!data) {
          data = this.getEnhancedMockData(symbol);
        }

        // Cache the result and save to database
        this.cache.set(symbol, {
          data,
          timestamp: Date.now()
        });

        // Save to database for persistence and historical tracking
        try {
          await dbMarketDataService.updateMarketData({
            symbol: data.symbol,
            name: this.getSymbolName(data.symbol),
            price: data.price,
            change24h: data.change24h,
            volume24h: data.volume24h,
            marketCap: data.marketCap
          });
          console.log('💾 Saved market data to database:', data.symbol);
        } catch (error) {
          console.warn('Failed to save market data to database:', error);
          // Continue without failing the request
        }

        results.push(data);
      } catch (error) {
        console.warn(`Failed to fetch data for ${symbol}:`, error);
        // Use mock data as fallback
        const mockData = this.getEnhancedMockData(symbol);
        this.cache.set(symbol, {
          data: mockData,
          timestamp: Date.now()
        });
        results.push(mockData);
      }
    }

    return results;
  }

  /**
   * Fetch from CoinAPI (better for crypto)
   */
  private async fetchFromCoinAPI(symbol: string): Promise<MarketDataPoint | null> {
    if (!this.coinApiKey) return null;

    try {
      const coinId = this.getCoinAPIId(symbol);
      const response = await fetch(
        `https://rest.coinapi.io/v1/exchangerate/${coinId}/USD`,
        {
          headers: {
            'X-CoinAPI-Key': this.coinApiKey
          }
        }
      );

      if (!response.ok) {
        console.warn(`CoinAPI error for ${symbol}:`, response.status);
        return null;
      }

      const data = await response.json();
      
      // Get additional market data
      const marketResponse = await fetch(
        `https://rest.coinapi.io/v1/assets/${coinId}`,
        {
          headers: {
            'X-CoinAPI-Key': this.coinApiKey
          }
        }
      );

      let marketData: { 
        volume_1day_usd?: number;
        market_cap_usd?: number;
      } = {};
      if (marketResponse.ok) {
        marketData = await marketResponse.json();
      }

      return {
        symbol,
        price: data.rate || 0,
        change24h: marketData.volume_1day_usd || 0,
        changePercent24h: ((Math.random() - 0.5) * 10), // Mock since not in free tier
        volume24h: marketData.volume_1day_usd || Math.random() * 1000000,
        marketCap: marketData.market_cap_usd || 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.warn(`CoinAPI fetch failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch from Alpha Vantage
   */
  private async fetchFromAlphaVantage(symbol: string): Promise<MarketDataPoint | null> {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
      );
      
      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        return null;
      }

      const quote = data['Global Quote'];
      if (!quote) return null;

      return {
        symbol,
        price: parseFloat(quote['05. price']) || 0,
        change24h: parseFloat(quote['09. change']) || 0,
        changePercent24h: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
        volume24h: parseFloat(quote['06. volume']) || 0,
        marketCap: 0, // Not available in Alpha Vantage free tier
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.warn(`Alpha Vantage fetch failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced mock data with realistic movements
   */
  private getEnhancedMockData(symbol: string): MarketDataPoint {
    const baseData = this.getBasePriceData(symbol);
    const volatility = this.getSymbolVolatility(symbol);
    
    // Generate realistic price movements
    const changePercent = (Math.random() - 0.5) * volatility;
    const change24h = baseData.price * (changePercent / 100);
    
    return {
      symbol,
      price: baseData.price + change24h,
      change24h,
      changePercent24h: changePercent,
      volume24h: baseData.volume * (0.8 + Math.random() * 0.4), // ±20% volume variation
      marketCap: baseData.marketCap,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get base price data for symbols
   */
  private getBasePriceData(symbol: string): { price: number; volume: number; marketCap: number } {
    const data: Record<string, { price: number; volume: number; marketCap: number }> = {
      'BTC': { price: 43250, volume: 15000000000, marketCap: 847000000000 },
      'ETH': { price: 2580, volume: 8000000000, marketCap: 310000000000 },
      'USDT': { price: 1.00, volume: 25000000000, marketCap: 95000000000 },
      'BNB': { price: 315, volume: 1200000000, marketCap: 47000000000 },
      'SOL': { price: 98, volume: 2500000000, marketCap: 42000000000 },
      'USDC': { price: 1.00, volume: 4500000000, marketCap: 25000000000 },
      'ADA': { price: 0.52, volume: 450000000, marketCap: 18000000000 },
      'AVAX': { price: 39, volume: 620000000, marketCap: 15000000000 },
      'DOGE': { price: 0.082, volume: 890000000, marketCap: 12000000000 },
      'LINK': { price: 15.8, volume: 780000000, marketCap: 9500000000 }
    };

    return data[symbol] || { price: 100 + Math.random() * 1000, volume: Math.random() * 1000000000, marketCap: Math.random() * 10000000000 };
  }

  /**
   * Get volatility factor for different symbols
   */
  private getSymbolVolatility(symbol: string): number {
    const volatilities: Record<string, number> = {
      'BTC': 8,
      'ETH': 10,
      'USDT': 0.1,
      'BNB': 12,
      'SOL': 15,
      'USDC': 0.1,
      'ADA': 18,
      'AVAX': 20,
      'DOGE': 25,
      'LINK': 16
    };

    return volatilities[symbol] || 15;
  }

  /**
   * Check if symbol is cryptocurrency
   */
  private isCryptoSymbol(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'ADA', 'AVAX', 'DOGE', 'LINK'];
    return cryptoSymbols.includes(symbol);
  }

  /**
   * Get CoinAPI asset ID
   */
  private getCoinAPIId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'BTC',
      'ETH': 'ETH',
      'USDT': 'USDT',
      'BNB': 'BNB',
      'SOL': 'SOL',
      'USDC': 'USDC',
      'ADA': 'ADA',
      'AVAX': 'AVAX',
      'DOGE': 'DOGE',
      'LINK': 'LINK'
    };

    return mapping[symbol] || symbol;
  }

  /**
   * Get human-readable name for symbol
   */
  private getSymbolName(symbol: string): string {
    const nameMapping: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDT': 'Tether',
      'BNB': 'BNB',
      'SOL': 'Solana',
      'USDC': 'USD Coin',
      'ADA': 'Cardano',
      'AVAX': 'Avalanche',
      'DOT': 'Polkadot',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'LTC': 'Litecoin',
      'ATOM': 'Cosmos',
      'XRP': 'XRP'
    };
    return nameMapping[symbol] || symbol;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const marketDataService = new EnhancedMarketDataService();
