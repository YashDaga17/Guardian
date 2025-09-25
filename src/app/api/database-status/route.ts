import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/database/services';

export async function GET() {
  try {
    const prisma = getPrismaClient();

    // Get data counts for all tables
    const [
      userCount,
      portfolioCount,
      holdingCount,
      tradeCount,
      alertCount,
      aiChatCount,
      marketDataCount,
      priceHistoryCount,
      watchlistCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.portfolio.count(),
      prisma.portfolioHolding.count(),
      prisma.trade.count(),
      prisma.alert.count(),
      prisma.aIChat.count(),
      prisma.marketData.count(),
      prisma.priceHistory.count(),
      prisma.watchlist.count()
    ]);

    // Get recent activity samples
    const [
      recentChats,
      recentMarketData,
      recentTrades
    ] = await Promise.all([
      prisma.aIChat.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          createdAt: true,
          message: true
        }
      }),
      prisma.marketData.findMany({
        take: 10,
        orderBy: { lastUpdate: 'desc' },
        select: {
          symbol: true,
          price: true,
          change24h: true,
          lastUpdate: true
        }
      }),
      prisma.trade.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          toSymbol: true,
          toAmount: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      databaseStatus: {
        tables: {
          users: userCount,
          portfolios: portfolioCount,
          portfolio_holdings: holdingCount,
          trades: tradeCount,
          alerts: alertCount,
          ai_chats: aiChatCount,
          market_data: marketDataCount,
          price_history: priceHistoryCount,
          watchlists: watchlistCount
        },
        recentActivity: {
          aiChats: recentChats.map(chat => ({
            id: chat.id,
            type: chat.type,
            preview: chat.message.slice(0, 50) + '...',
            createdAt: chat.createdAt
          })),
          marketData: recentMarketData,
          trades: recentTrades
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
