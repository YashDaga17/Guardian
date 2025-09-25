/**
 * Network Request Monitor - Development/Debug Component
 * Shows API request status to track optimization improvements
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, Clock } from 'lucide-react';
import { apiCoordinator } from '@/lib/utils/apiCoordinator';

interface NetworkStats {
  activeRequests: number;
  queuedRequests: number;
  cacheSize: number;
  lastRequests: Record<string, number>;
}

export function NetworkRequestMonitor() {
  const [stats, setStats] = useState<NetworkStats>({
    activeRequests: 0,
    queuedRequests: 0,
    cacheSize: 0,
    lastRequests: {}
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = apiCoordinator.getStatus();
      setStats(currentStats);
    };

    // Update stats immediately
    updateStats();
    
    // Set up periodic updates
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (stats.activeRequests > 3) return 'text-red-500';
    if (stats.activeRequests > 1) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (stats.activeRequests > 0) {
      return <Activity className={`h-4 w-4 animate-pulse ${getStatusColor()}`} />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const formatLastRequest = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">Network Status</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant={stats.activeRequests > 0 ? "default" : "secondary"}>
            Active: {stats.activeRequests}
          </Badge>
          <Badge variant={stats.queuedRequests > 0 ? "destructive" : "outline"}>
            Queued: {stats.queuedRequests}
          </Badge>
          <Badge variant="outline">
            Cache: {stats.cacheSize}
          </Badge>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="text-muted-foreground">Recent API Activity:</div>
            {Object.entries(stats.lastRequests).map(([type, timestamp]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize">{type}:</span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastRequest(timestamp)}</span>
                </span>
              </div>
            ))}
            
            {Object.keys(stats.lastRequests).length === 0 && (
              <div className="text-muted-foreground text-center py-2">
                No API requests yet
              </div>
            )}
            
            <div className="pt-2 border-t text-xs text-muted-foreground">
              API Coordinator is managing requests to prevent excessive network load.
              Intervals: Market (5m), Portfolio (3m), AI (2h)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NetworkRequestMonitor;
