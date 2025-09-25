'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { realMarketDataService } from '@/lib/market/realMarketDataService';

interface MarketDataPoint {
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

interface UseRealMarketDataOptions {
  symbols: string[];
  refreshInterval?: number;
  enabled?: boolean;
  autoRefresh?: boolean;
}

interface UseRealMarketDataReturn {
  data: MarketDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdate: number;
  refresh: () => void;
  getSymbolData: (symbol: string) => MarketDataPoint | undefined;
  isStale: boolean;
}

export function useRealMarketData({ 
  symbols, 
  refreshInterval = 180000, // 3 minutes - reasonable interval
  enabled = true,
  autoRefresh = true // Re-enable auto-refresh
}: UseRealMarketDataOptions): UseRealMarketDataReturn {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize symbols array to prevent unnecessary re-fetches
  const memoizedSymbols = useMemo(() => {
    return [...new Set(symbols.map(s => s.toUpperCase()))].sort();
  }, [symbols]);

  // Check if data is stale (older than refresh interval)
  const isStale = useMemo(() => {
    return lastUpdate > 0 && (Date.now() - lastUpdate) > refreshInterval;
  }, [lastUpdate, refreshInterval]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled || memoizedSymbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      if (showLoading) {
        setLoading(true);
      }
      
      console.log('📈 Fetching real market data for:', memoizedSymbols.join(', '));
      
      const result = await realMarketDataService.getMarketData(memoizedSymbols);
      
      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      setLastUpdate(Date.now());
      
      console.log('✅ Market data updated successfully');
      
      // Clear any retry timeout on successful fetch
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('❌ Market data fetch error:', err.message);
        
        // Implement exponential backoff retry for failures
        const retryDelay = Math.min(30000, 5000 * Math.pow(2, Math.random()));
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && enabled) {
            fetchData(false);
          }
        }, retryDelay);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [memoizedSymbols, enabled]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Get data for a specific symbol
  const getSymbolData = useCallback((symbol: string) => {
    return data.find(d => d.symbol === symbol.toUpperCase());
  }, [data]);

  // Initial fetch and interval setup
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, refreshInterval, enabled, autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Focus listener to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (enabled && isStale) {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, isStale, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    getSymbolData,
    isStale
  };
}

// Hook for single cryptocurrency
export function useRealCryptoPrice(symbol: string, refreshInterval = 300000) { // Increased to 5 minutes
  const { data, loading, error, lastUpdate, refresh, isStale } = useRealMarketData({
    symbols: [symbol],
    refreshInterval,
    enabled: !!symbol
  });

  return {
    data: data[0] || null,
    loading,
    error,
    lastUpdate,
    refresh,
    isStale
  };
}

// Hook for portfolio tracking with real prices
export function useRealPortfolioData(
  holdings: Array<{ symbol: string; amount: number }>,
  refreshInterval = 90000 // Increased to 90s for portfolio data
) {
  const symbols = useMemo(() => 
    holdings.map(h => h.symbol).filter(Boolean), 
    [holdings]
  );

  const { data, loading, error, lastUpdate, refresh, isStale } = useRealMarketData({
    symbols,
    refreshInterval,
    enabled: symbols.length > 0
  });

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!data.length) {
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent: 0,
        holdings: []
      };
    }

    let totalValue = 0;
    let totalChange24h = 0;
    
    const enrichedHoldings = holdings.map(holding => {
      const marketData = data.find(d => d.symbol === holding.symbol.toUpperCase());
      if (!marketData) return null;

      const value = holding.amount * marketData.price;
      const change24h = holding.amount * marketData.change24h;
      
      totalValue += value;
      totalChange24h += change24h;

      return {
        ...holding,
        ...marketData,
        value,
        change24h
      };
    }).filter(Boolean);

    const totalChangePercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

    return {
      totalValue,
      totalChange24h,
      totalChangePercent,
      holdings: enrichedHoldings
    };
  }, [data, holdings]);

  return {
    ...portfolioMetrics,
    loading,
    error,
    lastUpdate,
    refresh,
    isStale
  };
}
