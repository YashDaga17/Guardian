/**
 * Production-safe logging utility
 * Logs debug information only in development, errors in all environments
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = {
  // Always log errors
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : error);
  },

  // Always log warnings
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },

  // Only log info in development
  info: (message: string, data?: unknown) => {
    if (isDevelopment || isTest) {
      console.log(`[INFO] ${message}`, data);
    }
  },

  // Only log debug in development
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  // Production-safe API logging (sanitizes sensitive data)
  api: (endpoint: string, status: number, data?: unknown) => {
    if (isDevelopment) {
      console.log(`[API] ${endpoint} - ${status}`, data);
    } else {
      // In production, only log errors
      if (status >= 400) {
        console.error(`[API ERROR] ${endpoint} - ${status}`);
      }
    }
  },

  // Sanitize data before logging
  sanitize: (obj: unknown): unknown => {
    if (!obj) return obj;
    
    if (typeof obj !== 'object') return obj;
    
    const sensitive = ['password', 'privateKey', 'apiKey', 'token', 'secret', 'key'];
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
};
