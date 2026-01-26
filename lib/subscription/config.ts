export type SubscriptionTier = 'free' | 'pro';

export interface TierLimits {
  maxProjects: number | null;
  maxBooksPerProject: number | null;
  maxStoryNodes: number | null;
  monthlyWordQuota: number | null;
  exportFormats: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxProjects: 1,
    maxBooksPerProject: 1,
    maxStoryNodes: 15,
    monthlyWordQuota: 10000,
    exportFormats: ['txt'],
  },
  pro: {
    maxProjects: null, // unlimited
    maxBooksPerProject: null,
    maxStoryNodes: null,
    monthlyWordQuota: 150000,
    exportFormats: ['txt'],
  },
};

export const TIER_PRICING = {
  free: 0,
  pro: 15, // $15/month
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
}

export function isUnlimited(value: number | null): boolean {
  return value === null;
}

export function formatLimit(value: number | null): string {
  return value === null ? 'Unlimited' : value.toLocaleString();
}
