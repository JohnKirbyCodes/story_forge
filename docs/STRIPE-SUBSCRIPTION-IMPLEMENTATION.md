# Stripe Subscription Implementation

> **Last Updated:** February 2026
> **Status:** Production Ready

This document provides comprehensive documentation for the NovelWorld subscription billing system, including Stripe integration, database schema, API endpoints, webhook handling, and UI components.

---

## Table of Contents

1. [Overview](#overview)
2. [Pricing Structure](#pricing-structure)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Environment Configuration](#environment-configuration)
6. [Stripe Dashboard Setup](#stripe-dashboard-setup)
7. [API Endpoints](#api-endpoints)
8. [Webhook Handling](#webhook-handling)
9. [UI Components](#ui-components)
10. [Subscription Flow](#subscription-flow)
11. [Testing Guide](#testing-guide)
12. [Troubleshooting](#troubleshooting)

---

## Overview

NovelWorld uses a **BYOK (Bring Your Own Key)** pricing model where users provide their own AI provider API keys. The subscription fee covers platform features, not AI usage. This significantly reduces operational costs and allows for competitive pricing.

### Key Features

- **Two billing cycles**: Monthly and Annual with savings incentive
- **Stripe Checkout**: Secure, hosted checkout experience
- **Stripe Customer Portal**: Self-service billing management
- **Webhook Integration**: Real-time subscription state synchronization
- **Rate Limiting**: Fraud prevention on checkout and webhook endpoints

---

## Pricing Structure

### Subscription Tiers

| Tier | Monthly Price | Annual Price | Annual Equivalent | Annual Savings |
|------|---------------|--------------|-------------------|----------------|
| **Free** | $0 | N/A | N/A | N/A |
| **Pro** | $7/month | $60/year | $5/month | $24/year |

### Feature Comparison

| Feature | Free | Pro |
|---------|------|-----|
| Projects (Series) | 1 | Unlimited |
| Books per Project | 1 | Unlimited |
| Story Elements (Nodes) | 15 | Unlimited |
| Export Formats | TXT | TXT |
| AI Generation | BYOK | BYOK |
| Priority Support | No | Yes |

> **Note:** DOCX and EPUB export are on the roadmap but not yet implemented. Currently only TXT export is available for all tiers.

### Configuration Location

```typescript
// lib/subscription/config.ts

export type SubscriptionTier = 'free' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export const TIER_PRICING = {
  free: 0,
  pro: {
    monthly: 7,        // $7/month billed monthly
    annual: 60,        // $60/year billed annually
    annualMonthly: 5,  // $5/month equivalent when billed annually
    annualSavings: 24, // Save $24/year vs monthly ($84 - $60)
  },
};

export const SUBSCRIPTION_TIERS = {
  free: {
    maxProjects: 1,
    maxBooksPerProject: 1,
    maxStoryNodes: 15,
    exportFormats: ['txt'],
  },
  pro: {
    maxProjects: null,      // unlimited
    maxBooksPerProject: null,
    maxStoryNodes: null,
    exportFormats: ['txt'],  // DOCX/EPUB on roadmap
  },
};
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ PricingSection  │  │ BillingSettings │  │  Landing Page  │  │
│  │ (Billing Toggle)│  │ (Plan Display)  │  │  (#pricing)    │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
│           │                    │                    │           │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ /api/stripe/    │  │ /api/stripe/    │  │ /api/stripe/   │  │
│  │ checkout        │  │ portal          │  │ webhook        │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stripe API                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Checkout        │  │ Customer        │  │ Webhook        │  │
│  │ Sessions        │  │ Portal          │  │ Events         │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Database                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    profiles table                        │   │
│  │  - subscription_tier (free | pro)                       │   │
│  │  - subscription_status (active | canceled | past_due)   │   │
│  │  - billing_cycle (monthly | annual)                     │   │
│  │  - stripe_customer_id                                   │   │
│  │  - stripe_subscription_id                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Checkout Flow**: User clicks upgrade → Frontend calls `/api/stripe/checkout` with billing cycle → Stripe checkout session created → User redirected to Stripe → Payment completed → Webhook updates database
2. **Portal Flow**: User clicks manage billing → Frontend calls `/api/stripe/portal` → Redirect to Stripe Customer Portal → User manages subscription → Webhook updates database
3. **Webhook Flow**: Stripe sends events → `/api/stripe/webhook` validates signature → Updates profile in Supabase

---

## Database Schema

### Profiles Table - Billing Columns

```sql
-- Subscription columns in profiles table
subscription_tier        TEXT DEFAULT 'free'      -- 'free' or 'pro'
subscription_status      TEXT                     -- 'active', 'trialing', 'canceled', 'past_due'
billing_cycle            TEXT DEFAULT 'monthly'   -- 'monthly' or 'annual'
stripe_customer_id       TEXT                     -- Stripe customer ID (cus_xxx)
stripe_subscription_id   TEXT                     -- Stripe subscription ID (sub_xxx)
subscription_period_end  TIMESTAMPTZ              -- When current period ends
billing_period_start     DATE                     -- Start of billing period
billing_period_end       DATE                     -- End of billing period
words_quota              INTEGER DEFAULT 10000    -- Monthly word quota (legacy)
words_used_this_month    INTEGER DEFAULT 0        -- Words used this period
```

### Migration Files

| Migration | Description |
|-----------|-------------|
| `20240125000007_billing_period_tracking.sql` | Core billing schema and functions |
| `20260131000001_add_billing_cycle.sql` | Adds billing_cycle column |
| `20260131000002_add_marketing_opt_in.sql` | Marketing preferences |

### Database Functions

```sql
-- Reset monthly word usage
CREATE FUNCTION reset_monthly_word_usage(user_id UUID)

-- Check and reset billing period if expired
CREATE FUNCTION check_and_reset_billing_period(user_id UUID)

-- Atomically increment word usage
CREATE FUNCTION increment_word_usage(user_id UUID, word_count INTEGER)
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...           # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...         # From Stripe webhook settings
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # or pk_test_...

# Price IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...  # $7/month price
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID=price_...   # $60/year price

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For redirect URLs
```

### Environment Variable Sources

| Variable | Where to Find |
|----------|---------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe Dashboard → Products → Price ID |
| `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID` | Stripe Dashboard → Products → Price ID |

---

## Stripe Dashboard Setup

### Step 1: Create the Product

1. Go to **Stripe Dashboard** → **Products**
2. Click **+ Add Product**
3. Configure:
   - **Name**: NovelWorld Pro
   - **Description**: Unlimited projects, books, and story elements for serious writers
   - **Image**: Upload product image (optional)

### Step 2: Create Price IDs

Create two prices for the product:

#### Monthly Price ($7/month)
1. In the product, click **+ Add price**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: $7.00
   - **Billing period**: Monthly
   - **Price ID**: Copy this → `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID`

#### Annual Price ($60/year)
1. Click **+ Add price**
2. Configure:
   - **Pricing model**: Standard pricing
   - **Price**: $60.00
   - **Billing period**: Yearly
   - **Price ID**: Copy this → `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID`

### Step 3: Configure Webhook

1. Go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Step 4: Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable features:
   - Update payment method
   - View invoices
   - Cancel subscription
   - Switch plans (if desired)
3. Save changes

---

## API Endpoints

### POST /api/stripe/checkout

Creates a Stripe Checkout session for subscription.

**Request:**
```typescript
POST /api/stripe/checkout
Content-Type: application/json

{
  "billingCycle": "monthly" | "annual"
}
```

**Response:**
```typescript
{
  "url": "https://checkout.stripe.com/c/pay/..."  // Redirect URL
}
```

**Error Responses:**
```typescript
// 401 - Not authenticated
{ "error": "Unauthorized" }

// 429 - Rate limited
{ "error": "Too many requests" }

// 500 - Missing configuration
{ "error": "Stripe price not configured for monthly billing" }
```

**Implementation Details:**
- Creates Stripe customer if not exists
- Stores `stripe_customer_id` in profile
- Attaches `supabase_user_id` and `billing_cycle` to subscription metadata
- Rate limited per user

### POST /api/stripe/portal

Creates a Stripe Customer Portal session.

**Request:**
```typescript
POST /api/stripe/portal
```

**Response:**
```typescript
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Note:** Requires existing `stripe_customer_id` on profile.

### POST /api/stripe/webhook

Handles Stripe webhook events. Called by Stripe, not the frontend.

**Headers Required:**
```
stripe-signature: t=...,v1=...,v0=...
```

**Events Handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set tier to `pro`, store customer/subscription IDs |
| `customer.subscription.updated` | Update tier and status based on subscription state |
| `customer.subscription.deleted` | Set tier to `free`, status to `canceled` |
| `invoice.payment_succeeded` | Log success (billing period reset handled separately) |
| `invoice.payment_failed` | Set status to `past_due` |

---

## Webhook Handling

### Event: checkout.session.completed

Triggered when a user completes checkout.

```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const userId = subscription.metadata.supabase_user_id;

  await supabase.from("profiles").update({
    subscription_tier: "pro",
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
  }).eq("id", userId);
}
```

### Event: customer.subscription.updated

Triggered on subscription status changes.

```typescript
case "customer.subscription.updated": {
  const subscription = event.data.object as Stripe.Subscription;
  const isActive = ["active", "trialing"].includes(subscription.status);

  await supabase.from("profiles").update({
    subscription_tier: isActive ? "pro" : "free",
    subscription_status: subscription.status,
  }).eq("id", subscription.metadata.supabase_user_id);
}
```

### Event: customer.subscription.deleted

Triggered when subscription is canceled.

```typescript
case "customer.subscription.deleted": {
  await supabase.from("profiles").update({
    subscription_tier: "free",
    subscription_status: "canceled",
  }).eq("id", subscription.metadata.supabase_user_id);
}
```

### Security

- **Signature Verification**: All webhooks verified using `stripe.webhooks.constructEvent()`
- **Rate Limiting**: Webhook endpoint rate limited by IP
- **Admin Client**: Uses Supabase admin client to bypass RLS

---

## UI Components

### PricingSection Component

**Location:** `components/shared/pricing-section.tsx`

Client component for landing page with billing cycle toggle.

```tsx
import { PricingSection } from "@/components/shared/pricing-section";

// Usage in page
<PricingSection />
```

**Features:**
- Monthly/Annual toggle with "Save $24" badge
- Dynamic price display based on selection
- Links to signup page

### BillingSettings Component

**Location:** `components/dashboard/billing-settings.tsx`

Dashboard component for billing management.

```tsx
import { BillingSettings } from "@/components/dashboard/billing-settings";

// Usage in dashboard
<BillingSettings profile={profile} />
```

**Features:**
- Current plan display with billing cycle badge
- Monthly/Annual toggle for free users
- Plan comparison cards
- Upgrade button with dynamic pricing
- Manage Billing button for Pro users
- Success/cancel message handling
- BYOK explanation card

### Key Props

```typescript
interface BillingSettingsProps {
  profile: Profile | null;  // User profile with subscription data
}
```

### State Management

```typescript
const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("annual");
const isPro = profile?.subscription_tier === "pro";
const currentBillingCycle = profile?.billing_cycle || "monthly";
```

---

## Subscription Flow

### New User Upgrade Flow

```
1. User on Free tier visits Billing Settings
2. User toggles to desired billing cycle (default: Annual)
3. User clicks "Upgrade to Pro - $60/year"
4. Frontend POSTs to /api/stripe/checkout with { billingCycle: "annual" }
5. API creates Stripe customer (if needed)
6. API creates checkout session with price ID and metadata
7. User redirected to Stripe Checkout
8. User completes payment
9. Stripe sends checkout.session.completed webhook
10. Webhook updates profile: tier=pro, stores IDs
11. User redirected to /dashboard/settings/billing?success=true
12. UI shows success message
```

### Existing Pro User Management Flow

```
1. Pro user visits Billing Settings
2. User clicks "Manage Billing"
3. Redirected to Stripe Customer Portal
4. User can:
   - Update payment method
   - View invoice history
   - Cancel subscription
   - Switch between monthly/annual (if configured)
5. Changes trigger appropriate webhook events
6. Profile updated accordingly
```

### Cancellation Flow

```
1. Pro user accesses Stripe Customer Portal
2. User clicks Cancel Subscription
3. Stripe sends customer.subscription.deleted event
4. Webhook sets tier=free, status=canceled
5. User retains access until period end (if applicable)
```

---

## Testing Guide

### Test Mode Setup

1. Use Stripe **test mode** API keys
2. Create test products/prices in test mode
3. Set environment variables with test keys

### Test Card Numbers

| Scenario | Card Number |
|----------|-------------|
| Successful payment | 4242 4242 4242 4242 |
| Card declined | 4000 0000 0000 0002 |
| Requires authentication | 4000 0025 0000 3155 |
| Insufficient funds | 4000 0000 0000 9995 |

### Testing Webhooks Locally

**Option 1: Stripe CLI**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Note the webhook signing secret and use in .env.local
```

**Option 2: ngrok**
```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Add ngrok URL to Stripe webhook settings
```

### Test Scenarios

1. **Monthly Subscription**
   - Select Monthly, complete checkout
   - Verify profile updated with `billing_cycle: "monthly"`

2. **Annual Subscription**
   - Select Annual, complete checkout
   - Verify profile updated with `billing_cycle: "annual"`

3. **Payment Failure**
   - Use declining card
   - Verify appropriate error shown
   - No profile changes

4. **Cancellation**
   - Complete subscription
   - Cancel via Customer Portal
   - Verify tier reverts to free

5. **Plan Switch** (if enabled)
   - Switch monthly to annual
   - Verify billing_cycle updated

---

## Troubleshooting

### Common Issues

#### "Stripe price not configured" Error
**Cause:** Missing environment variable for price ID
**Solution:** Ensure both price IDs are set:
```bash
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID=price_...
```

#### Webhook Events Not Received
**Causes:**
- Webhook endpoint URL incorrect
- Webhook not configured for required events
- Signature verification failing

**Solutions:**
1. Verify endpoint URL matches your deployment
2. Check all events are selected in Stripe
3. Confirm `STRIPE_WEBHOOK_SECRET` matches

#### User Upgraded But Still Shows Free
**Causes:**
- Webhook failed to process
- User ID not in subscription metadata
- Database update failed

**Solutions:**
1. Check webhook logs in Stripe Dashboard
2. Verify `supabase_user_id` in subscription metadata
3. Check Supabase logs for errors

#### "Customer not found" Error
**Cause:** User doesn't have `stripe_customer_id`
**Solution:** Customer is created during checkout. For portal, ensure user completed checkout first.

### Debug Logging

Enable detailed logging:
```typescript
// In webhook handler
logger.info("Webhook event received", {
  type: event.type,
  data: event.data.object
});
```

### Stripe Dashboard Debugging

1. **Events**: Developers → Events → Filter by type
2. **Webhooks**: Developers → Webhooks → View attempts
3. **Customers**: Search by email to see subscription state
4. **Subscriptions**: View status, metadata, and event history

---

## File Reference

### Core Files

| File | Purpose |
|------|---------|
| `lib/stripe/index.ts` | Stripe SDK initialization |
| `lib/subscription/config.ts` | Tier and pricing configuration |
| `lib/subscription/limits.ts` | Limit checking utilities |
| `app/api/stripe/checkout/route.ts` | Checkout session creation |
| `app/api/stripe/portal/route.ts` | Customer portal access |
| `app/api/stripe/webhook/route.ts` | Webhook event handling |

### UI Files

| File | Purpose |
|------|---------|
| `components/shared/pricing-section.tsx` | Landing page pricing |
| `components/dashboard/billing-settings.tsx` | Dashboard billing UI |
| `app/dashboard/settings/billing/page.tsx` | Billing settings page |

### Database Files

| File | Purpose |
|------|---------|
| `types/database.ts` | TypeScript types including Profile |
| `supabase/migrations/20260131000001_add_billing_cycle.sql` | Billing cycle migration |

---

## Changelog

### February 2026
- Added monthly/annual billing cycles
- Updated pricing: $7/month, $60/year ($24 savings)
- Added billing cycle toggle to UI
- Updated checkout to support both price IDs
- Added `billing_cycle` column to profiles
- Created comprehensive documentation

### January 2024
- Initial Stripe integration
- Single Pro tier at $5/month
- Basic webhook handling
- Billing settings UI
