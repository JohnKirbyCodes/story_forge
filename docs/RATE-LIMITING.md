# Rate Limiting Implementation Guide

This document covers the rate limiting implementation for StoryForge using the `@vercel/firewall` SDK and Vercel Firewall Dashboard.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [SDK Configuration](#sdk-configuration)
- [Rate Limit IDs](#rate-limit-ids)
- [API Routes with Rate Limiting](#api-routes-with-rate-limiting)
- [Vercel Dashboard Configuration](#vercel-dashboard-configuration)
- [Testing Rate Limits](#testing-rate-limits)

---

## Overview

Rate limiting protects the application from:
- **Brute force attacks** on authentication endpoints
- **Cost abuse** on AI generation endpoints
- **Fraud prevention** on payment endpoints
- **Resource exhaustion** from expensive operations (exports)
- **Spam/scraping** on content endpoints

The implementation uses a two-layer approach:
1. **SDK Layer**: `@vercel/firewall` SDK in API routes for programmatic rate limit checking
2. **Dashboard Layer**: Vercel Firewall Dashboard for configuring thresholds and rules

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client Request                                                 │
│        │                                                         │
│        ▼                                                         │
│   ┌─────────────────────┐                                       │
│   │  Vercel Edge        │  ◄── Dashboard rules evaluated here   │
│   │  (Firewall)         │                                       │
│   └──────────┬──────────┘                                       │
│              │                                                   │
│              ▼                                                   │
│   ┌─────────────────────┐                                       │
│   │  API Route Handler  │                                       │
│   │  ┌───────────────┐  │                                       │
│   │  │ checkRateLimit│  │  ◄── SDK call with rate limit ID      │
│   │  └───────┬───────┘  │                                       │
│   │          │          │                                       │
│   │          ▼          │                                       │
│   │  Rate Limited?      │                                       │
│   │   Yes → 429         │                                       │
│   │   No  → Continue    │                                       │
│   └─────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## SDK Configuration

### Installation

```bash
npm install @vercel/firewall
```

### Core Module

Location: `lib/security/rate-limit.ts`

```typescript
import { unstable_checkRateLimit as checkRateLimit } from "@vercel/firewall";

// Check rate limit
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.AUTH_LOGIN, {
  request,
  rateLimitKey: user.id, // Optional: defaults to IP
});

if (rateLimited) {
  return createRateLimitResponse();
}
```

### Exported Functions

| Function | Description |
|----------|-------------|
| `checkApiRateLimit(id, options)` | Check single rate limit |
| `checkMultipleRateLimits(request, limits)` | Check multiple limits (e.g., per-minute + per-hour) |
| `createRateLimitResponse(retryAfter?)` | Create 429 response with proper headers |
| `withRateLimit(id, handler, getUserId?)` | HOC wrapper for handlers |

---

## Rate Limit IDs

All rate limit IDs must be configured in both the code and Vercel Dashboard.

| ID | Priority | Requests | Window | Use Case |
|----|----------|----------|--------|----------|
| `auth-login` | Critical | 10 | 60s | Login attempts |
| `auth-signup` | Critical | 5 | 60s | Account creation |
| `auth-password-reset` | Critical | 3 | 1 hour | Password reset |
| `stripe-checkout` | Critical | 20 | 60s | Checkout sessions |
| `stripe-portal` | Critical | 20 | 60s | Customer portal |
| `stripe-webhook` | High | 100 | 60s | Webhook events |
| `ai-generate` | High | 10 | 60s | AI generation (per-minute) |
| `ai-generate-hourly` | High | 50 | 1 hour | AI generation (per-hour) |
| `content-write` | Medium | 60 | 60s | Create/update content |
| `content-read` | Medium | 120 | 60s | Read operations |
| `export-operations` | Medium | 5 | 1 hour | File exports |
| `search-query` | Medium | 60 | 60s | Search operations |
| `onboarding` | Low | 30 | 60s | Onboarding flows |

### ID Constants

```typescript
export const RATE_LIMIT_IDS = {
  AUTH_LOGIN: "auth-login",
  AUTH_SIGNUP: "auth-signup",
  AUTH_PASSWORD_RESET: "auth-password-reset",
  STRIPE_CHECKOUT: "stripe-checkout",
  STRIPE_PORTAL: "stripe-portal",
  STRIPE_WEBHOOK: "stripe-webhook",
  AI_GENERATE: "ai-generate",
  AI_GENERATE_HOURLY: "ai-generate-hourly",
  CONTENT_WRITE: "content-write",
  CONTENT_READ: "content-read",
  EXPORT_OPERATIONS: "export-operations",
  SEARCH_QUERY: "search-query",
  ONBOARDING: "onboarding",
} as const;
```

---

## API Routes with Rate Limiting

### Authentication

| Route | Method | Rate Limit ID | Key |
|-------|--------|---------------|-----|
| `/callback` | GET | `auth-login` | IP |

**File**: `app/(auth)/callback/route.ts`

```typescript
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.AUTH_LOGIN, { request });
if (rateLimited) {
  return createRateLimitResponse();
}
```

---

### AI Generation Endpoints

All AI endpoints use **dual rate limiting** (per-minute + per-hour).

| Route | Method | Rate Limit IDs | Key |
|-------|--------|----------------|-----|
| `/api/ai/generate-scene` | POST | `ai-generate`, `ai-generate-hourly` | User ID |
| `/api/ai/generate-outline` | POST | `ai-generate`, `ai-generate-hourly` | User ID |
| `/api/ai/generate-synopsis` | POST | `ai-generate`, `ai-generate-hourly` | User ID |
| `/api/ai/generate-universe` | POST | `ai-generate`, `ai-generate-hourly` | User ID |
| `/api/ai/edit-prose` | POST | `ai-generate`, `ai-generate-hourly` | User ID |

**Files**:
- `app/api/ai/generate-scene/route.ts`
- `app/api/ai/generate-outline/route.ts`
- `app/api/ai/generate-synopsis/route.ts`
- `app/api/ai/generate-universe/route.ts`
- `app/api/ai/edit-prose/route.ts`

```typescript
const rateLimitResult = await checkMultipleRateLimits(request, [
  { id: RATE_LIMIT_IDS.AI_GENERATE, key: user.id },
  { id: RATE_LIMIT_IDS.AI_GENERATE_HOURLY, key: user.id },
]);
if (rateLimitResult.rateLimited) {
  return createRateLimitResponse();
}
```

---

### Payment Endpoints

| Route | Method | Rate Limit ID | Key |
|-------|--------|---------------|-----|
| `/api/stripe/checkout` | POST | `stripe-checkout` | User ID |
| `/api/stripe/portal` | POST | `stripe-portal` | User ID |
| `/api/stripe/webhook` | POST | `stripe-webhook` | IP |

**Files**:
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/portal/route.ts`
- `app/api/stripe/webhook/route.ts`

---

### Content CRUD Endpoints

| Route | Method | Rate Limit ID | Key |
|-------|--------|---------------|-----|
| `/api/projects` | POST | `content-write` | User ID |
| `/api/books` | POST | `content-write` | User ID |
| `/api/story-nodes` | POST | `content-write` | User ID |

**Files**:
- `app/api/projects/route.ts`
- `app/api/books/route.ts`
- `app/api/story-nodes/route.ts`

```typescript
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.CONTENT_WRITE, {
  request,
  rateLimitKey: user.id,
});
if (rateLimited) {
  return createRateLimitResponse();
}
```

---

### Export Endpoints

| Route | Method | Rate Limit ID | Key | Retry After |
|-------|--------|---------------|-----|-------------|
| `/api/export/txt` | GET | `export-operations` | User ID | 1 hour |

**File**: `app/api/export/txt/route.ts`

```typescript
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.EXPORT_OPERATIONS, {
  request,
  rateLimitKey: user.id,
});
if (rateLimited) {
  return createRateLimitResponse(3600); // 1 hour retry
}
```

---

### Onboarding Endpoints

| Route | Method | Rate Limit ID | Key |
|-------|--------|---------------|-----|
| `/api/onboarding/status` | GET | `onboarding` | User ID |
| `/api/onboarding/progress` | POST | `onboarding` | User ID |
| `/api/onboarding/complete` | POST | `onboarding` | User ID |
| `/api/onboarding/skip` | POST | `onboarding` | User ID |
| `/api/onboarding/reset` | POST | `onboarding` | User ID |
| `/api/onboarding/dismiss-banner` | POST | `onboarding` | User ID |
| `/api/onboarding/dismiss-tooltip` | POST | `onboarding` | User ID |

**Files**: `app/api/onboarding/*/route.ts`

```typescript
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.ONBOARDING, {
  request,
  rateLimitKey: user.id,
});
if (rateLimited) {
  return createRateLimitResponse();
}
```

---

### Search & Query Endpoints (Future)

| Route | Method | Rate Limit ID | Key |
|-------|--------|---------------|-----|
| `/api/search` | GET | `search-query` | IP (unauthenticated) or User ID |
| `/api/projects` | GET | `content-read` | User ID |
| `/api/books` | GET | `content-read` | User ID |

```typescript
// For authenticated read operations
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.CONTENT_READ, {
  request,
  rateLimitKey: user.id,
});
if (rateLimited) {
  return createRateLimitResponse();
}

// For search operations
const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.SEARCH_QUERY, {
  request,
  rateLimitKey: user?.id, // Falls back to IP if unauthenticated
});
```

---

## Vercel Dashboard Configuration

### Accessing the Firewall Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Firewall** → **Configure**

### Rule Configuration

Create 13 rules in the following order (priority is determined by rule order):

---

#### Rule 1: Auth Login Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Auth Login Rate Limit |
| **Description** | Protects authentication endpoints. Limits login attempts to protect user accounts from automated password guessing. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/callback` |
| Method | Equals | `GET` |
| @vercel/firewall | with rate limit ID | `auth-login` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 10
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 2: AI Generation Rate Limit (Per-Minute)

| Field | Value |
|-------|-------|
| **Name** | AI Generation Rate Limit |
| **Description** | Limits AI generation requests to prevent API cost abuse. Per-minute limit for burst protection. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/api/ai/` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `ai-generate` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 10
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 3: AI Generation Hourly Limit

| Field | Value |
|-------|-------|
| **Name** | AI Generation Hourly Limit |
| **Description** | Hourly cap on AI generation to control costs and ensure fair usage across users. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/api/ai/` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `ai-generate-hourly` |

**Rate Limit**:
- Type: Fixed Window
- Window: 3600 seconds (1 hour)
- Requests: 50
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 hour

---

#### Rule 4: Stripe Checkout Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Stripe Checkout Rate Limit |
| **Description** | Protects payment checkout flow from abuse and potential fraud attempts. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/stripe/checkout` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `stripe-checkout` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 20
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 5: Stripe Portal Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Stripe Portal Rate Limit |
| **Description** | Limits customer portal session creation to prevent abuse of billing management. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/stripe/portal` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `stripe-portal` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 20
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 6: Stripe Webhook Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Stripe Webhook Rate Limit |
| **Description** | Protects webhook endpoint from DDoS while allowing legitimate Stripe events. Higher limit for legitimate traffic. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/stripe/webhook` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `stripe-webhook` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 100
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 7: Content Write Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Content Write Rate Limit |
| **Description** | Limits content creation (projects, books, story nodes) to prevent spam and database abuse. |

**Conditions**:

First, match ANY of these paths (OR):

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/projects` |
| **OR** Request Path | Equals | `/api/books` |
| **OR** Request Path | Equals | `/api/story-nodes` |

Then AND with:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `content-write` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 60
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 8: Export Operations Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Export Operations Rate Limit |
| **Description** | Limits expensive export operations to prevent server resource exhaustion. Hourly limit for resource-intensive operations. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/api/export/` |
| Method | Equals | `GET` |
| @vercel/firewall | with rate limit ID | `export-operations` |

**Rate Limit**:
- Type: Fixed Window
- Window: 3600 seconds (1 hour)
- Requests: 5
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 hour

---

#### Rule 9: Auth Signup Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Auth Signup Rate Limit |
| **Description** | Prevents automated account creation and signup abuse. Stricter than login to prevent spam accounts. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/auth/signup` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `auth-signup` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 5
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 5 minutes

---

#### Rule 10: Auth Password Reset Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Auth Password Reset Rate Limit |
| **Description** | Prevents account enumeration and email bombing attacks on password reset functionality. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/auth/forgot-password` |
| Method | Equals | `POST` |
| @vercel/firewall | with rate limit ID | `auth-password-reset` |

**Rate Limit**:
- Type: Fixed Window
- Window: 3600 seconds (1 hour)
- Requests: 3
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 hour

---

#### Rule 11: Content Read Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Content Read Rate Limit |
| **Description** | Limits read operations to prevent database overload and content scraping. |

**Conditions**:

First, match ANY of these paths (OR):

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Equals | `/api/projects` |
| **OR** Request Path | Equals | `/api/books` |
| **OR** Request Path | Starts with | `/api/projects/` |
| **OR** Request Path | Starts with | `/api/books/` |

Then AND with:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Method | Equals | `GET` |
| @vercel/firewall | with rate limit ID | `content-read` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 120
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 12: Search Query Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Search Query Rate Limit |
| **Description** | Protects search endpoints from abuse and database overload from complex queries. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/api/search` |
| Method | Equals | `GET` |
| @vercel/firewall | with rate limit ID | `search-query` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 60
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

#### Rule 13: Onboarding Rate Limit

| Field | Value |
|-------|-------|
| **Name** | Onboarding Rate Limit |
| **Description** | Limits onboarding API calls for general protection. Lower priority, higher threshold. |

**Conditions (AND)**:

| Parameter | Operator | Value |
|-----------|----------|-------|
| Request Path | Starts with | `/api/onboarding/` |
| @vercel/firewall | with rate limit ID | `onboarding` |

**Rate Limit**:
- Type: Fixed Window
- Window: 60 seconds
- Requests: 30
- Keys: 1 (API controlled)

**Action**: Too Many Requests (429) for 1 minute

---

## Testing Rate Limits

### Local Development

Rate limits are only enforced in production on Vercel. For local testing:

1. Deploy to a preview environment
2. Use curl to test rate limits:

```bash
# Test auth rate limit
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://your-preview.vercel.app/callback
done

# Test AI endpoint (requires auth)
for i in {1..12}; do
  curl -X POST -s -o /dev/null -w "%{http_code}\n" \
    -H "Cookie: your-auth-cookie" \
    -H "Content-Type: application/json" \
    -d '{"bookId": "test"}' \
    https://your-preview.vercel.app/api/ai/generate-scene
done
```

### Verifying Configuration

1. Check Vercel Firewall logs in the dashboard
2. Monitor for `rate_limit_exceeded` errors in application logs
3. Verify `Retry-After` headers in 429 responses

### Common Issues

| Issue | Solution |
|-------|----------|
| Rate limit not triggering | Verify Rate Limit ID matches exactly between code and dashboard |
| 429 on first request | Check if rule conditions are too broad |
| Rate limit not found error | Ensure rule is enabled in Vercel Dashboard |

---

## Summary

### Files Modified

| File | Changes |
|------|---------|
| `lib/security/rate-limit.ts` | Core rate limiting module (new) |
| `app/(auth)/callback/route.ts` | Added auth-login rate limit |
| `app/api/ai/generate-scene/route.ts` | Added dual rate limits |
| `app/api/ai/generate-outline/route.ts` | Added dual rate limits |
| `app/api/ai/generate-synopsis/route.ts` | Added dual rate limits |
| `app/api/ai/generate-universe/route.ts` | Added dual rate limits |
| `app/api/ai/edit-prose/route.ts` | Added dual rate limits |
| `app/api/stripe/checkout/route.ts` | Added stripe-checkout rate limit |
| `app/api/stripe/portal/route.ts` | Added stripe-portal rate limit |
| `app/api/stripe/webhook/route.ts` | Added stripe-webhook rate limit |
| `app/api/projects/route.ts` | Added content-write rate limit |
| `app/api/books/route.ts` | Added content-write rate limit |
| `app/api/story-nodes/route.ts` | Added content-write rate limit |
| `app/api/export/txt/route.ts` | Added export-operations rate limit |
| `app/api/onboarding/*/route.ts` | Added onboarding rate limit (7 routes) |

### Vercel Dashboard Rules Summary

| # | Rule Name | Rate Limit ID | Requests | Window |
|---|-----------|---------------|----------|--------|
| 1 | Auth Login | `auth-login` | 10 | 60s |
| 2 | AI Generation (Per-Minute) | `ai-generate` | 10 | 60s |
| 3 | AI Generation (Hourly) | `ai-generate-hourly` | 50 | 1 hour |
| 4 | Stripe Checkout | `stripe-checkout` | 20 | 60s |
| 5 | Stripe Portal | `stripe-portal` | 20 | 60s |
| 6 | Stripe Webhook | `stripe-webhook` | 100 | 60s |
| 7 | Content Write | `content-write` | 60 | 60s |
| 8 | Export Operations | `export-operations` | 5 | 1 hour |
| 9 | Auth Signup | `auth-signup` | 5 | 60s |
| 10 | Auth Password Reset | `auth-password-reset` | 3 | 1 hour |
| 11 | Content Read | `content-read` | 120 | 60s |
| 12 | Search Query | `search-query` | 60 | 60s |
| 13 | Onboarding | `onboarding` | 30 | 60s |

### Dependencies

```json
{
  "@vercel/firewall": "^1.1.2"
}
```
