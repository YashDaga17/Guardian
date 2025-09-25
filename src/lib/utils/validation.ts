/**
 * Input validation and sanitization utilities
 * Prevents XSS, injection attacks, and ensures data integrity
 */

export class InputValidator {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize user ID
  static validateUserId(userId: string | null): string | null {
    if (!userId) return null;
    
    const sanitized = userId.trim();
    if (sanitized.length === 0) return null;
    if (sanitized.length > 255) return null;
    
    // Allow alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      throw new Error('Invalid user ID format');
    }
    
    return sanitized;
  }

  // Validate wallet address
  static validateWalletAddress(address: string): boolean {
    if (!address) return false;
    
    // Basic Ethereum address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return false;
    }
    
    return true;
  }

  // Validate and sanitize text input
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    let sanitized = input.trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
    
    return sanitized;
  }

  // Validate numeric input
  static validateNumber(input: unknown, min?: number, max?: number): number | null {
    const num = Number(input);
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    
    if (min !== undefined && num < min) {
      return null;
    }
    
    if (max !== undefined && num > max) {
      return null;
    }
    
    return num;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Sanitize search query
  static sanitizeSearchQuery(query: string): string {
    if (!query) return '';
    
    return query
      .trim()
      .replace(/[<>\"'&%]/g, '') // Remove potentially dangerous characters
      .substring(0, 100); // Limit length
  }

  // Validate token symbol
  static validateTokenSymbol(symbol: string): boolean {
    if (!symbol) return false;
    
    // Allow 2-10 uppercase letters, numbers
    return /^[A-Z0-9]{2,10}$/.test(symbol);
  }

  // Validate and sanitize amount
  static validateAmount(amount: string | number): number | null {
    const num = Number(amount);
    
    if (isNaN(num) || !isFinite(num) || num < 0) {
      return null;
    }
    
    // Limit to reasonable precision (18 decimal places max)
    return Math.floor(num * 1e18) / 1e18;
  }

  // Validate JSON structure
  static validateJson<T>(input: unknown, requiredFields: string[] = []): T | null {
    try {
      if (typeof input === 'string') {
        input = JSON.parse(input);
      }
      
      if (!input || typeof input !== 'object') {
        return null;
      }
      
      // Check required fields
      for (const field of requiredFields) {
        if (!(field in input)) {
          return null;
        }
      }
      
      return input as T;
    } catch {
      return null;
    }
  }

  // Validate URL
  static validateUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  // Check for common SQL injection patterns
  static checkSqlInjection(input: string): boolean {
    if (!input) return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
      /(--|\/\*|\*\/|;|'|")/gi,
      /(\b(script|javascript|vbscript|onload|onerror|onclick)\b)/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Comprehensive input sanitization
  static sanitizeInput(input: unknown): unknown {
    if (typeof input === 'string') {
      if (this.checkSqlInjection(input)) {
        throw new Error('Potentially malicious input detected');
      }
      return this.sanitizeHtml(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        sanitized[this.sanitizeText(key, 50)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

// Type-safe validation schemas
export const ValidationSchemas = {
  user: {
    walletAddress: (value: string) => InputValidator.validateWalletAddress(value),
    email: (value: string) => InputValidator.validateEmail(value),
    username: (value: string) => InputValidator.sanitizeText(value, 50)
  },
  
  trade: {
    amount: (value: unknown) => InputValidator.validateAmount(value as string | number),
    tokenSymbol: (value: string) => InputValidator.validateTokenSymbol(value),
    slippage: (value: unknown) => InputValidator.validateNumber(value, 0.01, 50)
  },
  
  api: {
    userId: (value: unknown) => InputValidator.validateUserId(String(value)),
    limit: (value: unknown) => InputValidator.validateNumber(value, 1, 100),
    offset: (value: unknown) => InputValidator.validateNumber(value, 0, 10000)
  }
};
