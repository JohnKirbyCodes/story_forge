import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildGraphContext, getFocusNodeIds } from "@/lib/ai/graph-context";
import { formatContextForPrompt, buildCacheableSystemPrompt } from "@/lib/ai/context-formatter";
import { trackAIUsage } from "@/lib/ai/usage-tracker";
import { checkWordQuota, incrementWordUsage, countWords } from "@/lib/subscription/limits";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("API key not configured", { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });
    const { prompt, sceneId, projectId } = await request.json();

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Use admin client to fetch data without RLS restrictions
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

    // Log context for debugging (check terminal output)
    console.log("\n========== AI GENERATION CONTEXT ==========");
    console.log("Scene ID:", sceneId);
    console.log("Focus Nodes:", focusNodeIds.length, "nodes");
    console.log("POV Node:", povNodeId || "None");
    console.log("Graph Context Summary:");
    console.log("  - Characters:", graphContext.nodes.filter(n => n.type === "character").length);
    console.log("  - Locations:", graphContext.nodes.filter(n => n.type === "location").length);
    console.log("  - Relationships:", graphContext.relationships.length);
    console.log("  - Previous Scenes:", graphContext.previousScenes.length);
    console.log("  - Events:", graphContext.events.length);
    console.log("\n--- CACHEABLE SYSTEM PROMPT PARTS ---");
    console.log("Static Part (cacheable):", staticPart.length, "chars");
    console.log("Book Part (cacheable per book):", bookPart.length, "chars");
    console.log("Context Part (per scene):", contextPart.length, "chars");
    console.log("\n--- USER PROMPT ---\n");
    console.log(prompt);
    console.log("\n============================================\n");

    const modelId = "claude-sonnet-4-20250514";
    const startTime = Date.now();

    // Combine static + book parts for caching (need minimum 1024 tokens)
    // The scene context changes per scene, so it's not cached
    const cacheableSystemContent = `${staticPart}\n\n${bookPart}`;

    // Use Anthropic SDK directly with cache_control for prompt caching
    // This enables 90% cost savings on repeated requests within 1 hour
    const stream = anthropic.messages.stream({
      model: modelId,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: cacheableSystemContent,
          // Mark this content for caching (ephemeral = 1 hour cache)
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `## Scene Context\n${contextPart}`,
          // Scene-specific context is NOT cached (changes per scene)
        },
      ],
      messages: [
        {
          role: "user",
          content: `Expand the following beat instructions into polished prose:\n\n${prompt}`,
        },
      ],
    });

    // Create a ReadableStream to send text chunks to the client
    const encoder = new TextEncoder();
    let generatedText = ""; // Accumulate for word counting

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Stream text chunks
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              generatedText += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          // Get final message for usage stats after streaming completes
          const finalMessage = await stream.finalMessage();
          const durationMs = Date.now() - startTime;

          const inputTokens = finalMessage.usage?.input_tokens ?? 0;
          const outputTokens = finalMessage.usage?.output_tokens ?? 0;
          const cacheCreationInputTokens = finalMessage.usage?.cache_creation_input_tokens ?? 0;
          const cacheReadInputTokens = finalMessage.usage?.cache_read_input_tokens ?? 0;

          // Count words in generated text and increment usage
          const wordCount = countWords(generatedText);
          await incrementWordUsage(adminSupabase, user.id, wordCount);
          console.log(`Word usage: +${wordCount} words (AI generated)`);

          // Track AI usage
          trackAIUsage({
            userId: user.id,
            projectId,
            bookId,
            sceneId,
            endpoint: "generate-scene",
            model: modelId,
            inputTokens,
            outputTokens,
            cacheCreationInputTokens,
            cacheReadInputTokens,
            durationMs,
            status: "success",
          });

          // Log with cache info
          const cacheInfo = cacheReadInputTokens > 0
            ? ` (${cacheReadInputTokens} from cache)`
            : cacheCreationInputTokens > 0
            ? ` (${cacheCreationInputTokens} written to cache)`
            : "";
          console.log(`AI Usage: ${inputTokens} input${cacheInfo}, ${outputTokens} output tokens in ${durationMs}ms`);

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating scene:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
