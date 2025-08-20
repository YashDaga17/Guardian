import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, polygon, arbitrum } from 'viem/chains';

// Chain configurations
export const SUPPORTED_CHAINS = {
  ethereum: mainnet,
  polygon: polygon,
  arbitrum: arbitrum,
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

// Create public clients for each chain
const publicClients = {
  ethereum: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
  polygon: createPublicClient({
    chain: polygon,
    transport: http(),
  }),
  arbitrum: createPublicClient({
    chain: arbitrum,
    transport: http(),
  }),
};

// Token interfaces
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  formattedBalance: string;
  value: string;
  price: string;
  change24h: number;
}

export interface PriceData {
  price: string;
  change24h: number;
  change7d: number;
  marketCap: string;
  volume24h: string;
  lastUpdated: number;
}

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
  lastUpdated: number;
}

// WebSocket connection manager
class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string, onMessage: (data: unknown) => void, onError?: (error: unknown) => void): void {
    if (this.connections.has(url)) {
      return;
    }

    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log(`WebSocket connected: ${url}`);
      this.reconnectAttempts.set(url, 0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected: ${url}`);
      this.connections.delete(url);
      this.handleReconnect(url, onMessage, onError);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error: ${url}`, error);
      if (onError) onError(error);
    };

    this.connections.set(url, ws);
  }

  private handleReconnect(url: string, onMessage: (data: unknown) => void, onError?: (error: unknown) => void): void {
    const attempts = this.reconnectAttempts.get(url) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect to ${url} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(url, attempts + 1);
        this.connect(url, onMessage, onError);
      }, this.reconnectDelay * Math.pow(2, attempts));
    } else {
      console.error(`Max reconnection attempts reached for ${url}`);
    }
  }

  disconnect(url: string): void {
    const ws = this.connections.get(url);
    if (ws) {
      ws.close();
      this.connections.delete(url);
    }
  }

  disconnectAll(): void {
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
  }
}

// Price cache manager
class PriceCache {
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private cacheExpiry = 30000; // 30 seconds

  get(key: string): PriceData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: PriceData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize managers
const wsManager = new WebSocketManager();
const priceCache = new PriceCache();

// Data provider class
export class BlockchainDataProvider {
  private priceSubscriptions: Map<string, Set<(data: PriceData) => void>> = new Map();

  // Get token balances for an address
  async getTokenBalances(address: string, chain: SupportedChain = 'ethereum'): Promise<TokenBalance[]> {
    try {
      const client = publicClients[chain];
      
      // This is a simplified implementation
      // In a real app, you'd use a service like Moralis, Alchemy, or The Graph
      const ethBalance = await client.getBalance({ address: address as `0x${string}` });
      
      const mockTokens: Token[] = [
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
        },
        {
          address: '0xA0b86a33E6441319E7BC1c1C4C7E3aaE8A3F7B3E',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        {
          address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
          symbol: 'LINK',
          name: 'Chainlink',
          decimals: 18,
        },
      ];

      const balances: TokenBalance[] = [];
      
      for (const token of mockTokens) {
        let balance = '0';
        
        if (token.symbol === 'ETH') {
          balance = formatUnits(ethBalance, 18);
        } else {
          // For ERC-20 tokens, you'd call the balanceOf function
          // This is mock data for demonstration
          balance = (Math.random() * 1000).toFixed(6);
        }

        const price = await this.getTokenPrice(token.symbol);
        const value = (parseFloat(balance) * parseFloat(price.price)).toFixed(2);

        balances.push({
          token,
          balance,
          formattedBalance: parseFloat(balance).toFixed(6),
          value,
          price: price.price,
          change24h: price.change24h,
        });
      }

      return balances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw new Error('Failed to fetch token balances');
    }
  }

  // Get token price data
  async getTokenPrice(symbol: string): Promise<PriceData> {
    const cacheKey = `price_${symbol.toLowerCase()}`;
    const cached = priceCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Mock price data - in a real app, use CoinGecko, CoinMarketCap, or DEX APIs
      const mockPrices: Record<string, Partial<PriceData>> = {
        eth: { price: '3200', change24h: 2.5, change7d: -1.2, marketCap: '385000000000', volume24h: '15000000000' },
        usdc: { price: '1.00', change24h: 0.01, change7d: 0.02, marketCap: '25000000000', volume24h: '2000000000' },
        link: { price: '15.50', change24h: 5.2, change7d: 8.1, marketCap: '9000000000', volume24h: '500000000' },
      };

      const mockData = mockPrices[symbol.toLowerCase()] || {
        price: '1.00',
        change24h: 0,
        change7d: 0,
        marketCap: '0',
        volume24h: '0'
      };

      const priceData: PriceData = {
        price: mockData.price || '0',
        change24h: mockData.change24h || 0,
        change7d: mockData.change7d || 0,
        marketCap: mockData.marketCap || '0',
        volume24h: mockData.volume24h || '0',
        lastUpdated: Date.now(),
      };

      priceCache.set(cacheKey, priceData);
      return priceData;
    } catch (error) {
      console.error('Error fetching token price:', error);
      throw new Error('Failed to fetch token price');
    }
  }

  // Subscribe to live price updates
  subscribeToPriceUpdates(symbol: string, callback: (data: PriceData) => void): () => void {
    const key = symbol.toLowerCase();
    
    if (!this.priceSubscriptions.has(key)) {
      this.priceSubscriptions.set(key, new Set());
      
      // Start WebSocket connection for this symbol
      const wsUrl = `wss://stream.coinapi.io/v1/`;
      wsManager.connect(
        wsUrl,
        (data) => {
          // Type guard for price data
          if (typeof data === 'object' && data && 
              'symbol_id' in data && 'price' in data && 
              data.symbol_id === symbol) {
            const priceUpdate = data as { symbol_id: string; price: number; change_24h?: number };
            const priceData: PriceData = {
              price: String(priceUpdate.price),
              change24h: priceUpdate.change_24h || 0,
              change7d: 0,
              marketCap: '0',
              volume24h: '0',
              lastUpdated: Date.now(),
            };
            
            // Notify all subscribers
            const subscribers = this.priceSubscriptions.get(key);
            if (subscribers) {
              subscribers.forEach(cb => cb(priceData));
            }
          }
        },
        (error) => console.error(`Price feed error for ${symbol}:`, error)
      );
    }

    this.priceSubscriptions.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.priceSubscriptions.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.priceSubscriptions.delete(key);
          wsManager.disconnect(`wss://stream.coinapi.io/v1/`);
        }
      }
    };
  }

  // Get current gas prices
  async getGasPrices(chain: SupportedChain = 'ethereum'): Promise<GasPrice> {
    try {
      const client = publicClients[chain];
      const gasPrice = await client.getGasPrice();
      
      // Convert to gwei and create different speed tiers
      const basePrice = parseFloat(formatUnits(gasPrice, 9));
      
      return {
        slow: (basePrice * 0.8).toFixed(1),
        standard: basePrice.toFixed(1),
        fast: (basePrice * 1.25).toFixed(1),
        instant: (basePrice * 1.5).toFixed(1),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      throw new Error('Failed to fetch gas prices');
    }
  }

  // Get DeFi protocol APYs
  async getProtocolAPYs(): Promise<Array<{ protocol: string; apy: number; tvl: string; }>> {
    try {
      // Mock DeFi protocol data
      return [
        { protocol: 'Aave', apy: 4.5, tvl: '12.5B' },
        { protocol: 'Compound', apy: 3.8, tvl: '8.2B' },
        { protocol: 'Uniswap V3', apy: 6.2, tvl: '4.1B' },
        { protocol: 'Curve', apy: 5.1, tvl: '3.8B' },
        { protocol: 'Yearn', apy: 7.3, tvl: '2.1B' },
      ];
    } catch (error) {
      console.error('Error fetching protocol APYs:', error);
      throw new Error('Failed to fetch protocol APYs');
    }
  }

  // Get historical price data
  async getHistoricalPrices(
    symbol: string,
    timeframe: '1h' | '1d' | '7d' | '30d' | '1y' = '7d'
  ): Promise<Array<{ timestamp: number; price: number; volume: number; }>> {
    try {
      // Mock historical data
      const now = Date.now();
      const intervals = {
        '1h': { points: 60, interval: 60 * 1000 },
        '1d': { points: 24, interval: 60 * 60 * 1000 },
        '7d': { points: 7, interval: 24 * 60 * 60 * 1000 },
        '30d': { points: 30, interval: 24 * 60 * 60 * 1000 },
        '1y': { points: 365, interval: 24 * 60 * 60 * 1000 },
      };

      const config = intervals[timeframe];
      const basePrice = parseFloat((await this.getTokenPrice(symbol)).price);
      
      return Array.from({ length: config.points }, (_, i) => {
        const timestamp = now - (config.points - i - 1) * config.interval;
        const volatility = 0.1;
        const trend = Math.sin(i / config.points * Math.PI * 2) * 0.05;
        const noise = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + trend + noise);
        
        return {
          timestamp,
          price: Math.max(price, 0.01),
          volume: Math.random() * 1000000,
        };
      });
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      throw new Error('Failed to fetch historical prices');
    }
  }

  // Clean up resources
  cleanup(): void {
    wsManager.disconnectAll();
    priceCache.clear();
    this.priceSubscriptions.clear();
  }
}

// Create singleton instance
export const blockchainDataProvider = new BlockchainDataProvider();

// Utility functions
export const formatCurrency = (value: string | number, currency = 'USD'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};
