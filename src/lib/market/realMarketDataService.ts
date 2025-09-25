'use client';

/**
 * Real Market Data Service
 * Fetches actual cryptocurrency prices from CoinGecko API and other sources
 */

interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

interface CachedData {
  data: MarketData[];
  timestamp: number;
}

export class RealMarketDataService {
  private static instance: RealMarketDataService;
  private cache = new Map<string, CachedData>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

  // Cryptocurrency ID mapping for CoinGecko
  private readonly CRYPTO_MAPPING: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'COMP': 'compound',
    'CRV': 'curve-dao-token',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'MATIC': 'polygon',
    'AVAX': 'avalanche-2'
  };

  private constructor() {}

  public static getInstance(): RealMarketDataService {
    if (!RealMarketDataService.instance) {
      RealMarketDataService.instance = new RealMarketDataService();
    }
    return RealMarketDataService.instance;
  }

  /**
   * Fetch real market data for given symbols
   */
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    const cacheKey = symbols.sort().join(',');
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Convert symbols to CoinGecko IDs
      const coinIds = symbols
        .map(symbol => this.CRYPTO_MAPPING[symbol.toUpperCase()])
        .filter(Boolean);

      if (coinIds.length === 0) {
        throw new Error('No valid cryptocurrency symbols provided');
      }

      const data = await this.fetchFromCoinGecko(coinIds);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch real market data:', error);
      // Fallback to mock data if API fails
      return this.getFallbackData(symbols);
    }
  }

  /**
   * Fetch data from CoinGecko API
   */
  private async fetchFromCoinGecko(coinIds: string[]): Promise<MarketData[]> {
    const ids = coinIds.join(',');
    const url = `${this.BASE_URL}/coins/markets?ids=${ids}&vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key if available (for higher rate limits)
    if (this.API_KEY && this.API_KEY !== 'your_coingecko_api_key_here') {
      headers['x-cg-demo-api-key'] = this.API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited by CoinGecko API. Please try again later.');
      }
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data: CoinGeckoResponse[] = await response.json();
    
    return data.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_24h,
      changePercent24h: coin.price_change_percentage_24h,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      lastUpdated: coin.last_updated
    }));
  }

  /**
   * Fallback mock data when API is unavailable
   */
  private getFallbackData(symbols: string[]): MarketData[] {
    const mockPrices: Record<string, Partial<MarketData>> = {
      'BTC': { 
        price: 67000 + (Math.random() - 0.5) * 2000, 
        changePercent24h: (Math.random() - 0.5) * 8,
        volume24h: 25000000000,
        marketCap: 1300000000000
      },
      'ETH': { 
        price: 2600 + (Math.random() - 0.5) * 200, 
        changePercent24h: (Math.random() - 0.5) * 6,
        volume24h: 15000000000,
        marketCap: 315000000000
      },
      'USDC': { 
        price: 1.00 + (Math.random() - 0.5) * 0.01, 
        changePercent24h: (Math.random() - 0.5) * 0.1,
        volume24h: 5000000000,
        marketCap: 25000000000
      },
      'LINK': { 
        price: 11 + (Math.random() - 0.5) * 2, 
        changePercent24h: (Math.random() - 0.5) * 10,
        volume24h: 800000000,
        marketCap: 6500000000
      },
      'UNI': { 
        price: 7 + (Math.random() - 0.5) * 1, 
        changePercent24h: (Math.random() - 0.5) * 12,
        volume24h: 400000000,
        marketCap: 4200000000
      }
    };

    return symbols.map(symbol => {
      const mock = mockPrices[symbol.toUpperCase()] || {
        price: Math.random() * 100,
        changePercent24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
        marketCap: Math.random() * 10000000000
      };

      return {
        symbol: symbol.toUpperCase(),
        name: this.getTokenName(symbol),
        price: mock.price!,
        change24h: (mock.price! * mock.changePercent24h!) / 100,
        changePercent24h: mock.changePercent24h!,
        volume24h: mock.volume24h!,
        marketCap: mock.marketCap!,
        high24h: mock.price! * (1 + Math.random() * 0.05),
        low24h: mock.price! * (1 - Math.random() * 0.05),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  /**
   * Get human-readable token name
   */
  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'AAVE': 'Aave',
      'COMP': 'Compound',
      'CRV': 'Curve DAO Token',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche'
    };
    return names[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCoins(): Promise<MarketData[]> {
    try {
      const url = `${this.BASE_URL}/search/trending`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (this.API_KEY && this.API_KEY !== 'your_coingecko_api_key_here') {
        headers['x-cg-demo-api-key'] = this.API_KEY;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending coins');
      }

      const data = await response.json();
      const coinIds = data.coins.slice(0, 10).map((coin: { item: { id: string } }) => coin.item.id);
      
      return await this.fetchFromCoinGecko(coinIds);
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      // Return fallback trending data
      return await this.getMarketData(['BTC', 'ETH', 'SOL', 'LINK', 'UNI']);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Create singleton instance
export const realMarketDataService = RealMarketDataService.getInstance();
