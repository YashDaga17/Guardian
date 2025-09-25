'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Star,
  BarChart3,
  Volume2,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { useRealMarketData } from '@/hooks/useRealMarketData';

// Popular cryptocurrencies to track
const TRACKED_SYMBOLS = ['BTC', 'ETH', 'USDC', 'LINK', 'UNI', 'AAVE', 'COMP', 'CRV'];

// Helper functions
const getTokenLogo = (symbol: string): string => {
  const logos: Record<string, string> = {
    'BTC': '₿',
    'ETH': '⟠', 
    'USDC': '💵',
    'USDT': '💲',
    'LINK': '🔗',
    'UNI': '🦄',
    'AAVE': '👻',
    'COMP': '🏛️',
    'CRV': '🌀',
    'SOL': '☀️',
    'ADA': '🔷',
    'DOT': '⚪',
    'MATIC': '🟣',
    'AVAX': '🔺'
  };
  return logos[symbol] || '🪙';
};

const generateSparklineData = (currentPrice: number, changePercent: number) => {
  // Generate 24 data points for sparkline chart
  return Array.from({ length: 24 }, (_, i) => {
    const variance = (Math.random() - 0.5) * 0.02; // ±2% random variance
    const trend = (changePercent / 100) * (i / 24); // Apply overall trend
    const price = currentPrice * (1 - trend + variance);
    return {
      time: i,
      price: Math.max(price, 0.01)
    };
  });
};

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'marketCap' | 'price' | 'changePercent24h' | 'volume24h'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['BTC', 'ETH', 'LINK']));

  // Debounce search query to reduce filtering calculations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Use real market data with more conservative refresh
  const { 
    data: marketData, 
    loading, 
    error, 
    lastUpdate, 
    refresh, 
    isStale 
  } = useRealMarketData({
    symbols: TRACKED_SYMBOLS,
    refreshInterval: 180000, // 3 minutes - reasonable interval
    autoRefresh: true // Re-enabled for real-time data
  });

  // Memoize filtered and sorted data to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    if (!marketData.length) return [];

    // Add sparkline data (mock data for chart)
    const dataWithSparklines = marketData.map(token => ({
      ...token,
      id: token.symbol.toLowerCase(),
      logo: getTokenLogo(token.symbol),
      isWatchlisted: watchlist.has(token.symbol),
      sparklineData: generateSparklineData(token.price, token.changePercent24h)
    }));

    // Filter by debounced search query
    const filtered = dataWithSparklines.filter(token =>
      token.symbol.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    // Sort data
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'changePercent24h':
          aValue = a.changePercent24h;
          bValue = b.changePercent24h;
          break;
        case 'volume24h':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        default: // marketCap
          aValue = a.marketCap;
          bValue = b.marketCap;
      }
      
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * modifier;
    });

    return sorted;
  }, [marketData, debouncedSearchQuery, sortBy, sortOrder, watchlist]); // Use debounced search

  // Calculate market stats from real data
  const marketStats = useMemo(() => {
    if (!marketData.length) {
      return {
        totalMarketCap: 0,
        totalVolume24h: 0,
        btcDominance: 0,
        fearGreedIndex: 50
      };
    }

    const totalMarketCap = marketData.reduce((sum, token) => sum + token.marketCap, 0);
    const totalVolume24h = marketData.reduce((sum, token) => sum + token.volume24h, 0);
    
    const btcData = marketData.find(token => token.symbol === 'BTC');
    const btcDominance = btcData ? (btcData.marketCap / totalMarketCap) * 100 : 0;
    
    // Simple fear & greed calculation based on average price change
    const avgChange = marketData.reduce((sum, token) => sum + token.changePercent24h, 0) / marketData.length;
    const fearGreedIndex = Math.max(0, Math.min(100, 50 + avgChange * 5));

    return {
      totalMarketCap,
      totalVolume24h,
      btcDominance,
      fearGreedIndex
    };
  }, [marketData]);

  // Get top gainers and losers
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...marketData].sort((a, b) => b.changePercent24h - a.changePercent24h);
    return {
      topGainers: sorted.slice(0, 3).map(token => ({
        symbol: token.symbol,
        change: token.changePercent24h,
        price: token.price
      })),
      topLosers: sorted.slice(-3).reverse().map(token => ({
        symbol: token.symbol,
        change: token.changePercent24h,
        price: token.price
      }))
    };
  }, [marketData]);

  // Memoized handlers
  const handleSort = useCallback((column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(symbol)) {
        newWatchlist.delete(symbol);
      } else {
        newWatchlist.add(symbol);
      }
      return newWatchlist;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Format currency helper
  const formatCurrency = useCallback((value: number): string => {
    if (value >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      }).format(value);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Real-time market data and trading interface
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isStale ? (
              <WifiOff className="h-4 w-4 text-amber-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
            {lastUpdate && (
              <span className="text-xs">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <WifiOff className="h-4 w-4" />
              <span>Failed to load market data: {error}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(marketStats.totalMarketCap / 1e12)}T
            </div>
            <p className="text-xs text-muted-foreground">
              Total market capitalization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(marketStats.totalVolume24h / 1e9)}B
            </div>
            <p className="text-xs text-muted-foreground">
              24-hour trading volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC Dominance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketStats.btcDominance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Bitcoin market dominance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              marketStats.fearGreedIndex > 60 ? 'text-green-600' : 
              marketStats.fearGreedIndex > 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(marketStats.fearGreedIndex)}
            </div>
            <p className="text-xs text-muted-foreground">
              {marketStats.fearGreedIndex > 60 ? 'Greed' : 
               marketStats.fearGreedIndex > 40 ? 'Neutral' : 'Fear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Gainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topGainers.map((token, index) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="font-medium">{token.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(token.price)}</div>
                    <div className="text-sm text-green-600">+{token.change.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Losers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLosers.map((token, index) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="font-medium">{token.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(token.price)}</div>
                    <div className="text-sm text-red-600">{token.change.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Data Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Market Data</CardTitle>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  <TabsTrigger value="defi">DeFi</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading && processedData.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading market data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price')}>
                      Price
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('changePercent24h')}>
                      24h Change
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('volume24h')}>
                      Volume
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort('marketCap')}>
                      Market Cap
                    </TableHead>
                    <TableHead className="text-right">7d Chart</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWatchlist(token.symbol)}
                        >
                          <Star 
                            className={`h-4 w-4 ${
                              token.isWatchlisted ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{token.logo}</span>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(token.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end ${
                          token.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {token.changePercent24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {token.changePercent24h >= 0 ? '+' : ''}{token.changePercent24h.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(token.volume24h / 1e9)}B
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(token.marketCap / 1e9)}B
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="w-20 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={token.sparklineData}>
                              <Line 
                                type="monotone" 
                                dataKey="price" 
                                stroke={token.changePercent24h >= 0 ? "#10B981" : "#EF4444"}
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Trade</CardTitle>
            <CardDescription>
              Trade tokens with optimized execution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TradingPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
