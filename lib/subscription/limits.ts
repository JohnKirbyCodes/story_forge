import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getTierLimits, SubscriptionTier, isUnlimited } from './config';

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  tier: SubscriptionTier;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  message?: string;
}

type SupabaseClientType = SupabaseClient<Database>;

async function getUserProfile(supabase: SupabaseClientType, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, words_used_this_month, words_quota')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  return {
    tier: (profile.subscription_tier || 'free') as SubscriptionTier,
    wordsUsed: profile.words_used_this_month || 0,
    wordsQuota: profile.words_quota || 10000,
  };
}

export async function checkProjectLimit(
  supabase: SupabaseClientType,
  userId: string
): Promise<LimitCheckResult> {
  const profile = await getUserProfile(supabase, userId);
  const limits = getTierLimits(profile.tier);

  if (isUnlimited(limits.maxProjects)) {
    return { allowed: true, current: 0, limit: null };
  }

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to count projects');
  }

  const currentCount = count || 0;
  const allowed = currentCount < limits.maxProjects!;

  return {
    allowed,
    current: currentCount,
    limit: limits.maxProjects,
    message: allowed
      ? undefined
      : `You've reached the maximum of ${limits.maxProjects} project(s) on the ${profile.tier} plan. Upgrade to Pro for unlimited projects.`,
  };
}

export async function checkBookLimit(
  supabase: SupabaseClientType,
  userId: string,
  projectId: string
): Promise<LimitCheckResult> {
  const profile = await getUserProfile(supabase, userId);
  const limits = getTierLimits(profile.tier);

  if (isUnlimited(limits.maxBooksPerProject)) {
    return { allowed: true, current: 0, limit: null };
  }

  const { count, error } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    throw new Error('Failed to count books');
  }

  const currentCount = count || 0;
  const allowed = currentCount < limits.maxBooksPerProject!;

  return {
    allowed,
    current: currentCount,
    limit: limits.maxBooksPerProject,
    message: allowed
      ? undefined
      : `You've reached the maximum of ${limits.maxBooksPerProject} book(s) per project on the ${profile.tier} plan. Upgrade to Pro for unlimited books.`,
  };
}

export async function checkNodeLimit(
  supabase: SupabaseClientType,
  userId: string,
  projectId: string
): Promise<LimitCheckResult> {
  const profile = await getUserProfile(supabase, userId);
  const limits = getTierLimits(profile.tier);

  if (isUnlimited(limits.maxStoryNodes)) {
    return { allowed: true, current: 0, limit: null };
  }

  const { count, error } = await supabase
    .from('story_nodes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    throw new Error('Failed to count story nodes');
  }

  const currentCount = count || 0;
  const allowed = currentCount < limits.maxStoryNodes!;

  return {
    allowed,
    current: currentCount,
    limit: limits.maxStoryNodes,
    message: allowed
      ? undefined
      : `You've reached the maximum of ${limits.maxStoryNodes} story elements on the ${profile.tier} plan. Upgrade to Pro for unlimited story elements.`,
  };
}

export async function checkWordQuota(
  supabase: SupabaseClientType,
  userId: string
): Promise<QuotaStatus> {
  const profile = await getUserProfile(supabase, userId);
  const limits = getTierLimits(profile.tier);

  const used = profile.wordsUsed;
  const limit = limits.monthlyWordQuota;

  if (isUnlimited(limit)) {
    return {
      allowed: true,
      used,
      limit: null,
      remaining: null,
      tier: profile.tier,
    };
  }

  const remaining = Math.max(0, limit! - used);
  const allowed = used < limit!;

  return {
    allowed,
    used,
    limit,
    remaining,
    tier: profile.tier,
  };
}

export async function incrementWordUsage(
  supabase: SupabaseClientType,
  userId: string,
  wordCount: number
): Promise<void> {
  const { error } = await supabase.rpc('increment_word_usage', {
    user_id: userId,
    word_count: wordCount,
  });

  // Fallback if RPC doesn't exist yet
  if (error) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('words_used_this_month')
      .eq('id', userId)
      .single();

    const currentUsage = profile?.words_used_this_month || 0;

    await supabase
      .from('profiles')
      .update({ words_used_this_month: currentUsage + wordCount })
      .eq('id', userId);
  }
}

export async function getUsageStats(
  supabase: SupabaseClientType,
  userId: string
): Promise<{
  wordsUsed: number;
  wordsLimit: number | null;
  wordsRemaining: number | null;
  projectCount: number;
  projectLimit: number | null;
  nodeCount: number;
  nodeLimit: number | null;
  tier: SubscriptionTier;
}> {
  const profile = await getUserProfile(supabase, userId);
  const limits = getTierLimits(profile.tier);

  // Get project count
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get total node count across all user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId);

  let nodeCount = 0;
  if (projects && projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    const { count } = await supabase
      .from('story_nodes')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds);
    nodeCount = count || 0;
  }

  return {
    wordsUsed: profile.wordsUsed,
    wordsLimit: limits.monthlyWordQuota,
    wordsRemaining: isUnlimited(limits.monthlyWordQuota)
      ? null
      : Math.max(0, limits.monthlyWordQuota! - profile.wordsUsed),
    projectCount: projectCount || 0,
    projectLimit: limits.maxProjects,
    nodeCount,
    nodeLimit: limits.maxStoryNodes,
    tier: profile.tier,
  };
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
