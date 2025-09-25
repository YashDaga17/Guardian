'use client';

// Gemini AI Service for Tradely DeFi Platform
// Provides real-time market analysis, portfolio insights, and trading recommendations

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
}

interface PortfolioData {
  totalValue: number;
  assets: Array<{
    symbol: string;
    balance: number;
    value: number;
    allocation: number;
  }>;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface AIInsight {
  type: 'market_analysis' | 'portfolio_recommendation' | 'risk_warning' | 'opportunity';
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
  relatedAssets: string[];
  timeframe: 'short' | 'medium' | 'long';
}

// Cache and request management
interface CacheEntry {
  data: string;
  timestamp: number;
  type: string;
}

export class GeminiAIService {
  private config: GeminiConfig;
  private apiUrl = '/api/ai/gemini'; // Use our server-side API
  private userId?: string; // User context for database storage
  private cache = new Map<string, CacheEntry>(); // Response cache
  private pendingRequests = new Map<string, Promise<string>>(); // Request deduplication
  private readonly CACHE_TTL = 60 * 1000; // 1 minute cache for market insights
  private readonly MAX_CACHE_SIZE = 50; // Limit cache size
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
  
  // Global request lock to ensure only one market analysis at a time
  private static isGeneratingMarketAnalysis = false;
  private static lastMarketAnalysisTime = 0;
  private static readonly MARKET_ANALYSIS_COOLDOWN = 60 * 1000; // 1 minute between market analysis

  constructor(userId?: string) {
    this.userId = userId;
    this.config = {
      apiKey: '', // Not needed on client side anymore
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 1000
    };
  }

  private generateCacheKey(prompt: string, type: string): string {
    return `${type}:${prompt}`;
  }

  private getCachedResponse(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    if (entry && (Date.now() - entry.timestamp) < this.CACHE_TTL) {
      console.log(`[GeminiAI] Cache hit for: ${entry.type}`);
      return entry.data;
    }
    if (entry) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  private setCacheEntry(cacheKey: string, data: string, type: string): void {
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      type
    });
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Generate AI-powered market analysis
   */
  async analyzeMarket(marketData: MarketData[]): Promise<AIInsight> {
    // Check global market analysis cooldown
    const now = Date.now();
    if (GeminiAIService.isGeneratingMarketAnalysis) {
      console.log('[GeminiAI] Market analysis already in progress, using fallback');
      return this.getFallbackMarketAnalysis();
    }
    
    if ((now - GeminiAIService.lastMarketAnalysisTime) < GeminiAIService.MARKET_ANALYSIS_COOLDOWN) {
      console.log('[GeminiAI] Market analysis on cooldown, using fallback');
      return this.getFallbackMarketAnalysis();
    }

    try {
      GeminiAIService.isGeneratingMarketAnalysis = true;
      GeminiAIService.lastMarketAnalysisTime = now;
      
      const prompt = this.createMarketAnalysisPrompt(marketData);
      const response = await this.callGeminiAPI(prompt, 'market_analysis');
      
      return {
        type: 'market_analysis',
        title: 'Market Analysis',
        content: response,
        confidence: 85,
        actionable: true,
        relatedAssets: marketData.map(d => d.symbol),
        timeframe: 'short'
      };
    } catch (error) {
      console.error('Market analysis failed:', error);
      return this.getFallbackMarketAnalysis();
    } finally {
      GeminiAIService.isGeneratingMarketAnalysis = false;
    }
  }

  /**
   * Generate investment advisory chat response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateInvestmentAdvice(userMessage: string, marketContext?: any): Promise<string> {
    try {
      const prompt = this.createInvestmentAdvisoryPrompt(userMessage, marketContext);
      const response = await this.callGeminiAPI(prompt, 'investment_advice');
      return response;
    } catch (error) {
      console.error('Investment advice generation failed:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Analyze specific cryptocurrency for investment recommendation
   */
  async analyzeCrypto(symbol: string, includeRisks: boolean = true): Promise<string> {
    try {
      const prompt = this.createCryptoAnalysisPrompt(symbol, includeRisks);
      const response = await this.callGeminiAPI(prompt, 'crypto_analysis');
      return response;
    } catch (error) {
      console.error('Crypto analysis failed:', error);
      return `I'm unable to analyze ${symbol} right now. Please try again later or consult multiple sources before making investment decisions.`;
    }
  }

  /**
   * Generate portfolio recommendations
   */
  async analyzePortfolio(portfolioData: PortfolioData): Promise<AIInsight> {
    try {
      const prompt = this.createPortfolioAnalysisPrompt(portfolioData);
      const response = await this.callGeminiAPI(prompt, 'portfolio_recommendation');
      
      return {
        type: 'portfolio_recommendation',
        title: 'Portfolio Optimization',
        content: response,
        confidence: 92,
        actionable: true,
        relatedAssets: portfolioData.assets.map(a => a.symbol),
        timeframe: 'medium'
      };
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      return this.getFallbackPortfolioAnalysis();
    }
  }

  /**
   * Explain market movements with AI reasoning
   */
  async explainMovement(symbol: string, priceChange: number, context: Record<string, unknown>): Promise<string> {
    try {
      const prompt = this.createMovementExplanationPrompt(symbol, priceChange, context);
      return await this.callGeminiAPI(prompt, 'market_analysis');
    } catch (error) {
      console.error('Movement explanation failed:', error);
      return this.getFallbackExplanation(symbol, priceChange);
    }
  }

  /**
   * Generate trading recommendations
   */
  async getTradingRecommendation(
    symbol: string, 
    marketData: MarketData, 
    userProfile: Record<string, unknown>
  ): Promise<AIInsight> {
    try {
      const prompt = this.createTradingRecommendationPrompt(symbol, marketData, userProfile);
      const response = await this.callGeminiAPI(prompt, 'opportunity');
      
      return {
        type: 'opportunity',
        title: `${symbol} Trading Opportunity`,
        content: response,
        confidence: 78,
        actionable: true,
        relatedAssets: [symbol],
        timeframe: 'short'
      };
    } catch (error) {
      console.error('Trading recommendation failed:', error);
      return this.getFallbackTradingRecommendation(symbol);
    }
  }

  /**
   * Risk assessment with AI insights
   */
  async assessRisk(portfolioData: PortfolioData, marketConditions: Record<string, unknown>): Promise<AIInsight> {
    try {
      const prompt = this.createRiskAssessmentPrompt(portfolioData, marketConditions);
      const response = await this.callGeminiAPI(prompt, 'risk_warning');
      
      return {
        type: 'risk_warning',
        title: 'Risk Assessment',
        content: response,
        confidence: 88,
        actionable: true,
        relatedAssets: portfolioData.assets.map(a => a.symbol),
        timeframe: 'medium'
      };
    } catch (error) {
      console.error('Risk assessment failed:', error);
      return this.getFallbackRiskAssessment();
    }
  }

  /**
   * Core Gemini API call through server-side endpoint
   */
  private async callGeminiAPI(prompt: string, type: string = 'market_analysis'): Promise<string> {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Invalid prompt provided');
    }

    const validTypes = ['market_analysis', 'portfolio_recommendation', 'risk_warning', 'opportunity', 'investment_advice'];
    if (!validTypes.includes(type)) {
      console.warn(`Invalid type "${type}", defaulting to market_analysis`);
      type = 'market_analysis';
    }

    const cacheKey = this.generateCacheKey(prompt.trim(), type);
    
    // Check cache first
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check for pending requests (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`[GeminiAI] Request already pending for: ${type}`);
      return await this.pendingRequests.get(cacheKey)!;
    }

    // Create new request with rate limiting
    const requestPromise = this.makeAPIRequest(prompt.trim(), type);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // Cache the response
      this.setCacheEntry(cacheKey, response, type);
      
      return response;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async makeAPIRequest(prompt: string, type: string): Promise<string> {
    // Rate limiting
    await this.waitForRateLimit();

    try {
      console.log(`[GeminiAI] Making API request for: ${type}`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type,
          userId: this.userId // Include userId for database storage
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`[GeminiAI] Rate limited for ${type}, falling back`);
          throw new Error('Rate limit exceeded');
        }
        console.error('Gemini API call failed:', response.status, response.statusText);
        throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[GeminiAI] Successfully received response for: ${type}`);
      return data.content || 'No response available';
    } catch (error) {
      console.error('Gemini API call error:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Create market analysis prompt
   */
  private createMarketAnalysisPrompt(marketData: MarketData[]): string {
    const marketSummary = marketData.map(d => 
      `${d.symbol}: $${d.price} (${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%)`
    ).join(', ');

    return `
As a professional cryptocurrency analyst, analyze the current market conditions based on this data:

${marketSummary}

Provide a concise market analysis (max 150 words) covering:
1. Overall market sentiment
2. Key trends and patterns
3. Potential catalysts or risks
4. Short-term outlook (1-7 days)

Focus on actionable insights for DeFi investors. Use clear, professional language.
`;
  }

  /**
   * Create portfolio analysis prompt
   */
  private createPortfolioAnalysisPrompt(portfolioData: PortfolioData): string {
    const assetBreakdown = portfolioData.assets.map(a => 
      `${a.symbol}: ${a.allocation.toFixed(1)}% ($${a.value.toFixed(0)})`
    ).join(', ');

    return `
As a DeFi portfolio advisor, analyze this portfolio:

Total Value: $${portfolioData.totalValue.toFixed(0)}
Assets: ${assetBreakdown}
Performance: Daily ${portfolioData.performance.daily > 0 ? '+' : ''}${portfolioData.performance.daily.toFixed(1)}%

Provide specific recommendations (max 150 words) for:
1. Asset allocation optimization
2. Risk management improvements
3. Rebalancing suggestions
4. DeFi opportunities

Be specific and actionable.
`;
  }

  /**
   * Create movement explanation prompt
   */
  private createMovementExplanationPrompt(symbol: string, priceChange: number, _context: Record<string, unknown>): string {
    return `
Explain why ${symbol} moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% today.

Consider these factors:
- Market sentiment and trends
- Recent news and developments
- Technical indicators
- Broader crypto market movements

Provide a clear, concise explanation (max 100 words) that helps users understand the reasoning behind this price movement.
`;
  }

  /**
   * Create trading recommendation prompt
   */
  private createTradingRecommendationPrompt(symbol: string, marketData: MarketData, _userProfile: Record<string, unknown>): string {
    return `
As a trading advisor, analyze ${symbol} for potential trading opportunities:

Current Price: $${marketData.price}
24h Change: ${marketData.change24h > 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%
Volume: $${(marketData.volume / 1e6).toFixed(1)}M

Provide a trading recommendation (max 120 words) including:
1. Entry/exit strategy
2. Risk level assessment
3. Position sizing suggestion
4. Stop-loss recommendations

Consider current market conditions and be specific about timing.
`;
  }

  /**
   * Create risk assessment prompt
   */
  private createRiskAssessmentPrompt(portfolioData: PortfolioData, _marketConditions: Record<string, unknown>): string {
    return `
Assess the risk profile of this DeFi portfolio:

Total Value: $${portfolioData.totalValue.toFixed(0)}
Top Holdings: ${portfolioData.assets.slice(0, 3).map(a => a.symbol).join(', ')}
Performance Volatility: High concentration in top assets

Provide a risk assessment (max 150 words) covering:
1. Current risk level (1-10 scale)
2. Major risk factors
3. Diversification recommendations
4. Risk mitigation strategies

Focus on practical risk management for DeFi portfolios.
`;
  }

  /**
   * Create investment advisory prompt for general crypto advice
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createInvestmentAdvisoryPrompt(userMessage: string, marketContext?: any): string {
    return `You are a knowledgeable crypto investment advisor. Respond to the user's question with:
- Brief, friendly advice (75-125 words)
- 1-2 specific crypto recommendations with reasoning
- 1-2 cryptos to avoid with brief explanation
- Company/project background for mentioned tokens
- Risk assessment for recommendations
- Market context if relevant

User question: "${userMessage}"

Market context: ${marketContext ? JSON.stringify(marketContext) : 'No specific market data available'}

Format your response in a graceful, professional manner suitable for investment guidance.`;
  }

  /**
   * Create crypto analysis prompt for specific tokens
   */
  private createCryptoAnalysisPrompt(symbol: string, includeRisks: boolean): string {
    return `Analyze ${symbol} for investment potential. Provide:
- Brief project description (1-2 sentences)
- Current market position and recent performance
- Investment thesis (bullish/bearish factors)
- ${includeRisks ? 'Key risks to consider' : ''}
- Time horizon recommendation (short/medium/long term)

Keep response concise (75-125 words) and actionable for retail investors.`;
  }

  /**
   * Get fallback investment advice when API fails
   */
  private getFallbackAdvice(): string {
    return `I'm currently unable to access real-time market data, but here are some general principles: Diversify across major cryptocurrencies (BTC, ETH), avoid highly speculative tokens, and never invest more than you can afford to lose. Consider dollar-cost averaging for long-term positions. For current market conditions, consult multiple sources and consider your risk tolerance. Remember: cryptocurrency investments carry significant risk.`;
  }

  // Fallback responses when API fails - with variations to avoid repetition
  private getFallbackMarketAnalysis(): AIInsight {
    const fallbacks = [
      'Current market conditions show mixed signals with moderate volatility. Major cryptocurrencies are consolidating after recent movements. Monitor key support/resistance levels and consider gradual position building during market uncertainty.',
      'Market sentiment remains cautious with selective buying interest. Key cryptocurrencies are finding support at technical levels. Watch for volume confirmation before taking significant positions.',
      'Crypto markets are experiencing sideways movement with pockets of strength in select assets. Risk management remains crucial in this environment. Consider taking profits on outperformers and accumulating quality projects on dips.',
      'Mixed signals across crypto markets with Bitcoin and Ethereum showing resilience. Altcoins remain volatile with divergent performance. Focus on fundamentally strong projects and maintain diversified exposure.',
    ];
    
    return {
      type: 'market_analysis',
      title: 'Market Analysis',
      content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      confidence: 75,
      actionable: true,
      relatedAssets: ['BTC', 'ETH'],
      timeframe: 'short'
    };
  }

  private getFallbackPortfolioAnalysis(): AIInsight {
    return {
      type: 'portfolio_recommendation',
      title: 'Portfolio Optimization',
      content: 'Your portfolio shows good performance but could benefit from rebalancing. Consider reducing concentration in top holdings and diversifying into stablecoins for risk management. Review your DeFi positions for optimal yield opportunities.',
      confidence: 80,
      actionable: true,
      relatedAssets: ['ETH', 'BTC', 'USDC'],
      timeframe: 'medium'
    };
  }

  private getFallbackRiskAssessment(): AIInsight {
    return {
      type: 'risk_warning',
      title: 'Risk Assessment',
      content: 'Portfolio risk level: 7/10. High concentration in volatile assets increases downside exposure. Consider implementing stop-losses, increasing stablecoin allocation to 15-20%, and diversifying across different DeFi protocols.',
      confidence: 85,
      actionable: true,
      relatedAssets: ['ETH', 'BTC'],
      timeframe: 'medium'
    };
  }

  private getFallbackExplanation(symbol: string, priceChange: number): string {
    if (priceChange > 5) {
      return `${symbol} gained ${priceChange.toFixed(1)}% likely due to positive market sentiment, increased buying pressure, or favorable news. Monitor for continued momentum or profit-taking opportunities.`;
    } else if (priceChange < -5) {
      return `${symbol} declined ${Math.abs(priceChange).toFixed(1)}% possibly due to market-wide selling, profit-taking, or specific concerns. Consider this a potential accumulation opportunity if fundamentals remain strong.`;
    } else {
      return `${symbol} showed minimal movement (${priceChange.toFixed(1)}%), indicating consolidation. This sideways action often precedes significant directional moves.`;
    }
  }

  private getFallbackTradingRecommendation(symbol: string): AIInsight {
    return {
      type: 'opportunity',
      title: `${symbol} Trading Opportunity`,
      content: `${symbol} presents moderate trading opportunity. Consider dollar-cost averaging for long-term positions or wait for clearer directional signals for short-term trades. Set stop-losses at 8-10% below entry.`,
      confidence: 70,
      actionable: true,
      relatedAssets: [symbol],
      timeframe: 'short'
    };
  }
}

// Create singleton instance with no user context (for general use)
// Components should create their own instances with user context for database storage
export const geminiAI = new GeminiAIService();
