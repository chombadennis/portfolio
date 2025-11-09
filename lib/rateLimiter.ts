/**
 * Client-side rate limiter for form submissions and API calls
 * This provides basic protection, but real rate limiting should be implemented server-side
 */

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = {
      keyGenerator: (id: string) => id,
      ...config,
    };
  }

  /**
   * Check if an action is allowed for the given identifier
   */
  isAllowed(identifier: string): boolean {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const entry = this.limits.get(key);

    // Clean up expired entries
    this.cleanup();

    if (!entry) {
      // First attempt
      this.limits.set(key, {
        attempts: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.limits.set(key, {
        attempts: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.attempts >= this.config.maxAttempts) {
      return false;
    }

    // Increment attempts
    entry.attempts += 1;
    return true;
  }

  /**
   * Get remaining attempts for identifier
   */
  getRemainingAttempts(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - entry.attempts);
  }

  /**
   * Get time until reset for identifier
   */
  getResetTime(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }

    return entry.resetTime - Date.now();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Reset limits for identifier
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    this.limits.delete(key);
  }
}

// Pre-configured rate limiters for common use cases
export const emailRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (email: string) => `email:${email}`,
});

export const formSubmissionRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (ip: string) => `form:${ip}`,
});

export const apiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (endpoint: string) => `api:${endpoint}`,
});

export { RateLimiter };
export type { RateLimiterConfig };