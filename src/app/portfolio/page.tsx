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
  BarChart3,
  Activity,
  DollarSign,
  AlertTriangle,
  Brain,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/blockchain/dataProviders';
import AIPortfolioInsights from '@/components/ai/AIPortfolioInsights';
import { getAIService } from '@/lib/ai/aiServiceSingleton';
import type { AIInsight } from '@/lib/ai/geminiService';

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
  
  // AI-generated insights state
  const [aiInsights, setAiInsights] = useState<{
    portfolioSummary: AIInsight | null;
    riskAnalysis: AIInsight | null;
    marketOutlook: AIInsight | null;
  }>({
    portfolioSummary: null,
    riskAnalysis: null,
    marketOutlook: null
  });
  
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(0);

  // Rate limiting for AI insights - minimum 10 minutes between generations
  const MIN_GENERATION_INTERVAL = 10 * 60 * 1000; // Increased to 10 minutes for much better performance

  // Generate AI insights for the portfolio with rate limiting
  const generateAIInsights = async (forceGenerate = false) => {
    const now = Date.now();
    if (!forceGenerate && (now - lastGeneratedTime) < MIN_GENERATION_INTERVAL) {
      console.log('Rate limiting portfolio AI insights - too many recent requests');
      return;
    }

    setLoadingInsights(true);
    setInsightError(null);
    
    try {
      // Prepare portfolio data for AI analysis
      const portfolioData = {
        totalValue,
        assets: portfolioAssets.map(asset => ({
          symbol: asset.symbol,
          balance: parseFloat(asset.balance),
          value: asset.value,
          allocation: asset.allocation
        })),
        performance: {
          daily: totalChangePercent,
          weekly: 2.8, // This would be calculated from historical data in a real app
          monthly: 15.2
        }
      };

      // Prepare market data
      const marketData = portfolioAssets.map(asset => ({
        symbol: asset.symbol,
        price: asset.price,
        change24h: asset.change24h,
        volume: 1000000, // Mock volume - would be real data in production
        marketCap: 50000000 // Mock market cap - would be real data in production
      }));

      // Generate insights in parallel
      const aiService = getAIService();
      const [portfolioSummary, riskAnalysis, marketOutlook] = await Promise.all([
        aiService.analyzePortfolio(portfolioData),
        aiService.assessRisk(portfolioData, {
          volatilityIndex: riskMetrics.volatility,
          marketTrend: totalChange24h > 0 ? 'bullish' : 'bearish',
          correlationRisk: 'moderate'
        }),
        aiService.analyzeMarket(marketData)
      ]);

      setAiInsights({
        portfolioSummary,
        riskAnalysis,
        marketOutlook
      });
      setLastGeneratedTime(now);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      setInsightError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // Generate insights on component mount with initial rate limiting check
  useEffect(() => {
    const now = Date.now();
    if ((now - lastGeneratedTime) >= MIN_GENERATION_INTERVAL) {
      generateAIInsights();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            AI-powered portfolio management and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => generateAIInsights(true)}
            disabled={loadingInsights}
          >
            <Brain className={`h-4 w-4 mr-2 ${loadingInsights ? 'animate-pulse' : ''}`} />
            {loadingInsights ? 'AI Analyzing...' : 'AI Insights'}
          </Button>
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
            <div className="flex items-center space-x-1">
              {aiInsights.portfolioSummary && <Brain className="h-3 w-3 text-blue-500" />}
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className={`text-xs ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChangePercent >= 0 ? '+' : ''}{formatCurrency(totalChange24h)} ({totalChangePercent.toFixed(2)}%)
            </p>
            {aiInsights.portfolioSummary && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                AI monitoring portfolio health
              </p>
            )}
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

      {/* AI-Generated Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <CardTitle>AI Portfolio Analysis</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateAIInsights(true)}
                disabled={loadingInsights}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
                {loadingInsights ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
            </div>
            <CardDescription>
              Real-time AI-powered insights and recommendations for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInsights ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Brain className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-2" />
                  <p className="text-muted-foreground">Generating AI insights...</p>
                </div>
              </div>
            ) : insightError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{insightError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => generateAIInsights(true)}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiInsights.portfolioSummary && (
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2">Portfolio Summary</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {aiInsights.portfolioSummary.content}
                    </p>
                  </div>
                )}
                
                {aiInsights.riskAnalysis && (
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold mb-2">Risk Assessment</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {aiInsights.riskAnalysis.content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Outlook</CardTitle>
            <CardDescription>AI-powered market analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInsights ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <BarChart3 className="h-6 w-6 text-muted-foreground animate-pulse mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analyzing market...</p>
                </div>
              </div>
            ) : aiInsights.marketOutlook ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2 text-sm">Market Analysis</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {aiInsights.marketOutlook.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{aiInsights.marketOutlook.confidence}%</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="font-medium capitalize">{aiInsights.marketOutlook.timeframe}-term</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No market analysis available</p>
            )}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>AI-enhanced portfolio risk metrics and analysis</CardDescription>
            </div>
            {aiInsights.riskAnalysis && (
              <div className="flex items-center space-x-1">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400">AI Enhanced</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights.riskAnalysis && (
            <div className="mb-6 p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                AI Risk Assessment
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {aiInsights.riskAnalysis.content}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.sharpeRatio}</span>
                </div>
                <Progress value={(riskMetrics.sharpeRatio / 3) * 100} />
                <p className="text-xs text-muted-foreground mt-1">
                  {aiInsights.riskAnalysis ? 
                    'AI suggests reviewing risk-return balance' : 
                    (riskMetrics.sharpeRatio > 1.5 ? 'Excellent' : riskMetrics.sharpeRatio > 1 ? 'Good' : 'Poor') + ' risk-adjusted returns'
                  }
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Beta (vs Market)</span>
                  <span className="text-sm text-muted-foreground">{riskMetrics.beta}</span>
                </div>
                <Progress value={riskMetrics.beta * 50} />
                <p className="text-xs text-muted-foreground mt-1">
                  {aiInsights.riskAnalysis ? 
                    'AI monitoring correlation patterns' : 
                    (riskMetrics.beta < 1 ? 'Lower' : riskMetrics.beta > 1 ? 'Higher' : 'Same') + ' volatility than market'
                  }
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
                  {aiInsights.portfolioSummary ? 
                    'AI analyzing performance attribution' : 
                    (riskMetrics.alpha > 0 ? 'Outperforming' : 'Underperforming') + ' the market'
                  }
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

      {/* Enhanced AI Portfolio Insights Component */}
      <AIPortfolioInsights 
        portfolioAssets={portfolioAssets}
        riskMetrics={riskMetrics}
        totalValue={totalValue}
        totalChange24h={totalChange24h}
      />
    </div>
  );
}
