/**
 * Environment variable validation and configuration
 * Ensures required environment variables are present and valid
 */

interface EnvironmentConfig {
  DATABASE_URL: string;
  GEMINI_API_KEY?: string;
  NEXT_PUBLIC_ETHEREUM_RPC_URL?: string;
  NEXT_PUBLIC_CHAIN_ID: string;
  NITROLITE_PRIVATE_KEY?: string;
  NEXT_PUBLIC_WALLET_ADDRESS?: string;
  NEXT_PUBLIC_CLEARNODE_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

class EnvironmentValidator {
  private config: Partial<EnvironmentConfig> = {};

  constructor() {
    this.loadEnvironment();
    this.validateRequired();
  }

  private loadEnvironment() {
    this.config = {
      DATABASE_URL: process.env.DATABASE_URL,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      NEXT_PUBLIC_ETHEREUM_RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
      NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '1',
      NITROLITE_PRIVATE_KEY: process.env.NITROLITE_PRIVATE_KEY,
      NEXT_PUBLIC_WALLET_ADDRESS: process.env.NEXT_PUBLIC_WALLET_ADDRESS,
      NEXT_PUBLIC_CLEARNODE_URL: process.env.NEXT_PUBLIC_CLEARNODE_URL,
      NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    };
  }

  private validateRequired() {
    const required: Array<keyof EnvironmentConfig> = [
      'DATABASE_URL',
    ];

    const missing = required.filter(key => !this.config[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }

    // Validate format of DATABASE_URL
    if (this.config.DATABASE_URL && !this.config.DATABASE_URL.startsWith('postgres')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    // Validate chain ID
    const chainId = parseInt(this.config.NEXT_PUBLIC_CHAIN_ID!);
    if (isNaN(chainId) || chainId <= 0) {
      throw new Error('NEXT_PUBLIC_CHAIN_ID must be a valid positive integer');
    }

    // Validate private key format if present
    if (this.config.NITROLITE_PRIVATE_KEY && !this.config.NITROLITE_PRIVATE_KEY.startsWith('0x')) {
      throw new Error('NITROLITE_PRIVATE_KEY must start with 0x');
    }
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key] as EnvironmentConfig[K];
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Check if critical services are configured
  hasAIFeatures(): boolean {
    return !!this.config.GEMINI_API_KEY && this.config.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  }

  hasBlockchainFeatures(): boolean {
    return !!(
      this.config.NEXT_PUBLIC_ETHEREUM_RPC_URL &&
      this.config.NITROLITE_PRIVATE_KEY &&
      this.config.NEXT_PUBLIC_WALLET_ADDRESS
    );
  }

  hasNitroliteFeatures(): boolean {
    return !!(
      this.config.NITROLITE_PRIVATE_KEY &&
      this.config.NEXT_PUBLIC_CLEARNODE_URL
    );
  }
}

// Singleton instance
let envValidator: EnvironmentValidator | null = null;

export function getEnvironmentConfig(): EnvironmentValidator {
  if (!envValidator) {
    envValidator = new EnvironmentValidator();
  }
  return envValidator;
}

// Convenience functions
export const env = {
  get: (key: keyof EnvironmentConfig) => getEnvironmentConfig().get(key),
  isDevelopment: () => getEnvironmentConfig().isDevelopment(),
  isProduction: () => getEnvironmentConfig().isProduction(),
  isTest: () => getEnvironmentConfig().isTest(),
  hasAI: () => getEnvironmentConfig().hasAIFeatures(),
  hasBlockchain: () => getEnvironmentConfig().hasBlockchainFeatures(),
  hasNitrolite: () => getEnvironmentConfig().hasNitroliteFeatures(),
};
