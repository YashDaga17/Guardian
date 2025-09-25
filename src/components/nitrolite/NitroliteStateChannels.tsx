'use client';

import React, { useState, useEffect, memo } from 'react';
import { 
  Activity, 
  Zap, 
  TrendingDown, 
  Clock, 
  ArrowUpDown,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNitrolite } from '@/hooks/useNitrolite';

interface ChannelInfo {
  id: string;
  status: string;
  balance: string;
  counterparty: string;
  lastUpdate: number;
  expiresAt: number;
}

export const NitroliteStateChannels = memo(() => {
  // Always call hooks first - React hooks rules
  const {
    isInitialized,
    isLoading,
    error,
    isClearNodeConnected,
    gasSavings,
    serviceStats,
    createChannel,
    createAppSession,
    fetchChannels,
    fetchAppSessions,
    closeChannel,
    refreshData
  } = useNitrolite();

  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appSessions, setAppSessions] = useState<any[]>([]);
  const [_totalLiquidity, _setTotalLiquidity] = useState(0);
  const [_activeChannels, _setActiveChannels] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [demoMode, setDemoMode] = useState(false);

  // Check if Nitrolite is enabled via environment
  const isNitroliteEnabled = process.env.NEXT_PUBLIC_ENABLE_NITROLITE === 'true';

  // Update current time for client-side rendering only
  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update enabled state based on initialization
  useEffect(() => {
    if (isNitroliteEnabled) {
      setIsEnabled(isInitialized && isClearNodeConnected);
    }
  }, [isInitialized, isClearNodeConnected, isNitroliteEnabled]);

  // Load real data when service is ready
  useEffect(() => {
    if (isNitroliteEnabled && isInitialized) {
      loadChannelsAndSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isNitroliteEnabled]);

  const loadChannelsAndSessions = async () => {
    try {
      // Fetch real channels and app sessions from ClearNode
      const [channelsData, sessionsData] = await Promise.all([
        fetchChannels().catch(() => []),
        fetchAppSessions().catch(() => [])
      ]);

      // Convert ClearNode channel format to display format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedChannels = channelsData.map((ch: any) => ({
        id: ch.channel_id || `ch_${Date.now()}`,
        status: ch.status === 'open' ? 'active' : ch.status || 'unknown',
        balance: `${(parseInt(ch.amount || '0') / 1e6).toFixed(2)} USDC`,
        counterparty: ch.participant || '0x742d35Cc6634C0532925a3b8D80000000000000',
        lastUpdate: new Date(ch.updated_at || Date.now()).getTime(),
        expiresAt: Date.now() + 3600000, // 1 hour from now
      }));

      setChannels(formattedChannels);
      setAppSessions(sessionsData);

      // If no real data, show demo data
      if (formattedChannels.length === 0 && sessionsData.length === 0) {
        setDemoMode(true);
        loadMockChannelData();
      }
    } catch (error) {
      console.error('Failed to load channels and sessions:', error);
      setDemoMode(true);
      loadMockChannelData();
    }
  };
  
  // If disabled, show minimal placeholder
  if (!isNitroliteEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Nitrolite State Channels</h2>
            <p className="text-muted-foreground">
              Advanced state channel features are disabled in production mode.
            </p>
          </div>
          <Badge variant="secondary">Disabled</Badge>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              State channel features are not available. Connect your wallet to access DeFi protocols directly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadMockChannelData = () => {
    const mockChannels: ChannelInfo[] = [
      {
        id: 'ch_1a2b3c4d',
        status: 'active',
        balance: '2.5 ETH',
        counterparty: '0x742d35Cc6634C0532925a3b8D80000000000000',
        lastUpdate: Date.now() - 300000,
        expiresAt: Date.now() + 3600000,
      },
      {
        id: 'ch_5e6f7g8h',
        status: 'settling',
        balance: '1.2 USDC',
        counterparty: '0x1234567890123456789012345678901234567890',
        lastUpdate: Date.now() - 600000,
        expiresAt: Date.now() + 7200000,
      },
    ];
    setChannels(mockChannels);
  };

  const handleCreateNewChannel = async () => {
    try {
      // Create a real channel using ClearNode API
      const channelId = await createChannel({
        counterparty: '0x1234567890123456789012345678901234567890',
        amount: '1000000000', // 1000 USDC (6 decimals)
        duration: 3600,
        asset: 'USDC',
      });
      
      console.log('Created new channel:', channelId);
      
      // Refresh channels and sessions
      await loadChannelsAndSessions();
      
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleCreateAppSession = async () => {
    try {
      // Create a new app session
      const sessionId = await createAppSession(
        ['0x742d35Cc6634C0532925a3b8D40000000000000', '0x1234567890123456789012345678901234567890'],
        [
          { participant: '0x742d35Cc6634C0532925a3b8D40000000000000', asset: 'usdc', amount: '500.0' },
          { participant: '0x1234567890123456789012345678901234567890', asset: 'usdc', amount: '500.0' }
        ]
      );
      
      console.log('Created new app session:', sessionId);
      
      // Refresh channels and sessions
      await loadChannelsAndSessions();
      
    } catch (err) {
      console.error('Failed to create app session:', err);
    }
  };

  const handleCloseChannel = async (channelId: string) => {
    try {
      const txHash = await closeChannel(channelId);
      console.log('Channel closed:', channelId, 'Transaction:', txHash);
      
      // Refresh channels and sessions
      await loadChannelsAndSessions();
    } catch (err) {
      console.error('Failed to close channel:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'settling': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    if (currentTime === 0) {
      return '--h --m';
    }
    
    const timeLeft = expiresAt - currentTime;
    if (timeLeft <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Nitrolite State Channels
          </CardTitle>
          <CardDescription>Advanced gas optimization through state channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nitrolite State Channels</h2>
          <p className="text-muted-foreground">
            {demoMode ? 'Demo mode - ClearNode API integration' : 'Connected to ClearNode'}
            {isClearNodeConnected && <span className="text-green-600 ml-2">• Connected</span>}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {demoMode && <Badge variant="outline">Demo Mode</Badge>}
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {gasSavings.currentSavings.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Potential: {gasSavings.potentialSavings.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gasSavings.activeChannels}</div>
            <p className="text-xs text-muted-foreground">
              {channels.filter(c => c.status === 'active').length} of {channels.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Sessions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Virtual applications running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats?.totalGasSaved || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Across {serviceStats?.totalChannels || 0} channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats?.totalVolume || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Avg duration: {serviceStats?.averageChannelDuration || 0}h
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>State Channel Management</CardTitle>
              <CardDescription>Manage your Nitrolite state channels for optimized gas costs</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="nitrolite-enabled" 
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="nitrolite-enabled">Enable Nitrolite</Label>
              </div>
              <Button onClick={refreshData} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleCreateNewChannel} disabled={!isEnabled || isLoading}>
                <Zap className="h-4 w-4 mr-2" />
                New Channel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isEnabled ? (
            <div className="text-center py-8 text-muted-foreground">
              Enable Nitrolite to start using state channels for gas optimization
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No state channels found. Create your first channel to start saving on gas costs.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-mono text-sm">{channel.id}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(channel.status)}>
                        {channel.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{channel.balance}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {channel.counterparty.slice(0, 6)}...{channel.counterparty.slice(-4)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatTimeRemaining(channel.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCloseChannel(channel.id)}
                          disabled={channel.status !== 'active' || isLoading}
                        >
                          Close
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* App Sessions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Virtual App Sessions</CardTitle>
              <CardDescription>Manage virtual applications for collaborative trading and portfolio management</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCreateAppSession} disabled={!isEnabled || isLoading}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                New App Session
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isEnabled ? (
            <div className="text-center py-8 text-muted-foreground">
              Enable Nitrolite to start using virtual app sessions
            </div>
          ) : appSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No app sessions found. Create a session to enable collaborative portfolio management.
            </div>
          ) : (
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {appSessions.map((session: any, index: number) => (
                <div key={session.app_session_id || `session-${index}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{session.protocol || 'NitroPortfolio'}</Badge>
                      <Badge className={session.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {session.status || 'open'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Session ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {session.app_session_id?.slice(0, 10) || 'Unknown'}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Participants</p>
                      <p className="text-sm text-muted-foreground">
                        {session.participants?.length || 2} active
                      </p>
                    </div>
                  </div>
                  {session.session_data && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Session Data</p>
                      <pre className="text-xs text-muted-foreground bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(JSON.parse(session.session_data), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ClearNode Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            ClearNode Integration Status
          </CardTitle>
          <CardDescription>Connection status and API capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WebSocket Connection</span>
                <Badge variant={isClearNodeConnected ? "default" : "secondary"}>
                  {isClearNodeConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentication</span>
                <Badge variant={isInitialized ? "default" : "secondary"}>
                  {isInitialized ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Demo Mode</span>
                <Badge variant={demoMode ? "outline" : "secondary"}>
                  {demoMode ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Available APIs:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• get_channels - Fetch all user channels</div>
                <div>• create_channel - Open new state channels</div>
                <div>• close_channel - Close existing channels</div>
                <div>• get_app_sessions - Fetch virtual app sessions</div>
                <div>• create_app_session - Create collaborative sessions</div>
                <div>• get_config - Retrieve broker configuration</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

NitroliteStateChannels.displayName = 'NitroliteStateChannels';