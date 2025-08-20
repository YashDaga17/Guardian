import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Wallet Store
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connector: string | null;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletActions {
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setBalance: (balance: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setConnector: (connector: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set) => ({
      // State
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      connector: null,
      isConnecting: false,
      error: null,
      
      // Actions
      setConnected: (connected) => set({ isConnected: connected }),
      setAddress: (address) => set({ address }),
      setBalance: (balance) => set({ balance }),
      setChainId: (chainId) => set({ chainId }),
      setConnector: (connector) => set({ connector }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setError: (error) => set({ error }),
      disconnect: () => set({
        isConnected: false,
        address: null,
        balance: null,
        chainId: null,
        connector: null,
        error: null,
      }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        address: state.address,
        chainId: state.chainId,
        connector: state.connector,
      }),
    }
  )
);

// Portfolio Store
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  value: string;
  price: string;
  change24h: number;
  allocation: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'swap' | 'transfer';
  asset: string;
  amount: string;
  value: string;
  timestamp: number;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  batchId?: string;
}

export interface PerformanceData {
  totalValue: string;
  change24h: number;
  change7d: number;
  change30d: number;
  allTimeHigh: string;
  allTimeLow: string;
}

export interface PortfolioState {
  assets: Asset[];
  transactions: Transaction[];
  performance: PerformanceData | null;
  isLoading: boolean;
  error: string | null;
}

export interface PortfolioActions {
  setAssets: (assets: Asset[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  setPerformance: (performance: PerformanceData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState & PortfolioActions>((set) => ({
  // State
  assets: [],
  transactions: [],
  performance: null,
  isLoading: false,
  error: null,

  // Actions
  setAssets: (assets) => set({ assets }),
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map(tx => 
      tx.id === id ? { ...tx, ...updates } : tx
    )
  })),
  setPerformance: (performance) => set({ performance }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// Strategy Store
export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'conservative' | 'moderate' | 'aggressive' | 'defi-yield' | 'custom';
  riskLevel: number;
  expectedApy: number;
  isActive: boolean;
  allocation: number;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
  assets: string[];
  createdAt: number;
}

export interface AIRecommendation {
  id: string;
  type: 'buy' | 'sell' | 'rebalance' | 'yield-opportunity';
  title: string;
  description: string;
  confidence: number;
  expectedReturn: number;
  riskLevel: number;
  timeframe: string;
  assets: string[];
  createdAt: number;
}

export interface StrategyState {
  strategies: Strategy[];
  recommendations: AIRecommendation[];
  activeStrategy: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface StrategyActions {
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  removeStrategy: (id: string) => void;
  setActiveStrategy: (id: string | null) => void;
  setRecommendations: (recommendations: AIRecommendation[]) => void;
  addRecommendation: (recommendation: AIRecommendation) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStrategyStore = create<StrategyState & StrategyActions>((set) => ({
  // State
  strategies: [],
  recommendations: [],
  activeStrategy: null,
  isLoading: false,
  error: null,

  // Actions
  addStrategy: (strategy) => set((state) => ({
    strategies: [...state.strategies, strategy]
  })),
  updateStrategy: (id, updates) => set((state) => ({
    strategies: state.strategies.map(strategy =>
      strategy.id === id ? { ...strategy, ...updates } : strategy
    )
  })),
  removeStrategy: (id) => set((state) => ({
    strategies: state.strategies.filter(strategy => strategy.id !== id)
  })),
  setActiveStrategy: (id) => set({ activeStrategy: id }),
  setRecommendations: (recommendations) => set({ recommendations }),
  addRecommendation: (recommendation) => set((state) => ({
    recommendations: [recommendation, ...state.recommendations]
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// UI Store
export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  isMobile: boolean;
  activeModal: string | null;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
  }>;
}

export interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // State
      theme: 'system',
      sidebarOpen: true,
      isMobile: false,
      activeModal: null,
      notifications: [],

      // Actions
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      setActiveModal: (modal) => set({ activeModal: modal }),
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
          },
          ...state.notifications
        ]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
