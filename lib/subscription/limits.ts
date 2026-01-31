import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getTierLimits, SubscriptionTier, isUnlimited } from './config';

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
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  return {
    tier: (profile.subscription_tier || 'free') as SubscriptionTier,
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

export async function getUsageStats(
  supabase: SupabaseClientType,
  userId: string
): Promise<{
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
