/**
 * Test page to verify AI insights deduplication is working
 * This page intentionally uses multiple AIMarketInsights components to test
 * that only one set of insights is generated globally
 */

'use client';

import { AIMarketInsights } from '@/components/ai/AIMarketInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AIInsightsTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Insights Deduplication Test</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This page demonstrates that multiple AIMarketInsights components share the same centralized insights,
          preventing duplicate API calls and multiple "Market Analysis" entries.
        </p>
        <Badge variant="secondary" className="text-xs">
          Only ONE set of insights should be generated and shared across all components below
        </Badge>
      </div>

      {/* First AIMarketInsights instance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600">
            Instance #1 - Main Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIMarketInsights />
        </CardContent>
      </Card>

      {/* Second AIMarketInsights instance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-purple-600">
            Instance #2 - Secondary Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIMarketInsights />
        </CardContent>
      </Card>

      {/* Third AIMarketInsights instance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-green-600">
            Instance #3 - Tertiary Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIMarketInsights />
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <Badge variant="outline" className="text-xs">
          ✅ If working correctly: All three components show identical insights with same timestamps
        </Badge>
        <br />
        <Badge variant="destructive" className="text-xs">
          ❌ If broken: Each component shows different insights with different timestamps
        </Badge>
      </div>
    </div>
  );
}
