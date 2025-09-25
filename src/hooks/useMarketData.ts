'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { marketDataService } from '@/lib/market/enhancedMarketDataService';

interface MarketDataPoint {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

interface UseMarketDataOptions {
  symbols: string[];
  refreshInterval?: number;
  enabled?: boolean;
}

export function useMarketData({ symbols, refreshInterval = 300000, enabled = true }: UseMarketDataOptions) {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Memoize symbols array to prevent infinite re-renders
  const _symbolsString = useMemo(() => symbols.join(','), [symbols]);

  const fetchData = useCallback(async () => {
    if (!enabled || symbols.length === 0) return;

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      const result = await marketDataService.getMarketData(symbols);
      
      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      setLastUpdate(Date.now());
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Market data fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [symbols, enabled]); // Removed symbolsString as it's derived from symbols

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up interval for periodic updates
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    intervalRef.current = setInterval(fetchData, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const getSymbolData = useCallback((symbol: string) => {
    return data.find(d => d.symbol === symbol);
  }, [data]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    getSymbolData
  };
}

// Hook for single symbol with memoization
export function useSingleMarketData(symbol: string, refreshInterval = 30000) {
  const { data, loading, error, lastUpdate, refresh } = useMarketData({
    symbols: [symbol],
    refreshInterval,
    enabled: !!symbol
  });

  return {
    data: data[0] || null,
    loading,
    error,
    lastUpdate,
    refresh
  };
}

// Hook for portfolio data with performance optimization
export function usePortfolioData(symbols: string[], enabled = true) {
  const { data, loading, error, lastUpdate, refresh } = useMarketData({
    symbols,
    refreshInterval: 30000,
    enabled
  });

  const totalValue = data.reduce((sum, item) => sum + item.price, 0);
  const totalChange24h = data.reduce((sum, item) => sum + item.change24h, 0);
  const totalChangePercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    totalValue,
    totalChange24h,
    totalChangePercent
  };
}
