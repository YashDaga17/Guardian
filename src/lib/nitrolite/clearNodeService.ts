'use client';

import { ethers } from 'ethers';
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createGetChannelsMessage,
  createGetLedgerBalancesMessage,
  createGetConfigMessage,
  parseAnyRPCResponse,
  RPCMethod,
  generateRequestId,
  getCurrentTimestamp,
  type MessageSigner
} from '@erc7824/nitrolite';
import { Hex } from 'viem';

export interface ClearNodeChannel {
  channel_id: string;
  status: 'open' | 'closed' | 'pending';
  participant: string;
  token: string;
  amount: string;
  chain_id: string;
  adjudicator: string;
  challenge: string;
  nonce: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerBalance {
  participant: string;
  token: string;
  balance: string;
}

export interface ClearNodeConfig {
  supported_tokens: string[];
  chain_id: string;
  adjudicator: string;
  version: string;
}

// Type definitions for request handling  
export interface RequestMapEntry {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
}

export interface SignedRequest {
  req: [string, string, unknown[], number];
  sig: string[];
}

export interface WebSocketMessage {
  req?: [string, string, unknown[], number];
  res?: [string, unknown, null | string];
  id?: string;
  [key: string]: unknown;
}

// Default wallet configuration for ClearNode authentication
const DEFAULT_PRIVATE_KEY = '91a31fdfeb27d6f6397b4330d90c66e7eef696a47c00028577576d4d3c0af947';
const _DEFAULT_WALLET_ADDRESS = '0xC9A651a40f06059074DfDdBc31490A77C83aCEBe';

export class ClearNodeConnection extends EventTarget {
  private url: string;
  private stateWallet: ethers.Wallet;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private requestMap = new Map<string, RequestMapEntry>();
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(url: string, privateKey: string = DEFAULT_PRIVATE_KEY) {
    super();
    this.url = url;
    this.stateWallet = new ethers.Wallet(privateKey);
    console.log('ClearNode initialized with wallet:', this.stateWallet.address);
  }

  // Message signer function for Nitrolite SDK
  private messageSigner: MessageSigner = async (payload: unknown): Promise<Hex> => {
    try {
      const message = JSON.stringify(payload);
      const digestHex = ethers.id(message);
      const messageBytes = ethers.getBytes(digestHex);
      const signature = this.stateWallet.signingKey.sign(messageBytes);
      return signature.serialized as Hex;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  // Create a signed request manually
  private async createSignedRequest(method: string, params: unknown[] = [], requestId = generateRequestId().toString()): Promise<{ request: SignedRequest; requestId: string }> {
    const timestamp = getCurrentTimestamp();
    const requestData: [string, string, unknown[], number] = [requestId, method, params, timestamp];
    const request: SignedRequest = { req: requestData, sig: [] };
    
    const message = JSON.stringify(request);
    const digestHex = ethers.id(message);
    const messageBytes = ethers.getBytes(digestHex);
    const signature = this.stateWallet.signingKey.sign(messageBytes);
    request.sig = [signature.serialized];
    
    return { request, requestId };
  }

  // Emit custom events
  private emit(eventType: string, data?: unknown) {
    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  // Connect to ClearNode
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.close();
      }

      this.emit('connecting');
      console.log(`[ClearNode] Connecting to ${this.url}...`);

      try {
        this.ws = new WebSocket(this.url);
      } catch (error) {
        reject(new Error(`Failed to create WebSocket connection: ${error instanceof Error ? error.message : String(error)}`));
        return;
      }

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.onopen = async () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        console.log('[ClearNode] WebSocket connection established');

        try {
          // Start authentication flow
          const authRequest = await createAuthRequestMessage({
            address: this.stateWallet.address as `0x${string}`,
            session_key: this.stateWallet.signingKey.publicKey as `0x${string}`,
            app_name: 'Tradely DeFi Platform',
            expire: String(Math.floor(Date.now() / 1000) + 3600), // 1 hour expiration
            scope: 'console',
            application: this.stateWallet.address as `0x${string}`, // Using wallet address as application
            allowances: [],
          });

          console.log('[ClearNode] Sending auth request...');
          this.ws?.send(authRequest);
        } catch (error) {
          console.error('[ClearNode] Authentication request failed:', error);
          this.emit('error', `Authentication request failed: ${error instanceof Error ? error.message : String(error)}`);
          reject(error);
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = parseAnyRPCResponse(event.data);
          this.emit('message', message);

          // Handle authentication flow
          if (message.method === RPCMethod.AuthChallenge) {
            console.log('[ClearNode] Received auth challenge, signing...');
            
            try {
              const authVerify = await createAuthVerifyMessage(
                this.messageSigner,
                message
              );
              
              this.ws?.send(authVerify);
            } catch (error) {
              console.error('[ClearNode] Authentication verification failed:', error);
              this.emit('error', `Authentication verification failed: ${error instanceof Error ? error.message : String(error)}`);
              reject(error);
            }
          } else if (message.method === RPCMethod.AuthVerify) {
            if (message.params?.success) {
              this.isAuthenticated = true;
              this.emit('authenticated');
              console.log('[ClearNode] Authentication successful');
              
              // Store JWT token if provided
              if (message.params.jwtToken) {
                localStorage.setItem('clearnode_jwt', message.params.jwtToken);
              }
              
              resolve(); // Authentication successful
            } else {
              this.isAuthenticated = false;
              const errorMsg = 'Authentication failed: Unknown error';
              const error = new Error(errorMsg);
              this.emit('error', error.message);
              reject(error);
            }
          } else if (message.method === RPCMethod.Error) {
            console.error('[ClearNode] Received error:', message.params?.error);
            this.emit('error', message.params?.error || 'Unknown error');
          }

          // Handle other response types
          const requestId = this.extractRequestId(message);
          if (requestId) {
            const handler = this.requestMap.get(requestId);
            if (handler) {
              clearTimeout(handler.timeout);
              handler.resolve(message as unknown);
              this.requestMap.delete(requestId);
            }
          }
        } catch (error) {
          console.error('[ClearNode] Error handling message:', error);
          this.emit('error', `Message handling error: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      this.ws.onerror = (error) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        console.error('[ClearNode] WebSocket error:', error);
        this.emit('error', `WebSocket error: ${error}`);
        reject(new Error(`WebSocket error: ${error}`));
      };

      this.ws.onclose = (event) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        
        this.isConnected = false;
        this.isAuthenticated = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        console.log(`[ClearNode] WebSocket closed: ${event.code} ${event.reason}`);
        
        // Clear pending requests
        for (const [requestId, handler] of this.requestMap.entries()) {
          clearTimeout(handler.timeout);
          handler.reject(new Error('Connection closed'));
          this.requestMap.delete(requestId);
        }

        // Attempt to reconnect if not user initiated
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };
    });
  }

  // Extract request ID from various message formats
  private extractRequestId(message: unknown): string | null {
    const msg = message as Record<string, unknown>;
    if (msg.res && Array.isArray(msg.res) && msg.res[0]) {
      return String(msg.res[0]);
    }
    if (msg.req && Array.isArray(msg.req) && msg.req[0]) {
      return String(msg.req[0]);
    }
    if (msg.id) {
      return String(msg.id);
    }
    return null;
  }

  // Get channels using the SDK helper
  async getChannels(): Promise<ClearNodeChannel[]> {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Not connected or authenticated');
    }

    const message = await createGetChannelsMessage(
      this.messageSigner,
      this.stateWallet.address as Hex
    );

    return new Promise((resolve, reject) => {
      try {
        const parsed = JSON.parse(message);
        const requestId = parsed.req[0];

        const timeout = setTimeout(() => {
          this.requestMap.delete(requestId);
          reject(new Error('Request timeout for getChannels'));
        }, 30000);

        this.requestMap.set(requestId, {
          resolve: (response: unknown) => {
            try {
              // Extract channels from response - type assertion for external API response
              const typedResponse = response as { res?: unknown[][]; params?: unknown[] };
              const channels = typedResponse.res?.[2]?.[0] || typedResponse.params || [];
              resolve(channels as ClearNodeChannel[]);
            } catch (error) {
              reject(new Error(`Failed to parse channels response: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          },
          reject,
          timeout
        });

        this.ws?.send(message);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get ledger balances for a channel
  async getLedgerBalances(channelId: string): Promise<LedgerBalance[]> {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Not connected or authenticated');
    }

    const message = await createGetLedgerBalancesMessage(
      this.messageSigner,
      channelId as Hex
    );

    return new Promise((resolve, reject) => {
      try {
        const parsed = JSON.parse(message);
        const requestId = parsed.req[0];

        const timeout = setTimeout(() => {
          this.requestMap.delete(requestId);
          reject(new Error('Request timeout for getLedgerBalances'));
        }, 30000);

        this.requestMap.set(requestId, {
          resolve: (response: unknown) => {
            try {
              const typedResponse = response as { res?: unknown[]; params?: unknown[] };
              const balances = typedResponse.res?.[2] || typedResponse.params || [];
              resolve(balances as LedgerBalance[]);
            } catch (error) {
              reject(new Error(`Failed to parse balances response: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          },
          reject,
          timeout
        });

        this.ws?.send(message);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get ClearNode configuration
  async getConfig(): Promise<ClearNodeConfig> {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Not connected or authenticated');
    }

    const message = await createGetConfigMessage(
      this.messageSigner,
      parseInt(this.stateWallet.address, 16)
    );

    return new Promise((resolve, reject) => {
      try {
        const parsed = JSON.parse(message);
        const requestId = parsed.req[0];

        const timeout = setTimeout(() => {
          this.requestMap.delete(requestId);
          reject(new Error('Request timeout for getConfig'));
        }, 30000);

        this.requestMap.set(requestId, {
          resolve: (response: unknown) => {
            try {
              const typedResponse = response as { res?: unknown[]; params?: unknown };
              const config = typedResponse.res?.[2] || typedResponse.params || {};
              resolve(config as ClearNodeConfig);
            } catch (error) {
              reject(new Error(`Failed to parse config response: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          },
          reject,
          timeout
        });

        this.ws?.send(message);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Send a custom request
  async sendRequest(method: string, params: unknown[] = []): Promise<unknown> {
    if (!this.isConnected || !this.isAuthenticated) {
      throw new Error('Not connected or authenticated');
    }

    const { request, requestId } = await this.createSignedRequest(method, params);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestMap.delete(requestId);
        reject(new Error(`Request timeout for ${method}`));
      }, 30000);

      this.requestMap.set(requestId, {
        resolve: (response) => {
          resolve(response);
        },
        reject,
        timeout
      });

      try {
        this.ws?.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timeout);
        this.requestMap.delete(requestId);
        reject(error);
      }
    });
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', 'Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    console.log(`[ClearNode] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error(`[ClearNode] Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      });
    }, delay);
  }

  // Disconnect from ClearNode
  disconnect() {
    console.log('[ClearNode] Disconnecting...');
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Clear all pending requests
    for (const [requestId, handler] of this.requestMap.entries()) {
      clearTimeout(handler.timeout);
      handler.reject(new Error('Connection closed'));
      this.requestMap.delete(requestId);
    }

    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
  }

  // Getters for connection state
  get connected(): boolean {
    return this.isConnected;
  }

  get authenticated(): boolean {
    return this.isAuthenticated;
  }

  get walletAddress(): string {
    return this.stateWallet.address;
  }
}

// Factory function to create ClearNode connection
export const createClearNodeConnection = (url: string, privateKey: string): ClearNodeConnection => {
  return new ClearNodeConnection(url, privateKey);
};

// Demo/Test private key (DO NOT USE IN PRODUCTION)
export const DEMO_PRIVATE_KEY = '0x' + '1'.repeat(64);

export default ClearNodeConnection;
