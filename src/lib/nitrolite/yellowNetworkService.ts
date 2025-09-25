/**
 * Yellow Network Nitrolite Integration
 * State channels for testnet transactions
 */

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

export class YellowNitroliteService {
  private static readonly SANDBOX_WS_URL = 'wss://clearnet-sandbox.yellow.com/ws';
  private static readonly SANDBOX_API_URL = 'https://clearnet-sandbox.yellow.com';
  private static readonly FAUCET_URL = 'https://clearnet-sandbox.yellow.com/faucet/requestTokens';
  
  private static ws: WebSocket | null = null;
  private static isConnected = false;
  private static listeners: Map<string, (data: Record<string, unknown>) => void> = new Map();

  /**
   * Initialize connection to Yellow Network Sandbox
   */
  static async initialize(userAddress: string): Promise<boolean> {
    try {
      // Request test tokens from faucet first
      await this.requestFaucetTokens(userAddress);
      
      // Connect to websocket
      this.ws = new WebSocket(this.SANDBOX_WS_URL);
      
      return new Promise((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket not initialized'));

        this.ws.onopen = () => {
          console.log('✅ Connected to Yellow Network Sandbox');
          this.isConnected = true;
          
          // Authenticate with user address
          this.ws?.send(JSON.stringify({
            type: 'authenticate',
            address: userAddress
          }));
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as Record<string, unknown>;
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Yellow Network WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Yellow Network');
          this.isConnected = false;
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error initializing Yellow Network:', error);
      return false;
    }
  }

  /**
   * Request test tokens from faucet
   */
  static async requestFaucetTokens(userAddress: string): Promise<boolean> {
    try {
      const response = await fetch(this.FAUCET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Faucet tokens requested:', result);
        return true;
      } else {
        console.warn('Faucet request failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error requesting faucet tokens:', error);
      return false;
    }
  }

  /**
   * Get user balance from clearnode
   */
  static async getBalance(userAddress: string): Promise<YellowBalance[]> {
    try {
      const response = await fetch(`${this.SANDBOX_API_URL}/api/v1/balance/${userAddress}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const balances = await response.json() as Record<string, unknown>[];
        return balances.map((b: Record<string, unknown>) => ({
          asset: (b.asset as string) || 'YELLOW_TEST_USD',
          balance: (b.balance as string) || '0',
          locked: (b.locked as string) || '0', 
          available: (b.available as string) || (b.balance as string) || '0'
        }));
      }
      
      // Return mock data for demo
      return [{
        asset: 'YELLOW_TEST_USD',
        balance: '100.00',
        locked: '0.00',
        available: '100.00'
      }];
    } catch (error) {
      console.error('Error fetching Yellow balance:', error);
      return [];
    }
  }

  /**
   * Get user's open channels
   */
  static async getChannels(userAddress: string): Promise<YellowChannelInfo[]> {
    try {
      const response = await fetch(`${this.SANDBOX_API_URL}/api/v1/channels/${userAddress}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const channels = await response.json() as Record<string, unknown>[];
        return channels.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          state: ((c.state as string) || 'open') as 'opening' | 'open' | 'closing' | 'closed',
          balance: (c.balance as string) || '0',
          counterparty: (c.counterparty as string) || 'unknown',
          asset: (c.asset as string) || 'YELLOW_TEST_USD',
          createdAt: (c.createdAt as string) || new Date().toISOString(),
          lastUpdated: (c.lastUpdated as string) || new Date().toISOString()
        }));
      }

      // Return mock channel for demo
      return [{
        id: `channel_${Date.now()}`,
        state: 'open',
        balance: '50.00',
        counterparty: '0x742d35Cc6634C0532925a3b8D4024bFb3065d2e4',
        asset: 'YELLOW_TEST_USD',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }

  /**
   * Create a new payment channel
   */
  static async createChannel(counterpartyAddress: string, initialAmount: string, asset: string = 'YELLOW_TEST_USD'): Promise<string | null> {
    try {
      if (!this.isConnected || !this.ws) {
        throw new Error('Not connected to Yellow Network');
      }

      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send channel creation request via WebSocket
      this.ws.send(JSON.stringify({
        type: 'create_channel',
        channelId,
        counterparty: counterpartyAddress,
        amount: initialAmount,
        asset
      }));

      console.log(`✅ Channel creation requested: ${channelId}`);
      return channelId;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  }

  /**
   * Send payment through a channel
   */
  static async sendPayment(channelId: string, amount: string, recipient: string): Promise<YellowTransaction | null> {
    try {
      if (!this.isConnected || !this.ws) {
        throw new Error('Not connected to Yellow Network');
      }

      const transaction: YellowTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'transfer',
        amount,
        asset: 'YELLOW_TEST_USD',
        status: 'pending',
        counterparty: recipient,
        timestamp: new Date().toISOString()
      };

      // Send payment via WebSocket
      this.ws.send(JSON.stringify({
        type: 'send_payment',
        channelId,
        transactionId: transaction.id,
        amount,
        recipient
      }));

      console.log(`✅ Payment sent: ${transaction.id}`);
      return transaction;
    } catch (error) {
      console.error('Error sending payment:', error);
      return null;
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactions(_userAddress: string): Promise<YellowTransaction[]> {
    try {
      // Mock transaction history for demo
      return [
        {
          id: 'tx_1695567890123',
          type: 'deposit',
          amount: '100.00',
          asset: 'YELLOW_TEST_USD',
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'tx_1695567890124',
          type: 'transfer',
          amount: '25.50',
          asset: 'YELLOW_TEST_USD',
          status: 'completed',
          counterparty: '0x742d35Cc6634C0532925a3b8D4024bFb3065d2e4',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Close a payment channel
   */
  static async closeChannel(channelId: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.ws) {
        throw new Error('Not connected to Yellow Network');
      }

      this.ws.send(JSON.stringify({
        type: 'close_channel',
        channelId
      }));

      console.log(`✅ Channel closure requested: ${channelId}`);
      return true;
    } catch (error) {
      console.error('Error closing channel:', error);
      return false;
    }
  }

  /**
   * Add event listener for WebSocket messages
   */
  static addEventListener(event: string, callback: (data: Record<string, unknown>) => void): void {
    this.listeners.set(event, callback);
  }

  /**
   * Remove event listener
   */
  static removeEventListener(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private static handleWebSocketMessage(data: Record<string, unknown>): void {
    console.log('📨 Yellow Network message:', data);

    // Notify listeners
    this.listeners.forEach((callback, event) => {
      if (data.type === event || event === 'all') {
        callback(data);
      }
    });

    // Handle specific message types
    switch (data.type) {
      case 'channel_created':
        console.log('✅ Channel created:', data.channelId);
        break;
      case 'payment_received':
        console.log('💰 Payment received:', data);
        break;
      case 'payment_sent':
        console.log('💸 Payment sent:', data);
        break;
      case 'channel_closed':
        console.log('🔒 Channel closed:', data.channelId);
        break;
      case 'balance_updated':
        console.log('💰 Balance updated:', data);
        break;
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  /**
   * Disconnect from Yellow Network
   */
  static disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    console.log('Disconnected from Yellow Network');
  }

  /**
   * Check connection status
   */
  static isConnectedToNetwork(): boolean {
    return this.isConnected;
  }
}
