import { createAdminClient } from "@/lib/supabase/admin";

// Anthropic pricing as of January 2025 (per 1M tokens)
// Claude Sonnet 4: $3/1M input, $15/1M output, $0.30/1M cached input
// Claude Opus 4: $15/1M input, $75/1M output, $1.50/1M cached input
// Claude Haiku 3.5: $0.80/1M input, $4/1M output, $0.08/1M cached input
// Cache write tokens are charged at standard input rate
// Cache read tokens are charged at 10% of standard input rate
const MODEL_PRICING: Record<
  string,
  { inputPer1M: number; outputPer1M: number; cachedInputPer1M: number }
> = {
  "claude-sonnet-4-20250514": { inputPer1M: 3, outputPer1M: 15, cachedInputPer1M: 0.3 },
  "claude-opus-4-20250514": { inputPer1M: 15, outputPer1M: 75, cachedInputPer1M: 1.5 },
  "claude-3-5-haiku-20241022": { inputPer1M: 0.8, outputPer1M: 4, cachedInputPer1M: 0.08 },
  // Fallback for unknown models
  default: { inputPer1M: 3, outputPer1M: 15, cachedInputPer1M: 0.3 },
};

export interface AIUsageParams {
  userId: string;
  projectId?: string;
  bookId?: string;
  sceneId?: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  // Anthropic prompt caching metrics
  cacheCreationInputTokens?: number; // Tokens written to cache (charged at input rate)
  cacheReadInputTokens?: number; // Tokens read from cache (charged at 10% of input rate)
  durationMs?: number;
  status?: "success" | "error" | "cancelled";
  errorMessage?: string;
}

/**
 * Calculate cost in cents for given tokens and model
 * Supports Anthropic prompt caching: cached reads are 10% of normal input cost
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationInputTokens = 0,
  cacheReadInputTokens = 0
): { inputCostCents: number; outputCostCents: number; cacheSavingsCents: number } {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING.default;

  // Non-cached input tokens (total input minus cache tokens)
  const regularInputTokens = inputTokens - cacheCreationInputTokens - cacheReadInputTokens;

  // Calculate costs:
  // - Regular input: full price
  // - Cache creation: full price (same as regular input)
  // - Cache read: 10% of input price (cachedInputPer1M)
  const regularInputCost = (regularInputTokens / 1_000_000) * pricing.inputPer1M * 100;
  const cacheCreationCost = (cacheCreationInputTokens / 1_000_000) * pricing.inputPer1M * 100;
  const cacheReadCost = (cacheReadInputTokens / 1_000_000) * pricing.cachedInputPer1M * 100;

  const inputCostCents = regularInputCost + cacheCreationCost + cacheReadCost;
  const outputCostCents = (outputTokens / 1_000_000) * pricing.outputPer1M * 100;

  // Calculate savings from cache reads (what we would have paid without caching)
  const fullPriceForCacheReads = (cacheReadInputTokens / 1_000_000) * pricing.inputPer1M * 100;
  const cacheSavingsCents = fullPriceForCacheReads - cacheReadCost;

  return {
    inputCostCents: Math.round(inputCostCents * 10000) / 10000, // 4 decimal precision
    outputCostCents: Math.round(outputCostCents * 10000) / 10000,
    cacheSavingsCents: Math.round(cacheSavingsCents * 10000) / 10000,
  };
}

/**
 * Log AI usage to the database
 * Should be called after every AI API call
 */
export async function trackAIUsage(params: AIUsageParams): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { inputCostCents, outputCostCents, cacheSavingsCents } = calculateCost(
      params.model,
      params.inputTokens,
      params.outputTokens,
      params.cacheCreationInputTokens,
      params.cacheReadInputTokens
    );

    // Log cache hit information if available
    if (params.cacheReadInputTokens && params.cacheReadInputTokens > 0) {
      console.log(
        `🚀 Cache hit! ${params.cacheReadInputTokens} tokens read from cache, saving $${(cacheSavingsCents / 100).toFixed(4)}`
      );
    }

    // Use rpc to insert since ai_usage table may not be in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("ai_usage").insert({
      user_id: params.userId,
      project_id: params.projectId || null,
      book_id: params.bookId || null,
      scene_id: params.sceneId || null,
      endpoint: params.endpoint,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      input_cost_cents: inputCostCents,
      output_cost_cents: outputCostCents,
      request_duration_ms: params.durationMs || null,
      status: params.status || "success",
      error_message: params.errorMessage || null,
    });

    if (error) {
      console.error("Failed to track AI usage:", error);
    }
  } catch (err) {
    // Don't throw - usage tracking should never break the main flow
    console.error("Error in trackAIUsage:", err);
  }
}

/**
 * Helper to extract usage from Vercel AI SDK result
 * Handles both AI SDK v5 and v6 property names
 */
export function extractUsageFromResult(result: {
  usage?: Record<string, unknown>;
}): { inputTokens: number; outputTokens: number } {
  const usage = result.usage || {};
  return {
    // v6 uses promptTokens/completionTokens
    inputTokens: (usage.promptTokens as number) || 0,
    outputTokens: (usage.completionTokens as number) || 0,
  };
}

// Interface for ai_usage records (table may not be in generated types yet)
interface AIUsageRecord {
  input_tokens: number;
  output_tokens: number;
  input_cost_cents: number;
  output_cost_cents: number;
  endpoint: string;
  model: string;
}

/**
 * Get user's usage summary for the current billing period
 */
export async function getUserUsageSummary(
  userId: string,
  startDate?: Date
): Promise<{
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byEndpoint: Record<string, { requests: number; tokens: number; costUsd: number }>;
  byModel: Record<string, { requests: number; tokens: number; costUsd: number }>;
}> {
  const supabase = createAdminClient();

  // Default to start of current month
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", start.toISOString());

  if (error) {
    console.error("Failed to fetch usage summary:", error);
    return {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      byEndpoint: {},
      byModel: {},
    };
  }

  const records = (data || []) as AIUsageRecord[];

  const summary = {
    totalRequests: records.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
    byEndpoint: {} as Record<string, { requests: number; tokens: number; costUsd: number }>,
    byModel: {} as Record<string, { requests: number; tokens: number; costUsd: number }>,
  };

  for (const record of records) {
    summary.totalInputTokens += record.input_tokens;
    summary.totalOutputTokens += record.output_tokens;
    summary.totalCostUsd += (record.input_cost_cents + record.output_cost_cents) / 100;

    // By endpoint
    if (!summary.byEndpoint[record.endpoint]) {
      summary.byEndpoint[record.endpoint] = { requests: 0, tokens: 0, costUsd: 0 };
    }
    summary.byEndpoint[record.endpoint].requests++;
    summary.byEndpoint[record.endpoint].tokens += record.input_tokens + record.output_tokens;
    summary.byEndpoint[record.endpoint].costUsd +=
      (record.input_cost_cents + record.output_cost_cents) / 100;

    // By model
    if (!summary.byModel[record.model]) {
      summary.byModel[record.model] = { requests: 0, tokens: 0, costUsd: 0 };
    }
    summary.byModel[record.model].requests++;
    summary.byModel[record.model].tokens += record.input_tokens + record.output_tokens;
    summary.byModel[record.model].costUsd +=
      (record.input_cost_cents + record.output_cost_cents) / 100;
  }

  return summary;
}
