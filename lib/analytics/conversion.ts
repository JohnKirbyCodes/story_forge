import { track } from "@vercel/analytics";

/**
 * Conversion analytics helper for tracking upgrade funnel events.
 * Uses Vercel Analytics for event tracking.
 */
export const conversionAnalytics = {
  /**
   * Track when user hits a tier limit
   */
  tierLimitHit: (
    feature: string,
    currentCount: number,
    limit: number,
    requestedCount: number
  ) => {
    track("tier_limit_hit", {
      feature,
      current_count: currentCount,
      limit,
      requested_count: requestedCount,
    });
  },

  /**
   * Track when upgrade prompt is shown
   */
  upgradePromptShown: (
    feature: string,
    trigger: "limit_hit" | "proactive" | "quota_warning"
  ) => {
    track("upgrade_prompt_shown", { feature, trigger });
  },

  /**
   * Track when user clicks upgrade button
   */
  upgradeClicked: (
    feature: string,
    source: "dialog" | "toast" | "settings" | "banner"
  ) => {
    track("upgrade_clicked", { feature, source });
  },

  /**
   * Track when user dismisses upgrade prompt without upgrading
   */
  upgradeDismissed: (feature: string) => {
    track("upgrade_dismissed", { feature });
  },

  /**
   * Track successful upgrade completion
   */
  upgradeCompleted: (plan: "pro" | "enterprise", source: string) => {
    track("upgrade_completed", { plan, source });
  },

  /**
   * Track quota check showing remaining capacity
   */
  quotaChecked: (
    feature: string,
    currentCount: number,
    limit: number,
    tier: "free" | "pro"
  ) => {
    track("quota_checked", {
      feature,
      current_count: currentCount,
      limit,
      tier,
      usage_percent: Math.round((currentCount / limit) * 100),
    });
  },
};
