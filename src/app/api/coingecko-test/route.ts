import { NextResponse } from 'next/server';
import { CoinGeckoService } from '@/lib/market/coinGeckoService';

export async function GET() {
  try {
    // Test CoinGecko API with common cryptocurrencies
    const prices = await CoinGeckoService.getCurrentPrices([
      'bitcoin', 'ethereum', 'solana', 'chainlink', 'usd-coin'
    ]);

    // Test portfolio calculation
    const portfolioData = await CoinGeckoService.getPortfolioValue([
      { symbol: 'BTC', balance: 2.5 },
      { symbol: 'ETH', balance: 12.8 },
      { symbol: 'SOL', balance: 45.2 },
      { symbol: 'LINK', balance: 890 },
      { symbol: 'USDC', balance: 4812.50 }
    ]);

    // Test search functionality
    const searchResults = await CoinGeckoService.searchCoins('bitcoin');

    // Test trending coins
    const trending = await CoinGeckoService.getTrendingCoins();

    return NextResponse.json({
      success: true,
      data: {
        prices,
        portfolioValue: portfolioData,
        searchResults: searchResults.slice(0, 3),
        trending: trending.slice(0, 3),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('CoinGecko API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
