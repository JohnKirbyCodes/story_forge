/**
 * Rate Limiting Configuration using @vercel/firewall SDK
 *
 * This module provides rate limiting for API endpoints using Vercel's
 * firewall SDK. Rate limits are enforced at the edge for optimal performance.
 *
 * IMPORTANT: Each rate limit ID must be configured in the Vercel Dashboard:
 * 1. Go to Project Settings > Firewall > Configure
 * 2. Create a new rule with condition: @vercel/firewall
 * 3. Set the Rate Limit ID to match the IDs defined here
 * 4. Configure the rate limit threshold and window in the dashboard
 *
 * Recommended Vercel Dashboard Configuration:
 * ┌─────────────────────────┬────────────────┬────────────────┬──────────┐
 * │ Rate Limit ID           │ Requests/min   │ Window         │ Priority │
 * ├─────────────────────────┼────────────────┼────────────────┼──────────┤
 * │ auth-login              │ 10             │ 60s            │ Critical │
 * │ auth-signup             │ 5              │ 60s            │ Critical │
 * │ auth-password-reset     │ 3              │ 3600s (1hr)    │ Critical │
 * │ stripe-checkout         │ 20             │ 60s            │ Critical │
 * │ stripe-portal           │ 20             │ 60s            │ Critical │
 * │ stripe-webhook          │ 100            │ 60s            │ High     │
 * │ ai-generate             │ 10             │ 60s            │ High     │
 * │ ai-generate-hourly      │ 50             │ 3600s (1hr)    │ High     │
 * │ content-write           │ 60             │ 60s            │ Medium   │
 * │ content-read            │ 120            │ 60s            │ Medium   │
 * │ export-operations       │ 5              │ 3600s (1hr)    │ Medium   │
 * │ search-query            │ 60             │ 60s            │ Medium   │
 * │ onboarding              │ 30             │ 60s            │ Low      │
 * └─────────────────────────┴────────────────┴────────────────┴──────────┘
 */

import { unstable_checkRateLimit as checkRateLimit } from "@vercel/firewall";
import { logger } from "@/lib/logger";

/**
 * Rate limit IDs - must match Vercel Dashboard configuration
 */
export const RATE_LIMIT_IDS = {
  // Authentication (Critical - prevent brute force)
  AUTH_LOGIN: "auth-login",
  AUTH_SIGNUP: "auth-signup",
  AUTH_PASSWORD_RESET: "auth-password-reset",

  // Payment (Critical - prevent fraud)
  STRIPE_CHECKOUT: "stripe-checkout",
  STRIPE_PORTAL: "stripe-portal",
  STRIPE_WEBHOOK: "stripe-webhook",

  // AI Generation (High - prevent cost abuse)
  AI_GENERATE: "ai-generate",
  AI_GENERATE_HOURLY: "ai-generate-hourly",

  // Content Operations (Medium - prevent spam/scraping)
  CONTENT_WRITE: "content-write",
  CONTENT_READ: "content-read",

  // Export (Medium - prevent resource exhaustion)
  EXPORT_OPERATIONS: "export-operations",

  // Search (Medium - prevent database overload)
  SEARCH_QUERY: "search-query",

  // Onboarding (Low - general protection)
  ONBOARDING: "onboarding",
} as const;

export type RateLimitId = (typeof RATE_LIMIT_IDS)[keyof typeof RATE_LIMIT_IDS];

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  rateLimited: boolean;
  error?: "not-found" | "blocked";
}

/**
 * Options for rate limit checking
 */
export interface RateLimitOptions {
  /** The incoming request object */
  request: Request;
  /** Custom key for rate limiting (e.g., user ID, org ID). Defaults to IP. */
  rateLimitKey?: string;
}

/**
 * Check if a request should be rate limited.
 *
 * @param rateLimitId - The rate limit rule ID (must be configured in Vercel Dashboard)
 * @param options - Rate limit options including request and optional custom key
 * @returns Promise resolving to rate limit result
 *
 * @example
 * ```ts
 * // Basic IP-based rate limiting
 * const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.AUTH_LOGIN, { request });
 * if (rateLimited) {
 *   return new Response("Too many requests", { status: 429 });
 * }
 *
 * // User-based rate limiting
 * const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.AI_GENERATE, {
 *   request,
 *   rateLimitKey: user.id
 * });
 * ```
 */
export async function checkApiRateLimit(
  rateLimitId: RateLimitId,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const result = await checkRateLimit(rateLimitId, {
      request: options.request,
      rateLimitKey: options.rateLimitKey,
    });

    if (result.rateLimited) {
      logger.warn("Rate limit exceeded", {
        rateLimitId,
        rateLimitKey: options.rateLimitKey || "ip",
      });
    }

    if (result.error === "not-found") {
      logger.error("Rate limit rule not found in Vercel Dashboard", null, {
        rateLimitId,
      });
    }

    return result;
  } catch (error) {
    // Log error but don't block the request if rate limiting fails
    logger.error("Rate limit check failed", error, { rateLimitId });
    return { rateLimited: false };
  }
}

/**
 * Create a rate-limited Response with proper headers
 */
export function createRateLimitResponse(retryAfterSeconds: number = 60): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Higher-order function to wrap an API handler with rate limiting.
 * Applies rate limiting before executing the handler.
 *
 * @param rateLimitId - The rate limit rule ID
 * @param handler - The API handler function
 * @param getUserId - Optional function to extract user ID for user-based limiting
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(
 *   RATE_LIMIT_IDS.AI_GENERATE,
 *   async (request: Request) => {
 *     // Your handler logic
 *   },
 *   async (request) => {
 *     const user = await getUser(request);
 *     return user?.id;
 *   }
 * );
 * ```
 */
export function withRateLimit(
  rateLimitId: RateLimitId,
  handler: (request: Request) => Promise<Response>,
  getUserId?: (request: Request) => Promise<string | undefined>
) {
  return async (request: Request): Promise<Response> => {
    // Get optional user ID for user-based rate limiting
    const userId = getUserId ? await getUserId(request) : undefined;

    const { rateLimited, error } = await checkApiRateLimit(rateLimitId, {
      request,
      rateLimitKey: userId,
    });

    if (rateLimited) {
      return createRateLimitResponse();
    }

    if (error === "blocked") {
      return new Response(
        JSON.stringify({ error: "blocked", message: "Request blocked by firewall" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(request);
  };
}

/**
 * Apply multiple rate limits to a request.
 * Useful for applying both per-minute and per-hour limits.
 *
 * @example
 * ```ts
 * const result = await checkMultipleRateLimits(request, [
 *   { id: RATE_LIMIT_IDS.AI_GENERATE, key: userId },
 *   { id: RATE_LIMIT_IDS.AI_GENERATE_HOURLY, key: userId },
 * ]);
 *
 * if (result.rateLimited) {
 *   return createRateLimitResponse();
 * }
 * ```
 */
export async function checkMultipleRateLimits(
  request: Request,
  limits: Array<{ id: RateLimitId; key?: string }>
): Promise<RateLimitResult> {
  for (const limit of limits) {
    const result = await checkApiRateLimit(limit.id, {
      request,
      rateLimitKey: limit.key,
    });

    if (result.rateLimited || result.error === "blocked") {
      return result;
    }
  }

  return { rateLimited: false };
}
