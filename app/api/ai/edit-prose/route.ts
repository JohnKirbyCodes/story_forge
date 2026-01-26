import { createAnthropic } from "@ai-sdk/anthropic";
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
import { checkWordQuota, incrementWordUsage, countWords } from "@/lib/subscription/limits";

export const maxDuration = 60;

interface EditProseRequest {
  selectedText: string;
  action: EditAction;
  customPrompt?: string;
  sceneId: string;
  projectId: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("API key not configured", { status: 500 });
    }

    const anthropic = createAnthropic({ apiKey });
    const body: EditProseRequest = await request.json();
    const { selectedText, action, customPrompt, sceneId, projectId } = body;

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

    // Use admin client to verify ownership
    const adminSupabase = createAdminClient();

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

    // Check word quota before generating
    const quotaStatus = await checkWordQuota(adminSupabase, user.id);
    if (!quotaStatus.allowed) {
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: "You've reached your monthly AI generation limit. Upgrade to Pro for more words.",
          used: quotaStatus.used,
          limit: quotaStatus.limit,
          tier: quotaStatus.tier,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
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

    // Log for debugging
    console.log("\n========== AI EDIT REQUEST ==========");
    console.log("Action:", action);
    console.log("Scene ID:", sceneId);
    console.log("Text length:", selectedText.length, "characters");
    console.log("Using graph context:", !!graphContext);
    if (graphContext) {
      console.log("  Characters:", graphContext.nodes.filter(n => n.type === "character").length);
      console.log("  Locations:", graphContext.nodes.filter(n => n.type === "location").length);
      console.log("  Relationships:", graphContext.relationships.length);
    }
    if (customPrompt) {
      console.log("Custom prompt:", customPrompt);
    }
    console.log("==========================================\n");

    const modelId = "claude-sonnet-4-20250514";
    const startTime = Date.now();

    const result = streamText({
      model: anthropic(modelId),
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: async ({ text, usage }) => {
        const durationMs = Date.now() - startTime;
        // AI SDK v6 uses these property names on LanguageModelUsage
        const inputTokens = (usage as { promptTokens?: number })?.promptTokens ?? 0;
        const outputTokens = (usage as { completionTokens?: number })?.completionTokens ?? 0;

        // Count words in generated text and increment usage
        const wordCount = countWords(text);
        await incrementWordUsage(adminSupabase, user.id, wordCount);
        console.log(`Word usage (${action}): +${wordCount} words (AI generated)`);

        // Track AI usage
        trackAIUsage({
          userId: user.id,
          projectId,
          bookId,
          sceneId,
          endpoint: `edit-prose:${action}`,
          model: modelId,
          inputTokens,
          outputTokens,
          durationMs,
          status: "success",
        });

        console.log(`AI Usage (${action}): ${inputTokens} input, ${outputTokens} output tokens in ${durationMs}ms`);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error editing prose:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
