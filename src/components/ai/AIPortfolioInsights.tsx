'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  RefreshCw, 
  Lightbulb,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';
import { getAIService } from '@/lib/ai/aiServiceSingleton';
import type { AIInsight } from '@/lib/ai/geminiService';

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
  logo: string;
}

interface RiskMetrics {
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  var95: number;
}

interface AIPortfolioInsightsProps {
  portfolioAssets: PortfolioAsset[];
  riskMetrics: RiskMetrics;
  totalValue: number;
  totalChange24h: number;
}

export default function AIPortfolioInsights({ 
  portfolioAssets, 
  riskMetrics, 
  totalValue, 
  totalChange24h 
}: AIPortfolioInsightsProps) {
  const [insights, setInsights] = useState<{
    portfolio: AIInsight | null;
    risk: AIInsight | null;
    opportunities: AIInsight | null;
    market: AIInsight | null;
  }>({
    portfolio: null,
    risk: null,
    opportunities: null,
    market: null
  });

  const [loading, setLoading] = useState<{
    portfolio: boolean;
    risk: boolean;
    opportunities: boolean;
    market: boolean;
  }>({
    portfolio: false,
    risk: false,
    opportunities: false,
    market: false
  });

  const [activeTab, setActiveTab] = useState('portfolio');

  // Calculate portfolio performance metrics
  const portfolioPerformance = {
    daily: (totalChange24h / totalValue) * 100,
    weekly: 2.8, // Mock data - in real app, calculate from historical data
    monthly: 15.2 // Mock data
  };

  // Prepare portfolio data for AI analysis
  const portfolioData = {
    totalValue,
    assets: portfolioAssets.map(asset => ({
      symbol: asset.symbol,
      balance: parseFloat(asset.balance),
      value: asset.value,
      allocation: asset.allocation
    })),
    performance: portfolioPerformance
  };

  // Prepare market data for AI analysis
  const marketData = portfolioAssets.map(asset => ({
    symbol: asset.symbol,
    price: asset.price,
    change24h: asset.change24h,
    volume: 1000000, // Mock volume data
    marketCap: 50000000 // Mock market cap data
  }));

  const analyzePortfolio = async () => {
    setLoading(prev => ({ ...prev, portfolio: true }));
    try {
      const aiService = getAIService();
      const result = await aiService.analyzePortfolio(portfolioData);
      setInsights(prev => ({ ...prev, portfolio: result }));
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, portfolio: false }));
    }
  };

  const analyzeRisk = async () => {
    setLoading(prev => ({ ...prev, risk: true }));
    try {
      const marketConditions = {
        volatilityIndex: riskMetrics.volatility,
        marketTrend: totalChange24h > 0 ? 'bullish' : 'bearish',
        correlationRisk: 'moderate'
      };
      const aiService = getAIService();
      const result = await aiService.assessRisk(portfolioData, marketConditions);
      setInsights(prev => ({ ...prev, risk: result }));
    } catch (error) {
      console.error('Risk analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, risk: false }));
    }
  };

  const analyzeOpportunities = async () => {
    setLoading(prev => ({ ...prev, opportunities: true }));
    try {
      // Analyze the largest holding for opportunities
      const largestHolding = portfolioAssets.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      );
      
      const marketDataForAsset = {
        symbol: largestHolding.symbol,
        price: largestHolding.price,
        change24h: largestHolding.change24h,
        volume: 1000000,
        marketCap: 50000000
      };

      const userProfile = {
        riskTolerance: riskMetrics.volatility > 20 ? 'high' : 'moderate',
        timeHorizon: 'medium',
        portfolioSize: totalValue
      };

      const aiService = getAIService();
      const result = await aiService.getTradingRecommendation(
        largestHolding.symbol, 
        marketDataForAsset, 
        userProfile
      );
      setInsights(prev => ({ ...prev, opportunities: result }));
    } catch (error) {
      console.error('Opportunities analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, opportunities: false }));
    }
  };

  const analyzeMarket = async () => {
    setLoading(prev => ({ ...prev, market: true }));
    try {
      const aiService = getAIService();
      const result = await aiService.analyzeMarket(marketData);
      setInsights(prev => ({ ...prev, market: result }));
    } catch (error) {
      console.error('Market analysis failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, market: false }));
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      analyzePortfolio(),
      analyzeRisk(),
      analyzeOpportunities(),
      analyzeMarket()
    ]);
  };

  // Auto-load insights on component mount
  useEffect(() => {
    refreshAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'portfolio_recommendation':
        return <BarChart3 className="h-5 w-5" />;
      case 'risk_warning':
        return <Shield className="h-5 w-5" />;
      case 'opportunity':
        return <Zap className="h-5 w-5" />;
      case 'market_analysis':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const InsightCard = ({ 
    insight, 
    isLoading, 
    onRefresh 
  }: { 
    insight: AIInsight | null; 
    isLoading: boolean; 
    onRefresh: () => void;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {insight && getInsightIcon(insight.type)}
          <CardTitle className="text-lg">{insight?.title || 'AI Analysis'}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {insight && (
            <Badge variant="secondary" className={getConfidenceColor(insight.confidence)}>
              {insight.confidence}% confidence
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 animate-pulse" />
              <span className="text-muted-foreground">AI is analyzing...</span>
            </div>
          </div>
        ) : insight ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{insight.content}</p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                {insight.timeframe} term
              </Badge>
              {insight.actionable && (
                <Badge variant="outline">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Actionable
                </Badge>
              )}
              {insight.relatedAssets.length > 0 && (
                <Badge variant="outline">
                  Assets: {insight.relatedAssets.slice(0, 3).join(', ')}
                  {insight.relatedAssets.length > 3 && '...'}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Unable to generate insights. Please try again.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>AI Portfolio Insights</CardTitle>
              <CardDescription>
                Advanced AI analysis of your portfolio performance and market opportunities
              </CardDescription>
            </div>
          </div>
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolio" className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>Risk</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>Opportunities</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Market</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-6">
            <InsightCard 
              insight={insights.portfolio}
              isLoading={loading.portfolio}
              onRefresh={analyzePortfolio}
            />
          </TabsContent>

          <TabsContent value="risk" className="mt-6">
            <InsightCard 
              insight={insights.risk}
              isLoading={loading.risk}
              onRefresh={analyzeRisk}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="mt-6">
            <InsightCard 
              insight={insights.opportunities}
              isLoading={loading.opportunities}
              onRefresh={analyzeOpportunities}
            />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <InsightCard 
              insight={insights.market}
              isLoading={loading.market}
              onRefresh={analyzeMarket}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
