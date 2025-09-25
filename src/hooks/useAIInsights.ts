/**
 * React hook for using centralized AI insights store
 */

import { useEffect, useState } from 'react';
import { aiInsightsStore, AIMarketInsight, MarketMetrics } from '@/lib/ai/aiInsightsStore';
import { getAIService } from '@/lib/ai/aiServiceSingleton';

interface UseAIInsightsOptions {
  autoGenerate?: boolean;
  marketData?: Array<{
    symbol: string;
    price: number;
    changePercent24h: number;
    volume24h: number;
    marketCap: number;
  }>;
}

export function useAIInsights(options: UseAIInsightsOptions = {}) {
  const { autoGenerate = true, marketData = [] } = options;
  const [state, setState] = useState(aiInsightsStore.getState());

  useEffect(() => {
    const unsubscribe = aiInsightsStore.subscribe(() => {
      setState(aiInsightsStore.getState());
    });

    return unsubscribe;
  }, []);

  const generateInsights = async (forceGenerate = false): Promise<void> => {
    if (!marketData.length || !aiInsightsStore.canGenerateInsights(forceGenerate)) {
      if (!forceGenerate) {
        console.log('Skipping AI insights generation - rate limited or no market data');
        return;
      }
    }

    aiInsightsStore.setLoading(true);
    aiInsightsStore.setError(null);

    try {
      // Convert marketData to the format expected by geminiAI.analyzeMarket
      const marketDataForAnalysis = marketData.map(item => ({
        symbol: item.symbol,
        price: item.price,
        change24h: item.changePercent24h, // Map changePercent24h to change24h
        volume: item.volume24h, // Map volume24h to volume
        marketCap: item.marketCap
      }));

      const aiService = getAIService();
      const marketAnalysis = await aiService.analyzeMarket(marketDataForAnalysis);

      const newInsight: AIMarketInsight = {
        id: Date.now().toString(),
        type: marketAnalysis.confidence > 75 ? 'bullish' : 
              marketAnalysis.confidence < 25 ? 'bearish' : 'neutral',
        title: marketAnalysis.title,
        content: marketAnalysis.content,
        confidence: marketAnalysis.confidence,
        timeframe: marketAnalysis.timeframe,
        relatedAssets: marketAnalysis.relatedAssets,
        actionable: marketAnalysis.actionable,
        timestamp: Date.now()
      };

      aiInsightsStore.addInsight(newInsight);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      
      // Create fallback insight
      const avgChange = marketData.length > 0 
        ? marketData.reduce((sum, item) => sum + item.changePercent24h, 0) / marketData.length
        : 0;
        
      const fallbackInsight: AIMarketInsight = {
        id: Date.now().toString(),
        type: avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral',
        title: 'Market Analysis',
        content: marketData.length > 0
          ? `Current market shows ${avgChange > 0 ? 'positive' : 'negative'} momentum with average ${avgChange.toFixed(1)}% change across major assets.`
          : 'Market analysis temporarily unavailable. Please try again later.',
        confidence: 75,
        timeframe: 'short',
        relatedAssets: marketData.map(item => item.symbol),
        actionable: true,
        timestamp: Date.now()
      };
      
      aiInsightsStore.addInsight(fallbackInsight);
      aiInsightsStore.setError('Failed to generate AI insights, showing fallback analysis');
    } finally {
      aiInsightsStore.setLoading(false);
    }
  };

  const updateMetrics = (metrics: MarketMetrics): void => {
    aiInsightsStore.updateMetrics(metrics);
  };

  // Disable auto-generate to prevent excessive requests - only manual requests now
  useEffect(() => {
    // Removed auto-generation to prevent excessive API requests
    // All insights must be manually triggered
  }, [autoGenerate, marketData]);

  return {
    insights: state.insights,
    metrics: state.metrics,
    isLoading: state.isLoading,
    error: state.error,
    lastGeneratedTime: state.lastGeneratedTime,
    generateInsights,
    updateMetrics,
    canGenerateInsights: (force = false) => aiInsightsStore.canGenerateInsights(force),
    hasRecentInsights: () => aiInsightsStore.hasRecentInsights(),
    clearInsights: () => aiInsightsStore.clearInsights()
  };
}
