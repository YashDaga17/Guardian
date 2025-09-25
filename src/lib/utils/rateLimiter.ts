// Simple in-memory rate limiter for API endpoints
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get time until reset
   */
  getTimeUntilReset(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;
    
    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiter instances
export const aiApiLimiter = new RateLimiter(60000, 5); // 5 requests per minute
export const marketDataLimiter = new RateLimiter(30000, 10); // 10 requests per 30 seconds

// Cleanup every 5 minutes
setInterval(() => {
  aiApiLimiter.cleanup();
  marketDataLimiter.cleanup();
}, 300000);
