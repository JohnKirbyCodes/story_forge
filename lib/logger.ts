/**
 * Production-safe structured logger.
 *
 * In development: logs all levels with full details
 * In production: only logs warnings and errors, sanitizes sensitive data
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === "development";

// Patterns to detect and redact sensitive data
const SENSITIVE_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]+/g, // Anthropic API keys
  /sk-[a-zA-Z0-9_-]{20,}/g, // OpenAI API keys
  /AIza[a-zA-Z0-9_-]+/g, // Google API keys
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+/g, // JWT tokens
  /Bearer\s+[a-zA-Z0-9_-]+/gi, // Bearer tokens
  /password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, // Password patterns
  /secret["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, // Secret patterns
];

// Fields to always redact
const SENSITIVE_FIELDS = new Set([
  "password",
  "apikey",
  "api_key",
  "apiKey",
  "secret",
  "token",
  "authorization",
  "cookie",
  "session",
  "credential",
  "private_key",
  "privateKey",
]);

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    let redacted = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, "[REDACTED]");
    }
    return redacted;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactValue(val);
      }
    }
    return result;
  }

  return value;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (!context || Object.keys(context).length === 0) {
    return `${prefix} ${message}`;
  }

  // In production, redact sensitive data
  const safeContext = isDevelopment ? context : redactValue(context);
  return `${prefix} ${message} ${JSON.stringify(safeContext)}`;
}

function shouldLog(level: LogLevel): boolean {
  if (isDevelopment) return true;

  // In production, only log warnings and errors
  return level === "warn" || level === "error";
}

export const logger = {
  /**
   * Debug level - only shown in development
   */
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  /**
   * Info level - only shown in development
   */
  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, context));
    }
  },

  /**
   * Warning level - always shown, data redacted in production
   */
  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, context));
    }
  },

  /**
   * Error level - always shown, data redacted in production
   * Does NOT log the error stack in production to avoid leaking internals
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog("error")) return;

    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      // Only include stack trace in development
      if (isDevelopment) {
        errorContext.stack = error.stack;
      }
    } else if (error) {
      errorContext.error = isDevelopment ? error : "[Error object redacted]";
    }

    console.error(formatMessage("error", message, errorContext));
  },

  /**
   * Log AI usage metrics - info level with structured data
   */
  aiUsage(data: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
    endpoint: string;
  }): void {
    this.info("AI usage", {
      provider: data.provider,
      model: data.model,
      tokens: { input: data.inputTokens, output: data.outputTokens },
      durationMs: data.durationMs,
      endpoint: data.endpoint,
    });
  },

  /**
   * Log successful operations - debug level
   */
  success(operation: string, context?: LogContext): void {
    this.debug(`${operation} completed`, context);
  },
};

export default logger;
