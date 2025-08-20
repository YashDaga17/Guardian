'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Star,
  ExternalLink,
  BarChart3,
  Volume2,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { formatCurrency, formatPercent } from '@/lib/blockchain/dataProviders';

// Mock market data
const marketData = [
  {
    id: '1',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3200.15,
    change24h: 2.4,
    volume24h: 15000000000,
    marketCap: 385000000000,
    logo: '⟠',
    isWatchlisted: true,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 3200 + Math.sin(i / 4) * 100 + Math.random() * 50 - 25
    }))
  },
  {
    id: '2',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 47150.50,
    change24h: -1.2,
    volume24h: 25000000000,
    marketCap: 925000000000,
    logo: '₿',
    isWatchlisted: true,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 47000 + Math.sin(i / 3) * 800 + Math.random() * 200 - 100
    }))
  },
  {
    id: '3',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.001,
    change24h: 0.01,
    volume24h: 5000000000,
    marketCap: 25000000000,
    logo: '💵',
    isWatchlisted: false,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 1.0 + Math.random() * 0.004 - 0.002
    }))
  },
  {
    id: '4',
    symbol: 'LINK',
    name: 'Chainlink',
    price: 15.50,
    change24h: 5.2,
    volume24h: 800000000,
    marketCap: 9000000000,
    logo: '🔗',
    isWatchlisted: false,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 15.5 + Math.sin(i / 2) * 2 + Math.random() * 1 - 0.5
    }))
  },
  {
    id: '5',
    symbol: 'UNI',
    name: 'Uniswap',
    price: 6.30,
    change24h: -3.1,
    volume24h: 400000000,
    marketCap: 4700000000,
    logo: '🦄',
    isWatchlisted: true,
    sparklineData: Array.from({ length: 24 }, (_, i) => ({
      time: i,
      price: 6.3 + Math.sin(i / 5) * 0.8 + Math.random() * 0.3 - 0.15
    }))
  },
];

const topGainers = [
  { symbol: 'LINK', change: 5.2, price: 15.50 },
  { symbol: 'ETH', change: 2.4, price: 3200.15 },
  { symbol: 'USDC', change: 0.01, price: 1.001 },
];

const topLosers = [
  { symbol: 'UNI', change: -3.1, price: 6.30 },
  { symbol: 'BTC', change: -1.2, price: 47150.50 },
];

const marketStats = {
  totalMarketCap: 1350000000000,
  totalVolume24h: 45000000000,
  btcDominance: 42.5,
  fearGreedIndex: 73,
};

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'marketCap' | 'price' | 'change24h' | 'volume24h'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [watchlist, setWatchlist] = useState<Set<string>>(
    new Set(marketData.filter(token => token.isWatchlisted).map(token => token.id))
  );

  const filteredData = marketData.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * modifier;
  });

  const toggleWatchlist = (id: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(id)) {
      newWatchlist.delete(id);
    } else {
      newWatchlist.add(id);
    }
    setWatchlist(newWatchlist);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-muted-foreground">
            Real-time market data and trading interface
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
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketStats.totalMarketCap / 1e12)}T</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketStats.totalVolume24h / 1e9)}B</div>
            <p className="text-xs text-muted-foreground">
              -5.2% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC Dominance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketStats.btcDominance}%</div>
            <p className="text-xs text-muted-foreground">
              +0.8% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marketStats.fearGreedIndex}</div>
            <p className="text-xs text-muted-foreground">
              Greed
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price')}>
                    Price
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('change24h')}>
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
                {sortedData.map((token, index) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWatchlist(token.id)}
                      >
                        <Star 
                          className={`h-4 w-4 ${
                            watchlist.has(token.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
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
                        token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {token.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
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
                              stroke={token.change24h >= 0 ? "#10B981" : "#EF4444"}
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
