import { streamText } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildGraphContext, getFocusNodeIds } from "@/lib/ai/graph-context";
import { formatContextForPrompt, buildCacheableSystemPrompt } from "@/lib/ai/context-formatter";
import { trackAIUsage } from "@/lib/ai/usage-tracker";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { generateSceneSchema, validateRequest } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequest(generateSceneSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "validation_error", message: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt, sceneId, projectId, model: requestedModel } = validation.data;

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Apply rate limiting (per-minute and per-hour limits)
    const rateLimitResult = await checkMultipleRateLimits(request, [
      { id: RATE_LIMIT_IDS.AI_GENERATE, key: user.id },
      { id: RATE_LIMIT_IDS.AI_GENERATE_HOURLY, key: user.id },
    ]);
    if (rateLimitResult.rateLimited) {
      return createRateLimitResponse();
    }

    // Use admin client to fetch data without RLS restrictions
    const adminSupabase = createAdminClient();

    // Get user's configured AI provider (BYOK) - pass requested model for provider detection
    let providerResult;
    try {
      providerResult = await getUserProvider(adminSupabase, user.id, requestedModel);
    } catch (err) {
      if (err instanceof ProviderError) {
        return new Response(
          JSON.stringify({
            error: "provider_error",
            code: err.code,
            message: err.message,
            provider: err.provider,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const { instance, provider, defaultModelId } = providerResult;

    // Use requested model if valid, otherwise fall back to default
    const modelId = (requestedModel && isValidModel(provider, requestedModel))
      ? requestedModel
      : defaultModelId;

    // Verify user owns this project
    const { data: project, error: projectError } = await adminSupabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Get scene's chapter and book IDs for context building
    const { data: scene } = await adminSupabase
      .from("scenes")
      .select("chapter_id, chapters(book_id)")
      .eq("id", sceneId)
      .single();

    if (!scene?.chapter_id) {
      return new Response("Scene not found", { status: 404 });
    }

    const chapterId = scene.chapter_id;
    const bookId = (scene.chapters as { book_id: string })?.book_id;

    if (!bookId) {
      return new Response("Book not found", { status: 404 });
    }

    // Get focus nodes from the scene (characters + location)
    const { focusNodeIds, povNodeId } = await getFocusNodeIds(adminSupabase, sceneId);

    // Build comprehensive graph context
    const graphContext = await buildGraphContext(adminSupabase, {
      sceneId,
      projectId,
      bookId,
      chapterId,
      focusNodeIds,
      povNodeId: povNodeId || undefined,
      depth: 2,
    });

    // Format context into structured prompt text
    const contextStr = formatContextForPrompt(graphContext);

    // Build cacheable system prompt parts for Anthropic prompt caching
    const { staticPart, bookPart, contextPart } = buildCacheableSystemPrompt(
      contextStr,
      [],
      graphContext
    );

    // Log context for debugging (only in development)
    logger.debug("AI generation context", {
      provider,
      model: modelId,
      sceneId,
      focusNodes: focusNodeIds.length,
      povNode: povNodeId || "None",
      context: {
        characters: graphContext.nodes.filter(n => n.type === "character").length,
        locations: graphContext.nodes.filter(n => n.type === "location").length,
        relationships: graphContext.relationships.length,
        previousScenes: graphContext.previousScenes.length,
        events: graphContext.events.length,
      },
    });

    const startTime = Date.now();

    // Build full system prompt
    const systemPrompt = `${staticPart}\n\n${bookPart}\n\n## Scene Context\n${contextPart}`;

    // Use Vercel AI SDK streamText for multi-provider support
    const result = streamText({
      model: instance.getModel(modelId),
      system: systemPrompt,
      prompt: `Expand the following beat instructions into polished prose:\n\n${prompt}`,
      onFinish: async ({ text, usage }) => {
        const durationMs = Date.now() - startTime;
        const inputTokens = (usage as { inputTokens?: number })?.inputTokens ?? 0;
        const outputTokens = (usage as { outputTokens?: number })?.outputTokens ?? 0;

        // Save generated prose to database
        if (text && text.trim()) {
          const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
          const { error: updateError } = await adminSupabase
            .from("scenes")
            .update({
              generated_prose: text,
              word_count: wordCount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sceneId);

          if (updateError) {
            logger.error("Failed to save generated prose", updateError, { sceneId });
          } else {
            logger.debug("Saved generated prose", { sceneId, wordCount });
          }
        }

        // Track AI usage (no quota enforcement with BYOK)
        trackAIUsage({
          userId: user.id,
          projectId,
          bookId,
          sceneId,
          endpoint: "generate-scene",
          model: `${provider}:${modelId}`,
          inputTokens,
          outputTokens,
          durationMs,
          status: "success",
        });

        logger.aiUsage({
          provider,
          model: modelId,
          inputTokens,
          outputTokens,
          durationMs,
          endpoint: "generate-scene",
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("Scene generation failed", error);

    // Return structured error response (don't expose internal error details)
    return new Response(
      JSON.stringify({
        error: "generation_error",
        message: "An error occurred during generation. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
