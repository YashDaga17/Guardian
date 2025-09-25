'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Target,
  BarChart3,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Define proper type for active strategy
interface ActiveStrategy {
  id: string;
  name: string;
  type: 'custom' | 'defi-yield';
  status: 'active';
  allocation: number;
  currentValue: number;
  totalReturn: number;
  dailyChange: number;
  createdAt: string;
  riskLevel: number;
  assets: string[];
}

// Memoized Active Strategy Card Component
const ActiveStrategyCard = memo(({ 
  strategy, 
  getRiskLevelColor, 
  getRiskLevelText 
}: {
  strategy: ActiveStrategy;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelText: (level: number) => string;
}) => (
  <Card key={strategy.id}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">{strategy.name}</CardTitle>
          <CardDescription>
            Active since {new Date(strategy.createdAt).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge className={getRiskLevelColor(strategy.riskLevel)}>
          {getRiskLevelText(strategy.riskLevel)}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Value</p>
          <p className="text-lg font-semibold">{formatCurrency(strategy.currentValue)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Return</p>
          <p className="text-lg font-semibold text-green-600">
            +{strategy.totalReturn.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">24h Change</span>
          <span className={`text-sm ${strategy.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {strategy.dailyChange >= 0 ? '+' : ''}{strategy.dailyChange.toFixed(2)}%
          </span>
        </div>
        <Progress 
          value={Math.abs(strategy.dailyChange) * 10} 
          className={strategy.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'} 
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline">
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Adjust
        </Button>
        <Button size="sm" variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Details
        </Button>
      </div>
    </CardContent>
  </Card>
));

ActiveStrategyCard.displayName = 'ActiveStrategyCard';

// Define proper type for pre-built strategy
interface PreBuiltStrategy {
  id: string;
  name: string;
  description: string;
  type: 'conservative' | 'moderate' | 'aggressive' | 'defi-yield';
  riskLevel: number;
  expectedApy: number;
  minimumInvestment: number;
  assets: string[];
  allocation: { [key: string]: number };
  features: string[];
  backtestData: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  isPopular: boolean;
}

// Memoized Pre-built Strategy Card Component
const PreBuiltStrategyCard = memo(({ 
  strategy, 
  getRiskLevelColor, 
  getRiskLevelText 
}: {
  strategy: PreBuiltStrategy;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelText: (level: number) => string;
}) => (
  <Card key={strategy.id} className="relative">
    {strategy.isPopular && (
      <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500">
        <Star className="h-3 w-3 mr-1" />
        Popular
      </Badge>
    )}
    
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg">{strategy.name}</CardTitle>
          <CardDescription>{strategy.description}</CardDescription>
          <div className="flex items-center space-x-4">
            <Badge className={getRiskLevelColor(strategy.riskLevel)}>
              {getRiskLevelText(strategy.riskLevel)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Expected APY: <span className="font-semibold text-green-600">{strategy.expectedApy}%</span>
            </span>
          </div>
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="space-y-4">
      {/* Asset Allocation */}
      <div>
        <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
        <div className="space-y-2">
          {Object.entries(strategy.allocation).map(([asset, percentage]) => (
            <div key={asset} className="flex items-center justify-between">
              <span className="text-sm">{asset}</span>
              <div className="flex items-center space-x-2">
                <Progress value={Number(percentage)} className="w-20" />
                <span className="text-sm text-muted-foreground w-8">{percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backtest Results */}
      <div>
        <h4 className="text-sm font-medium mb-2">Backtest Performance</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Return:</span>
            <span className="ml-2 font-semibold text-green-600">
              +{strategy.backtestData.totalReturn}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Sharpe Ratio:</span>
            <span className="ml-2 font-semibold">{strategy.backtestData.sharpeRatio}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max Drawdown:</span>
            <span className="ml-2 font-semibold text-red-600">
              {strategy.backtestData.maxDrawdown}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Win Rate:</span>
            <span className="ml-2 font-semibold">{strategy.backtestData.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h4 className="text-sm font-medium mb-2">Key Features</h4>
        <div className="flex flex-wrap gap-1">
          {strategy.features.map((feature: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="text-sm text-muted-foreground">
          Min. investment: {formatCurrency(strategy.minimumInvestment)}
        </span>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            Learn More
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

PreBuiltStrategyCard.displayName = 'PreBuiltStrategyCard';

// Pre-built strategies
const preBuiltStrategies: PreBuiltStrategy[] = [
  {
    id: '1',
    name: 'Conservative Growth',
    description: 'Low-risk strategy focusing on stable returns with minimal volatility',
    type: 'conservative' as const,
    riskLevel: 2,
    expectedApy: 8.5,
    minimumInvestment: 1000,
    assets: ['USDC', 'ETH', 'BTC'],
    allocation: { USDC: 60, ETH: 25, BTC: 15 },
    features: ['Automated rebalancing', 'Downside protection', 'Stable yield farming'],
    backtestData: {
      totalReturn: 12.3,
      sharpeRatio: 1.8,
      maxDrawdown: -5.2,
      winRate: 78,
    },
    isPopular: true,
  },
  {
    id: '2',
    name: 'Moderate Balanced',
    description: 'Balanced approach with moderate risk for steady growth potential',
    type: 'moderate' as const,
    riskLevel: 4,
    expectedApy: 15.2,
    minimumInvestment: 500,
    assets: ['ETH', 'BTC', 'LINK', 'UNI'],
    allocation: { ETH: 40, BTC: 30, LINK: 20, UNI: 10 },
    features: ['Dynamic rebalancing', 'Market trend following', 'Risk management'],
    backtestData: {
      totalReturn: 18.7,
      sharpeRatio: 1.4,
      maxDrawdown: -12.1,
      winRate: 65,
    },
    isPopular: false,
  },
  {
    id: '3',
    name: 'Aggressive Alpha',
    description: 'High-growth strategy targeting maximum returns with higher volatility',
    type: 'aggressive' as const,
    riskLevel: 8,
    expectedApy: 28.5,
    minimumInvestment: 250,
    assets: ['ETH', 'LINK', 'UNI', 'AAVE', 'CRV'],
    allocation: { ETH: 30, LINK: 25, UNI: 20, AAVE: 15, CRV: 10 },
    features: ['Momentum trading', 'High-yield DeFi', 'Advanced analytics'],
    backtestData: {
      totalReturn: 45.2,
      sharpeRatio: 1.1,
      maxDrawdown: -28.3,
      winRate: 58,
    },
    isPopular: true,
  },
  {
    id: '4',
    name: 'DeFi Yield Optimizer',
    description: 'Maximizes yield through automated DeFi protocol farming',
    type: 'defi-yield' as const,
    riskLevel: 6,
    expectedApy: 22.8,
    minimumInvestment: 750,
    assets: ['USDC', 'ETH', 'DAI', 'COMP', 'AAVE'],
    allocation: { USDC: 35, ETH: 25, DAI: 20, COMP: 12, AAVE: 8 },
    features: ['Yield optimization', 'Protocol diversification', 'Auto-compounding'],
    backtestData: {
      totalReturn: 31.5,
      sharpeRatio: 1.6,
      maxDrawdown: -16.8,
      winRate: 72,
    },
    isPopular: false,
  },
];

// Active strategies
const activeStrategies: ActiveStrategy[] = [
  {
    id: 'active_1',
    name: 'My Conservative Mix',
    type: 'custom' as const,
    status: 'active' as const,
    allocation: 15000,
    currentValue: 16250.30,
    totalReturn: 8.33,
    dailyChange: 1.2,
    createdAt: '2024-01-15',
    riskLevel: 3,
    assets: ['USDC', 'ETH', 'BTC'],
  },
  {
    id: 'active_2',
    name: 'DeFi Yield Farm',
    type: 'defi-yield' as const,
    status: 'active' as const,
    allocation: 8500,
    currentValue: 9785.20,
    totalReturn: 15.12,
    dailyChange: -0.8,
    createdAt: '2024-02-01',
    riskLevel: 6,
    assets: ['AAVE', 'COMP', 'CRV'],
  },
];

// Performance comparison data
const comparisonData = [
  { date: '2024-01-01', conservative: 100, moderate: 100, aggressive: 100, market: 100 },
  { date: '2024-01-08', conservative: 102, moderate: 105, aggressive: 108, market: 103 },
  { date: '2024-01-15', conservative: 104, moderate: 103, aggressive: 112, market: 101 },
  { date: '2024-01-22', conservative: 106, moderate: 108, aggressive: 118, market: 105 },
  { date: '2024-01-29', conservative: 108, moderate: 115, aggressive: 125, market: 110 },
  { date: '2024-02-05', conservative: 110, moderate: 118, aggressive: 135, market: 115 },
  { date: '2024-02-12', conservative: 112, moderate: 119, aggressive: 145, market: 118 },
];

// Risk tolerance assessment questions
const riskQuestions = [
  {
    id: 1,
    question: "What is your investment experience?",
    options: [
      { text: "Beginner (0-1 years)", score: 1 },
      { text: "Some experience (1-3 years)", score: 2 },
      { text: "Experienced (3-5 years)", score: 3 },
      { text: "Expert (5+ years)", score: 4 },
    ]
  },
  {
    id: 2,
    question: "How would you react to a 20% portfolio decline?",
    options: [
      { text: "Panic and sell everything", score: 1 },
      { text: "Feel nervous but hold", score: 2 },
      { text: "Stay calm and wait", score: 3 },
      { text: "Buy more at lower prices", score: 4 },
    ]
  },
  {
    id: 3,
    question: "What is your investment timeline?",
    options: [
      { text: "Less than 1 year", score: 1 },
      { text: "1-3 years", score: 2 },
      { text: "3-5 years", score: 3 },
      { text: "More than 5 years", score: 4 },
    ]
  },
];

export default function Strategies() {
  const [_selectedStrategy, _setSelectedStrategy] = useState<string | null>(null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [riskAnswers, setRiskAnswers] = useState<Record<number, number>>({});
  
  // Memoize color and text calculations to prevent re-renders
  const getRiskLevelColor = useCallback((level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100';
    if (level <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  const getRiskLevelText = useCallback((level: number) => {
    if (level <= 3) return 'Low Risk';
    if (level <= 6) return 'Medium Risk';
    return 'High Risk';
  }, []);

  // Memoize risk score calculation
  const calculateRiskScore = useMemo(() => {
    const total = Object.values(riskAnswers).reduce((sum, score) => sum + score, 0);
    const maxScore = riskQuestions.length * 4;
    return Math.round((total / maxScore) * 10);
  }, [riskAnswers]);

  // Memoize sorted strategies to prevent unnecessary re-sorts
  const sortedPreBuiltStrategies = useMemo(() => {
    return [...preBuiltStrategies].sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.expectedApy - b.expectedApy;
    });
  }, []);

  // Memoize handlers to prevent child re-renders
  const handleRiskAnswerChange = useCallback((questionId: number, score: number) => {
    setRiskAnswers(prev => ({
      ...prev,
      [questionId]: score
    }));
  }, []);

  const handleShowRiskAssessment = useCallback(() => {
    setShowRiskAssessment(true);
  }, []);

  const handleCloseRiskAssessment = useCallback(() => {
    setShowRiskAssessment(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Strategies</h1>
          <p className="text-muted-foreground">
            AI-powered strategies to optimize your portfolio performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleShowRiskAssessment}>
            <Target className="h-4 w-4 mr-2" />
            Risk Assessment
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Strategy
          </Button>
        </div>
      </div>

      {/* Active Strategies */}
      {activeStrategies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Active Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeStrategies.map((strategy) => (
              <ActiveStrategyCard
                key={strategy.id}
                strategy={strategy}
                getRiskLevelColor={getRiskLevelColor}
                getRiskLevelText={getRiskLevelText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Strategy Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance Comparison</CardTitle>
          <CardDescription>Compare different strategy types over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="conservative" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="moderate" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="aggressive" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="market" stroke="#6B7280" strokeWidth={1} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pre-built Strategies */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pre-built Strategies</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedPreBuiltStrategies.map((strategy) => (
            <PreBuiltStrategyCard
              key={strategy.id}
              strategy={strategy}
              getRiskLevelColor={getRiskLevelColor}
              getRiskLevelText={getRiskLevelText}
            />
          ))}
        </div>
      </div>

      {/* Risk Assessment Modal */}
      <Dialog open={showRiskAssessment} onOpenChange={handleCloseRiskAssessment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Risk Tolerance Assessment</DialogTitle>
            <DialogDescription>
              Answer a few questions to find strategies that match your risk profile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {riskQuestions.map((question) => (
              <div key={question.id} className="space-y-3">
                <h4 className="font-medium">{question.question}</h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={option.score}
                        onChange={(e) => handleRiskAnswerChange(question.id, parseInt(e.target.value))}
                        className="text-primary"
                      />
                      <span className="text-sm">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(riskAnswers).length === riskQuestions.length && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Your Risk Score: {calculateRiskScore}/10</h4>
                <p className="text-sm text-muted-foreground">
                  Based on your answers, we recommend {calculateRiskScore <= 3 ? 'Conservative' : calculateRiskScore <= 7 ? 'Moderate' : 'Aggressive'} strategies.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseRiskAssessment}>
                Cancel
              </Button>
              <Button 
                onClick={handleCloseRiskAssessment}
                disabled={Object.keys(riskAnswers).length !== riskQuestions.length}
              >
                Get Recommendations
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
