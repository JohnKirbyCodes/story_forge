import { generateText } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { trackAIUsage, extractUsageFromResult } from "@/lib/ai/usage-tracker";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

interface ChapterData {
  id: string;
  title: string;
  summary: string | null;
  order_index: number | null;
}

interface BookData {
  id: string;
  title: string;
  synopsis: string | null;
  sort_order: number | null;
  chapters: ChapterData[];
}

export async function POST(request: Request) {
  try {
    const { bookId, projectId, model: requestedModel, save = true } = await request.json();

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await checkMultipleRateLimits(request, [
      { id: RATE_LIMIT_IDS.AI_GENERATE, key: user.id },
      { id: RATE_LIMIT_IDS.AI_GENERATE_HOURLY, key: user.id },
    ]);
    if (rateLimitResult.rateLimited) {
      return createRateLimitResponse();
    }

    const adminSupabase = createAdminClient();

    // Get user's AI provider
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
    const modelId = (requestedModel && isValidModel(provider, requestedModel))
      ? requestedModel
      : defaultModelId;

    // Verify user owns this project
    const { data: project, error: projectError } = await adminSupabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Get current book
    const { data: currentBook, error: bookError } = await adminSupabase
      .from("books")
      .select("id, title, sort_order")
      .eq("id", bookId)
      .eq("project_id", projectId)
      .single();

    if (bookError || !currentBook) {
      return new Response("Book not found", { status: 404 });
    }

    // Get previous books in the series (lower sort_order)
    const { data: previousBooks, error: prevBooksError } = await adminSupabase
      .from("books")
      .select(`
        id,
        title,
        synopsis,
        sort_order,
        chapters (
          id,
          title,
          summary,
          order_index
        )
      `)
      .eq("project_id", projectId)
      .lt("sort_order", currentBook.sort_order ?? 0)
      .order("sort_order", { ascending: true });

    if (prevBooksError) {
      logger.error("Error fetching previous books", prevBooksError as Error);
      return new Response("Failed to fetch previous books", { status: 500 });
    }

    if (!previousBooks || previousBooks.length === 0) {
      return Response.json({
        recap: null,
        message: "No previous books in the series to generate a recap from.",
      });
    }

    // Get key story nodes that might have changed across books
    const { data: storyNodes } = await adminSupabase
      .from("story_nodes")
      .select("id, name, node_type, description, character_role, character_arc")
      .eq("project_id", projectId)
      .in("node_type", ["character", "event"]);

    // Build context for the AI
    let contextStr = `# Series Context\n\n`;
    contextStr += `## Series: ${project.title}\n`;
    if (project.genre) contextStr += `Genre: ${project.genre}\n`;
    if (project.description) contextStr += `Series Description: ${project.description}\n`;
    contextStr += `\n`;

    // Add each previous book's details
    contextStr += `## Previous Books\n\n`;

    (previousBooks as BookData[]).forEach((book, index) => {
      contextStr += `### Book ${index + 1}: ${book.title}\n`;

      if (book.synopsis) {
        contextStr += `**Synopsis:** ${book.synopsis}\n\n`;
      }

      // Add chapter summaries if available
      const chaptersWithSummaries = (book.chapters || [])
        .filter((ch) => ch.summary)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      if (chaptersWithSummaries.length > 0) {
        contextStr += `**Chapter Summaries:**\n`;
        chaptersWithSummaries.forEach((ch) => {
          contextStr += `- ${ch.title}: ${ch.summary}\n`;
        });
        contextStr += `\n`;
      }
    });

    // Add key characters and their arcs
    const characters = storyNodes?.filter((n) => n.node_type === "character") || [];
    if (characters.length > 0) {
      contextStr += `## Key Characters\n`;
      characters.forEach((char) => {
        contextStr += `- **${char.name}**`;
        if (char.character_role) contextStr += ` (${char.character_role})`;
        if (char.description) contextStr += `: ${char.description}`;
        if (char.character_arc) contextStr += ` | Arc: ${char.character_arc}`;
        contextStr += `\n`;
      });
      contextStr += `\n`;
    }

    // Add key events
    const events = storyNodes?.filter((n) => n.node_type === "event") || [];
    if (events.length > 0) {
      contextStr += `## Key Events\n`;
      events.forEach((event) => {
        contextStr += `- **${event.name}**`;
        if (event.description) contextStr += `: ${event.description}`;
        contextStr += `\n`;
      });
    }

    const systemPrompt = `You are an expert fiction writer creating a "Previously On..." recap for a book series. Your task is to summarize what happened in the previous book(s) to help readers (and the AI writing assistant) understand the context for the current book.

${contextStr}

## Guidelines for Recap Generation

1. **Length**: Write a concise recap of 300-600 words
2. **Focus on**:
   - Major plot points and how they resolved
   - Character development and relationship changes
   - Unresolved threads or cliffhangers that carry forward
   - Key revelations or world-changing events
   - Where main characters ended up (physically and emotionally)
3. **Tone**: Write in present tense, narrative style (like a TV "Previously on..." recap)
4. **Structure**: Start with the most impactful events, then fill in supporting context
5. **Avoid**: Don't just summarize chapter by chapter - synthesize into a flowing narrative

Write the recap as if introducing Book ${(currentBook.sort_order ?? 0) + 1} to someone who read the previous book(s) a while ago and needs a refresher. Do not include any preamble, headers, or meta-commentary - just write the recap text directly.`;

    logger.debug("AI recap generation started", {
      currentBook: currentBook.title,
      previousBooksCount: previousBooks.length,
      provider,
      model: modelId,
    });

    const startTime = Date.now();

    const result = await generateText({
      model: instance.getModel(modelId),
      system: systemPrompt,
      prompt: `Generate a "Previously On..." recap for "${currentBook.title}" (Book ${(currentBook.sort_order ?? 0) + 1} in the series). Summarize the key events, character developments, and unresolved threads from the previous book(s).`,
    });

    const durationMs = Date.now() - startTime;
    const recap = result.text.trim();

    // Extract usage metrics
    const { inputTokens, outputTokens } = extractUsageFromResult(result);

    // Track AI usage
    await trackAIUsage({
      userId: user.id,
      projectId,
      bookId,
      endpoint: "generate-recap",
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
      endpoint: "generate-recap",
    });

    // Optionally save the recap to the book
    // Note: previously_on column may not be in generated types yet
    if (save) {
      const { error: updateError } = await adminSupabase
        .from("books")
        .update({ previously_on: recap } as Record<string, unknown>)
        .eq("id", bookId);

      if (updateError) {
        logger.error("Error saving recap", updateError as Error);
        // Don't fail the request, just log the error
      }
    }

    return Response.json({
      recap,
      previousBooksCount: previousBooks.length,
      saved: save,
    });
  } catch (error) {
    logger.error("Error generating recap", error as Error);

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
