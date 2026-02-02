import { generateText } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { trackAIUsage, extractUsageFromResult } from "@/lib/ai/usage-tracker";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { bookId, projectId, model: requestedModel } = await request.json();

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
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Get book details
    const { data: book, error: bookError } = await adminSupabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("project_id", projectId)
      .single();

    if (bookError || !book) {
      return new Response("Book not found", { status: 404 });
    }

    // Get story nodes for context
    const { data: storyNodes } = await adminSupabase
      .from("story_nodes")
      .select("*")
      .eq("project_id", projectId);

    // Get existing edges for relationships
    const { data: storyEdges } = await adminSupabase
      .from("story_edges")
      .select("*, source:story_nodes!story_edges_source_node_id_fkey(name, node_type), target:story_nodes!story_edges_target_node_id_fkey(name, node_type)")
      .eq("project_id", projectId);

    // Build context for the AI
    const characters = storyNodes?.filter((n) => n.node_type === "character") || [];
    const locations = storyNodes?.filter((n) => n.node_type === "location") || [];
    const factions = storyNodes?.filter((n) => n.node_type === "faction") || [];
    const events = storyNodes?.filter((n) => n.node_type === "event") || [];
    const items = storyNodes?.filter((n) => n.node_type === "item") || [];

    // Format nodes for prompt
    const formatNode = (node: typeof storyNodes extends (infer T)[] | null ? T : never) => {
      let str = `- ${node.name}`;
      if (node.description) str += `: ${node.description}`;
      if (node.character_role) str += ` (${node.character_role})`;
      return str;
    };

    // Format relationships
    const formatRelationships = () => {
      if (!storyEdges || storyEdges.length === 0) return "";
      const rels = storyEdges
        .map((e) => {
          const source = e.source as { name: string; node_type: string } | null;
          const target = e.target as { name: string; node_type: string } | null;
          if (!source || !target) return null;
          const relLabel = e.relationship_type.replace(/_/g, " ");
          return `- ${source.name} ${relLabel} ${target.name}${e.description ? ` (${e.description})` : ""}`;
        })
        .filter(Boolean);
      return rels.length > 0 ? `\n\n## Key Relationships\n${rels.join("\n")}` : "";
    };

    // Build the context string
    let contextStr = `# Story Universe\n\n`;
    contextStr += `## Project: ${project.title}\n`;
    if (project.genre) contextStr += `Genre: ${project.genre}\n`;
    if (project.description) contextStr += `World Description: ${project.description}\n`;
    if (project.world_setting) contextStr += `World Setting: ${project.world_setting}\n`;
    if (project.time_period) contextStr += `Time Period: ${project.time_period}\n`;
    if (project.world_description) contextStr += `Detailed World: ${project.world_description}\n`;
    if (project.themes && Array.isArray(project.themes) && project.themes.length > 0) {
      contextStr += `Themes: ${project.themes.join(", ")}\n`;
    }

    contextStr += `\n## Book: ${book.title}\n`;
    if (book.subtitle) contextStr += `Subtitle: ${book.subtitle}\n`;

    // Add style settings
    const styleSettings: string[] = [];
    if (book.pov_style) styleSettings.push(`POV: ${book.pov_style}`);
    if (book.tense) styleSettings.push(`Tense: ${book.tense}`);
    if (book.prose_style) styleSettings.push(`Prose Style: ${book.prose_style}`);
    if (book.pacing) styleSettings.push(`Pacing: ${book.pacing}`);
    if (book.content_rating) styleSettings.push(`Content Rating: ${book.content_rating}`);
    if (book.tone && Array.isArray(book.tone)) styleSettings.push(`Tone: ${book.tone.join(", ")}`);
    if (book.target_word_count) styleSettings.push(`Target Length: ~${book.target_word_count.toLocaleString()} words`);
    if (styleSettings.length > 0) {
      contextStr += `\n### Writing Style\n${styleSettings.join("\n")}\n`;
    }

    // Add characters
    if (characters.length > 0) {
      contextStr += `\n## Characters\n`;
      characters.forEach((c) => {
        contextStr += formatNode(c) + "\n";
      });
    }

    // Add locations
    if (locations.length > 0) {
      contextStr += `\n## Locations\n`;
      locations.forEach((l) => {
        contextStr += formatNode(l) + "\n";
      });
    }

    // Add factions
    if (factions.length > 0) {
      contextStr += `\n## Factions/Organizations\n`;
      factions.forEach((f) => {
        contextStr += formatNode(f) + "\n";
      });
    }

    // Add events (backstory)
    if (events.length > 0) {
      contextStr += `\n## Important Events (Backstory)\n`;
      events.forEach((e) => {
        contextStr += formatNode(e) + "\n";
      });
    }

    // Add items
    if (items.length > 0) {
      contextStr += `\n## Notable Items\n`;
      items.forEach((i) => {
        contextStr += formatNode(i) + "\n";
      });
    }

    // Add relationships
    contextStr += formatRelationships();

    const systemPrompt = `You are an expert fiction writer specializing in crafting compelling book synopses. Your task is to create a synopsis for a novel based on the provided story universe, characters, and book details.

${contextStr}

## Guidelines for Synopsis Generation

1. **Length**: Write a synopsis of 150-300 words that captures the essence of the story
2. **Structure**: Include the main characters, central conflict, and hint at the story arc
3. **Tone**: Match the synopsis tone to the book's genre and style settings
4. **Hook**: Start with a compelling hook that draws readers in
5. **Avoid Spoilers**: Hint at stakes and conflict without revealing the ending
6. **Characters**: Feature the main characters and their goals/conflicts
7. **World**: Incorporate relevant world-building elements naturally

Write the synopsis in a professional, engaging style suitable for a book description. Do not include any preamble, headers, or meta-commentary - just write the synopsis text directly.`;

    logger.debug("AI synopsis generation started", {
      book: book.title,
      provider,
      model: modelId,
      characters: characters.length,
      locations: locations.length,
      relationships: storyEdges?.length || 0,
    });

    const startTime = Date.now();

    const result = await generateText({
      model: instance.getModel(modelId),
      system: systemPrompt,
      prompt: `Generate a compelling synopsis for "${book.title}".`,
    });

    const durationMs = Date.now() - startTime;
    const synopsis = result.text.trim();

    // Extract usage metrics
    const { inputTokens, outputTokens } = extractUsageFromResult(result);

    // Track AI usage (no word quota - BYOK model)
    await trackAIUsage({
      userId: user.id,
      projectId,
      bookId,
      endpoint: "generate-synopsis",
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
      endpoint: "generate-synopsis",
    });

    return Response.json({ synopsis });
  } catch (error) {
    logger.error("Error generating synopsis", error as Error);

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
