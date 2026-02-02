import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EditAction,
  getSystemPrompt,
  getEditPrompt,
  actionNeedsContext,
  getSystemPromptWithContext,
} from "@/lib/ai/edit-prompts";
import { trackAIUsage } from "@/lib/ai/usage-tracker";
import { buildGraphContext, getFocusNodeIds } from "@/lib/ai/graph-context";
import { GraphContext } from "@/types/graph-context";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

interface EditProseRequest {
  selectedText: string;
  action: EditAction;
  customPrompt?: string;
  sceneId: string;
  projectId: string;
  model?: string;
}

export async function POST(request: Request) {
  try {
    const body: EditProseRequest = await request.json();
    const { selectedText, action, customPrompt, sceneId, projectId, model: requestedModel } = body;

    if (!selectedText || !action || !sceneId || !projectId) {
      return new Response("Missing required fields", { status: 400 });
    }

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

    // Use admin client to verify ownership
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

    // Verify scene exists and belongs to this project
    const { data: scene, error: sceneError } = await adminSupabase
      .from("scenes")
      .select(`
        id,
        chapter_id,
        chapters!inner (
          id,
          book_id,
          books!inner (
            project_id
          )
        )
      `)
      .eq("id", sceneId)
      .single();

    if (sceneError || !scene) {
      return new Response("Scene not found", { status: 404 });
    }

    const chapters = scene.chapters as {
      id: string;
      book_id: string;
      books: { project_id: string }
    };

    if (chapters.books.project_id !== projectId) {
      return new Response("Scene does not belong to this project", {
        status: 403
      });
    }

    const bookId = chapters.book_id;
    const chapterId = chapters.id;

    // Build the prompts - conditionally include graph context for actions that need it
    let systemPrompt: string;
    let graphContext: GraphContext | undefined;

    if (actionNeedsContext(action)) {
      // Fetch graph context for context-aware actions
      const { focusNodeIds, povNodeId } = await getFocusNodeIds(adminSupabase, sceneId);

      graphContext = await buildGraphContext(adminSupabase, {
        sceneId,
        projectId,
        bookId,
        chapterId,
        focusNodeIds,
        povNodeId: povNodeId || undefined,
        depth: 1, // Shallower depth for edit operations (faster)
      });

      systemPrompt = getSystemPromptWithContext(graphContext);
    } else {
      // Use minimal system prompt for simple actions
      systemPrompt = getSystemPrompt();
    }

    const userPrompt = getEditPrompt(action, selectedText, customPrompt);

    logger.debug("AI edit request started", {
      action,
      provider,
      model: modelId,
      sceneId,
      textLength: selectedText.length,
      usingGraphContext: !!graphContext,
      ...(graphContext && {
        characters: graphContext.nodes.filter(n => n.type === "character").length,
        locations: graphContext.nodes.filter(n => n.type === "location").length,
        relationships: graphContext.relationships.length,
      }),
      ...(customPrompt && { hasCustomPrompt: true }),
    });

    const startTime = Date.now();

    const result = streamText({
      model: instance.getModel(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: async ({ text, usage }) => {
        const durationMs = Date.now() - startTime;
        // AI SDK v4 uses inputTokens/outputTokens on LanguageModelUsage
        const inputTokens = (usage as { inputTokens?: number })?.inputTokens ?? 0;
        const outputTokens = (usage as { outputTokens?: number })?.outputTokens ?? 0;

        // Track AI usage (no word quota - BYOK model)
        trackAIUsage({
          userId: user.id,
          projectId,
          bookId,
          sceneId,
          endpoint: `edit-prose:${action}`,
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
          endpoint: `edit-prose:${action}`,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("Error editing prose", error as Error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "generation_error",
        message: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
