'use client';

/**
 * Yellow Network Interface Component
 * 
 * This component integrates with the Yellow Network (Nitrolite) testnet.
 * Currently running in demo mode with mock functionality while the full SDK integration
 * is being refined. The component provides:
 * 
 * 1. Wallet connection (MetaMask)
 * 2. Testnet balance display and faucet integration
 * 3. State channel creation and management 
 * 4. Instant payment functionality
 * 5. Transaction history
 * 
 * The actual Nitrolite SDK usage pattern:
 * - const client = new NitroliteClient(config);
 * - await client.createChannel(channelConfig);
 * - const session = await client.createApplicationSession(appConfig);
 * - await session.sendPayment(paymentData);
 * 
 * For production use, replace the mock client with proper SDK initialization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import { NitroliteClient } from '@erc7824/nitrolite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  Send,
  Plus,
  Wallet,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface YellowChannelInfo {
  id: string;
  state: 'opening' | 'open' | 'closing' | 'closed';
  balance: string;
  counterparty: string;
  asset: string;
  createdAt: string;
  lastUpdated: string;
}

interface YellowBalance {
  asset: string;
  balance: string;
  locked: string;
  available: string;
}

interface YellowTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  amount: string;
  asset: string;
  status: 'pending' | 'completed' | 'failed';
  counterparty?: string;
  timestamp: string;
  txHash?: string;
}

interface YellowNetworkProps {
  userAddress?: string;
}

type WsStatus = 'Connecting' | 'Connected' | 'Disconnected';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

interface MockNitroliteClient {
  getBalance?: (address: string) => Promise<NitroliteBalanceData[]>;
  getChannels?: () => Promise<NitroliteChannelData[]>;
  getTransactionHistory?: (address: string) => Promise<NitroliteTransactionData[]>;
  createChannel?: (config: unknown) => Promise<unknown>;
  connect?: () => Promise<boolean>;
  disconnect?: () => void;
}

interface NitroliteApplicationSession {
  sendPayment: (paymentData: {
    channelId: string;
    recipientAddress: string;
    amount: number;
    asset: string;
  }) => Promise<unknown>;
}

interface NitroliteChannelData {
  channelId?: string;
  state?: string;
  balance?: string;
  counterparty?: string;
  asset?: string;
  createdAt?: string;
  lastUpdated?: string;
}

interface NitroliteBalanceData {
  asset?: string;
  total?: string;
  locked?: string;
  available?: string;
}

interface NitroliteTransactionData {
  txId?: string;
  type?: string;
  amount?: string;
  asset?: string;
  status?: string;
  counterparty?: string;
  timestamp?: string;
  txHash?: string;
}

export function YellowNetworkInterface({ userAddress: _userAddress }: YellowNetworkProps) {
  const [account, setAccount] = useState<Address | null>(null);
  const [_walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [balance, setBalance] = useState<YellowBalance[]>([]);
  const [channels, setChannels] = useState<YellowChannelInfo[]>([]);
  const [transactions, setTransactions] = useState<YellowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nitrolite SDK instances
  const [nitroliteClient, setNitroliteClient] = useState<NitroliteClient | null>(null);
  const [applicationSession, setApplicationSession] = useState<NitroliteApplicationSession | null>(null);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');

  // Channel creation states
  const [newChannelAmount, setNewChannelAmount] = useState('');
  const [newChannelCounterparty, setNewChannelCounterparty] = useState('');

  const connectWallet = async () => {
    const ethereum = (window as unknown as { ethereum?: EthereumProvider })?.ethereum;
    
    if (!ethereum) {
      setError('Please install MetaMask!');
      return;
    }

    try {
      setIsLoading(true);
      setWsStatus('Connecting');
      
      const client = createWalletClient({
        chain: mainnet,
        transport: custom(ethereum),
      });
      
      const [address] = await client.requestAddresses();
      
      const walletClientWithAccount = createWalletClient({
        account: address,
        chain: mainnet,
        transport: custom(ethereum),
      });

      setWalletClient(walletClientWithAccount);
      setAccount(address);

      // Initialize Nitrolite client for testnet
      await initializeNitroliteClient(address);
      
      setError(null);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Failed to connect wallet');
      setWsStatus('Disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNitroliteClient = async (userAddress: Address) => {
    try {
      // For now, we'll create a demo mode that simulates the SDK functionality
      // This provides a working interface while the actual SDK integration can be refined
      
      console.log('Initializing Yellow Network testnet connection for:', userAddress);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock client object that implements basic functionality
      const mockClient = {
        connect: async () => {
          console.log('Mock: Connected to Yellow Network testnet');
          return true;
        },
        disconnect: () => {
          console.log('Mock: Disconnected from Yellow Network');
        },
        getBalance: async (address: string) => {
          console.log('Mock: Getting balance for', address);
          return [{
            asset: 'YELLOW_TEST_USD',
            total: '100.00',
            locked: '0.00',
            available: '100.00'
          }];
        },
        getChannels: async () => {
          console.log('Mock: Getting channels');
          return [];
        },
        getTransactionHistory: async (address: string) => {
          console.log('Mock: Getting transaction history for', address);
          return [];
        },
        createChannel: async (config: unknown) => {
          console.log('Mock: Creating channel with config:', config);
          return { channelId: `channel_${Date.now()}`, status: 'created' };
        }
      };

      setNitroliteClient(mockClient as unknown as NitroliteClient);

      // Create a mock application session
      const mockSession: NitroliteApplicationSession = {
        sendPayment: async (paymentData) => {
          console.log('Mock: Sending payment:', paymentData);
          return { txId: `tx_${Date.now()}`, status: 'completed' };
        }
      };

      setApplicationSession(mockSession);

      // Set connection status
      setWsStatus('Connected');
      setIsAuthenticated(true);

      console.log('Yellow Network testnet integration initialized (demo mode)');

    } catch (error) {
      console.error('Failed to initialize Nitrolite client:', error);
      setError(`Failed to connect to Yellow Network: ${String(error)}`);
      setWsStatus('Disconnected');
    }
  };

  const requestFaucetTokens = async () => {
    if (!account || !nitroliteClient) {
      setError('Wallet not connected or Yellow Network not initialized');
      return;
    }

    setIsLoading(true);
    try {
      // Request testnet tokens from Yellow Network faucet
      const faucetResponse = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          userAddress: account,
          amount: 1000, // Request 1000 test tokens
          asset: 'YELLOW_TEST_USD'
        })
      });

      if (faucetResponse.ok) {
        const faucetData = await faucetResponse.json();
        console.log('Faucet request successful:', faucetData);
        
        // Wait a moment for the tokens to be credited
        setTimeout(async () => {
          await loadBalances();
        }, 2000);
        
        setError(null);
      } else {
        const errorData = await faucetResponse.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Faucet request failed: ${errorData.error || faucetResponse.statusText}`);
      }
    } catch (err: unknown) {
      console.error('Faucet request failed:', err);
      setError(`Error requesting faucet tokens: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalances = useCallback(async () => {
    if (!nitroliteClient || !account) return;

    try {
      // Get balances from Yellow Network if method exists
      let balanceData = null;
      const client = nitroliteClient as unknown as MockNitroliteClient;
      if (typeof client.getBalance === 'function') {
        balanceData = await client.getBalance(account);
      }
      
      if (balanceData && Array.isArray(balanceData) && balanceData.length > 0) {
        const formattedBalances: YellowBalance[] = (balanceData as NitroliteBalanceData[]).map((bal) => ({
          asset: bal.asset || 'YELLOW_TEST_USD',
          balance: bal.total || '0.00',
          locked: bal.locked || '0.00',
          available: bal.available || '0.00'
        }));
        setBalance(formattedBalances);
      } else {
        // Set default testnet balance
        setBalance([{
          asset: 'YELLOW_TEST_USD',
          balance: '100.00',
          locked: '0.00',
          available: '100.00'
        }]);
      }
    } catch (err) {
      console.error('Failed to load balances:', err);
      // Fallback to default balance on error
      setBalance([{
        asset: 'YELLOW_TEST_USD',
        balance: '100.00',
        locked: '0.00',
        available: '100.00'
      }]);
    }
  }, [nitroliteClient, account]);

  const loadChannels = useCallback(async () => {
    if (!nitroliteClient || !account) return;

    try {
      // Get channels from Yellow Network if method exists
      let channelsData = null;
      const client = nitroliteClient as unknown as MockNitroliteClient;
      if (typeof client.getChannels === 'function') {
        channelsData = await client.getChannels();
      }
      
      if (channelsData && Array.isArray(channelsData) && channelsData.length > 0) {
        const formattedChannels: YellowChannelInfo[] = (channelsData as NitroliteChannelData[]).map((channel) => ({
          id: channel.channelId || `channel_${Date.now()}`,
          state: (channel.state as 'opening' | 'open' | 'closing' | 'closed') || 'open',
          balance: channel.balance || '0.00',
          counterparty: channel.counterparty || '0x0000000000000000000000000000000000000000',
          asset: channel.asset || 'YELLOW_TEST_USD',
          createdAt: channel.createdAt || new Date().toISOString(),
          lastUpdated: channel.lastUpdated || new Date().toISOString()
        }));
        setChannels(formattedChannels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
      setChannels([]);
    }
  }, [nitroliteClient, account]);

  const loadTransactions = useCallback(async () => {
    if (!nitroliteClient || !account) return;

    try {
      // Get transaction history from Yellow Network if method exists
      let txHistory = null;
      const client = nitroliteClient as unknown as MockNitroliteClient;
      if (typeof client.getTransactionHistory === 'function') {
        txHistory = await client.getTransactionHistory(account);
      }
      
      if (txHistory && Array.isArray(txHistory) && txHistory.length > 0) {
        const formattedTxs: YellowTransaction[] = (txHistory as NitroliteTransactionData[]).map((tx) => ({
          id: tx.txId || `tx_${Date.now()}`,
          type: (tx.type as 'deposit' | 'withdraw' | 'transfer' | 'trade') || 'transfer',
          amount: tx.amount || '0.00',
          asset: tx.asset || 'YELLOW_TEST_USD',
          status: (tx.status as 'pending' | 'completed' | 'failed') || 'completed',
          counterparty: tx.counterparty,
          timestamp: tx.timestamp || new Date().toISOString(),
          txHash: tx.txHash
        }));
        setTransactions(formattedTxs);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setTransactions([]);
    }
  }, [nitroliteClient, account]);

  const createChannel = async () => {
    if (!newChannelAmount || !newChannelCounterparty || !nitroliteClient || !applicationSession) {
      setError('Missing required data for channel creation');
      return;
    }

    setIsLoading(true);
    try {
      // Create channel using Nitrolite SDK
      const client = nitroliteClient as unknown as MockNitroliteClient;
      if (typeof client.createChannel === 'function') {
        const channelConfig = {
          counterparty: newChannelCounterparty,
          amount: parseFloat(newChannelAmount),
          asset: 'YELLOW_TEST_USD',
          userAddress: account
        };

        const channelResult = await client.createChannel(channelConfig);
        console.log('Channel created successfully:', channelResult);
      }
      
      // Refresh channels list
      await loadChannels();
      
      setNewChannelAmount('');
      setNewChannelCounterparty('');
      setError(null);
      
    } catch (err: unknown) {
      console.error('Failed to create channel:', err);
      setError(`Error creating channel: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPayment = async () => {
    if (!paymentAmount || !recipientAddress || !selectedChannelId || !applicationSession) {
      setError('Missing required data for payment');
      return;
    }

    setIsLoading(true);
    try {
      // Send payment using Nitrolite SDK
      const paymentData = {
        channelId: selectedChannelId,
        recipientAddress,
        amount: parseFloat(paymentAmount),
        asset: 'YELLOW_TEST_USD'
      };

      const paymentResult = await applicationSession.sendPayment(paymentData);
      
      console.log('Payment sent successfully:', paymentResult);
      
      // Refresh balances and transactions
      await Promise.all([loadBalances(), loadTransactions(), loadChannels()]);
      
      setPaymentAmount('');
      setRecipientAddress('');
      setSelectedChannelId('');
      setError(null);
      
    } catch (err: unknown) {
      console.error('Failed to send payment:', err);
      setError(`Error sending payment: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (account && nitroliteClient) {
      loadBalances();
      loadChannels();
      loadTransactions();
    }
  }, [account, nitroliteClient, applicationSession, loadBalances, loadChannels, loadTransactions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nitroliteClient) {
        try {
          const client = nitroliteClient as unknown as MockNitroliteClient;
          if (typeof client.disconnect === 'function') {
            client.disconnect();
          }
        } catch (err) {
          console.warn('Error disconnecting Nitrolite client:', err);
        }
      }
    };
  }, [nitroliteClient]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChannelStatusBadge = (state: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'open': 'default',
      'opening': 'secondary', 
      'closing': 'outline',
      'closed': 'destructive'
    };
    
    return (
      <Badge variant={variants[state] || 'outline'} className="capitalize">
        {state}
      </Badge>
    );
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Yellow Network Testnet
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${wsStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">{wsStatus}</span>
              </div>
              {account ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatAddress(account)}</Badge>
                  {isAuthenticated && <Badge variant="default">Authenticated</Badge>}
                </div>
              ) : (
                <Button onClick={connectWallet} disabled={isLoading}>
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 ml-auto text-red-600"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Testnet Environment: Yellow Network Integration (Demo Mode) • SDK Framework Ready • No real funds required
            {nitroliteClient && <span className="text-green-600"> • Mock Client Connected</span>}
          </div>
        </CardContent>
      </Card>

      {account && (
        <>
          {/* Balance Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Testnet Balance
                </CardTitle>
                <Button variant="outline" size="sm" onClick={requestFaucetTokens} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Request Tokens'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {balance.length > 0 ? (
                <div className="space-y-3">
                  {balance.map((bal, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span className="font-medium">{bal.asset}</span>
                      <div className="text-right">
                        <div className="font-mono text-lg">{bal.available}</div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No balance found. Request testnet tokens to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* State Channels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Payment Channels
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Create Channel Form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Create New Channel</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Counterparty Address (0x...)"
                      value={newChannelCounterparty}
                      onChange={(e) => setNewChannelCounterparty(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Initial Amount"
                      value={newChannelAmount}
                      onChange={(e) => setNewChannelAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={createChannel} disabled={!newChannelAmount || !newChannelCounterparty || isLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? 'Creating...' : 'Create Channel'}
                  </Button>
                </div>

                {/* Channels List */}
                {channels.length > 0 ? (
                  <div className="space-y-3">
                    {channels.map((channel) => (
                      <div key={channel.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-mono text-sm">{channel.id}</div>
                          {getChannelStatusBadge(channel.state)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Balance</div>
                            <div className="font-medium">{channel.balance} {channel.asset}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Counterparty</div>
                            <div className="font-mono text-xs">{formatAddress(channel.counterparty)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No channels found. Create one to start transacting instantly!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Payment */}
          {channels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Instant Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Channel</label>
                    <select 
                      className="w-full p-2 border rounded-lg mt-1"
                      value={selectedChannelId}
                      onChange={(e) => setSelectedChannelId(e.target.value)}
                    >
                      <option value="">Select a channel</option>
                      {channels.filter(c => c.state === 'open').map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.id} ({channel.balance} {channel.asset})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Recipient Address</label>
                    <Input
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="10.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={sendPayment} 
                    disabled={!paymentAmount || !recipientAddress || !selectedChannelId || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send Payment Instantly'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(tx.status)}
                          <div>
                            <div className="font-medium capitalize">{tx.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{tx.amount} {tx.asset}</div>
                          {tx.counterparty && (
                            <div className="text-xs text-muted-foreground">
                              to {formatAddress(tx.counterparty)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No transactions yet. Start by creating a channel and sending a payment!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" asChild className="justify-start">
                  <a href="https://layer-3.github.io/docs/learn/introduction/what-is-yellow-sdk/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Yellow Network Docs
                  </a>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <a href="https://github.com/erc7824/nitrolite/blob/main/clearnode/docs/API.md" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Nitrolite API Reference
                  </a>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <a href="https://github.com/erc7824/nitrolite-example/tree/final-p2p-transfer" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    P2P Transfer Example
                  </a>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <a href="https://github.com/erc7824/nitrolite/tree/8576a9d01534cd199b9b1715e5f32f81c746d872/examples" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    More Examples
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
