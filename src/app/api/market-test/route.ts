import { NextRequest, NextResponse } from 'next/server';
import { marketDataService as dbMarketDataService } from '@/lib/database/services';

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'symbols array is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing market data storage for symbols:', symbols);

    const results = [];

    for (const symbol of symbols) {
      try {
        // Generate mock data that looks realistic
        const mockData = {
          symbol,
          name: getSymbolName(symbol),
          price: Math.random() * (symbol === 'BTC' ? 50000 : symbol === 'ETH' ? 3000 : 1),
          change24h: (Math.random() - 0.5) * 10, // -5% to +5%
          volume24h: Math.random() * 1000000000,
          marketCap: Math.random() * 100000000000
        };

        await dbMarketDataService.updateMarketData(mockData);
        
        // Also save to price history
        await dbMarketDataService.savePriceHistory(
          symbol, 
          mockData.price, 
          mockData.volume24h,
          mockData.marketCap
        );

        results.push({
          symbol,
          status: 'stored',
          data: mockData
        });

        console.log('💾 Stored market data for', symbol, '- Price:', mockData.price.toFixed(2));

      } catch (error) {
        console.error('Failed to store market data for', symbol, ':', error);
        results.push({
          symbol,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Market data test completed',
      results
    });

  } catch (error) {
    console.error('Market data test API error:', error);
    return NextResponse.json(
      { error: 'Failed to test market data storage' },
      { status: 500 }
    );
  }
}

function getSymbolName(symbol: string): string {
  const nameMapping: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'USDT': 'Tether',
    'BNB': 'BNB',
    'SOL': 'Solana',
    'USDC': 'USD Coin',
    'ADA': 'Cardano',
    'AVAX': 'Avalanche',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'UNI': 'Uniswap',
    'LTC': 'Litecoin',
    'ATOM': 'Cosmos',
    'XRP': 'XRP'
  };
  return nameMapping[symbol] || symbol;
}
