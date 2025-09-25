'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Target, 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  Clock,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
import { NitroliteStateChannels } from '@/components/nitrolite/NitroliteStateChannels';
// import { TestnetTransactionPanel } from '@/components/testnet/TestnetTransactionPanel'; // Disabled for production
import AIAssistant from '@/components/ai/AIAssistant';
import { useDashboardStore, formatCurrency } from '@/store/dashboardStore';
import { TransactionItem } from '@/components/dashboard/TransactionItem';

export default function Dashboard() {
  // Zustand store selectors - memoized to prevent unnecessary re-renders
  const {
    portfolioData,
    allocationData,
    totalValue,
    dailyChange,
    dailyChangeValue,
    recentTransactions,
    aiInsights,
    timeframe,
    isClient,
    setTimeframe,
    initializeClientData,
  } = useDashboardStore();

  // AI Assistant state
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Initialize client-side data only once
  useEffect(() => {
    if (!isClient) {
      initializeClientData();
    }
  }, [isClient, initializeClientData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your portfolio overview with AI-powered insights.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsAIAssistantOpen(true)}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Portfolio Insight</h3>
              <p className="text-blue-700 dark:text-blue-300">
                Consider rebalancing: Your ETH allocation is 15% above optimal. 
                Market sentiment suggests a potential 8% correction incoming.
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300">
            View Details
          </Button>
        </CardContent>
      </Card>

      {/* Portfolio Overview Cards */}
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
            <div className="space-y-0">
              {recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  isClient={isClient}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testnet Transaction Panel - Disabled for Production */}
      {process.env.NEXT_PUBLIC_USE_TESTNET === 'true' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Development Mode</h2>
              <p className="text-muted-foreground">
                Testnet features are disabled in production. Connect your wallet to use real transactions.
              </p>
            </div>
          </div>
          {/* <TestnetTransactionPanel /> */}
        </div>
      )}

      {/* Nitrolite State Channels Section */}
      <NitroliteStateChannels />

      {/* AI Assistant */}
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onToggle={() => setIsAIAssistantOpen(!isAIAssistantOpen)} 
      />
    </div>
  );
}
