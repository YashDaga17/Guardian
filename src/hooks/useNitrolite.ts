'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNitroliteService, type GuardianNitroliteService, type AppSession } from '@/lib/blockchain/nitroliteService';

interface NitroliteHookReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  isClearNodeConnected: boolean;
  supportedNetworks: Array<{name: string; chainId: number; custodyAddress: string}>;
  gasSavings: {
    currentSavings: number;
    potentialSavings: number;
    activeChannels: number;
  };
  serviceStats: {
    totalChannels: number;
    totalGasSaved: string;
    totalVolume: string;
    averageChannelDuration: number;
  } | null;
  createChannel: (params: {
    counterparty: string;
    amount: string;
    duration?: number;
    asset?: string;
  }) => Promise<string>;
  createAppSession: (participants: string[], allocations: Array<{
    participant: string;
    asset: string;
    amount: string;
  }>) => Promise<AppSession>;
  closeChannel: (channelId: string) => Promise<string>;
  optimizeGas: (swapParams: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage: number;
  }) => Promise<{
    optimizedGas: string;
    savings: string;
    batchable: boolean;
  }>;
  executeBatch: (transactions: Array<{
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
  }>) => Promise<string>;
  refreshData: () => Promise<void>;
}

/**
 * React hook for Nitrolite integration with ClearNode
 * Provides production-ready access to state channel functionality
 */
export function useNitrolite(): NitroliteHookReturn {
  const [service, setService] = useState<GuardianNitroliteService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearNodeConnected, setIsClearNodeConnected] = useState(false);
  const [supportedNetworks, setSupportedNetworks] = useState<Array<{name: string; chainId: number; custodyAddress: string}>>([]);
  const [gasSavings, setGasSavings] = useState({
    currentSavings: 0,
    potentialSavings: 0,
    activeChannels: 0,
  });
  const [serviceStats, setServiceStats] = useState<{
    totalChannels: number;
    totalGasSaved: string;
    totalVolume: string;
    averageChannelDuration: number;
  } | null>(null);

  // Initialize Nitrolite service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const nitroliteService = getNitroliteService({
          rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
          chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1'),
          privateKey: process.env.NITROLITE_PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          address: process.env.NEXT_PUBLIC_WALLET_ADDRESS,
          clearNodeUrl: process.env.NEXT_PUBLIC_CLEARNODE_URL || 'wss://clearnet.yellow.com/ws',
          enableClearNode: process.env.NEXT_PUBLIC_ENABLE_CLEARNODE !== 'false',
          supportedChains: [1, 137, 42220, 8453], // Ethereum, Polygon, Celo, Base
        });

        await nitroliteService.initialize();
        setService(nitroliteService);
        setIsInitialized(true);
        setIsClearNodeConnected(nitroliteService.isClearNodeReady());
        setSupportedNetworks(nitroliteService.getSupportedNetworks());

        // Load initial data
        await loadInitialData(nitroliteService);

      } catch (err) {
        console.error('Failed to initialize Nitrolite:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Nitrolite');
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (service) {
        service.cleanup().catch(console.error);
      }
    };
  }, []); // Empty dependency array to run only once

  const loadInitialData = async (nitroliteService: GuardianNitroliteService) => {
    try {
      // Load gas savings data
      const savings = await nitroliteService.getGasSavingsEstimate();
      setGasSavings(savings);

      // Load service statistics
      const stats = await nitroliteService.getServiceStats();
      setServiceStats(stats);

    } catch (err) {
      console.error('Failed to load initial data:', err);
      // Don't set error here as the service itself is working
    }
  };

  const refreshData = useCallback(async () => {
    if (!service || !isInitialized) return;

    try {
      setIsLoading(true);
      await loadInitialData(service);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [service, isInitialized]);

  const createChannel = useCallback(async (params: {
    counterparty: string;
    amount: string;
    duration?: number;
    asset?: string;
  }) => {
    if (!service || !isInitialized) {
      throw new Error('Nitrolite service not initialized');
    }

    try {
      setIsLoading(true);
      const channelId = await service.createStateChannel(params);
      
      // Refresh data after channel creation
      await refreshData();
      
      return channelId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create channel';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, isInitialized, refreshData]);

  const createAppSession = useCallback(async (participants: string[], allocations: Array<{
    participant: string;
    asset: string;
    amount: string;
  }>) => {
    if (!service || !isInitialized) {
      throw new Error('Nitrolite service not initialized');
    }

    try {
      setIsLoading(true);
      const session = await service.createApplicationSession(participants, allocations);
      
      // Refresh data after session creation
      await refreshData();
      
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create app session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, isInitialized, refreshData]);

  const closeChannel = useCallback(async (channelId: string) => {
    if (!service || !isInitialized) {
      throw new Error('Nitrolite service not initialized');
    }

    try {
      setIsLoading(true);
      const txHash = await service.closeChannel(channelId);
      
      // Refresh data after channel closure
      await refreshData();
      
      return txHash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close channel';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, isInitialized, refreshData]);

  const optimizeGas = useCallback(async (swapParams: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage: number;
  }) => {
    if (!service || !isInitialized) {
      throw new Error('Nitrolite service not initialized');
    }

    try {
      const optimization = await service.optimizeGasForSwap(swapParams);
      return optimization;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize gas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [service, isInitialized]);

  const executeBatch = useCallback(async (transactions: Array<{
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
  }>) => {
    if (!service || !isInitialized) {
      throw new Error('Nitrolite service not initialized');
    }

    try {
      setIsLoading(true);
      const batchId = await service.executeBatchTransactions(transactions);
      
      // Refresh data after batch execution
      await refreshData();
      
      return batchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute batch';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, isInitialized, refreshData]);

  return {
    isInitialized,
    isLoading,
    error,
    isClearNodeConnected,
    supportedNetworks,
    gasSavings,
    serviceStats,
    createChannel,
    createAppSession,
    closeChannel,
    optimizeGas,
    executeBatch,
    refreshData,
  };
}

/**
 * Hook specifically for trading operations with Nitrolite optimization
 */
export function useNitroliteTrading() {
  const nitrolite = useNitrolite();

  const executeOptimizedSwap = useCallback(async (swapParams: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage: number;
    routerAddress: string;
    swapData: string;
  }) => {
    if (!nitrolite.isInitialized) {
      throw new Error('Nitrolite not initialized');
    }

    try {
      // First, optimize the gas
      const optimization = await nitrolite.optimizeGas({
        fromToken: swapParams.fromToken,
        toToken: swapParams.toToken,
        amount: swapParams.amount,
        slippage: swapParams.slippage,
      });

      // Then execute the swap in a batch
      const batchId = await nitrolite.executeBatch([{
        to: swapParams.routerAddress,
        data: swapParams.swapData,
        value: swapParams.fromToken === 'ETH' ? swapParams.amount : '0',
        gasLimit: optimization.optimizedGas,
      }]);

      return {
        batchId,
        gasSavings: optimization.savings,
        optimizedGas: optimization.optimizedGas,
      };

    } catch (err) {
      console.error('Optimized swap failed:', err);
      throw err;
    }
  }, [nitrolite]);

  return {
    ...nitrolite,
    executeOptimizedSwap,
  };
}
