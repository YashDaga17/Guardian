// Database Service for Tradely AI DeFi Platform
// Replaces Firebase Firestore with Neon.tech Postgres + Prisma

import { PrismaClient } from '@prisma/client';
import { getDatabase } from './config';

// Initialize Prisma Client
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

// User Management
export class UserService {
  private prisma = getPrismaClient();

  async createUser(walletAddress: string, userData?: {
    email?: string;
    username?: string;
  }) {
    return await this.prisma.user.create({
      data: {
        walletAddress,
        ...userData,
      },
    });
  }

  async getUserByWallet(walletAddress: string) {
    return await this.prisma.user.findUnique({
      where: { walletAddress },
      include: {
        portfolios: true,
        alerts: true,
      },
    });
  }

  async updateUser(userId: string, data: {
    email?: string;
    username?: string;
  }) {
    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}

// Portfolio Management
export class PortfolioService {
  private prisma = getPrismaClient();

  async createPortfolio(userId: string, data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    return await this.prisma.portfolio.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async getUserPortfolios(userId: string) {
    return await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePortfolioValue(portfolioId: string, totalValue: number) {
    return await this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: { totalValue },
    });
  }

  async addHolding(portfolioId: string, data: {
    tokenSymbol: string;
    tokenName: string;
    amount: number;
    averagePrice: number;
    currentPrice: number;
  }) {
    return await this.prisma.portfolioHolding.upsert({
      where: {
        portfolioId_tokenSymbol_network: {
          portfolioId,
          tokenSymbol: data.tokenSymbol,
          network: 'ethereum', // Default network
        },
      },
      update: {
        amount: data.amount,
        averagePrice: data.averagePrice,
        currentPrice: data.currentPrice,
        totalValue: data.amount * data.currentPrice,
        lastUpdated: new Date(),
      },
      create: {
        portfolioId,
        tokenSymbol: data.tokenSymbol,
        tokenName: data.tokenName,
        amount: data.amount,
        averagePrice: data.averagePrice,
        currentPrice: data.currentPrice,
        totalValue: data.amount * data.currentPrice,
      },
    });
  }
}

// Alert Management
export class AlertService {
  private prisma = getPrismaClient();

  async createAlert(userId: string, data: {
    title: string;
    description?: string;
    type: string;
    condition: Record<string, unknown>;
    targetValue?: number;
    symbol?: string;
  }) {
    return await this.prisma.alert.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type as "PRICE_ABOVE" | "PRICE_BELOW" | "VOLUME_SPIKE" | "RSI_OVERBOUGHT" | "RSI_OVERSOLD" | "CUSTOM" | "PERCENT_CHANGE" | "SUPPORT_BREACH" | "RESISTANCE_BREAK" | "PORTFOLIO_VALUE",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        condition: data.condition as any, // Prisma JSON field
        targetValue: data.targetValue,
        symbol: data.symbol,
      },
    });
  }

  async getUserAlerts(userId: string) {
    return await this.prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerAlert(alertId: string) {
    return await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        isTriggered: true,
        triggeredAt: new Date(),
      },
    });
  }

  async deactivateAlert(alertId: string) {
    return await this.prisma.alert.update({
      where: { id: alertId },
      data: { isActive: false },
    });
  }
}

// Trade Management
export class TradeService {
  private prisma = getPrismaClient();

  async createTrade(userId: string, data: {
    type: string;
    side: string;
    toSymbol: string;
    fromSymbol?: string;
    toAmount: number;
    fromAmount?: number;
    price: number;
    totalValue: number;
    fees?: number;
    txHash?: string;
    exchange?: string;
    network?: string;
  }) {
    return await this.prisma.trade.create({
      data: {
        userId,
        type: data.type as "BUY" | "SELL" | "SWAP" | "TRANSFER_IN" | "TRANSFER_OUT" | "STAKE" | "UNSTAKE" | "YIELD_FARM" | "LIQUIDITY_ADD" | "LIQUIDITY_REMOVE",
        side: data.side as "BUY" | "SELL",
        toSymbol: data.toSymbol,
        fromSymbol: data.fromSymbol,
        toAmount: data.toAmount,
        fromAmount: data.fromAmount,
        price: data.price,
        totalValue: data.totalValue,
        fees: data.fees || 0,
        txHash: data.txHash,
        exchange: data.exchange,
        network: data.network || 'ethereum',
      },
    });
  }

  async updateTradeStatus(tradeId: string, status: string, executedAt?: Date) {
    return await this.prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: status as "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "PARTIAL",
        executedAt: executedAt || new Date(),
      },
    });
  }

  async getUserTrades(userId: string, limit = 50) {
    return await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

// AI Chat Management
export class AIChatService {
  private prisma = getPrismaClient();

  async saveChatMessage(userId: string, data: {
    message: string;
    response: string;
    type?: 'GENERAL' | 'PORTFOLIO_ANALYSIS' | 'MARKET_ANALYSIS' | 'RISK_ASSESSMENT' | 'STRATEGY_ADVICE' | 'TECHNICAL_ANALYSIS';
    sessionId?: string;
    context?: Record<string, unknown>;
    confidence?: number;
  }) {
    // Ensure user exists first (upsert pattern for AI chats)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {}, // No updates needed if user exists
      create: {
        id: userId,
        walletAddress: `temp-wallet-${userId}`, // Temporary wallet address
        username: `AI User ${userId.slice(-6)}` // Temporary username
      }
    });

    return await this.prisma.aIChat.create({
      data: {
        userId,
        message: data.message,
        response: data.response,
        type: data.type || 'GENERAL',
        sessionId: data.sessionId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context: data.context as any, // Prisma JSON field
        confidence: data.confidence,
      },
    });
  }

  async getUserChatHistory(userId: string, limit = 50) {
    return await this.prisma.aIChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

// Market Data Management
export class MarketDataService {
  private prisma = getPrismaClient();

  async updateMarketData(data: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    marketCap?: number;
  }) {
    return await this.prisma.marketData.upsert({
      where: { symbol: data.symbol },
      update: {
        price: data.price,
        change24h: data.change24h,
        volume24h: data.volume24h,
        marketCap: data.marketCap,
      },
      create: data,
    });
  }

  async getMarketData(symbol: string) {
    return await this.prisma.marketData.findUnique({
      where: { symbol },
    });
  }

  async getAllMarketData() {
    return await this.prisma.marketData.findMany({
      orderBy: { marketCap: 'desc' },
    });
  }

  async savePriceHistory(symbol: string, price: number, volume: number = 0, marketCap?: number) {
    return await this.prisma.priceHistory.create({
      data: {
        symbol,
        price,
        volume,
        marketCap
      }
    });
  }

  async getPriceHistory(symbol: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.prisma.priceHistory.findMany({
      where: {
        symbol,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }
}

// Export service instances
export const userService = new UserService();
export const portfolioService = new PortfolioService();
export const alertService = new AlertService();
export const tradeService = new TradeService();
export const aiChatService = new AIChatService();
export const marketDataService = new MarketDataService();

// Raw database access for complex queries
export { getDatabase };
export { getPrismaClient as prisma };
