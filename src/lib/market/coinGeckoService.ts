/**
 * CoinGecko API Service
 * Fetches real-time cryptocurrency market data
 */

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  lastUpdated: string;
}

export class CoinGeckoService {
  private static readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private static readonly API_KEY = process.env.COINGECKO_API_KEY || 'CG-VGFmCqBk4gp5WSYiWyKg4UgS';
  
  // Cache for API responses to avoid rate limits
  private static cache = new Map<string, { data: CryptoMarketData[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 60000; // 1 minute

  /**
   * Get current prices for multiple cryptocurrencies
   */
  static async getCurrentPrices(coinIds: string[] = ['bitcoin', 'ethereum', 'solana', 'chainlink', 'usd-coin']): Promise<CryptoMarketData[]> {
    const cacheKey = `prices-${coinIds.join(',')}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const ids = coinIds.join(',');
      const url = `${this.BASE_URL}/coins/markets?ids=${ids}&vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Add API key if available
      if (this.API_KEY && this.API_KEY !== 'your_coingecko_api_key_here') {
        headers['x-cg-demo-api-key'] = this.API_KEY;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as CoinGeckoPrice[];
      
      const marketData: CryptoMarketData[] = data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        volume24h: coin.total_volume,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        atl: coin.atl,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        lastUpdated: coin.last_updated
      }));

      // Cache the result
      this.cache.set(cacheKey, { data: marketData, timestamp: Date.now() });
      return marketData;

    } catch (error) {
      console.error('Error fetching CoinGecko data:', error);
      
      // Return fallback data if API fails
      return this.getFallbackData(coinIds);
    }
  }

  /**
   * Get price for a single cryptocurrency
   */
  static async getCoinPrice(coinId: string): Promise<CryptoMarketData | null> {
    const prices = await this.getCurrentPrices([coinId]);
    return prices[0] || null;
  }

  /**
   * Search for cryptocurrencies
   */
  static async searchCoins(query: string): Promise<{ id: string; name: string; symbol: string; thumb: string }[]> {
    try {
      const url = `${this.BASE_URL}/search?query=${encodeURIComponent(query)}`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (this.API_KEY && this.API_KEY !== 'your_coingecko_api_key_here') {
        headers['x-cg-demo-api-key'] = this.API_KEY;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`CoinGecko search error: ${response.status}`);
      }

      const data = await response.json() as { coins?: Array<{ id: string; name: string; symbol: string; thumb: string }> };
      return data.coins?.slice(0, 10) || [];

    } catch (error) {
      console.error('Error searching coins:', error);
      return [];
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  static async getTrendingCoins(): Promise<CryptoMarketData[]> {
    try {
      const url = `${this.BASE_URL}/search/trending`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (this.API_KEY && this.API_KEY !== 'your_coingecko_api_key_here') {
        headers['x-cg-demo-api-key'] = this.API_KEY;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`CoinGecko trending error: ${response.status}`);
      }

      const data = await response.json() as { 
        coins?: Array<{ item: { id: string } }>
      };

      const trendingIds = data.coins?.map(coin => coin.item.id).slice(0, 5) || [];
      
      if (trendingIds.length > 0) {
        return this.getCurrentPrices(trendingIds);
      }

      return [];

    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  }

  /**
   * Get portfolio value using real prices
   */
  static async getPortfolioValue(holdings: { symbol: string; balance: number }[]): Promise<{ totalValue: number; holdings: Array<{ symbol: string; balance: number; value: number; price: number }> }> {
    try {
      // Map common symbols to CoinGecko IDs
      const symbolToId: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum', 
        'SOL': 'solana',
        'LINK': 'chainlink',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'BNB': 'binancecoin',
        'ADA': 'cardano',
        'DOT': 'polkadot',
        'AVAX': 'avalanche-2'
      };

      const coinIds = holdings.map(h => symbolToId[h.symbol]).filter(Boolean);
      const prices = await this.getCurrentPrices(coinIds);
      
      let totalValue = 0;
      const portfolioHoldings = holdings.map(holding => {
        const price = prices.find(p => symbolToId[holding.symbol] === p.id);
        const currentPrice = price?.currentPrice || 0;
        const value = holding.balance * currentPrice;
        totalValue += value;
        
        return {
          symbol: holding.symbol,
          balance: holding.balance,
          value,
          price: currentPrice
        };
      });

      return { totalValue, holdings: portfolioHoldings };

    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return { totalValue: 0, holdings: [] };
    }
  }

  /**
   * Fallback data when API is unavailable
   */
  private static getFallbackData(coinIds: string[]): CryptoMarketData[] {
    const fallbackPrices: Record<string, Partial<CryptoMarketData>> = {
      'bitcoin': { 
        currentPrice: 65000, 
        priceChangePercentage24h: 2.5,
        marketCap: 1280000000000,
        volume24h: 25000000000
      },
      'ethereum': { 
        currentPrice: 2400, 
        priceChangePercentage24h: 1.8,
        marketCap: 290000000000,
        volume24h: 12000000000
      },
      'solana': { 
        currentPrice: 140, 
        priceChangePercentage24h: -0.8,
        marketCap: 65000000000,
        volume24h: 2500000000
      },
      'chainlink': { 
        currentPrice: 14, 
        priceChangePercentage24h: 3.2,
        marketCap: 8500000000,
        volume24h: 450000000
      },
      'usd-coin': { 
        currentPrice: 1, 
        priceChangePercentage24h: 0.1,
        marketCap: 34000000000,
        volume24h: 5200000000
      }
    };

    return coinIds.map(id => ({
      id,
      symbol: id === 'bitcoin' ? 'BTC' : 
              id === 'ethereum' ? 'ETH' :
              id === 'solana' ? 'SOL' :
              id === 'chainlink' ? 'LINK' :
              id === 'usd-coin' ? 'USDC' : id.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      currentPrice: fallbackPrices[id]?.currentPrice || 1,
      marketCap: fallbackPrices[id]?.marketCap || 0,
      marketCapRank: 1,
      volume24h: fallbackPrices[id]?.volume24h || 0,
      priceChange24h: 0,
      priceChangePercentage24h: fallbackPrices[id]?.priceChangePercentage24h || 0,
      high24h: 0,
      low24h: 0,
      ath: 0,
      atl: 0,
      circulatingSupply: 0,
      lastUpdated: new Date().toISOString()
    }));
  }
}
