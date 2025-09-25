import { NextRequest, NextResponse } from 'next/server';
import { aiApiLimiter } from '@/lib/utils/rateLimiter';
import { aiChatService } from '@/lib/database/services';
import { InputValidator } from '@/lib/utils/validation';
import { PortfolioContextService } from '@/lib/ai/portfolioContext';

interface GeminiRequest {
  prompt: string;
  type: 'market_analysis' | 'portfolio_recommendation' | 'risk_warning' | 'opportunity' | 'investment_advice' | 'crypto_analysis';
  userId?: string; // Optional user context
  symbol?: string; // For crypto-specific analysis
  includePortfolio?: boolean; // Whether to include portfolio data
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    if (!aiApiLimiter.isAllowed(clientIp)) {
      const timeUntilReset = Math.ceil(aiApiLimiter.getTimeUntilReset(clientIp) / 1000);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please wait ${timeUntilReset} seconds before trying again.`,
        retryAfter: timeUntilReset
      }, { status: 429 });
    }

    const body = await request.json();
    const { prompt, type, userId, symbol, includePortfolio }: GeminiRequest = body;

    // Validate and sanitize inputs
    if (!prompt || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and type' },
        { status: 400 }
      );
    }

    const sanitizedPrompt = InputValidator.sanitizeText(prompt, 2000);
    const validUserId = userId ? InputValidator.validateUserId(userId) : null;

    if (userId && !validUserId) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt too long (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    const validTypes = ['market_analysis', 'portfolio_recommendation', 'risk_warning', 'opportunity', 'investment_advice', 'crypto_analysis'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    if (typeof prompt !== 'string' || sanitizedPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Return a fallback response when API key is not configured
      return NextResponse.json({
        type,
        content: `[API KEY MISSING] ${getFallbackResponse(type, prompt)}`,
        confidence: 60,
        actionable: true,
        timeframe: 'short',
        needsApiKey: true
      });
    }

    // Create enhanced system prompt based on type
    let enhancedPrompt = '';
    let portfolioContext = '';
    
    // Get portfolio context if requested
    if (includePortfolio || type === 'portfolio_recommendation') {
      try {
        const portfolio = await PortfolioContextService.getPortfolioSummary(validUserId || undefined);
        portfolioContext = PortfolioContextService.createPortfolioContext(portfolio);
        const recommendations = PortfolioContextService.generateRecommendations(portfolio);
        
        if (recommendations.length > 0) {
          portfolioContext += '\n\nPortfolio Recommendations:\n' + recommendations.map(r => `- ${r}`).join('\n');
        }
      } catch (error) {
        console.error('Error fetching portfolio context:', error);
        portfolioContext = 'Portfolio data temporarily unavailable.';
      }
    }
    
    if (type === 'investment_advice') {
      enhancedPrompt = `You are a professional crypto investment advisor with access to the user's portfolio data. ${portfolioContext ? `\n\nUser's Portfolio:\n${portfolioContext}\n\n` : ''}

The user is asking: "${sanitizedPrompt}"

Please provide friendly, personalized advice in 75-125 words including:
- Specific recommendations based on their current holdings
- Whether they should buy, sell, or hold existing positions
- Risk assessment based on their portfolio composition
- Specific crypto suggestions that complement their current holdings
- Always remind users about market volatility and to do their own research

Be graceful, kind, and professional in your response.`;
    } else if (type === 'portfolio_recommendation') {
      enhancedPrompt = `You are a portfolio optimization expert analyzing the user's crypto portfolio. ${portfolioContext ? `\n\nUser's Portfolio:\n${portfolioContext}\n\n` : ''}

The user is asking: "${sanitizedPrompt}"

Provide portfolio optimization advice in 75-125 words including:
- Current portfolio strengths and weaknesses
- Rebalancing recommendations
- Risk level assessment
- Diversification suggestions
- Specific allocation improvements

Focus on actionable advice based on their actual holdings.`;
    } else if (type === 'crypto_analysis') {
      const holdingInfo = portfolioContext ? await PortfolioContextService.getHoldingInfo(symbol || sanitizedPrompt, validUserId || undefined) : null;
      
      enhancedPrompt = `Analyze ${symbol || sanitizedPrompt} as a crypto investment advisor. ${holdingInfo ? `\n\nUser currently holds: ${holdingInfo.balance} ${holdingInfo.symbol} worth $${holdingInfo.valueUSD.toLocaleString()} (${holdingInfo.allocation.toFixed(1)}% of portfolio)\n\n` : ''}

Provide:
- Brief project description and use case (1-2 sentences)
- Current market position and recent performance
- Investment thesis (bullish/bearish factors)
- ${holdingInfo ? 'Whether to buy more, hold, or reduce position' : 'Entry point recommendations'}
- Key risks and opportunities
- Time horizon recommendation (short/medium/long term)

Keep response 75-125 words, professional but accessible. User query: "${sanitizedPrompt}"`;
    } else {
      enhancedPrompt = `${getSystemPromptForType(type)}\n\n${portfolioContext ? `User's Portfolio Context:\n${portfolioContext}\n\n` : ''}User query: ${sanitizedPrompt}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      
      // Handle rate limiting specifically with exponential backoff suggestion
      if (response.status === 429) {
        console.warn('⚠️ Gemini API rate limit exceeded - suggesting retry');
        return NextResponse.json({
          type,
          content: "I'm experiencing high demand right now. Please wait 10-15 seconds and try again for fresh AI analysis.",
          confidence: 50,
          actionable: false,
          timeframe: 'short',
          isRateLimited: true
        });
      }
      
      // Return fallback for other errors
      return NextResponse.json({
        type,
        content: getFallbackResponse(type, prompt),
        confidence: 70,
        actionable: true,
        timeframe: 'short'
      });
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(type, prompt);

    // Save AI chat interaction to database if userId provided
    if (userId) {
      try {
        // Map the request type to the database enum
        const chatType = mapRequestTypeToDbType(type);
        
        await aiChatService.saveChatMessage(userId, {
          message: prompt,
          response: aiResponse,
          type: chatType,
          context: {
            clientIp: clientIp.slice(0, 10) + '...',
            timestamp: Date.now(),
            originalType: type
          },
          confidence: 90
        });
        // Successfully saved to database
      } catch (error) {
        // Log error but don't expose details to client
        console.error('Failed to save AI chat to database:', error instanceof Error ? error.message : 'Unknown error');
        // Continue without failing the request
      }
    }

    return NextResponse.json({
      type,
      content: aiResponse,
      confidence: 90,
      actionable: true,
      timeframe: 'short',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Gemini API route error:', error);
    // Return fallback instead of 500 error
    return NextResponse.json({
      type: 'market_analysis',
      content: 'Market analysis temporarily unavailable. Our AI systems are processing current market conditions and will provide insights shortly.',
      confidence: 60,
      actionable: false,
      timeframe: 'short'
    });
  }
}

function getFallbackResponse(type: string, prompt: string): string {
  const marketKeywords = prompt.toLowerCase();
  const isBullish = marketKeywords.includes('pump') || marketKeywords.includes('bullish') || marketKeywords.includes('gain');
  const isBearish = marketKeywords.includes('dump') || marketKeywords.includes('bearish') || marketKeywords.includes('loss');
  
  switch (type) {
    case 'investment_advice':
      return 'Based on current market conditions, I recommend focusing on established cryptocurrencies like Bitcoin (BTC) and Ethereum (ETH) for stability. Consider avoiding highly volatile meme coins and low-cap altcoins due to increased risk. Bitcoin offers store-of-value properties while Ethereum powers DeFi innovations. Always diversify and never invest more than you can afford to lose. Cryptocurrency markets are highly volatile - conduct your own research before investing.';
    
    case 'crypto_analysis':
      return 'I\'m currently unable to provide specific crypto analysis due to high demand. For any cryptocurrency investment, consider: project fundamentals, team credibility, use case adoption, market cap size, and recent price action. Always analyze multiple factors including technology, partnerships, and community strength. Remember that crypto investments carry significant risk - please consult multiple sources and consider your risk tolerance.';
    
    case 'market_analysis':
      if (isBullish) {
        return 'Current market indicators show positive momentum with increased buying pressure. Volume patterns suggest continued upward movement in the short term. Key resistance levels are being tested, and if broken, could lead to further gains. Monitor RSI and MACD for confirmation signals.';
      } else if (isBearish) {
        return 'Market sentiment appears cautious with selling pressure evident across major assets. Support levels are being tested, and traders should watch for potential breakdowns. Consider risk management strategies and wait for clearer directional signals before major positions.';
      }
      return 'Market conditions are showing mixed signals with moderate volatility. Trading volume remains steady across major cryptocurrencies. Key support and resistance levels are holding, suggesting a consolidation phase. Watch for breakout patterns in the coming sessions.';
    
    case 'portfolio_recommendation':
      return 'Your current portfolio allocation appears well-diversified across major asset classes. Consider rebalancing if any single position exceeds 25% of total value. Current market conditions favor a cautious approach with emphasis on blue-chip cryptocurrencies and stable assets.';
    
    case 'risk_warning':
      return 'Current market volatility suggests elevated risk levels. Consider implementing stop-losses and position sizing strategies. Correlation between assets tends to increase during volatile periods, so diversification benefits may be reduced. Maintain adequate cash reserves.';
    
    case 'opportunity':
      return 'Several assets are approaching key technical levels that could present opportunities. Look for oversold conditions in quality projects with strong fundamentals. Dollar-cost averaging can be effective during uncertain periods. Always maintain proper risk management.';
    
    default:
      return 'Market analysis is temporarily limited due to high API demand. Real-time data processing will resume shortly. Current conditions suggest maintaining existing positions while monitoring key technical indicators for entry/exit signals.';
  }
}

function mapRequestTypeToDbType(type: string): 'GENERAL' | 'PORTFOLIO_ANALYSIS' | 'MARKET_ANALYSIS' | 'RISK_ASSESSMENT' | 'STRATEGY_ADVICE' | 'TECHNICAL_ANALYSIS' {
  switch (type) {
    case 'market_analysis':
      return 'MARKET_ANALYSIS';
    case 'portfolio_recommendation':
      return 'PORTFOLIO_ANALYSIS';
    case 'risk_warning':
      return 'RISK_ASSESSMENT';
    case 'opportunity':
      return 'STRATEGY_ADVICE';
    case 'investment_advice':
      return 'STRATEGY_ADVICE';
    case 'crypto_analysis':
      return 'TECHNICAL_ANALYSIS';
    default:
      return 'GENERAL';
  }
}

function getSystemPromptForType(type: string): string {
  switch (type) {
    case 'market_analysis':
      return 'You are an expert crypto market analyst. Provide technical and fundamental analysis with specific price levels, volume indicators, and market sentiment. Include actionable trading insights.';
    case 'portfolio_recommendation':
      return 'You are a portfolio optimization expert. Analyze asset allocation, diversification, risk metrics, and suggest rebalancing strategies based on current market conditions.';
    case 'risk_warning':
      return 'You are a risk management specialist. Identify potential risks, volatility concerns, correlation risks, and provide specific risk mitigation strategies.';
    case 'opportunity':
      return 'You are an investment opportunity specialist. Identify undervalued assets, emerging trends, technical breakout patterns, and time-sensitive trading opportunities.';
    default:
      return 'You are a helpful crypto and DeFi assistant. Provide accurate, actionable information while emphasizing proper risk management.';
  }
}
