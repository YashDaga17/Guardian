'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  ArrowUpDown, 
  Filter,
  MoreHorizontal,
  PieChart,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  AlertTriangle,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/blockchain/dataProviders';

// Mock portfolio data
const portfolioAssets = [
  {
    id: '1',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '15.2456',
    value: 48782.40,
    price: 3200.15,
    change24h: 2.4,
    allocation: 45.2,
    logo: '⟠',
  },
  {
    id: '2',
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: '0.5823',
    value: 27451.30,
    price: 47150.50,
    change24h: -1.2,
    allocation: 25.4,
    logo: '₿',
  },
  {
    id: '3',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '15420.50',
    value: 15435.20,
    price: 1.001,
    change24h: 0.01,
    allocation: 14.3,
    logo: '💵',
  },
  {
    id: '4',
    symbol: 'LINK',
    name: 'Chainlink',
    balance: '542.10',
    value: 8403.55,
    price: 15.50,
    change24h: 5.2,
    allocation: 7.8,
    logo: '🔗',
  },
  {
    id: '5',
    symbol: 'UNI',
    name: 'Uniswap',
    balance: '1250.75',
    value: 7879.73,
    price: 6.30,
    change24h: -3.1,
    allocation: 7.3,
    logo: '🦄',
  },
];

const performanceData = [
  { date: '2024-01-01', value: 100000, btc: 98000, eth: 102000 },
  { date: '2024-01-08', value: 105000, btc: 101000, eth: 108000 },
  { date: '2024-01-15', value: 102000, btc: 99500, eth: 104500 },
  { date: '2024-01-22', value: 108000, btc: 103500, eth: 112500 },
  { date: '2024-01-29', value: 115000, btc: 108000, eth: 122000 },
  { date: '2024-02-05', value: 118000, btc: 110500, eth: 125500 },
  { date: '2024-02-12', value: 107952, btc: 101200, eth: 114704 },
];

const riskMetrics = {
  sharpeRatio: 1.42,
  volatility: 18.5,
  maxDrawdown: -12.3,
  beta: 0.85,
  alpha: 4.2,
  var95: -8.7,
};

const allocationData = portfolioAssets.map(asset => ({
  name: asset.symbol,
  value: asset.allocation,
  color: asset.symbol === 'ETH' ? '#627EEA' : 
         asset.symbol === 'BTC' ? '#F7931A' :
         asset.symbol === 'USDC' ? '#2775CA' :
         asset.symbol === 'LINK' ? '#375BD2' : '#8B5CF6'
}));

export default function Portfolio() {
  const [sortBy, setSortBy] = useState<'value' | 'change24h' | 'allocation'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('30d');

  const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalChange24h = portfolioAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);
  const totalChangePercent = (totalChange24h / totalValue) * 100;

  const sortedAssets = [...portfolioAssets].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * modifier;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your assets and track performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className={`text-xs ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChangePercent >= 0 ? '+' : ''}{formatCurrency(totalChange24h)} ({totalChangePercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted returns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics.volatility}%</div>
            <p className="text-xs text-muted-foreground">
              30-day volatility
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskMetrics.maxDrawdown}%</div>
            <p className="text-xs text-muted-foreground">
              Largest peak-to-trough decline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Compare your performance vs benchmarks</CardDescription>
              </div>
              <Tabs value={timeframe} onValueChange={(value: string) => setTimeframe(value as '24h' | '7d' | '30d' | '1y')}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="24h">24H</TabsTrigger>
                  <TabsTrigger value="7d">7D</TabsTrigger>
                  <TabsTrigger value="30d">30D</TabsTrigger>
                  <TabsTrigger value="1y">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'value' ? 'Portfolio' : String(name).toUpperCase()
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Portfolio"
                />
                <Line 
                  type="monotone" 
                  dataKey="btc" 
                  stroke="#F7931A" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="BTC"
                />
                <Line 
                  type="monotone" 
                  dataKey="eth" 
                  stroke="#627EEA" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="ETH"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Current portfolio distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {allocationData.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: asset.color }} 
                    />
                    <span className="text-sm font-medium">{asset.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{asset.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Detailed view of your portfolio assets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('value')}>
                  <div className="flex items-center justify-end">
                    Value
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('change24h')}>
                  <div className="flex items-center justify-end">
                    24h Change
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('allocation')}>
                  <div className="flex items-center justify-end">
                    Allocation
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{asset.logo}</span>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(asset.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(asset.balance).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(asset.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end ${
                      asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.change24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{asset.allocation.toFixed(1)}%</span>
                      <Progress value={asset.allocation} className="w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Buy More</DropdownMenuItem>
                        <DropdownMenuItem>Sell</DropdownMenuItem>
                        <DropdownMenuItem>Swap</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
          <CardDescription>Portfolio risk metrics and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.sharpeRatio}</span>
                </div>
                <Progress value={(riskMetrics.sharpeRatio / 3) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.sharpeRatio > 1.5 ? 'Excellent' : riskMetrics.sharpeRatio > 1 ? 'Good' : 'Poor'} risk-adjusted returns
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Beta (vs Market)</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.beta}</span>
                </div>
                <Progress value={riskMetrics.beta * 50} />
                <p className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.beta < 1 ? 'Lower' : riskMetrics.beta > 1 ? 'Higher' : 'Same'} volatility than market
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Alpha</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.alpha}%</span>
                </div>
                <Progress value={(riskMetrics.alpha + 10) * 5} />
                <p className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.alpha > 0 ? 'Outperforming' : 'Underperforming'} the market
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Volatility</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.volatility}%</span>
                </div>
                <Progress value={riskMetrics.volatility * 2} />
                <p className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.volatility < 15 ? 'Low' : riskMetrics.volatility < 25 ? 'Moderate' : 'High'} volatility
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Value at Risk (95%)</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.var95}%</span>
                </div>
                <Progress value={Math.abs(riskMetrics.var95) * 5} className="bg-red-100" />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum expected loss in worst 5% of cases
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Max Drawdown</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.maxDrawdown}%</span>
                </div>
                <Progress value={Math.abs(riskMetrics.maxDrawdown) * 4} className="bg-red-100" />
                <p className="text-xs text-muted-foreground mt-1">
                  Largest historical decline from peak
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
