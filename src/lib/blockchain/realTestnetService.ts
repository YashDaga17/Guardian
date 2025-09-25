'use client';

import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Address, type PrivateKeyAccount } from 'viem';
import { sepolia, polygonMumbai, arbitrumSepolia, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Real testnet configuration
export interface TestnetConfig {
  chainId: number;
  rpcUrl: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  faucetUrl?: string;
}

// Testnet configurations with fallback URLs
export const TESTNETS: Record<number, TestnetConfig> = {
  11155111: {
    chainId: 11155111,
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://rpc.sepolia.org',
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
    blockExplorer: 'https://sepolia.etherscan.io',
    faucetUrl: 'https://sepoliafaucet.com'
  },
  80001: {
    chainId: 80001,
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    name: 'Mumbai',
    nativeCurrency: { name: 'Mumbai Matic', symbol: 'MATIC', decimals: 18 },
    blockExplorer: 'https://mumbai.polygonscan.com',
    faucetUrl: 'https://faucet.polygon.technology'
  },
  421614: {
    chainId: 421614,
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Arbitrum Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia.arbiscan.io',
    faucetUrl: 'https://bridge.arbitrum.io'
  },
  84532: {
    chainId: 84532,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org',
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://sepolia-explorer.base.org',
    faucetUrl: 'https://bridge.base.org/deposit'
  }
};

// Common testnet token addresses (these are example addresses - replace with real ones)
export const TESTNET_TOKENS = {
  11155111: { // Sepolia
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'
  },
  80001: { // Mumbai
    USDC: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    USDT: '0xBD21A10F619BE90d6066c941b04e4E6d6DC67fC6',
    DAI: '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F'
  }
};

export interface RealTransaction {
  hash: string;
  from: Address;
  to: Address;
  value: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  blockNumber: bigint;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
}

export interface TokenBalance {
  address: Address;
  symbol: string;
  balance: string;
  decimals: number;
  price?: number;
  value?: number;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
}

/**
 * Real Testnet Transaction Service
 * Handles actual blockchain interactions on testnets
 */
export class RealTestnetService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publicClients: Map<number, any> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private walletClients: Map<number, any> = new Map();
  private account: PrivateKeyAccount | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize clients for each testnet
    Object.entries(TESTNETS).forEach(([chainId, config]) => {
      const chain = this.getViemChain(parseInt(chainId));
      
      // Public client for reading blockchain data (with error handling)
      try {
        const publicClient = createPublicClient({
          chain,
          transport: http(config.rpcUrl)
        });
        
        this.publicClients.set(parseInt(chainId), publicClient);
      } catch (error) {
        console.warn(`Failed to create public client for chain ${chainId}:`, error);
      }

      // Wallet client for transactions (disabled in production)
      const privateKey = process.env.NITROLITE_PRIVATE_KEY;
      if (privateKey && 
          process.env.NEXT_PUBLIC_USE_TESTNET === 'true') {
        
        try {
          this.account = privateKeyToAccount(privateKey as `0x${string}`);
          
          const walletClient = createWalletClient({
            account: this.account,
            chain,
            transport: http(config.rpcUrl)
          });
          
          this.walletClients.set(parseInt(chainId), walletClient);
        } catch (error) {
          console.warn(`Failed to create wallet client for chain ${chainId}:`, error);
        }
      }
    });
  }

  private getViemChain(chainId: number) {
    switch (chainId) {
      case 11155111: return sepolia;
      case 80001: return polygonMumbai;
      case 421614: return arbitrumSepolia;
      case 84532: return baseSepolia;
      default: return sepolia;
    }
  }

  /**
   * Get real native token balance
   */
  async getNativeBalance(address: Address, chainId: number): Promise<string> {
    try {
      const client = this.publicClients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      const balance = await client.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting native balance:', error);
      return '0';
    }
  }

  /**
   * Get real transaction history
   */
  async getTransactionHistory(address: Address, chainId: number, limit: number = 10): Promise<RealTransaction[]> {
    try {
      const client = this.publicClients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      // Get recent blocks
      const latestBlock = await client.getBlockNumber();
      const transactions: RealTransaction[] = [];

      // Search recent blocks for transactions from/to the address
      for (let i = 0; i < Math.min(limit, 100); i++) {
        try {
          const blockNumber = latestBlock - BigInt(i);
          const block = await client.getBlock({ 
            blockNumber, 
            includeTransactions: true 
          });

          if (block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && (tx.from === address || tx.to === address)) {
                const receipt = await client.getTransactionReceipt({ hash: tx.hash });
                
                transactions.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to || '0x0000000000000000000000000000000000000000',
                  value: tx.value,
                  gasUsed: receipt.gasUsed,
                  gasPrice: tx.gasPrice || BigInt(0),
                  blockNumber: tx.blockNumber || BigInt(0),
                  timestamp: Number(block.timestamp),
                  status: receipt.status === 'success' ? 'success' : 'failed'
                });

                if (transactions.length >= limit) break;
              }
            }
          }
          if (transactions.length >= limit) break;
        } catch (_blockError) {
          // Skip blocks that can't be fetched
          continue;
        }
      }

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: Address, 
    value: bigint, 
    data: `0x${string}` = '0x', 
    chainId: number
  ): Promise<GasEstimate> {
    try {
      const client = this.publicClients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      const gasLimit = await client.estimateGas({
        to,
        value,
        data,
        account: this.account?.address
      });

      const gasPrice = await client.getGasPrice();
      const totalCost = BigInt(gasLimit) * BigInt(gasPrice);

      return {
        gasLimit,
        gasPrice,
        totalCost
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return default estimates if estimation fails
      const defaultGasLimit = BigInt(21000);
      const defaultGasPrice = parseEther('0.000000001'); // 1 gwei
      return {
        gasLimit: defaultGasLimit,
        gasPrice: defaultGasPrice,
        totalCost: defaultGasLimit * defaultGasPrice
      };
    }
  }

  /**
   * Send a real transaction
   */
  async sendTransaction(
    to: Address,
    value: bigint,
    data: `0x${string}` = '0x',
    chainId: number
  ): Promise<string> {
    try {
      const walletClient = this.walletClients.get(chainId);
      if (!walletClient) {
        throw new Error(`No wallet client for chain ${chainId}. Please configure NITROLITE_PRIVATE_KEY.`);
      }

      const hash = await walletClient.sendTransaction({
        account: this.account!,
        to,
        value,
        data
      });

      return hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: `0x${string}`, chainId: number): Promise<{ status: string; blockNumber: number; gasUsed: bigint }> {
    try {
      const client = this.publicClients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      return await client.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  /**
   * Get current gas prices across testnets
   */
  async getGasPrices(): Promise<Record<number, string>> {
    const gasPrices: Record<number, string> = {};

    for (const [chainId, client] of this.publicClients.entries()) {
      try {
        const gasPrice = await client.getGasPrice();
        gasPrices[chainId] = formatEther(gasPrice);
      } catch (_error) {
        console.warn(`⚠️ Gas price unavailable for chain ${chainId}, using fallback`);
        // Use fallback gas prices for each chain
        switch (chainId) {
          case 11155111: // Sepolia
            gasPrices[chainId] = '0.000000020'; // 20 gwei
            break;
          case 80001: // Mumbai
            gasPrices[chainId] = '0.000000030'; // 30 gwei
            break;
          case 421614: // Arbitrum Sepolia
            gasPrices[chainId] = '0.000000010'; // 10 gwei
            break;
          case 84532: // Base Sepolia
            gasPrices[chainId] = '0.000000015'; // 15 gwei
            break;
          default:
            gasPrices[chainId] = '0.000000020'; // Default 20 gwei
        }
      }
    }

    return gasPrices;
  }

  /**
   * Get block information
   */
  async getLatestBlock(chainId: number) {
    try {
      const client = this.publicClients.get(chainId);
      if (!client) throw new Error(`No client for chain ${chainId}`);

      return await client.getBlock({ blockTag: 'latest' });
    } catch (error) {
      console.error(`Error getting latest block for chain ${chainId}:`, error);
      return null;
    }
  }

  /**
   * Get network status for all testnets
   */
  async getNetworkStatus() {
    const status: Record<number, { name: string; connected: boolean; latestBlock?: number; gasPrice?: string }> = {};

    for (const [chainId, config] of Object.entries(TESTNETS)) {
      try {
        const client = this.publicClients.get(parseInt(chainId));
        if (!client) {
          status[parseInt(chainId)] = {
            name: config.name,
            connected: false
          };
          continue;
        }
        
        const block = await client.getBlockNumber();
        const gasPrice = await client.getGasPrice();
        
        status[parseInt(chainId)] = {
          name: config.name,
          connected: true,
          latestBlock: Number(block),
          gasPrice: formatEther(gasPrice)
        };
      } catch (_error) {
        status[parseInt(chainId)] = {
          name: config.name,
          connected: false
        };
      }
    }

    return status;
  }

  /**
   * Get supported testnets
   */
  getSupportedTestnets() {
    return TESTNETS;
  }

  /**
   * Get faucet URLs for getting test tokens
   */
  getFaucetUrls() {
    return Object.fromEntries(
      Object.entries(TESTNETS)
        .filter(([_, config]) => config.faucetUrl)
        .map(([chainId, config]) => [chainId, config.faucetUrl])
    );
  }
}

// Singleton instance
let realTestnetService: RealTestnetService | null = null;

export function getRealTestnetService(): RealTestnetService {
  if (!realTestnetService) {
    realTestnetService = new RealTestnetService();
  }
  return realTestnetService;
}
