'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  Eye,
  Bell,
  BarChart3,
  Lightbulb,
  Search,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiAssetWatchlist } from '@/components/watchlist/MultiAssetWatchlist';
import { SmartAlertsDashboard } from '@/components/alerts/SmartAlertsDashboard';
import { AIMarketInsights } from '@/components/ai/AIMarketInsights';

export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState('watchlist');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Market Intelligence
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              AI-powered market analysis with multi-asset watchlists and smart alerts
            </p>
          </div>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-3 bg-muted rounded-full">
                <Eye className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Multi-Asset Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor stocks, crypto, ETFs, and forex in one unified watchlist
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-3 bg-muted rounded-full">
                <Bell className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered alerts with pattern recognition and volume analysis
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="p-3 bg-muted rounded-full">
                <Lightbulb className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">AI Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time market analysis with actionable recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Multi-Asset Watchlist
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Smart Alerts
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Market Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <MultiAssetWatchlist />
            
            {/* Additional Watchlist Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Watchlist Analytics
                  </CardTitle>
                  <CardDescription>
                    Performance overview of your tracked assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Assets</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg. 24h Change</span>
                      <span className="font-medium text-green-600">+2.34%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Best Performer</span>
                      <span className="font-medium">TSLA (+5.24%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Worst Performer</span>
                      <span className="font-medium text-red-600">AAPL (-1.16%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Market Screener
                  </CardTitle>
                  <CardDescription>
                    Discover trending assets to add to your watchlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Top Gainers (24h)</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">NVDA</span>
                        <span className="text-green-600 text-sm">+8.45%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">AMD</span>
                        <span className="text-green-600 text-sm">+6.78%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">TSLA</span>
                        <span className="text-green-600 text-sm">+5.24%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <SmartAlertsDashboard />
          
          {/* Alert Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alert Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Alerts</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-medium text-green-600">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Triggered (24h)</span>
                    <span className="font-medium text-blue-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">87.3%</div>
                <div className="text-sm text-muted-foreground">
                  Of alerts led to profitable signals
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">1.2s</div>
                <div className="text-sm text-muted-foreground">
                  Average alert processing time
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIMarketInsights />
          
          {/* AI Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Performance</CardTitle>
                <CardDescription>
                  Real-time AI analysis metrics and accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Analyses Generated</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prediction Accuracy</span>
                    <span className="font-medium text-green-600">87.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="font-medium">1.8s avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confidence Score</span>
                    <span className="font-medium">92.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Coverage</CardTitle>
                <CardDescription>
                  Assets analyzed across different market segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cryptocurrencies</span>
                    <span className="font-medium">450+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stocks (US)</span>
                    <span className="font-medium">3,200+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ETFs</span>
                    <span className="font-medium">800+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Forex Pairs</span>
                    <span className="font-medium">50+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
