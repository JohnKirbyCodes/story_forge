export type SubscriptionTier = 'free' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export interface TierLimits {
  maxProjects: number | null;
  maxBooksPerProject: number | null;
  maxStoryNodes: number | null;
  exportFormats: string[];
}

export interface PricingInfo {
  monthly: number;
  annual: number;
  annualMonthly: number; // Price per month when billed annually
  annualSavings: number; // Total savings per year
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxProjects: 1,
    maxBooksPerProject: 1,
    maxStoryNodes: 15,
    exportFormats: ['txt'],
  },
  pro: {
    maxProjects: null, // unlimited
    maxBooksPerProject: null,
    maxStoryNodes: null,
    exportFormats: ['txt'], // DOCX/EPUB on roadmap
  },
};

export const TIER_PRICING: Record<SubscriptionTier, number | PricingInfo> = {
  free: 0,
  pro: {
    monthly: 7,        // $7/month billed monthly
    annual: 60,        // $60/year billed annually
    annualMonthly: 5,  // $5/month equivalent when billed annually
    annualSavings: 24, // Save $24/year vs monthly ($84 - $60)
  },
};

export function getProPricing(): PricingInfo {
  return TIER_PRICING.pro as PricingInfo;
}

export function getPriceDisplay(cycle: BillingCycle): { price: number; period: string; perMonth?: number } {
  const pricing = getProPricing();
  if (cycle === 'monthly') {
    return { price: pricing.monthly, period: 'month' };
  }
  return { price: pricing.annual, period: 'year', perMonth: pricing.annualMonthly };
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
}

export function isUnlimited(value: number | null): boolean {
  return value === null;
}

export function formatLimit(value: number | null): string {
  return value === null ? 'Unlimited' : value.toLocaleString();
}
