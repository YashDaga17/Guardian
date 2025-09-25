'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Target,
  Lightbulb,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIAssistant from '@/components/ai/AIAssistant';
import { AIMarketInsights } from '@/components/ai/AIMarketInsights';
import { getAIService } from '@/lib/ai/aiServiceSingleton';

interface AIMetrics {
  totalAnalyses: number;
  successfulPredictions: number;
  averageConfidence: number;
  recommendationsGenerated: number;
}

interface AIInsight {
  type: 'market_analysis' | 'portfolio_recommendation' | 'risk_warning' | 'opportunity';
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
  relatedAssets: string[];
  timeframe: 'short' | 'medium' | 'long';
}

const Header = ({ 
  setIsAssistantOpen, 
  generatePortfolioInsights, 
  isGeneratingInsights 
}: { 
  setIsAssistantOpen: (open: boolean) => void;
  generatePortfolioInsights: () => void;
  isGeneratingInsights: boolean;
}) => {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Analytics Hub</h1>
        <p className="text-muted-foreground">
          AI-powered market analysis, portfolio insights, and conversational trading assistance
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline"
          onClick={() => setIsAssistantOpen(true)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Open AI Assistant
        </Button>
        <Button onClick={generatePortfolioInsights} disabled={isGeneratingInsights}>
          <Brain className="h-4 w-4 mr-2" />
          Generate Insights
        </Button>
      </div>
    </div>
  );
};

const AIPerformanceMetrics = ({ aiMetrics }: { aiMetrics: AIMetrics }) => {
  const successRate = (aiMetrics.successfulPredictions / aiMetrics.totalAnalyses) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aiMetrics.totalAnalyses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            +23 in the last hour
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Above 85% target
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aiMetrics.averageConfidence}%</div>
          <p className="text-xs text-muted-foreground">
            High confidence threshold
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aiMetrics.recommendationsGenerated}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const PortfolioAIAnalysis = ({ 
  portfolioInsights, 
  isGeneratingInsights 
}: { 
  portfolioInsights: AIInsight[];
  isGeneratingInsights: boolean;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          Portfolio AI Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your portfolio performance and optimization recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {portfolioInsights.map((insight, index) => (
          <div key={index} className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{insight.title}</h4>
              <span className="text-sm text-muted-foreground">
                {insight.confidence}% confidence
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.content}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              {insight.relatedAssets?.map((asset: string) => (
                <span key={asset} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {asset}
                </span>
              ))}
            </div>
          </div>
        ))}
        
        {isGeneratingInsights && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 animate-pulse text-purple-600" />
              <span className="text-muted-foreground">Generating AI insights...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AIRiskAssessment = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Risk Assessment</CardTitle>
        <CardDescription>
          Real-time risk analysis powered by machine learning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Portfolio Risk Score</span>
            <span className="text-lg font-bold text-yellow-600">7.2/10</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Volatility Risk</span>
              <span className="text-red-600">High</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Concentration Risk</span>
              <span className="text-yellow-600">Medium</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Liquidity Risk</span>
              <span className="text-green-600">Low</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ AI Recommendation: Consider reducing ETH allocation below 40% and increasing 
              stablecoin exposure to 20% for better risk-adjusted returns.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AIPredictions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          AI Market Predictions
        </CardTitle>
        <CardDescription>
          Machine learning-based price predictions and trend analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">BTC Price (7 days)</span>
                <span className="text-green-600 text-sm">82% confidence</span>
              </div>
              <div className="text-xl font-bold">$49,200 - $52,800</div>
              <p className="text-sm text-muted-foreground">
                Upward trend expected based on institutional flows
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">ETH Price (7 days)</span>
                <span className="text-blue-600 text-sm">78% confidence</span>
              </div>
              <div className="text-xl font-bold">$3,350 - $3,650</div>
              <p className="text-sm text-muted-foreground">
                Moderate growth with DeFi activity increase
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Key Prediction Factors</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Institutional buying pressure increasing</li>
              <li>• DeFi TVL growth accelerating</li>
              <li>• Options market showing bullish sentiment</li>
              <li>• Technical indicators align with upward momentum</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AIAIAssistant = ({ setIsAssistantOpen }: { setIsAssistantOpen: (open: boolean) => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Conversational AI Assistant
        </CardTitle>
        <CardDescription>
          Get instant answers to your crypto and DeFi questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Ask about Markets</h4>
              <p className="text-sm text-muted-foreground">
                "Why did Bitcoin drop today?" or "Explain ETH price movement"
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Portfolio Analysis</h4>
              <p className="text-sm text-muted-foreground">
                "Analyze my portfolio risk" or "Should I rebalance?"
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Trading Advice</h4>
              <p className="text-sm text-muted-foreground">
                "Best DeFi opportunities" or "When to buy ETH?"
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Risk Management</h4>
              <p className="text-sm text-muted-foreground">
                "How to reduce portfolio risk" or "Set stop losses"
              </p>
            </div>
          </div>

          <Button 
            onClick={() => setIsAssistantOpen(true)}
            className="w-full"
            size="lg"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Conversation with AI Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AIAnalyticsPage() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [aiMetrics, _setAiMetrics] = useState<AIMetrics>({
    totalAnalyses: 1247,
    successfulPredictions: 892,
    averageConfidence: 87.3,
    recommendationsGenerated: 156
  });

  const [portfolioInsights, setPortfolioInsights] = useState<AIInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    generatePortfolioInsights();
  }, []);

  const generatePortfolioInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // Mock portfolio data
      const portfolioData = {
        totalValue: 108765,
        assets: [
          { symbol: 'ETH', balance: 15.2456, value: 48782.40, allocation: 45.2 },
          { symbol: 'BTC', balance: 0.5823, value: 27451.30, allocation: 25.4 },
          { symbol: 'USDC', balance: 15420.50, value: 15435.20, allocation: 14.3 },
          { symbol: 'LINK', balance: 542.10, value: 8403.55, allocation: 7.8 }
        ],
        performance: {
          daily: 2.4,
          weekly: 8.1,
          monthly: 15.7
        }
      };

      const aiService = getAIService();
      const insight = await aiService.analyzePortfolio(portfolioData);
      setPortfolioInsights([insight]);
    } catch (error) {
      console.error('Failed to generate portfolio insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header 
        setIsAssistantOpen={setIsAssistantOpen} 
        generatePortfolioInsights={generatePortfolioInsights}
        isGeneratingInsights={isGeneratingInsights}
      />

      <AIPerformanceMetrics aiMetrics={aiMetrics} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio AI</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <AIMarketInsights />
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {/* Portfolio AI Analysis */}
          <PortfolioAIAnalysis 
            portfolioInsights={portfolioInsights}
            isGeneratingInsights={isGeneratingInsights}
          />

          {/* Risk Analysis */}
          <AIRiskAssessment />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* AI Predictions */}
          <AIPredictions />
        </TabsContent>

        <TabsContent value="assistant" className="space-y-6">
          {/* AI Assistant Instructions */}
          <AIAIAssistant setIsAssistantOpen={setIsAssistantOpen} />
        </TabsContent>
      </Tabs>

      {/* AI Assistant Component */}
      <AIAssistant 
        isOpen={isAssistantOpen} 
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
      />
    </div>
  );
}
