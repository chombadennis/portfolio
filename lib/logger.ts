/**
 * Enhanced logging utility with different levels and contexts
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private currentLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.currentLevel = level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // This would typically get the user ID from your auth system
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return undefined;
      const user = JSON.parse(raw) as { id?: string } | null;
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send critical errors to external service in production
    if (
      entry.level === LogLevel.ERROR &&
      process.env.NODE_ENV === "production"
    ) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // In a real application, you would send this to a logging service
      // like Sentry, LogRocket, DataDog, etc.
      console.warn("Critical error logged:", entry);

      // Example: Send to external logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error("Failed to send log to external service:", error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.addLog(entry);
      console.debug(`[DEBUG] ${message}`, context ?? {});
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.addLog(entry);
      console.info(`[INFO] ${message}`, context ?? {});
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      this.addLog(entry);
      console.warn(`[WARN] ${message}`, context ?? {});
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context);
      this.addLog(entry);
      console.error(`[ERROR] ${message}`, context ?? {});
    }
  }

  /**
   * Log API request/response for debugging
   */
  apiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    context?: Record<string, unknown>
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;

    if (this.shouldLog(level)) {
      const entry = this.createLogEntry(level, message, {
        method,
        url,
        status,
        duration,
        ...(context ?? {}),
      });
      this.addLog(entry);

      if (level === LogLevel.ERROR) {
        console.error(`[API ERROR] ${message}`, context ?? {});
      } else {
        // Use console.log for non-error API logs to avoid noisy error stream
        console.log(`[API] ${message}`, context ?? {});
      }
    }
  }

  /**
   * Log user actions for analytics
   */
  userAction(action: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      `User action: ${action}`,
      context
    );
    this.addLog(entry);

    // In a real app, you might send this to analytics
    console.log(`[USER ACTION] ${action}`, context ?? {});
  }

  /**
   * Log performance metrics
   */
  performance(
    metric: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    const message = `Performance: ${metric} = ${value}ms`;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, {
      metric,
      value,
      ...(context ?? {}),
    });
    this.addLog(entry);
    console.log(`[PERFORMANCE] ${message}`, context ?? {});
  }

  /**
   * Get all logs for debugging
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level);
    }
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Set logging level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create global logger instance
const logger = new Logger(
  process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO
);

// Add global error handlers (guard window for SSR safety)
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logger.error("Global error caught", {
      message: (event.error as Error | undefined)?.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: (event.error as Error | undefined)?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason:
        typeof event.reason === "object" && event.reason !== null
          ? // try to extract message if it's an Error-like object
            (event.reason as { message?: string }).message ?? event.reason
          : event.reason,
    });
  });

  // Performance observer for monitoring
  if ("PerformanceObserver" in window) {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          entry.entryType === "navigation" &&
          "loadEventEnd" in entry &&
          "loadEventStart" in entry
        ) {
          const navEntry = entry as PerformanceNavigationTiming;
          logger.performance(
            "Page Load",
            navEntry.loadEventEnd - navEntry.loadEventStart
          );
        }
      }
    });

    try {
      perfObserver.observe({ entryTypes: ["navigation"] });
    } catch (error) {
      console.warn("Performance observer not supported:", error);
    }
  }
}

export { logger, LogLevel };
export type { LogEntry };
