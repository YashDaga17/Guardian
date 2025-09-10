'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUpDown, 
  Settings, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/blockchain/dataProviders';
import { getNitroliteService, type BatchTransaction } from '@/lib/blockchain/nitroliteService';

interface Token {
  symbol: string;
  name: string;
  price: number;
  balance: number;
  logo: string;
}

const availableTokens: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', price: 3200.15, balance: 15.2456, logo: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin', price: 47150.50, balance: 0.5823, logo: '₿' },
  { symbol: 'USDC', name: 'USD Coin', price: 1.001, balance: 15420.50, logo: '💵' },
  { symbol: 'LINK', name: 'Chainlink', price: 15.50, balance: 542.10, logo: '🔗' },
  { symbol: 'UNI', name: 'Uniswap', price: 6.30, balance: 1250.75, logo: '🦄' },
];

const recentTransactions = [
  {
    id: '1',
    type: 'swap' as const,
    fromToken: 'USDC',
    toToken: 'ETH',
    fromAmount: '3200',
    toAmount: '1.0',
    status: 'confirmed' as const,
    timestamp: Date.now() - 1800000,
    hash: '0x1234...5678',
    gasUsed: '0.003',
    batchId: 'batch_001',
  },
  {
    id: '2',
    type: 'buy' as const,
    fromToken: 'USDC',
    toToken: 'LINK',
    fromAmount: '1000',
    toAmount: '64.5',
    status: 'pending' as const,
    timestamp: Date.now() - 300000,
    hash: '0x5678...9012',
    gasUsed: '0.002',
  },
  {
    id: '3',
    type: 'limit' as const,
    fromToken: 'ETH',
    toToken: 'BTC',
    fromAmount: '2.0',
    toAmount: '0.135',
    status: 'active' as const,
    timestamp: Date.now() - 7200000,
    limitPrice: '47500',
  },
];

export function TradingPanel() {
  const [fromToken, setFromToken] = useState<Token>(availableTokens[0]);
  const [toToken, setToToken] = useState<Token>(availableTokens[2]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [mevProtection, setMevProtection] = useState(true);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [gasFee, setGasFee] = useState(12.50);
  const [batchSavings, setBatchSavings] = useState(8.30);
  
  // Nitrolite integration states
  const [nitroliteEnabled, setNitroliteEnabled] = useState(false);
  const [gasSavings, setGasSavings] = useState<{
    currentSavings: number;
    potentialSavings: number;
    activeChannels: number;
  }>({ currentSavings: 0, potentialSavings: 0, activeChannels: 0 });

  // Initialize Nitrolite on component mount
  useEffect(() => {
    const initNitrolite = async () => {
      try {
        const nitroliteService = getNitroliteService({
          rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
          chainId: 1,
        });
        
        await nitroliteService.initialize();
        setNitroliteEnabled(true);
        
        // Get current gas savings
        const savings = await nitroliteService.getGasSavingsEstimate();
        setGasSavings(savings);
        
      } catch (error) {
        console.error('Failed to initialize Nitrolite:', error);
        setNitroliteEnabled(false);
      }
    };

    initNitrolite();
  }, []);

  // Optimize gas costs using Nitrolite
  const optimizeGasWithNitrolite = useCallback(async () => {
    if (!nitroliteEnabled) return;

    try {
      const nitroliteService = getNitroliteService();
      const optimization = await nitroliteService.optimizeGasForSwap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: fromAmount,
        slippage: slippage,
      });

      // Update gas estimates with Nitrolite optimization
      setGasFee(parseFloat(optimization.optimizedGas));
      setBatchSavings(parseFloat(optimization.savings));
      
    } catch (error) {
      console.error('Nitrolite gas optimization failed:', error);
    }
  }, [nitroliteEnabled, fromToken.symbol, toToken.symbol, fromAmount, slippage]);

  // Execute trade with Nitrolite batch optimization
  const executeTradeWithNitrolite = async () => {
    if (!nitroliteEnabled) {
      // Fallback to regular trade execution
      return executeRegularTrade();
    }

    try {
      const nitroliteService = getNitroliteService();
      
      // Create batch transaction for the swap
      const batchTx: BatchTransaction = {
        to: '0x...', // DEX router address
        data: '0x...', // Encoded swap data
        value: fromToken.symbol === 'ETH' ? fromAmount : '0',
        gasLimit: '200000',
      };

      const batchId = await nitroliteService.executeBatchTransactions([batchTx]);
      
      // Update UI with batch ID
      console.log('Trade executed with Nitrolite batch ID:', batchId);
      
      // Add transaction to your state management
      // This would integrate with your existing transaction handling
      
    } catch (error) {
      console.error('Nitrolite trade execution failed:', error);
      // Fallback to regular execution
      executeRegularTrade();
    }
  };

  const executeRegularTrade = async () => {
    // Your existing trade execution logic
    console.log('Executing regular trade...');
  };

  // Calculate exchange rate and amounts
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const exchangeRate = fromToken.price / toToken.price;
      const calculatedToAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(6);
      setToAmount(calculatedToAmount);
      
      // Calculate price impact (simplified)
      const tradeSize = parseFloat(fromAmount) * fromToken.price;
      const impact = Math.min(tradeSize / 1000000 * 0.1, 5); // Max 5% impact
      setPriceImpact(impact);
    }
  }, [fromAmount, fromToken, toToken]);

  // Update gas optimization when trade parameters change
  useEffect(() => {
    if (fromAmount && toAmount && nitroliteEnabled) {
      optimizeGasWithNitrolite();
    }
  }, [fromAmount, toAmount, fromToken, toToken, slippage, nitroliteEnabled, optimizeGasWithNitrolite]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxAmount = () => {
    setFromAmount(fromToken.balance.toString());
  };

  const canExecuteTrade = () => {
    return fromAmount && 
           parseFloat(fromAmount) > 0 && 
           parseFloat(fromAmount) <= fromToken.balance &&
           toAmount &&
           parseFloat(toAmount) > 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Swap</CardTitle>
              <CardDescription>Trade tokens with MEV protection and gas optimization</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'market' | 'limit')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="market">Market Order</TabsTrigger>
              <TabsTrigger value="limit">Limit Order</TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="space-y-6">
              {/* From Token */}
              <div className="space-y-2">
                <Label>From</Label>
                <div className="flex space-x-2">
                  <Select value={fromToken.symbol} onValueChange={(value) => {
                    const token = availableTokens.find(t => t.symbol === value);
                    if (token) setFromToken(token);
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center space-x-2">
                            <span>{token.logo}</span>
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                      onClick={handleMaxAmount}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance: {fromToken.balance.toFixed(4)} {fromToken.symbol}</span>
                  <span>{formatCurrency(parseFloat(fromAmount || '0') * fromToken.price)}</span>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={handleSwapTokens}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex space-x-2">
                  <Select value={toToken.symbol} onValueChange={(value) => {
                    const token = availableTokens.find(t => t.symbol === value);
                    if (token) setToToken(token);
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center space-x-2">
                            <span>{token.logo}</span>
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance: {toToken.balance.toFixed(4)} {toToken.symbol}</span>
                  <span>{formatCurrency(parseFloat(toAmount || '0') * toToken.price)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="limit" className="space-y-6">
              {/* Limit Order Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>You Pay</Label>
                    <Select value={fromToken.symbol} onValueChange={(value) => {
                      const token = availableTokens.find(t => t.symbol === value);
                      if (token) setFromToken(token);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center space-x-2">
                              <span>{token.logo}</span>
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>You Receive</Label>
                    <Select value={toToken.symbol} onValueChange={(value) => {
                      const token = availableTokens.find(t => t.symbol === value);
                      if (token) setToToken(token);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center space-x-2">
                              <span>{token.logo}</span>
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limit Price ({toToken.symbol} per {fromToken.symbol})</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current price: {(toToken.price / fromToken.price).toFixed(6)} {toToken.symbol}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Trade Summary */}
          {fromAmount && toAmount && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span>Exchange Rate</span>
                <span>1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}</span>
              </div>
              
              {priceImpact > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Price Impact</span>
                  <span className={priceImpact > 2 ? 'text-red-600' : priceImpact > 1 ? 'text-yellow-600' : 'text-green-600'}>
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <div className="text-right">
                  <span className="line-through text-muted-foreground">{formatCurrency(gasFee + batchSavings)}</span>
                  <span className="ml-2">{formatCurrency(gasFee)}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save {formatCurrency(batchSavings)}
                  </Badge>
                  {nitroliteEnabled && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Nitrolite ⚡
                    </Badge>
                  )}
                </div>
              </div>
              
              {nitroliteEnabled && (
                <div className="flex justify-between text-sm">
                  <span>State Channel Savings</span>
                  <div className="text-right">
                    <span className="text-green-600">
                      {gasSavings.currentSavings.toFixed(2)}% saved
                    </span>
                    {gasSavings.activeChannels > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {gasSavings.activeChannels} channels
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Advanced Settings</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Slippage Tolerance</Label>
                  <span className="text-sm text-muted-foreground">{slippage}%</span>
                </div>
                <Slider
                  value={[slippage]}
                  onValueChange={(value: number[]) => setSlippage(value[0])}
                  max={5}
                  min={0.1}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1%</span>
                  <span>5%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>MEV Protection</Label>
                  <p className="text-xs text-muted-foreground">Protect against front-running</p>
                </div>
                <Switch checked={mevProtection} onCheckedChange={setMevProtection} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>State Channel Batching</Label>
                  <p className="text-xs text-muted-foreground">Batch with other transactions to save gas</p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {orderType === 'market' ? (
              <Button 
                className="w-full" 
                size="lg"
                disabled={!canExecuteTrade()}
                onClick={executeTradeWithNitrolite}
              >
                {mevProtection && <Shield className="h-4 w-4 mr-2" />}
                Swap {fromToken.symbol} for {toToken.symbol}
              </Button>
            ) : (
              <Button 
                className="w-full" 
                size="lg"
                disabled={!canExecuteTrade() || !limitPrice}
              >
                <Clock className="h-4 w-4 mr-2" />
                Place Limit Order
              </Button>
            )}
            
            {priceImpact > 2 && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>High price impact. Consider reducing trade size.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your recent trading activity with batching status</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    tx.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {tx.status === 'confirmed' ? <CheckCircle className="h-4 w-4" /> :
                     tx.status === 'pending' ? <Clock className="h-4 w-4" /> :
                     <TrendingUp className="h-4 w-4" />}
                  </div>
                  
                  <div>
                    <div className="font-medium">
                      {tx.type === 'swap' ? 'Swap' : 
                       tx.type === 'buy' ? 'Buy' : 
                       'Limit Order'} {tx.fromToken} → {tx.toToken}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.fromAmount} {tx.fromToken} for {tx.toAmount} {tx.toToken}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                      {tx.batchId && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Batched
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant={
                    tx.status === 'confirmed' ? 'default' :
                    tx.status === 'pending' ? 'secondary' :
                    'outline'
                  }>
                    {tx.status}
                  </Badge>
                  {tx.gasUsed && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Gas: {tx.gasUsed} ETH
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
