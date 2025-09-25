import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Transaction interface
interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'swap';
  asset: string;
  amount: string;
  value: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  batchId?: string;
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

// Allocation data interface
interface AllocationData {
  name: string;
  value: number;
  color: string;
}

// Dashboard state interface
interface DashboardState {
  // Static data
  portfolioData: PortfolioData[];
  allocationData: AllocationData[];
  
  // Dynamic data
  totalValue: number;
  dailyChange: number;
  dailyChangeValue: number;
  recentTransactions: Transaction[];
  aiInsights: AIInsight[];
  
  // UI state
  selectedTab: string;
  timeframe: '24h' | '7d' | '30d' | '1y';
  isLoading: boolean;
  lastUpdateTime: number;
  isClient: boolean;
  
  // Actions
  setSelectedTab: (tab: string) => void;
  setTimeframe: (timeframe: '24h' | '7d' | '30d' | '1y') => void;
  setIsLoading: (loading: boolean) => void;
  initializeClientData: () => void;
  refreshData: () => void;
}

// SSR-safe time formatting function
const formatTimeSSR = (timestamp: number, isClient: boolean): string => {
  if (!isClient) {
    // Return a placeholder during SSR that matches initial client render
    return '--:--';
  }
  
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Initial static data that doesn't change between server and client
const initialPortfolioData: PortfolioData[] = [
  { date: '2024-01-01', value: 100000 },
  { date: '2024-01-08', value: 105000 },
  { date: '2024-01-15', value: 102000 },
  { date: '2024-01-22', value: 108000 },
  { date: '2024-01-29', value: 112000 },
  { date: '2024-02-05', value: 118000 },
  { date: '2024-02-12', value: 125432 },
];

const initialAllocationData: AllocationData[] = [
  { name: 'ETH', value: 45, color: '#627EEA' },
  { name: 'BTC', value: 25, color: '#F7931A' },
  { name: 'USDC', value: 15, color: '#2775CA' },
  { name: 'LINK', value: 10, color: '#375BD2' },
  { name: 'Other', value: 5, color: '#8B5CF6' },
];

const initialAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'rebalance',
    title: 'Portfolio Rebalancing Opportunity',
    description: 'Consider reducing ETH allocation by 5% and increasing DeFi exposure',
    confidence: 85,
    expectedReturn: 12.5,
    timeframe: '3-6 months',
  },
  {
    id: '2',
    type: 'yield-opportunity',
    title: 'High Yield Opportunity Detected',
    description: 'Aave USDC lending shows 6.2% APY with low risk profile',
    confidence: 92,
    expectedReturn: 6.2,
    timeframe: '1-3 months',
  },
  {
    id: '3',
    type: 'buy',
    title: 'Market Entry Signal',
    description: 'Technical indicators suggest good entry point for LINK',
    confidence: 78,
    expectedReturn: 18.3,
    timeframe: '2-4 weeks',
  },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Static data
      portfolioData: initialPortfolioData,
      allocationData: initialAllocationData,
      
      // Dynamic data
      totalValue: 125432.50,
      dailyChange: 2.4,
      dailyChangeValue: 2845.30,
      recentTransactions: [],
      aiInsights: initialAIInsights,
      
      // UI state
      selectedTab: 'overview',
      timeframe: '7d',
      isLoading: false,
      lastUpdateTime: 0,
      isClient: false,
      
      // Actions
      setSelectedTab: (tab) => set({ selectedTab: tab }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      initializeClientData: () => {
        const now = Date.now();
        set({
          isClient: true,
          lastUpdateTime: now,
          recentTransactions: [
            {
              id: '1',
              type: 'buy',
              asset: 'ETH',
              amount: '2.5',
              value: '$8,000',
              timestamp: now - 3600000, // 1 hour ago
              status: 'confirmed',
              batchId: 'batch_001',
            },
            {
              id: '2',
              type: 'swap',
              asset: 'USDC → LINK',
              amount: '500',
              value: '$500',
              timestamp: now - 7200000, // 2 hours ago
              status: 'confirmed',
            },
            {
              id: '3',
              type: 'sell',
              asset: 'BTC',
              amount: '0.1',
              value: '$4,200',
              timestamp: now - 10800000, // 3 hours ago
              status: 'pending',
              batchId: 'batch_002',
            },
          ],
        });
      },
      
      refreshData: () => {
        const { isClient } = get();
        if (isClient) {
          set({ 
            lastUpdateTime: Date.now(),
            isLoading: true 
          });
          
          // Simulate data refresh
          setTimeout(() => {
            set({ isLoading: false });
          }, 1000);
        }
      },
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        selectedTab: state.selectedTab,
        timeframe: state.timeframe,
      }),
    }
  )
);

// Utility function to format transaction time safely
export const formatTransactionTime = (timestamp: number, isClient: boolean): string => {
  return formatTimeSSR(timestamp, isClient);
};

// Utility function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
