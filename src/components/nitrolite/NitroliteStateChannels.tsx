'use client';

import { useState, useEffect } from 'react';
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
import { getNitroliteService } from '@/lib/blockchain/nitroliteService';

interface ChannelInfo {
  id: string;
  status: string;
  balance: string;
  counterparty: string;
  lastUpdate: number;
  expiresAt: number;
}

interface ServiceStats {
  totalChannels: number;
  totalGasSaved: string;
  totalVolume: string;
  averageChannelDuration: number;
}

export function NitroliteStateChannels() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [gasSavings, setGasSavings] = useState({
    currentSavings: 0,
    potentialSavings: 0,
    activeChannels: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Nitrolite service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        const nitroliteService = getNitroliteService({
          rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
          chainId: 1,
        });
        
        await nitroliteService.initialize();
        setIsEnabled(true);
        
        // Load initial data
        await loadChannelData();
        await loadServiceStats();
        
      } catch (err) {
        console.error('Failed to initialize Nitrolite:', err);
        setError('Failed to initialize Nitrolite service');
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  const loadChannelData = async () => {
    try {
      const nitroliteService = getNitroliteService();
      const savings = await nitroliteService.getGasSavingsEstimate();
      setGasSavings(savings);
      
      // Mock channel data - in real implementation, you'd fetch actual channels
      const mockChannels: ChannelInfo[] = [
        {
          id: 'ch_001',
          status: 'active',
          balance: '2.5 ETH',
          counterparty: '0x1234...5678',
          lastUpdate: Date.now() - 300000,
          expiresAt: Date.now() + 3600000,
        },
        {
          id: 'ch_002',
          status: 'settling',
          balance: '1000 USDC',
          counterparty: '0x5678...9012',
          lastUpdate: Date.now() - 600000,
          expiresAt: Date.now() + 1800000,
        },
      ];
      
      setChannels(mockChannels);
    } catch (err) {
      console.error('Failed to load channel data:', err);
      setError('Failed to load channel data');
    }
  };

  const loadServiceStats = async () => {
    try {
      const nitroliteService = getNitroliteService();
      const serviceStats = await nitroliteService.getServiceStats();
      setStats(serviceStats);
    } catch (err) {
      console.error('Failed to load service stats:', err);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([loadChannelData(), loadServiceStats()]);
    setIsLoading(false);
  };

  const createNewChannel = async () => {
    try {
      setIsLoading(true);
      const nitroliteService = getNitroliteService();
      
      // Example channel creation - in real app, this would be triggered by user input
      const channelId = await nitroliteService.createStateChannel({
        counterparty: '0x1234567890123456789012345678901234567890',
        amount: '1.0',
        duration: 3600,
        asset: 'ETH',
      });
      
      console.log('Created new channel:', channelId);
      await loadChannelData();
      
    } catch (err) {
      console.error('Failed to create channel:', err);
      setError('Failed to create new channel');
    } finally {
      setIsLoading(false);
    }
  };

  const closeChannel = async (channelId: string) => {
    try {
      setIsLoading(true);
      const nitroliteService = getNitroliteService();
      const txHash = await nitroliteService.closeChannel(channelId);
      
      console.log('Channel closed:', channelId, 'Transaction:', txHash);
      await loadChannelData();
      
    } catch (err) {
      console.error('Failed to close channel:', err);
      setError('Failed to close channel');
    } finally {
      setIsLoading(false);
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
    const timeLeft = expiresAt - Date.now();
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
      {/* Overview Cards */}
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
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGasSaved || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats?.totalChannels || 0} channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVolume || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Avg duration: {stats?.averageChannelDuration || 0}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
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
              <Button onClick={createNewChannel} disabled={!isEnabled || isLoading}>
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
                          onClick={() => closeChannel(channel.id)}
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
    </div>
  );
}
