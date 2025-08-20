'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  Target, 
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Brain,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { usePortfolioStore, useStrategyStore } from '@/store';
import { formatCurrency, formatPercent } from '@/lib/blockchain/dataProviders';

// Mock data for charts
const portfolioData = [
  { date: '2024-01-01', value: 100000 },
  { date: '2024-01-08', value: 105000 },
  { date: '2024-01-15', value: 102000 },
  { date: '2024-01-22', value: 108000 },
  { date: '2024-01-29', value: 115000 },
  { date: '2024-02-05', value: 118000 },
  { date: '2024-02-12', value: 125432 },
];

const allocationData = [
  { name: 'ETH', value: 45, color: '#627EEA' },
  { name: 'BTC', value: 25, color: '#F7931A' },
  { name: 'USDC', value: 15, color: '#2775CA' },
  { name: 'LINK', value: 10, color: '#375BD2' },
  { name: 'Other', value: 5, color: '#8B5CF6' },
];

const recentTransactions = [
  {
    id: '1',
    type: 'buy' as const,
    asset: 'ETH',
    amount: '2.5',
    value: '$8,000',
    timestamp: Date.now() - 3600000,
    status: 'confirmed' as const,
    batchId: 'batch_001',
  },
  {
    id: '2',
    type: 'swap' as const,
    asset: 'USDC → LINK',
    amount: '500',
    value: '$500',
    timestamp: Date.now() - 7200000,
    status: 'confirmed' as const,
  },
  {
    id: '3',
    type: 'sell' as const,
    asset: 'BTC',
    amount: '0.1',
    value: '$4,200',
    timestamp: Date.now() - 10800000,
    status: 'pending' as const,
    batchId: 'batch_002',
  },
];

const aiInsights = [
  {
    id: '1',
    type: 'rebalance' as const,
    title: 'Portfolio Rebalancing Opportunity',
    description: 'Consider reducing ETH allocation by 5% and increasing DeFi exposure',
    confidence: 85,
    expectedReturn: 12.5,
    timeframe: '3-6 months',
  },
  {
    id: '2',
    type: 'yield-opportunity' as const,
    title: 'High Yield Opportunity Detected',
    description: 'Aave USDC lending shows 6.2% APY with low risk profile',
    confidence: 92,
    expectedReturn: 6.2,
    timeframe: '1-3 months',
  },
  {
    id: '3',
    type: 'buy' as const,
    title: 'Market Entry Signal',
    description: 'Technical indicators suggest good entry point for LINK',
    confidence: 78,
    expectedReturn: 18.3,
    timeframe: '2-4 weeks',
  },
];

export default function Dashboard() {
  const { performance, assets, transactions } = usePortfolioStore();
  const { strategies, recommendations } = useStrategyStore();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');

  useEffect(() => {
    // Load initial data
    // This would typically fetch from your API
  }, []);

  const totalValue = 125432.50;
  const dailyChange = 2.4;
  const dailyChangeValue = 2845.30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your portfolio overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Trade
          </Button>
          <Button variant="outline">
            <Target className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <div className="flex items-center text-sm">
              {dailyChange > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={dailyChange > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(dailyChangeValue)} ({dailyChange > 0 ? '+' : ''}{dailyChange}%)
              </span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h P&L</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+$2,845</div>
            <p className="text-xs text-muted-foreground">
              +2.4% from previous day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <div className="flex items-center text-sm">
              <Badge variant="secondary" className="mr-2">2 AI</Badge>
              <span className="text-muted-foreground">strategies running</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Saved</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$342</div>
            <div className="flex items-center text-sm">
              <Badge variant="outline" className="mr-2">State Channels</Badge>
              <span className="text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Performance</CardTitle>
                <CardDescription>Your portfolio value over time</CardDescription>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Portfolio Value']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
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
              <PieChart>
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
              </PieChart>
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
                  <span className="text-sm text-muted-foreground">{asset.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </CardTitle>
                <CardDescription>Personalized recommendations for your portfolio</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge variant="secondary" className="ml-2">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">
                    +{insight.expectedReturn}% expected return
                  </span>
                  <span className="text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {insight.timeframe}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest portfolio activity</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      tx.type === 'buy' ? 'bg-green-100 text-green-600' :
                      tx.type === 'sell' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {tx.type === 'buy' ? <ArrowUpRight className="h-4 w-4" /> :
                       tx.type === 'sell' ? <ArrowDownRight className="h-4 w-4" /> :
                       <ArrowUpRight className="h-4 w-4 rotate-90" />}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{tx.type} {tx.asset}</div>
                      <div className="text-sm text-muted-foreground">
                        {tx.amount} • {new Date(tx.timestamp).toLocaleTimeString()}
                        {tx.batchId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Batched
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{tx.value}</div>
                    <Badge 
                      variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
