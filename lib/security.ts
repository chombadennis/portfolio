/**
 * Client-side security utilities
 * Note: These provide basic protection but should be complemented with server-side validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number format (basic international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if URL is safe (prevent open redirect attacks)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate a secure random string for CSRF tokens, etc.
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Hash sensitive data (client-side only for non-critical use cases)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate form data against common injection patterns
 */
export function validateFormData(data: Record<string, unknown>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Check for SQL injection patterns
      const sqlInjectionPattern =
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;
      if (sqlInjectionPattern.test(value)) {
        errors.push(`${key} contains potentially malicious content`);
      }

      // Check for script injection
      const scriptPattern =
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      if (scriptPattern.test(value)) {
        errors.push(`${key} contains script tags`);
      }

      // Check for excessive length
      if (value.length > 10000) {
        errors.push(`${key} exceeds maximum length`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Content Security Policy helper
 */
export function generateCSPNonce(): string {
  return generateSecureRandomString(16);
}

/**
 * Detect potential bot behavior (basic heuristics)
 */
export function detectBotBehavior(): boolean {
  // Check for common bot indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = ["bot", "crawler", "spider", "scraper"];

  if (botPatterns.some((pattern) => userAgent.includes(pattern))) {
    return true;
  }

  // Check for suspicious timing (too fast form submission)
  const now = Date.now();
  const pageLoadTime = performance.timing.loadEventEnd;
  if (now - pageLoadTime < 2000) {
    // Less than 2 seconds
    return true;
  }

  return false;
}

/**
 * Secure session storage helper
 */
export class SecureStorage {
  private static encrypt(data: string, key: string): string {
    // Simple XOR encryption (for demo purposes - use proper encryption in production)
    let encrypted = "";
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  private static decrypt(encryptedData: string, key: string): string {
    try {
      const encrypted = atob(encryptedData);
      let decrypted = "";
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch {
      return "";
    }
  }

  static setItem(key: string, value: unknown, encryptionKey?: string): void {
    try {
      const stringValue = JSON.stringify(value);
      const finalValue = encryptionKey
        ? this.encrypt(stringValue, encryptionKey)
        : stringValue;
      localStorage.setItem(key, finalValue);
    } catch (error) {
      console.error("Failed to store item securely:", error);
    }
  }

  static getItem(key: string, encryptionKey?: string): unknown | null {
    try {
      const storedValue = localStorage.getItem(key);
      if (!storedValue) return null;

      const finalValue = encryptionKey
        ? this.decrypt(storedValue, encryptionKey)
        : storedValue;
      return JSON.parse(finalValue);
    } catch (error) {
      console.error("Failed to retrieve item securely:", error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
