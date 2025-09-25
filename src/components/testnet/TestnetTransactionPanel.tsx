'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ExternalLink, 
  Send, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRealTestnetService, TESTNETS } from '@/lib/blockchain/realTestnetService';
import { useRealDashboardStore } from '@/store/realDashboardStore';

interface TestnetTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  chainId: number;
  amount: string;
  to: Address;
  timestamp: number;
}

export function TestnetTransactionPanel() {
  const { address, isConnected, chain: _chain } = useAccount();
  const { toast } = useToast();
  const testnetService = getRealTestnetService();
  const { 
    connectedChains: _connectedChains, 
    addTransaction, 
    executeRealSwap,
    updateNetworkStatus 
  } = useRealDashboardStore();

  // Transaction state
  const [selectedChain, setSelectedChain] = useState<number>(11155111); // Sepolia
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<TestnetTransaction[]>([]);
  const [balances, setBalances] = useState<Record<number, string>>({});
  const [gasPrices, setGasPrices] = useState<Record<number, string>>({});

  // Get balance for current chain
  const { data: currentBalance } = useBalance({
    address: address,
    chainId: selectedChain
  });

  // Wagmi transaction hooks
  const { 
    sendTransaction, 
    data: txHash, 
    isPending: isSending,
    error: sendError 
  } = useSendTransaction();

  const { 
    isLoading: isWaiting, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Load balances and gas prices
  useEffect(() => {
    if (!address || !isConnected) return;

    const loadData = async () => {
      try {
        // Get balances for all testnets
        const balancePromises = Object.keys(TESTNETS).map(async (chainId) => {
          const balance = await testnetService.getNativeBalance(address, parseInt(chainId));
          return [parseInt(chainId), balance];
        });

        const balanceResults = await Promise.all(balancePromises);
        const newBalances = Object.fromEntries(balanceResults);
        setBalances(newBalances);

        // Get gas prices
        const prices = await testnetService.getGasPrices();
        setGasPrices(prices);

        // Update network status
        updateNetworkStatus();

      } catch (error) {
        console.error('Error loading testnet data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load testnet data',
          variant: 'destructive'
        });
      }
    };

    loadData();
  }, [address, isConnected, testnetService, updateNetworkStatus, toast]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      const newTransaction: TestnetTransaction = {
        hash: txHash,
        status: 'success',
        chainId: selectedChain,
        amount,
        to: recipient as Address,
        timestamp: Date.now()
      };

      setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
      
      // Add to dashboard store
      addTransaction({
        id: txHash,
        hash: txHash,
        type: 'transfer',
        from: address!,
        to: recipient as Address,
        amount,
        value: `${amount} ${TESTNETS[selectedChain]?.nativeCurrency.symbol}`,
        gasUsed: '21000', // Standard transfer
        gasPrice: gasPrices[selectedChain] || '0',
        timestamp: Math.floor(Date.now() / 1000),
        status: 'confirmed',
        chainId: selectedChain,
        blockNumber: 0
      });

      toast({
        title: 'Transaction Confirmed!',
        description: `Successfully sent ${amount} ${TESTNETS[selectedChain]?.nativeCurrency.symbol}`,
      });

      // Reset form
      setAmount('');
      setRecipient('');
    }
  }, [isConfirmed, txHash, selectedChain, amount, recipient, addTransaction, gasPrices, address, toast]);

  // Handle send transaction
  const handleSendTransaction = async () => {
    if (!address || !isConnected || !amount || !recipient) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields and connect your wallet',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsExecuting(true);

      await sendTransaction({
        to: recipient as Address,
        value: parseEther(amount),
        chainId: selectedChain
      });

    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle demo swap
  const handleDemoSwap = async () => {
    if (!address || !isConnected) return;

    try {
      setIsExecuting(true);

      const result = await executeRealSwap({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '0.01',
        slippage: 0.5,
        chainId: selectedChain
      });

      if (result.hash) {
        toast({
          title: 'Swap Initiated',
          description: `Transaction hash: ${result.hash.slice(0, 10)}...`,
        });
      }

    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: 'Swap Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getExplorerUrl = (hash: string, chainId: number) => {
    const testnet = TESTNETS[chainId];
    return testnet ? `${testnet.blockExplorer}/tx/${hash}` : '#';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Selection and Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Testnet Transaction Panel
          </CardTitle>
          <CardDescription>
            Execute real transactions on testnets with Nitrolite gas optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label>Select Testnet</Label>
            <Select value={selectedChain.toString()} onValueChange={(value) => setSelectedChain(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TESTNETS).map(([chainId, config]) => (
                  <SelectItem key={chainId} value={chainId}>
                    <div className="flex items-center gap-2">
                      <span>{config.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {balances[parseInt(chainId)] ? 
                          `${parseFloat(balances[parseInt(chainId)]).toFixed(4)} ${config.nativeCurrency.symbol}` 
                          : 'Loading...'
                        }
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance Display */}
          {currentBalance && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <span className="font-medium">
                  {formatEther(currentBalance.value)} {currentBalance.symbol}
                </span>
              </div>
              {gasPrices[selectedChain] && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Gas Price</span>
                  <span className="text-sm">
                    {parseFloat(gasPrices[selectedChain]).toFixed(6)} ETH
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Transaction</CardTitle>
          <CardDescription>
            Send native tokens to any address on the selected testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isExecuting || isSending || isWaiting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({TESTNETS[selectedChain]?.nativeCurrency.symbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isExecuting || isSending || isWaiting}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendTransaction}
              disabled={!isConnected || isExecuting || isSending || isWaiting || !amount || !recipient}
              className="flex-1"
            >
              {(isSending || isWaiting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : isWaiting ? 'Confirming...' : 'Send Transaction'}
            </Button>

            <Button 
              variant="outline"
              onClick={handleDemoSwap}
              disabled={!isConnected || isExecuting}
            >
              <Zap className="mr-2 h-4 w-4" />
              Demo Swap
            </Button>
          </div>

          {sendError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{sendError.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest testnet transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx, _index) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <div className="font-medium text-sm">
                        Send {tx.amount} {TESTNETS[tx.chainId]?.nativeCurrency.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.status === 'success' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}>
                      {tx.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(tx.hash, tx.chainId), '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faucet Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Need Test Tokens?
          </CardTitle>
          <CardDescription>
            Get free testnet tokens from these faucets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(TESTNETS)
              .filter(([_, config]) => config.faucetUrl)
              .map(([chainId, config]) => (
                <Button
                  key={chainId}
                  variant="outline"
                  onClick={() => window.open(config.faucetUrl, '_blank')}
                  className="justify-start"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {config.name} Faucet
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
