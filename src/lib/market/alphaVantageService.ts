// Alpha Vantage API Service
// Implements real-time market data as specified in PDF requirements

interface AlphaVantageQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

interface AlphaVantageTimeSeriesData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';
  }

  /**
   * Get real-time quote for a symbol
   */
  async getRealTimeQuote(symbol: string): Promise<AlphaVantageQuote | null> {
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return this.getMockQuote(symbol);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        console.warn('Alpha Vantage API limit reached, using mock data');
        return this.getMockQuote(symbol);
      }

      const quote = data['Global Quote'];
      if (!quote) {
        return this.getMockQuote(symbol);
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume'])
      };
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return this.getMockQuote(symbol);
    }
  }

  /**
   * Get intraday time series data
   */
  async getIntradayData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'): Promise<AlphaVantageTimeSeriesData[]> {
    if (!this.apiKey) {
      return this.getMockTimeSeriesData(symbol);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        console.warn('Alpha Vantage API limit reached, using mock data');
        return this.getMockTimeSeriesData(symbol);
      }

      const timeSeries = data[`Time Series (${interval})`];
      if (!timeSeries) {
        return this.getMockTimeSeriesData(symbol);
      }

      return Object.entries(timeSeries).map(([timestamp, values]) => {
        const valuesRecord = values as Record<string, string>;
        return {
          timestamp,
          open: parseFloat(valuesRecord['1. open']),
          high: parseFloat(valuesRecord['2. high']),
          low: parseFloat(valuesRecord['3. low']),
          close: parseFloat(valuesRecord['4. close']),
          volume: parseInt(valuesRecord['5. volume'])
        };
      }).slice(0, 100); // Limit to last 100 data points
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return this.getMockTimeSeriesData(symbol);
    }
  }

  /**
   * Get multiple quotes at once
   */
  async getMultipleQuotes(symbols: string[]): Promise<AlphaVantageQuote[]> {
    const quotes = await Promise.all(
      symbols.map(symbol => this.getRealTimeQuote(symbol))
    );
    
    return quotes.filter(quote => quote !== null) as AlphaVantageQuote[];
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<Array<{symbol: string, name: string, type: string}>> {
    if (!this.apiKey) {
      return this.getMockSearchResults(query);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        return this.getMockSearchResults(query);
      }

      const matches = data.bestMatches || [];
      return matches.slice(0, 10).map((match: Record<string, string>) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type']
      }));
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return this.getMockSearchResults(query);
    }
  }

  // Mock data methods for fallback
  private getMockQuote(symbol: string): AlphaVantageQuote {
    const basePrice = Math.random() * 1000 + 10;
    const change = (Math.random() - 0.5) * basePrice * 0.1;
    
    return {
      symbol,
      price: basePrice,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 10000000)
    };
  }

  private getMockTimeSeriesData(_symbol: string): AlphaVantageTimeSeriesData[] {
    const data = [];
    const basePrice = Math.random() * 1000 + 10;
    let currentPrice = basePrice;
    
    for (let i = 99; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 5 * 60 * 1000).toISOString();
      const volatility = currentPrice * 0.02;
      const change = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000)
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  private getMockSearchResults(query: string): Array<{symbol: string, name: string, type: string}> {
    const mockSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity' }
    ];
    
    return mockSymbols.filter(item => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService();
