/**
 * Centralized store for AI market insights to prevent duplicate API calls
 * and ensure only one instance of market analysis is shown across the app
 */

interface AIMarketInsight {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'warning';
  title: string;
  content: string;
  confidence: number;
  timeframe: string;
  relatedAssets: string[];
  actionable: boolean;
  timestamp: number;
}

interface MarketMetrics {
  sentiment: number;
  volatility: number;
  volume: number;
  fearGreedIndex: number;
}

interface AIInsightsState {
  insights: AIMarketInsight[];
  metrics: MarketMetrics;
  isLoading: boolean;
  lastGeneratedTime: number;
  error: string | null;
}

class AIInsightsStore {
  private state: AIInsightsState = {
    insights: [],
    metrics: {
      sentiment: 73,
      volatility: 28,
      volume: 85,
      fearGreedIndex: 71
    },
    isLoading: false,
    lastGeneratedTime: 0,
    error: null
  };

  private listeners: Array<() => void> = [];
  private static instance: AIInsightsStore;
  
  // Rate limiting: minimum 5 minutes between AI insight generations to prevent excessive API usage
  private static readonly RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AIInsightsStore {
    if (!AIInsightsStore.instance) {
      AIInsightsStore.instance = new AIInsightsStore();
    }
    return AIInsightsStore.instance;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  getState(): AIInsightsState {
    return { ...this.state };
  }

  updateMetrics(metrics: MarketMetrics): void {
    this.state.metrics = metrics;
    this.notifyListeners();
  }

  canGenerateInsights(forceGenerate = false): boolean {
    if (forceGenerate) return true;
    const now = Date.now();
    return (now - this.state.lastGeneratedTime) >= AIInsightsStore.RATE_LIMIT_MS;
  }

  setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.notifyListeners();
  }

  setError(error: string | null): void {
    this.state.error = error;
    this.notifyListeners();
  }

  addInsight(insight: AIMarketInsight): void {
    this.state.insights = [insight, ...this.state.insights.slice(0, 4)]; // Keep only 5 latest
    this.state.lastGeneratedTime = Date.now();
    this.state.error = null;
    this.notifyListeners();
  }

  clearInsights(): void {
    this.state.insights = [];
    this.notifyListeners();
  }

  hasRecentInsights(): boolean {
    const now = Date.now();
    return this.state.insights.length > 0 && 
           this.state.insights.some(insight => (now - insight.timestamp) < AIInsightsStore.RATE_LIMIT_MS);
  }
}

export const aiInsightsStore = AIInsightsStore.getInstance();
export type { AIMarketInsight, MarketMetrics };
