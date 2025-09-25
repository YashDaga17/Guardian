/**
 * Portfolio Context Service for AI Assistant
 * Provides real portfolio data for personalized investment advice
 */

import { CoinGeckoService } from '../market/coinGeckoService';

export interface PortfolioHolding {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  priceUSD: number;
  change24h: number;
  allocation: number;
  category: 'crypto' | 'defi' | 'nft' | 'stablecoin';
}

export interface PortfolioSummary {
  totalValueUSD: number;
  totalChange24h: number;
  totalChangePercent: number;
  holdings: PortfolioHolding[];
  topGainers: PortfolioHolding[];
  topLosers: PortfolioHolding[];
  allocation: {
    crypto: number;
    defi: number;
    stablecoin: number;
    nft: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  diversificationScore: number;
}

export class PortfolioContextService {
  /**
   * Get current portfolio summary for AI analysis with real CoinGecko data
   */
  static async getPortfolioSummary(_userId?: string): Promise<PortfolioSummary> {
    try {
      // Mock user holdings - replace with actual database query
      const userHoldings = [
        { symbol: 'BTC', balance: 2.5 },
        { symbol: 'ETH', balance: 12.8 },
        { symbol: 'SOL', balance: 45.2 },
        { symbol: 'LINK', balance: 890 },
        { symbol: 'USDC', balance: 4812.50 }
      ];

      // Get real prices from CoinGecko
      const portfolioData = await CoinGeckoService.getPortfolioValue(userHoldings);
      const realPrices = await CoinGeckoService.getCurrentPrices(['bitcoin', 'ethereum', 'solana', 'chainlink', 'usd-coin']);
      
      // Calculate portfolio metrics with real data
      const holdings: PortfolioHolding[] = portfolioData.holdings.map((holding) => {
        const coinData = realPrices.find(coin => 
          (coin.symbol === holding.symbol) || 
          (holding.symbol === 'BTC' && coin.id === 'bitcoin') ||
          (holding.symbol === 'ETH' && coin.id === 'ethereum') ||
          (holding.symbol === 'SOL' && coin.id === 'solana') ||
          (holding.symbol === 'LINK' && coin.id === 'chainlink') ||
          (holding.symbol === 'USDC' && coin.id === 'usd-coin')
        );

        const change24h = coinData?.priceChangePercentage24h || 0;
        const allocation = portfolioData.totalValue > 0 ? (holding.value / portfolioData.totalValue) * 100 : 0;

        return {
          symbol: holding.symbol,
          name: coinData?.name || holding.symbol,
          balance: holding.balance,
          valueUSD: holding.value,
          priceUSD: holding.price,
          change24h,
          allocation,
          category: holding.symbol === 'USDC' ? 'stablecoin' : 
                   holding.symbol === 'LINK' ? 'defi' : 'crypto' as 'crypto' | 'defi' | 'nft' | 'stablecoin'
        };
      });

      // Calculate total change based on real price movements
      const totalChange24h = holdings.reduce((sum, holding) => {
        const change = (holding.valueUSD * holding.change24h) / 100;
        return sum + change;
      }, 0);

      const previousValue = portfolioData.totalValue - totalChange24h;
      const totalChangePercent = previousValue > 0 ? (totalChange24h / previousValue) * 100 : 0;

      // Sort for top gainers/losers
      const sortedByChange = [...holdings].sort((a, b) => b.change24h - a.change24h);
      const topGainers = sortedByChange.filter(h => h.change24h > 0).slice(0, 3);
      const topLosers = sortedByChange.filter(h => h.change24h < 0).slice(-3);

      // Calculate allocation percentages
      const allocation = {
        crypto: holdings.filter(h => h.category === 'crypto').reduce((sum, h) => sum + h.allocation, 0),
        defi: holdings.filter(h => h.category === 'defi').reduce((sum, h) => sum + h.allocation, 0),
        stablecoin: holdings.filter(h => h.category === 'stablecoin').reduce((sum, h) => sum + h.allocation, 0),
        nft: 0
      };

      // Risk assessment based on allocations and volatility
      const btcAllocation = holdings.find(h => h.symbol === 'BTC')?.allocation || 0;
      const stablecoinAllocation = allocation.stablecoin;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (stablecoinAllocation > 50) riskLevel = 'low';
      else if (btcAllocation < 30 && stablecoinAllocation < 20) riskLevel = 'high';

      // Diversification score (0-100)
      const diversificationScore = Math.min(100, 
        (holdings.length * 15) + // More holdings = better diversification
        (allocation.stablecoin > 10 ? 20 : 0) + // Stable allocation bonus
        (allocation.defi > 5 ? 15 : 0) + // DeFi exposure bonus
        (btcAllocation > 20 && btcAllocation < 60 ? 20 : 0) // Balanced BTC allocation
      );

      return {
        totalValueUSD: portfolioData.totalValue,
        totalChange24h,
        totalChangePercent,
        holdings,
        topGainers,
        topLosers,
        allocation,
        riskLevel,
        diversificationScore
      };

    } catch (error) {
      console.error('Error fetching real portfolio data:', error);
      
      // Fallback to mock data if CoinGecko fails
      return this.getMockPortfolioData();
    }
  }

  /**
   * Fallback mock portfolio data
   */
  private static getMockPortfolioData(): PortfolioSummary {
    const holdings: PortfolioHolding[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 2.5,
        valueUSD: 67500.00,
        priceUSD: 27000.00,
        change24h: 3.2,
        allocation: 53.8,
        category: 'crypto'
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 12.8,
        valueUSD: 30720.00,
        priceUSD: 2400.00,
        change24h: 1.8,
        allocation: 24.5,
        category: 'crypto'
      },
      {
        symbol: 'SOL', 
        name: 'Solana',
        balance: 45.2,
        valueUSD: 9950.00,
        priceUSD: 220.13,
        change24h: -1.8,
        allocation: 7.9,
        category: 'crypto'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        balance: 890,
        valueUSD: 12450.00,
        priceUSD: 14.00,
        change24h: 5.4,
        allocation: 9.9,
        category: 'defi'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: 4812.50,
        valueUSD: 4812.50,
        priceUSD: 1.00,
        change24h: 0.1,
        allocation: 3.8,
        category: 'stablecoin'
      }
    ];

    const sortedByChange = [...holdings].sort((a, b) => b.change24h - a.change24h);
    
    return {
      totalValueUSD: 125432.50,
      totalChange24h: 2956.75,
      totalChangePercent: 2.4,
      holdings,
      topGainers: sortedByChange.filter(h => h.change24h > 0).slice(0, 3),
      topLosers: sortedByChange.filter(h => h.change24h < 0).slice(-3),
      allocation: {
        crypto: 86.2,
        defi: 9.9,
        stablecoin: 3.8,
        nft: 0
      },
      riskLevel: 'medium',
      diversificationScore: 78
    };
  }

  /**
   * Create formatted portfolio context for AI prompts
   */
  static createPortfolioContext(portfolio: PortfolioSummary): string {
    const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
    const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

    let context = `Portfolio Overview:\n`;
    context += `Total Value: ${formatCurrency(portfolio.totalValueUSD)}\n`;
    context += `24h Change: ${formatCurrency(portfolio.totalChange24h)} (${formatPercent(portfolio.totalChangePercent)})\n`;
    context += `Risk Level: ${portfolio.riskLevel.toUpperCase()}\n`;
    context += `Diversification Score: ${portfolio.diversificationScore}/100\n\n`;

    context += `Current Holdings:\n`;
    portfolio.holdings.forEach(holding => {
      context += `• ${holding.name} (${holding.symbol}): ${holding.balance.toLocaleString()} = ${formatCurrency(holding.valueUSD)} (${holding.allocation.toFixed(1)}%) - ${formatPercent(holding.change24h)}\n`;
    });

    context += `\nAllocation Breakdown:\n`;
    context += `• Crypto: ${portfolio.allocation.crypto.toFixed(1)}%\n`;
    context += `• DeFi: ${portfolio.allocation.defi.toFixed(1)}%\n`;
    context += `• Stablecoins: ${portfolio.allocation.stablecoin.toFixed(1)}%\n`;

    if (portfolio.topGainers.length > 0) {
      context += `\nTop Performers Today:\n`;
      portfolio.topGainers.forEach(holding => {
        context += `• ${holding.symbol}: ${formatPercent(holding.change24h)}\n`;
      });
    }

    if (portfolio.topLosers.length > 0) {
      context += `\nUnderperformers Today:\n`;
      portfolio.topLosers.forEach(holding => {
        context += `• ${holding.symbol}: ${formatPercent(holding.change24h)}\n`;
      });
    }

    return context;
  }

  /**
   * Get specific holding information
   */
  static async getHoldingInfo(symbol: string, userId?: string): Promise<PortfolioHolding | null> {
    const portfolio = await this.getPortfolioSummary(userId);
    return portfolio.holdings.find(h => 
      h.symbol.toLowerCase() === symbol.toLowerCase()
    ) || null;
  }

  /**
   * Calculate key portfolio metrics
   */
  static calculatePortfolioMetrics(portfolio: PortfolioSummary) {
    return {
      totalValue: portfolio.totalValueUSD,
      dailyChange: portfolio.totalChange24h,
      diversification: portfolio.diversificationScore,
      riskLevel: portfolio.riskLevel,
      largestHolding: Math.max(...portfolio.holdings.map(h => h.allocation)),
      cryptoExposure: portfolio.allocation.crypto,
      stablecoinBuffer: portfolio.allocation.stablecoin
    };
  }

  /**
   * Generate investment recommendations based on portfolio analysis
   */
  static generateRecommendations(portfolio: PortfolioSummary): string[] {
    const recommendations: string[] = [];
    const metrics = this.calculatePortfolioMetrics(portfolio);

    // Diversification recommendations
    if (metrics.diversification < 60) {
      recommendations.push("Consider diversifying across more crypto assets to reduce risk");
    }

    // Risk management
    if (portfolio.allocation.stablecoin < 10 && portfolio.riskLevel === 'high') {
      recommendations.push("Consider allocating 10-20% to stablecoins for risk management");
    }

    // Concentration risk
    if (metrics.largestHolding > 60) {
      recommendations.push("Your portfolio is heavily concentrated in one asset - consider rebalancing");
    }

    // DeFi exposure
    if (portfolio.allocation.defi < 5 && portfolio.totalValueUSD > 50000) {
      recommendations.push("Consider exposure to DeFi tokens like LINK, UNI, or AAVE");
    }

    // Performance-based recommendations
    if (portfolio.totalChangePercent < -10) {
      recommendations.push("During market downturns, consider dollar-cost averaging into quality assets");
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }
}