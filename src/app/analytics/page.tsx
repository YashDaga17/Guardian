'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Percent,
  AlertTriangle,
  Award,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/blockchain/dataProviders';

// Mock analytics data
const performanceData = [
  { date: '2024-01-01', portfolio: 100000, btc: 100000, eth: 100000, sp500: 100000 },
  { date: '2024-01-08', portfolio: 105200, btc: 102800, eth: 108400, sp500: 101200 },
  { date: '2024-01-15', portfolio: 103800, btc: 99200, eth: 104600, sp500: 100800 },
  { date: '2024-01-22', portfolio: 110400, btc: 105600, eth: 115200, sp500: 102400 },
  { date: '2024-01-29', portfolio: 118200, btc: 110800, eth: 125600, sp500: 104100 },
  { date: '2024-02-05', portfolio: 121800, btc: 113400, eth: 130200, sp500: 105800 },
  { date: '2024-02-12', portfolio: 125432, btc: 115200, eth: 135800, sp500: 106500 },
];

const monthlyReturns = [
  { month: 'Jan', returns: 8.3, benchmark: 6.5 },
  { month: 'Feb', returns: 12.1, benchmark: 8.2 },
  { month: 'Mar', returns: -2.4, benchmark: -1.8 },
  { month: 'Apr', returns: 15.7, benchmark: 11.3 },
  { month: 'May', returns: 9.8, benchmark: 7.4 },
  { month: 'Jun', returns: 18.2, benchmark: 13.6 },
];

const riskMetrics = [
  { metric: 'Volatility', value: 65, benchmark: 45 },
  { metric: 'Sharpe Ratio', value: 85, benchmark: 70 },
  { metric: 'Max Drawdown', value: 35, benchmark: 40 },
  { metric: 'Alpha', value: 75, benchmark: 50 },
  { metric: 'Beta', value: 60, benchmark: 70 },
  { metric: 'Information Ratio', value: 80, benchmark: 65 },
];

const assetPerformance = [
  { asset: 'ETH', allocation: 45, return: 18.5, risk: 28.3, sharpe: 1.42 },
  { asset: 'BTC', allocation: 25, return: 12.1, risk: 32.1, sharpe: 1.18 },
  { asset: 'LINK', allocation: 15, return: 22.8, risk: 41.2, sharpe: 1.65 },
  { asset: 'UNI', allocation: 10, return: -8.2, risk: 55.7, sharpe: -0.23 },
  { asset: 'USDC', allocation: 5, return: 4.1, risk: 2.1, sharpe: 2.05 },
];

const timeSeriesReturns = [
  { period: '1D', portfolio: 1.2, benchmark: 0.8 },
  { period: '1W', portfolio: 3.4, benchmark: 2.1 },
  { period: '1M', portfolio: 8.7, benchmark: 6.2 },
  { period: '3M', portfolio: 15.3, benchmark: 12.8 },
  { period: '6M', portfolio: 22.1, benchmark: 18.4 },
  { period: '1Y', portfolio: 35.8, benchmark: 28.2 },
  { period: 'YTD', portfolio: 25.4, benchmark: 19.6 },
];

const portfolioMetrics = {
  totalReturn: 25.4,
  annualizedReturn: 35.8,
  volatility: 18.5,
  sharpeRatio: 1.42,
  maxDrawdown: -12.3,
  calmarRatio: 2.91,
  beta: 0.85,
  alpha: 4.2,
  informationRatio: 0.78,
  trackingError: 5.4,
  winRate: 68.2,
  profitFactor: 2.34,
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [benchmark, setBenchmark] = useState<'BTC' | 'ETH' | 'SP500'>('BTC');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your portfolio performance and risk metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: string) => setTimeframe(value as '1M' | '3M' | '6M' | '1Y' | 'ALL')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{portfolioMetrics.totalReturn}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(25432)} profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annualized Return</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioMetrics.annualizedReturn}%</div>
            <p className="text-xs text-muted-foreground">
              vs {benchmark} benchmark
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioMetrics.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{portfolioMetrics.maxDrawdown}%</div>
            <p className="text-xs text-muted-foreground">
              Largest decline from peak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio vs Benchmark */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio vs Benchmark</CardTitle>
                <CardDescription>Cumulative performance comparison</CardDescription>
              </div>
              <Select value={benchmark} onValueChange={(value: string) => setBenchmark(value as 'BTC' | 'ETH' | 'SP500')}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="SP500">S&P 500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'portfolio' ? 'Portfolio' : String(name).toUpperCase()
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="portfolio" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Portfolio"
                />
                <Line 
                  type="monotone" 
                  dataKey={benchmark.toLowerCase()} 
                  stroke="#6B7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={benchmark}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Returns */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Returns</CardTitle>
            <CardDescription>Portfolio vs benchmark monthly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="returns" fill="#3B82F6" name="Portfolio" />
                <Bar dataKey="benchmark" fill="#6B7280" name="Benchmark" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics Radar</CardTitle>
            <CardDescription>Portfolio vs benchmark risk profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} hide />
                <Radar
                  name="Portfolio"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="#6B7280"
                  fill="#6B7280"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Returns Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Returns by Time Period</CardTitle>
            <CardDescription>Performance across different timeframes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeSeriesReturns.map((item) => (
                <div key={item.period} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="font-medium w-12">{item.period}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(Math.abs(item.portfolio) * 2, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${item.portfolio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.portfolio >= 0 ? '+' : ''}{item.portfolio}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-gray-400 h-1 rounded-full" 
                            style={{ width: `${Math.min(Math.abs(item.benchmark) * 2, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.benchmark >= 0 ? '+' : ''}{item.benchmark}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Performance Analysis</CardTitle>
          <CardDescription>Individual asset contributions to portfolio performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Allocation</th>
                  <th className="text-right py-2">Return</th>
                  <th className="text-right py-2">Risk (σ)</th>
                  <th className="text-right py-2">Sharpe Ratio</th>
                  <th className="text-right py-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {assetPerformance.map((asset) => (
                  <tr key={asset.asset} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{asset.asset}</div>
                    </td>
                    <td className="text-right py-3">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{asset.allocation}%</span>
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${asset.allocation * 2}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <span className={asset.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {asset.return >= 0 ? '+' : ''}{asset.return}%
                      </span>
                    </td>
                    <td className="text-right py-3">{asset.risk}%</td>
                    <td className="text-right py-3">
                      <Badge variant={asset.sharpe > 1 ? 'default' : asset.sharpe > 0 ? 'secondary' : 'destructive'}>
                        {asset.sharpe.toFixed(2)}
                      </Badge>
                    </td>
                    <td className="text-right py-3">
                      <div className="flex items-center justify-end">
                        {asset.return > 15 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : asset.return > 5 ? (
                          <Activity className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Beta</span>
              <span className="font-medium">{portfolioMetrics.beta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Alpha</span>
              <span className="font-medium text-green-600">{portfolioMetrics.alpha}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tracking Error</span>
              <span className="font-medium">{portfolioMetrics.trackingError}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Information Ratio</span>
              <span className="font-medium">{portfolioMetrics.informationRatio}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Calmar Ratio</span>
              <span className="font-medium">{portfolioMetrics.calmarRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Win Rate</span>
              <span className="font-medium">{portfolioMetrics.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Profit Factor</span>
              <span className="font-medium">{portfolioMetrics.profitFactor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Volatility</span>
              <span className="font-medium">{portfolioMetrics.volatility}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Risk Score</span>
                <span className="text-sm">7/10</span>
              </div>
              <Progress value={70} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Diversification</span>
                <span className="text-sm">8/10</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Performance</span>
                <span className="text-sm">9/10</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
