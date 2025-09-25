'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react';
import { Timestamp } from '@/components/ui/Timestamp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMarketData } from '@/hooks/useMarketData';
import { useAIInsights } from '@/hooks/useAIInsights';

interface MarketMetrics {
  sentiment: number;
  volatility: number;
  volume: number;
  fearGreedIndex: number;
}

function AIMarketInsightsComponent() {
  // Use very conservative refresh intervals to prevent excessive API calls
  const { data: marketData, loading: isLoadingMarket, lastUpdate, refresh } = useMarketData({
    symbols: ['BTC', 'ETH', 'SOL', 'ADA'],
    refreshInterval: 900000, // Increased to 15 minutes to reduce API load
    enabled: true
  });

  // Memoize the market data transformation to prevent unnecessary re-renders
  const memoizedMarketData = useMemo(() => {
    if (!marketData?.length) return [];
    return marketData.map(item => ({
      symbol: item.symbol,
      price: item.price,
      changePercent24h: item.changePercent24h,
      volume24h: item.volume24h,
      marketCap: item.marketCap
    }));
  }, [marketData]);

  // Use centralized AI insights with strict rate limiting
  const { 
    insights, 
    metrics, 
    isLoading: isLoadingInsights, 
    generateInsights, 
    updateMetrics,
    canGenerateInsights 
  } = useAIInsights({
    autoGenerate: false, // Always disabled to prevent excessive calls
    marketData: memoizedMarketData
  });

  // Debounce the metrics update to prevent excessive calls
  const updateMetricsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedUpdateMetrics = useCallback((metrics: MarketMetrics) => {
    if (updateMetricsTimeoutRef.current) {
      clearTimeout(updateMetricsTimeoutRef.current);
    }
    
    updateMetricsTimeoutRef.current = setTimeout(() => {
      updateMetrics(metrics);
    }, 5000); // Increased debounce to 5 seconds
  }, [updateMetrics]);

  // Calculate metrics based on market data and update the centralized store
  const calculatedMetrics = useMemo(() => {
    if (!marketData.length) {
      return {
        sentiment: 73,
        volatility: 28,
        volume: 85,
        fearGreedIndex: 71
      };
    }

    const avgChangePercent = marketData.reduce((sum, item) => sum + item.changePercent24h, 0) / marketData.length;
    const totalVolume = marketData.reduce((sum, item) => sum + item.volume24h, 0);
    
    return {
      sentiment: Math.max(0, Math.min(100, 50 + avgChangePercent * 2)),
      volatility: Math.abs(avgChangePercent) * 3,
      volume: Math.min(100, totalVolume / 1000000000 * 10),
      fearGreedIndex: Math.max(0, Math.min(100, 50 + avgChangePercent * 1.5))
    };
  }, [marketData]);

  // Update metrics when calculated metrics change - with debouncing
  useEffect(() => {
    debouncedUpdateMetrics(calculatedMetrics);
    
    // Cleanup timeout on unmount
    return () => {
      if (updateMetricsTimeoutRef.current) {
        clearTimeout(updateMetricsTimeoutRef.current);
      }
    };
  }, [calculatedMetrics, debouncedUpdateMetrics]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-slate-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Lightbulb className="h-4 w-4 text-slate-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'bullish': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30';
      case 'bearish': return 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800/30';
      case 'warning': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800/30';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'bullish': return 'default' as const;
      case 'bearish': return 'destructive' as const;
      case 'warning': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-slate-600" />
            <CardTitle>AI Market Insights</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {isLoadingMarket && (
              <Eye className="h-4 w-4 text-blue-500 animate-pulse" />
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (canGenerateInsights(true)) {
                  refresh();
                  generateInsights(true); // Force generate on manual refresh
                }
              }}
              disabled={isLoadingInsights || !canGenerateInsights(true)}
              title={!canGenerateInsights(true) ? "Wait 1 minute between requests" : "Refresh insights"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              {!canGenerateInsights(true) ? 'Cooldown' : 'Refresh'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time AI analysis • Last updated: <Timestamp timestamp={lastUpdate} format="time" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Market Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sentiment</span>
              <Badge variant={metrics.sentiment > 60 ? 'default' : metrics.sentiment < 40 ? 'destructive' : 'secondary'}>
                {metrics.sentiment > 60 ? 'Bullish' : metrics.sentiment < 40 ? 'Bearish' : 'Neutral'}
              </Badge>
            </div>
            <Progress value={metrics.sentiment} className="h-2" />
            <span className="text-xs text-muted-foreground">{metrics.sentiment.toFixed(0)}%</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volatility</span>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </div>
            <Progress value={metrics.volatility} className="h-2" />
            <span className="text-xs text-muted-foreground">{metrics.volatility.toFixed(0)}%</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume</span>
              <div className="text-xs text-green-600 dark:text-green-400">
                {metrics.volume > 70 ? 'High' : metrics.volume > 40 ? 'Normal' : 'Low'}
              </div>
            </div>
            <Progress value={metrics.volume} className="h-2" />
            <span className="text-xs text-muted-foreground">{metrics.volume.toFixed(0)}%</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fear & Greed</span>
              <Badge variant={metrics.fearGreedIndex > 60 ? 'default' : 'secondary'}>
                {metrics.fearGreedIndex > 75 ? 'Greed' : metrics.fearGreedIndex > 50 ? 'Optimism' : 'Fear'}
              </Badge>
            </div>
            <Progress value={metrics.fearGreedIndex} className="h-2" />
            <span className="text-xs text-muted-foreground">{metrics.fearGreedIndex.toFixed(0)}</span>
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-600" />
            Latest Insights
          </h3>
          
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing market data...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take up to 30 seconds</p>
              </div>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No insights available yet.</p>
              <Button 
                onClick={() => generateInsights(true)} 
                variant="outline" 
                className="mt-4"
                disabled={!canGenerateInsights(true)}
              >
                Generate AI Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                        {insight.confidence}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">{insight.timeframe}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mb-3">{insight.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {insight.relatedAssets.map((asset) => (
                        <Badge key={asset} variant="outline" className="text-xs">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Timestamp timestamp={insight.timestamp} format="time" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export the component with React.memo for performance optimization
export const AIMarketInsights = React.memo(AIMarketInsightsComponent);
export default AIMarketInsights;