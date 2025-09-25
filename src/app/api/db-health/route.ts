// Database Health Check API Route
// Replaces Firebase health checks

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database/config';
import { getPrismaClient } from '@/lib/database/services';

export async function GET() {
  try {
    // Check basic database connection
    const isHealthy = await checkDatabaseHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Check Prisma connection
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    // Get basic stats
    const userCount = await prisma.user.count();
    const portfolioCount = await prisma.portfolio.count();
    const tradeCount = await prisma.trade.count();

    return NextResponse.json({
      status: 'healthy',
      database: 'neon-postgres',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        portfolios: portfolioCount,
        trades: tradeCount,
      },
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
