'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star,
  StarOff,
  Bell,
  BellOff,
  MoreVertical,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { alphaVantageService } from '@/lib/market/alphaVantageService';
import { smartAlertsService } from '@/lib/alerts/smartAlertsService';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'etf' | 'forex';
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  isStarred: boolean;
  hasAlert: boolean;
  addedAt: number;
}

interface WatchlistProps {
  className?: string;
}

export function MultiAssetWatchlist({ className }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      price: 43250.00,
      change24h: 1250.75,
      changePercent: 2.98,
      volume: 28500000000,
      marketCap: 847000000000,
      isStarred: true,
      hasAlert: true,
      addedAt: Date.now() - 86400000
    },
    {
      id: '2',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'stock',
      price: 182.45,
      change24h: -2.15,
      changePercent: -1.16,
      volume: 45000000,
      marketCap: 2890000000000,
      isStarred: true,
      hasAlert: false,
      addedAt: Date.now() - 172800000
    },
    {
      id: '3',
      symbol: 'ETH',
      name: 'Ethereum',
      type: 'crypto',
      price: 2645.30,
      change24h: 85.20,
      changePercent: 3.33,
      volume: 15200000000,
      marketCap: 318000000000,
      isStarred: false,
      hasAlert: true,
      addedAt: Date.now() - 259200000
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'stock',
      price: 248.75,
      change24h: 12.40,
      changePercent: 5.24,
      volume: 98000000,
      marketCap: 790000000000,
      isStarred: false,
      hasAlert: false,
      addedAt: Date.now() - 345600000
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{symbol: string, name: string, type: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'crypto' | 'stock' | 'etf' | 'forex'>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Filter watchlist based on type and search
  const filteredWatchlist = watchlist.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Sort watchlist
  const sortedWatchlist = [...filteredWatchlist].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'change':
        return b.changePercent - a.changePercent;
      case 'volume':
        return b.volume - a.volume;
      default:
        return a.symbol.localeCompare(b.symbol);
    }
  });

  // Search for new assets to add
  const handleAssetSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await alphaVantageService.searchSymbols(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add asset to watchlist
  const addToWatchlist = async (symbol: string, name: string, type: string) => {
    if (watchlist.find(item => item.symbol === symbol)) {
      return; // Already in watchlist
    }

    try {
      const quote = await alphaVantageService.getRealTimeQuote(symbol);
      if (quote) {
        const newItem: WatchlistItem = {
          id: Date.now().toString(),
          symbol: quote.symbol,
          name,
          type: type.toLowerCase() as WatchlistItem['type'],
          price: quote.price,
          change24h: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          isStarred: false,
          hasAlert: false,
          addedAt: Date.now()
        };

        setWatchlist(prev => [...prev, newItem]);
        setIsAddDialogOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  // Toggle star
  const toggleStar = (id: string) => {
    setWatchlist(prev => prev.map(item => 
      item.id === id ? { ...item, isStarred: !item.isStarred } : item
    ));
  };

  // Toggle alert
  const toggleAlert = async (id: string) => {
    const item = watchlist.find(w => w.id === id);
    if (!item) return;

    try {
      if (item.hasAlert) {
        // Remove alert logic would go here
        setWatchlist(prev => prev.map(w => 
          w.id === id ? { ...w, hasAlert: false } : w
        ));
      } else {
        // Create new alert
        await smartAlertsService.createAlert({
          symbol: item.symbol,
          name: `${item.symbol} Price Alert`,
          type: 'percent_change',
          condition: { percentChange: 5 },
          currentPrice: item.price
        });
        
        setWatchlist(prev => prev.map(w => 
          w.id === id ? { ...w, hasAlert: true } : w
        ));
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Get asset type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crypto': return 'bg-orange-100 text-orange-700';
      case 'stock': return 'bg-blue-100 text-blue-700';
      case 'etf': return 'bg-green-100 text-green-700';
      case 'forex': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Multi-Asset Watchlist
            </CardTitle>
            <CardDescription>
              Track stocks, crypto, ETFs, and forex in one place
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Asset to Watchlist</DialogTitle>
                <DialogDescription>
                  Search for stocks, crypto, ETFs, or forex to add to your watchlist
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search symbols (e.g., AAPL, BTC, TSLA)..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleAssetSearch(e.target.value);
                    }}
                  />
                </div>
                
                {isSearching && (
                  <div className="text-center py-4 text-muted-foreground">
                    Searching...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((result) => (
                      <div 
                        key={result.symbol}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => addToWatchlist(result.symbol, result.name, result.type)}
                      >
                        <div>
                          <div className="font-medium">{result.symbol}</div>
                          <div className="text-sm text-muted-foreground">{result.name}</div>
                        </div>
                        <Badge className={getTypeColor(result.type.toLowerCase())}>
                          {result.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search watchlist..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(value: 'all' | 'crypto' | 'stock' | 'etf' | 'forex') => setSelectedType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="etf">ETFs</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'symbol' | 'price' | 'change' | 'volume') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="symbol">Symbol</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change">Change</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-3">
          {sortedWatchlist.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStar(item.id)}
                  className="p-1"
                >
                  {item.isStarred ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.symbol}</span>
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.price)}</div>
                  <div className={`text-sm flex items-center ${
                    item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div>Vol: {formatCurrency(item.volume)}</div>
                  {item.marketCap && <div>MCap: {formatCurrency(item.marketCap)}</div>}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAlert(item.id)}
                    className="p-1"
                  >
                    {item.hasAlert ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{item.symbol}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Create Alert</DropdownMenuItem>
                      <DropdownMenuItem>Add to Portfolio</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => removeFromWatchlist(item.id)}
                      >
                        Remove from Watchlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedWatchlist.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No assets match your search.' : 'Your watchlist is empty. Add some assets to get started!'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
