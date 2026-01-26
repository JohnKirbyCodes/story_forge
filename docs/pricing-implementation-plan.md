# Pricing Structure Implementation Plan

## Implementation Status: COMPLETE

All pricing features have been implemented. See summary below.

## Proposed Tiers

### Free Tier ($0/month)
| Feature | Limit |
|---------|-------|
| Projects | 1 |
| Books | 1 |
| Story Elements (nodes) | 15 |
| AI Generation | 10,000 words/month (~12 generations) |
| Export | TXT |

### Pro Tier ($15/month)
| Feature | Limit |
|---------|-------|
| Projects | Unlimited |
| Books | Unlimited |
| Story Elements (nodes) | Unlimited |
| AI Generation | 150,000 words/month (~185 generations) |
| Export | TXT |

---

## Current State Analysis

### What Exists ✓
- Stripe checkout, portal, and webhook handlers
- Database fields: `subscription_tier`, `words_used_this_month`, `words_quota`
- AI usage tracking with token/cost logging
- Billing UI component

### Critical Gaps ✗
- **No limit enforcement** - Users can create unlimited resources regardless of tier
- **No word quota blocking** - AI endpoints don't check before generating
- **No export functionality** - TXT export not implemented
- **Limits only in UI** - No database or API validation

---

## Recommendations

### 1. Word Quota Adjustment
| Tier | Current | Proposed | Change |
|------|---------|----------|--------|
| Free | 5,000 words | 10,000 words | +100% |
| Pro | Unlimited | 150,000 words | Cap added |

**Recommendation:** The Pro tier cap of 150,000 words is reasonable for cost control. At ~800 words/generation, this equals ~185 generations/month—sufficient for active writers.

### 2. Story Node Limit
| Tier | Current (hardcoded) | Proposed | Change |
|------|---------------------|----------|--------|
| Free | 50 nodes | 15 nodes | -70% |
| Pro | Unlimited | Unlimited | No change |

**Recommendation:** 15 nodes is restrictive (a single book may need 5+ characters, 3+ locations, events). Consider **25-30 nodes** for free tier to allow meaningful exploration.

### 3. Export Feature
Currently no export exists. Implementation required for both tiers.

---

## Implementation Plan

### Phase 1: Database & Configuration (Foundation)

**1.1 Update subscription tier configuration**
Create a centralized config for tier limits:

```typescript
// lib/subscription/config.ts
export const SUBSCRIPTION_TIERS = {
  free: {
    maxProjects: 1,
    maxBooksPerProject: 1,
    maxStoryNodes: 15,      // or 25-30 per recommendation
    monthlyWordQuota: 10000,
    exportFormats: ['txt'],
  },
  pro: {
    maxProjects: null,      // unlimited
    maxBooksPerProject: null,
    maxStoryNodes: null,
    monthlyWordQuota: 150000,
    exportFormats: ['txt'], // expandable later
  },
};
```

**1.2 Database schema updates**
Add migration for:
- `billing_period_start` and `billing_period_end` columns (for accurate monthly reset)
- Update `words_quota` default to 10,000

```sql
ALTER TABLE profiles
  ADD COLUMN billing_period_start DATE,
  ADD COLUMN billing_period_end DATE,
  ALTER COLUMN words_quota SET DEFAULT 10000;
```

### Phase 2: Limit Enforcement (Critical)

**2.1 Create limit-checking utilities**

```typescript
// lib/subscription/limits.ts
export async function checkProjectLimit(userId: string): Promise<boolean>
export async function checkBookLimit(userId: string, projectId: string): Promise<boolean>
export async function checkNodeLimit(userId: string, projectId: string): Promise<boolean>
export async function checkWordQuota(userId: string): Promise<{ allowed: boolean; remaining: number }>
export async function incrementWordUsage(userId: string, wordCount: number): Promise<void>
```

**2.2 Add enforcement to API routes**

| Route | Enforcement Needed |
|-------|-------------------|
| `POST /api/projects` | Check project limit |
| `POST /api/books` | Check book limit |
| `POST /api/story-nodes` | Check node limit |
| `POST /api/ai/generate-*` | Check word quota |
| `POST /api/ai/edit-prose` | Check word quota |

**2.3 Update Stripe webhook**
- On `invoice.payment_succeeded`: Reset `words_used_this_month`, update billing period dates
- On subscription downgrade: Do NOT delete content, just restrict new creation

### Phase 3: Export Functionality

**3.1 TXT Export implementation**
- Create `/api/export/txt` endpoint
- Support book-level and chapter-level export
- Include proper formatting (chapter headings, scene breaks)

**3.2 Export UI**
- Add export button to book detail page
- Show format options based on tier

### Phase 4: UI Updates

**4.1 Header quota tracker (Required)**
- Add persistent word usage display to dashboard header
- Format: "2,450 / 10,000 words" (free) or "12,300 / 150,000 words" (pro)
- Visual indicator (progress bar or text color change when high)

**4.2 Update billing-settings.tsx**
- Display new limits from centralized config
- Show detailed word usage progress
- Remove 80% warning (block at 100% only)

**4.3 Add limit-reached modals**
- Project limit: "Upgrade to Pro for unlimited projects"
- Node limit: "Upgrade to Pro for unlimited story elements"
- Word quota: "You've used your monthly AI generation quota"
- All modals include: upgrade CTA + option to dismiss

**4.4 Read-only mode when at limit**
- Disable AI generation buttons when quota exhausted
- Keep all read/edit/export functionality enabled
- Clear messaging: "AI generation paused until [reset date]"

### Phase 5: Stripe Configuration

**5.1 Create/verify Stripe products**
- Free tier: No Stripe product needed
- Pro tier: Verify `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` is configured correctly

**5.2 Update checkout flow**
- Ensure metadata includes tier information
- Handle subscription changes (upgrade/downgrade)

---

## Files to Modify

### New Files
- `lib/subscription/config.ts` - Tier configuration
- `lib/subscription/limits.ts` - Limit checking utilities
- `app/api/export/txt/route.ts` - TXT export endpoint
- `supabase/migrations/XXXXXX_update_billing_fields.sql` - Schema changes

### Modified Files
- `app/api/projects/route.ts` - Add project limit check
- `app/api/ai/generate-scene/route.ts` - Add word quota check + count AI output words
- `app/api/ai/generate-outline/route.ts` - Add word quota check + count AI output words
- `app/api/ai/edit-prose/route.ts` - Add word quota check + count AI output words
- `app/api/stripe/webhook/route.ts` - Update billing period handling
- `components/dashboard/billing-settings.tsx` - Update limits display
- `components/dashboard/header.tsx` - Add quota tracker display (already receives profile prop)
- `components/story-nodes-list.tsx` - Add node limit check

---

## Confirmed Requirements

1. **Story node limit:** 15 nodes for free tier (confirmed)
2. **Export scope:** Final prose only (no beat instructions/notes)
3. **Quota behavior:** Block at 100%, no soft warning threshold
4. **Usage display:** Show quota tracker in header (e.g., "2,450 / 10,000 words")
5. **At-limit behavior:** Read-only + exportable (can't create new, can still access/export)
6. **Rollover:** No rollover of unused words

---

## AI vs User Text Tracking

**Critical distinction:** Only AI-generated text counts against the word quota. User-written text does not.

**Implementation approach:**
- Count words in AI endpoint responses only (generate-scene, generate-outline, edit-prose)
- Increment `words_used_this_month` at the moment of AI generation
- User edits in the editor (typing, pasting, manual writing) do NOT affect quota
- The `edited_prose` field can be modified freely without quota impact

**Word counting logic:**
```typescript
// In AI generation endpoints, after receiving response:
const generatedText = response.content;
const wordCount = generatedText.split(/\s+/).filter(Boolean).length;
await incrementWordUsage(userId, wordCount);
```

---

## Implementation Summary

### Files Created
| File | Purpose |
|------|---------|
| `lib/subscription/config.ts` | Centralized tier configuration |
| `lib/subscription/limits.ts` | Limit checking utilities |
| `app/api/projects/route.ts` | Project creation with limit check |
| `app/api/books/route.ts` | Book creation with limit check |
| `app/api/story-nodes/route.ts` | Story node creation with limit check |
| `app/api/export/txt/route.ts` | TXT export endpoint |
| `components/dashboard/export-book-button.tsx` | Export UI component |
| `supabase/migrations/20240125000007_billing_period_tracking.sql` | Database schema changes |

### Files Modified
| File | Changes |
|------|---------|
| `app/api/ai/generate-scene/route.ts` | Added quota check + word counting |
| `app/api/ai/generate-outline/route.ts` | Added quota check + word counting |
| `app/api/ai/edit-prose/route.ts` | Added quota check + word counting |
| `app/api/stripe/webhook/route.ts` | Added billing period handling |
| `components/dashboard/header.tsx` | Added quota tracker display |
| `components/dashboard/billing-settings.tsx` | Updated to use centralized config |
| `components/dashboard/create-project-dialog.tsx` | Uses API route with limit check |
| `components/dashboard/create-book-dialog.tsx` | Uses API route with limit check |
| `components/graph/create-node-dialog.tsx` | Uses API route with limit check |
| `app/dashboard/projects/[projectId]/books/[bookId]/page.tsx` | Added export button |
| `types/database.ts` | Added billing period columns |

### Key Features Implemented
1. **Limit Enforcement**: Server-side checks for projects, books, story nodes, and AI word quota
2. **Word Quota Tracking**: Only AI-generated words count; user typing is unlimited
3. **TXT Export**: Download book as plain text with chapter formatting
4. **Header Quota Display**: Persistent usage tracker in dashboard header
5. **Upgrade CTAs**: Limit-reached errors include upgrade links
6. **Billing Period Reset**: Stripe webhook resets quota on payment

### Next Steps (Post-Implementation)
1. Run database migration: `supabase db push` or `supabase migration up`
2. Verify Stripe webhook is configured with all events
3. Test upgrade/downgrade flow
4. Monitor usage patterns
