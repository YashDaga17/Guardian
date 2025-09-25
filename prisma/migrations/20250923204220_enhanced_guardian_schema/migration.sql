-- CreateEnum
CREATE TYPE "public"."UserTier" AS ENUM ('FREE', 'PREMIUM', 'PRO');

-- CreateEnum
CREATE TYPE "public"."PortfolioVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'SHARED');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('CRYPTO', 'STOCK', 'ETF', 'FOREX', 'COMMODITY', 'INDEX');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'VOLUME_SPIKE', 'RSI_OVERBOUGHT', 'RSI_OVERSOLD', 'SUPPORT_BREACH', 'RESISTANCE_BREAK', 'PORTFOLIO_VALUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."TradeType" AS ENUM ('BUY', 'SELL', 'SWAP', 'TRANSFER_IN', 'TRANSFER_OUT', 'STAKE', 'UNSTAKE', 'YIELD_FARM', 'LIQUIDITY_ADD', 'LIQUIDITY_REMOVE');

-- CreateEnum
CREATE TYPE "public"."TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."TradeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('GENERAL', 'PORTFOLIO_ANALYSIS', 'MARKET_ANALYSIS', 'RISK_ASSESSMENT', 'STRATEGY_ADVICE', 'TECHNICAL_ANALYSIS');

-- CreateEnum
CREATE TYPE "public"."StrategyType" AS ENUM ('DCA', 'GRID', 'MOMENTUM', 'MEAN_REVERSION', 'ARBITRAGE', 'YIELD_FARMING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ChannelStatus" AS ENUM ('OPENING', 'OPEN', 'SETTLING', 'SETTLED', 'DISPUTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ProtocolCategory" AS ENUM ('LENDING', 'DEX', 'YIELD_FARMING', 'STAKING', 'INSURANCE', 'BRIDGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "public"."NewsCategory" AS ENUM ('GENERAL', 'BITCOIN', 'ETHEREUM', 'ALTCOINS', 'DEFI', 'NFTS', 'REGULATION', 'ADOPTION', 'TECHNICAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "avatar" TEXT,
    "preferences" JSONB,
    "tier" "public"."UserTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "visibility" "public"."PortfolioVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_holdings" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "amount" DOUBLE PRECISION NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitLossPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstPurchase" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolio_snapshots" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "change24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "change7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "change30d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AlertType" NOT NULL,
    "condition" JSONB NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "symbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "type" "public"."TradeType" NOT NULL,
    "side" "public"."TradeSide" NOT NULL,
    "fromSymbol" TEXT,
    "toSymbol" TEXT NOT NULL,
    "fromAmount" DOUBLE PRECISION,
    "toAmount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gasUsed" DOUBLE PRECISION DEFAULT 0,
    "gasFee" DOUBLE PRECISION DEFAULT 0,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "exchange" TEXT,
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "status" "public"."TradeStatus" NOT NULL DEFAULT 'PENDING',
    "executedAt" TIMESTAMP(3),
    "batchId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "public"."ChatType" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "context" JSONB,
    "confidence" DOUBLE PRECISION,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_data" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "change24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changePercent24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeChange24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION,
    "marketCapRank" INTEGER,
    "circulatingSupply" DOUBLE PRECISION,
    "totalSupply" DOUBLE PRECISION,
    "high24h" DOUBLE PRECISION,
    "low24h" DOUBLE PRECISION,
    "ath" DOUBLE PRECISION,
    "athDate" TIMESTAMP(3),
    "atl" DOUBLE PRECISION,
    "atlDate" TIMESTAMP(3),
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rsi" DOUBLE PRECISION,
    "sma20" DOUBLE PRECISION,
    "sma50" DOUBLE PRECISION,
    "ema12" DOUBLE PRECISION,
    "ema26" DOUBLE PRECISION,
    "bollUpper" DOUBLE PRECISION,
    "bollLower" DOUBLE PRECISION,
    "macdLine" DOUBLE PRECISION,
    "macdSignal" DOUBLE PRECISION,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_history" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."strategies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."StrategyType" NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "performance" JSONB,
    "backtest" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTradeSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "favoriteAssets" JSONB,
    "tradingHours" JSONB,
    "riskProfile" JSONB,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."state_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "status" "public"."ChannelStatus" NOT NULL DEFAULT 'OPENING',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "token" TEXT NOT NULL DEFAULT 'ETH',
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."defi_protocols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "category" "public"."ProtocolCategory" NOT NULL,
    "tvl" DOUBLE PRECISION,
    "apy" DOUBLE PRECISION,
    "risk" "public"."RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defi_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."defi_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "apy" DOUBLE PRECISION,
    "rewards" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "claimable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryPrice" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defi_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sentiment" DOUBLE PRECISION,
    "relevantSymbols" JSONB,
    "category" "public"."NewsCategory" NOT NULL DEFAULT 'GENERAL',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "window" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "public"."users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_holdings_portfolioId_tokenSymbol_network_key" ON "public"."portfolio_holdings"("portfolioId", "tokenSymbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlistId_symbol_key" ON "public"."watchlist_items"("watchlistId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "trades_txHash_key" ON "public"."trades"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_symbol_key" ON "public"."market_data"("symbol");

-- CreateIndex
CREATE INDEX "price_history_symbol_timestamp_idx" ON "public"."price_history"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "price_history_symbol_timestamp_key" ON "public"."price_history"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_userId_key" ON "public"."user_analytics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "state_channels_channelId_key" ON "public"."state_channels"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "defi_protocols_name_key" ON "public"."defi_protocols"("name");

-- CreateIndex
CREATE UNIQUE INDEX "defi_positions_userId_protocolId_positionId_key" ON "public"."defi_positions"("userId", "protocolId", "positionId");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_url_key" ON "public"."news_articles"("url");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "public"."news_articles"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "config_key_key" ON "public"."config"("key");

-- CreateIndex
CREATE INDEX "api_usage_window_idx" ON "public"."api_usage"("window");

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_userId_endpoint_method_window_key" ON "public"."api_usage"("userId", "endpoint", "method", "window");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watchlist_items" ADD CONSTRAINT "watchlist_items_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "public"."watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades" ADD CONSTRAINT "trades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_chats" ADD CONSTRAINT "ai_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."strategies" ADD CONSTRAINT "strategies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_analytics" ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."state_channels" ADD CONSTRAINT "state_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."defi_positions" ADD CONSTRAINT "defi_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."defi_positions" ADD CONSTRAINT "defi_positions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."defi_protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
