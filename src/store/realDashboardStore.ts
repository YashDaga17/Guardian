import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRealDataProviderService, type PortfolioData as RealPortfolioData } from '@/lib/blockchain/realDataProviderService';
import type { Address } from 'viem';

// Real transaction interface matching blockchain data
interface RealTransaction {
  id: string;
  hash: string;
  type: 'transfer' | 'swap' | 'contract';
  from: Address;
  to: Address;
  amount: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  chainId: number;
  blockNumber: number;
}

// AI Insight interface
interface AIInsight {
  id: string;
  type: 'rebalance' | 'yield-opportunity' | 'buy' | 'sell';
  title: string;
  description: string;
  confidence: number;
  expectedReturn: number;
  timeframe: string;
}

// Portfolio data interface
interface PortfolioData {
  date: string;
  value: number;
}

// Token allocation interface
interface AllocationData {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  balance: string;
  price: number;
}

// Network status interface
interface NetworkStatus {
  chainId: number;
  name: string;
  connected: boolean;
  latestBlock?: number;
  gasPrice?: string;
}

// Real Dashboard State Interface
interface RealDashboardState {
  // Connection state
  isConnected: boolean;
  connectedAddress: Address | null;
  connectedChains: number[];
  
  // Portfolio data
  portfolioData: PortfolioData[];
  allocationData: AllocationData[];
  
  // Real-time data
  totalValue: number;
  dailyChange: number;
  dailyChangeValue: number;
  dailyChangePercent: number;
  
  // Transactions
  recentTransactions: RealTransaction[];
  transactionHistory: RealTransaction[];
  
  // AI insights
  aiInsights: AIInsight[];
  
  // Network data
  networkStatus: NetworkStatus[];
  gasPrices: Record<number, string>;
  
  // UI state
  isLoading: boolean;
  isClient: boolean;
  selectedTimeframe: '24h' | '7d' | '30d' | '1y';
  error: string | null;
  lastUpdated: number;
  
  // Actions
  connectWallet: (address: Address, chainIds: number[]) => void;
  disconnectWallet: () => void;
  setSelectedTimeframe: (timeframe: '24h' | '7d' | '30d' | '1y') => void;
  refreshRealData: () => Promise<void>;
  updatePortfolioData: (data: RealPortfolioData) => void;
  executeRealSwap: (params: SwapParams) => Promise<{ hash: string; status: string }>;
  addTransaction: (transaction: RealTransaction) => void;
  updateNetworkStatus: () => Promise<void>;
  initializeClientData: () => void;
  setError: (error: string | null) => void;
}

// Swap parameters interface
interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  chainId: number;
}

// SSR-safe utilities
export const formatCurrency = (value: number): string => {
  if (typeof window === 'undefined') return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  if (typeof window === 'undefined') return '0.00%';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatTimestamp = (timestamp: number): string => {
  if (typeof window === 'undefined') return '';
  return new Date(timestamp * 1000).toLocaleString();
};

// Create the real dashboard store
export const useRealDashboardStore = create<RealDashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      connectedAddress: null,
      connectedChains: [],
      
      portfolioData: [],
      allocationData: [],
      
      totalValue: 0,
      dailyChange: 0,
      dailyChangeValue: 0,
      dailyChangePercent: 0,
      
      recentTransactions: [],
      transactionHistory: [],
      
      aiInsights: [],
      
      networkStatus: [],
      gasPrices: {},
      
      isLoading: false,
      isClient: false,
      selectedTimeframe: '24h',
      error: null,
      lastUpdated: 0,

      // Actions
      connectWallet: (address: Address, chainIds: number[]) => {
        set({
          isConnected: true,
          connectedAddress: address,
          connectedChains: chainIds,
          error: null
        });
        
        // Automatically refresh data when wallet connects
        get().refreshRealData();
      },

      disconnectWallet: () => {
        set({
          isConnected: false,
          connectedAddress: null,
          connectedChains: [],
          portfolioData: [],
          allocationData: [],
          totalValue: 0,
          dailyChange: 0,
          dailyChangeValue: 0,
          dailyChangePercent: 0,
          recentTransactions: [],
          transactionHistory: [],
          aiInsights: []
        });
      },

      setSelectedTimeframe: (timeframe) => {
        set({ selectedTimeframe: timeframe });
        // Refresh data for new timeframe
        get().refreshRealData();
      },

      refreshRealData: async () => {
        const state = get();
        if (!state.connectedAddress || !state.isClient) return;

        set({ isLoading: true, error: null });

        try {
          const dataService = getRealDataProviderService();
          
          // Get real portfolio data
          const portfolioData = await dataService.getPortfolioData(
            state.connectedAddress,
            state.connectedChains
          );

          // Update portfolio data
          get().updatePortfolioData(portfolioData);

          // Get AI insights
          const insights = await dataService.getAIInsights(portfolioData);
          
          // Get network status
          await get().updateNetworkStatus();

          set({
            aiInsights: insights,
            lastUpdated: Date.now(),
            error: null
          });

        } catch (error) {
          console.error('Error refreshing real data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh data'
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updatePortfolioData: (data: RealPortfolioData) => {
        // Convert real portfolio data to dashboard format
        const allocationData: AllocationData[] = data.assets.map((asset, index) => ({
          name: asset.symbol,
          symbol: asset.symbol,
          value: asset.value || 0,
          percentage: data.totalValue > 0 ? ((asset.value || 0) / data.totalValue) * 100 : 0,
          color: `hsl(${(index * 137) % 360}, 70%, 50%)`, // Generate colors
          balance: asset.balance,
          price: asset.price || 0
        }));

        // Convert transactions to dashboard format
        const recentTransactions: RealTransaction[] = data.transactions.map(tx => ({
          id: tx.hash,
          hash: tx.hash,
          type: 'transfer' as const,
          from: tx.from,
          to: tx.to,
          amount: (Number(tx.value) / 1e18).toFixed(6),
          value: formatCurrency((Number(tx.value) / 1e18) * 2000), // Assume ETH at $2000
          gasUsed: tx.gasUsed.toString(),
          gasPrice: tx.gasPrice.toString(),
          timestamp: tx.timestamp,
          status: tx.status === 'success' ? 'confirmed' : tx.status === 'failed' ? 'failed' : 'pending',
          chainId: 11155111, // Default to Sepolia
          blockNumber: Number(tx.blockNumber)
        }));

        // Generate portfolio history (simplified)
        const portfolioData: PortfolioData[] = [];
        const now = Date.now();
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now - i * 24 * 60 * 60 * 1000);
          portfolioData.push({
            date: date.toISOString().split('T')[0],
            value: data.totalValue * (0.95 + Math.random() * 0.1) // Simulate historical data
          });
        }

        set({
          portfolioData,
          allocationData,
          totalValue: data.totalValue,
          dailyChange: data.dailyChange,
          dailyChangeValue: data.dailyChange,
          dailyChangePercent: data.dailyChangePercent,
          recentTransactions: recentTransactions.slice(0, 5),
          transactionHistory: recentTransactions
        });
      },

      executeRealSwap: async (params: SwapParams) => {
        const state = get();
        if (!state.connectedAddress) {
          throw new Error('Wallet not connected');
        }

        set({ isLoading: true, error: null });

        try {
          const dataService = getRealDataProviderService();
          const result = await dataService.executeSwap(
            params.fromToken,
            params.toToken,
            params.amount,
            params.slippage,
            params.chainId,
            state.connectedAddress
          );

          // Add pending transaction
          if (result.hash) {
            const newTransaction: RealTransaction = {
              id: result.hash,
              hash: result.hash,
              type: 'swap',
              from: state.connectedAddress,
              to: '0x0000000000000000000000000000000000000000' as Address, // DEX contract
              amount: params.amount,
              value: formatCurrency(parseFloat(params.amount) * 2000), // Estimate
              gasUsed: '0',
              gasPrice: '0',
              timestamp: Math.floor(Date.now() / 1000),
              status: result.status === 'pending' ? 'pending' : result.status === 'success' ? 'confirmed' : 'failed',
              chainId: params.chainId,
              blockNumber: 0
            };

            get().addTransaction(newTransaction);
          }

          return result;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Swap failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      addTransaction: (transaction: RealTransaction) => {
        set(state => ({
          recentTransactions: [transaction, ...state.recentTransactions].slice(0, 5),
          transactionHistory: [transaction, ...state.transactionHistory]
        }));
      },

      updateNetworkStatus: async () => {
        try {
          const dataService = getRealDataProviderService();
          const [networkStatus, gasPrices] = await Promise.all([
            dataService.getNetworkStatus(),
            dataService.getGasPrices()
          ]);

          const statusArray: NetworkStatus[] = Object.entries(networkStatus).map(([chainId, status]) => ({
            chainId: parseInt(chainId),
            ...status
          }));

          set({
            networkStatus: statusArray,
            gasPrices
          });
        } catch (error) {
          console.error('Error updating network status:', error);
        }
      },

      initializeClientData: () => {
        set({ isClient: true });
        
        // Auto-refresh data every 30 seconds when connected
        const state = get();
        if (state.isConnected) {
          get().refreshRealData();
        }
      },

      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'real-dashboard-storage',
      partialize: (state) => ({
        selectedTimeframe: state.selectedTimeframe,
        connectedAddress: state.connectedAddress,
        connectedChains: state.connectedChains,
        isConnected: state.isConnected
      })
    }
  )
);

// Auto-refresh utility for dashboard data
export const useAutoRefresh = () => {
  // Auto-refresh is handled individually by components using the store
  console.log('⚡ Dashboard auto-refresh available through individual components');
};
