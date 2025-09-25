/**
 * Security configuration and middleware for Tradely DeFi Platform
 * Implements comprehensive security measures for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  maxRequestSize: number;
  blockSuspiciousPatterns: boolean;
}

export const securityConfig: SecurityConfig = {
  enableCSP: process.env.NODE_ENV === 'production',
  enableHSTS: process.env.NODE_ENV === 'production',
  enableCORS: true,
  allowedOrigins: [
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    'https://tradely-defi.vercel.app',
    'https://*.tradely-defi.com'
  ],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  blockSuspiciousPatterns: true
};

export class SecurityMiddleware {
  private static suspiciousPatterns = [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM)/gi,
    /(--|\/\*|\*\/|;|\bOR\b|\bAND\b).*(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/gi,
    
    // XSS patterns
    /(<script[^>]*>.*<\/script>|javascript:|vbscript:|onload=|onerror=|onclick=)/gi,
    /(<iframe|<object|<embed|<applet|<form)/gi,
    
    // Path traversal
    /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
    
    // Command injection
    /(\||\;|&|\$|\`|exec|system|passthru|shell_exec)/gi
  ];

  static async validateRequest(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Check request size
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > securityConfig.maxRequestSize) {
        logger.warn('Request too large', { size: contentLength, ip: this.getClientIP(request) });
        return NextResponse.json(
          { error: 'Request too large' },
          { status: 413 }
        );
      }

      // Validate origin for CORS
      if (securityConfig.enableCORS && request.method !== 'GET') {
        const origin = request.headers.get('origin');
        if (origin && !this.isAllowedOrigin(origin)) {
          logger.warn('Blocked cross-origin request', { origin, ip: this.getClientIP(request) });
          return NextResponse.json(
            { error: 'Origin not allowed' },
            { status: 403 }
          );
        }
      }

      // Check for suspicious patterns in URL and headers
      if (securityConfig.blockSuspiciousPatterns) {
        const url = request.url;
        const userAgent = request.headers.get('user-agent') || '';
        
        if (this.containsSuspiciousPatterns(url) || this.containsSuspiciousPatterns(userAgent)) {
          logger.warn('Blocked suspicious request', { 
            url, 
            userAgent: userAgent.slice(0, 100),
            ip: this.getClientIP(request)
          });
          return NextResponse.json(
            { error: 'Request blocked' },
            { status: 403 }
          );
        }
      }

      return null; // Request is valid
    } catch (error) {
      logger.error('Security validation error', error);
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  }

  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    if (securityConfig.enableCSP) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https: wss: ws:; " +
        "frame-ancestors 'none';"
      );
    }

    // HTTP Strict Transport Security
    if (securityConfig.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Other security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // CORS headers
    if (securityConfig.enableCORS) {
      response.headers.set('Access-Control-Allow-Origin', '*'); // Configure appropriately
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    return forwarded?.split(',')[0] || realIP || 'unknown';
  }

  private static isAllowedOrigin(origin: string): boolean {
    return securityConfig.allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
  }

  private static containsSuspiciousPatterns(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }
}

// Middleware wrapper for API routes
export function withSecurity<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Validate request
    const validationResult = await SecurityMiddleware.validateRequest(request);
    if (validationResult) {
      return SecurityMiddleware.addSecurityHeaders(validationResult);
    }

    try {
      // Call original handler
      const response = await handler(request, ...args);
      
      // Add security headers
      return SecurityMiddleware.addSecurityHeaders(response);
    } catch (error) {
      logger.error('API route error', error);
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return SecurityMiddleware.addSecurityHeaders(errorResponse);
    }
  };
}

// Security monitoring
export class SecurityMonitor {
  private static suspiciousActivityCount = new Map<string, number>();
  private static readonly THREAT_THRESHOLD = 10;
  private static readonly MONITORING_WINDOW = 60 * 1000; // 1 minute

  static reportSuspiciousActivity(ip: string, type: string) {
    const key = `${ip}:${type}`;
    const count = this.suspiciousActivityCount.get(key) || 0;
    this.suspiciousActivityCount.set(key, count + 1);

    if (count >= this.THREAT_THRESHOLD) {
      logger.warn('High threat level detected', { ip, type, count });
      // In production, this could trigger additional security measures
      // such as temporary IP blocking or alerting security team
    }

    // Clean up old entries
    setTimeout(() => {
      this.suspiciousActivityCount.delete(key);
    }, this.MONITORING_WINDOW);
  }

  static getThreatLevel(ip: string): 'low' | 'medium' | 'high' {
    let totalCount = 0;
    for (const [key, count] of this.suspiciousActivityCount.entries()) {
      if (key.startsWith(`${ip}:`)) {
        totalCount += count;
      }
    }

    if (totalCount >= this.THREAT_THRESHOLD * 2) return 'high';
    if (totalCount >= this.THREAT_THRESHOLD) return 'medium';
    return 'low';
  }
}
