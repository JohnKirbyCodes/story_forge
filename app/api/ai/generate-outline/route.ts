import { generateObject } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { trackAIUsage, extractUsageFromResult } from "@/lib/ai/usage-tracker";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

export const maxDuration = 120;

// Schema for the generated outline
const outlineSchema = z.object({
  chapters: z.array(
    z.object({
      title: z.string().describe("Chapter title"),
      summary: z.string().describe("Brief chapter summary (1-2 sentences)"),
      scenes: z.array(
        z.object({
          title: z.string().optional().describe("Optional scene title"),
          beat_instructions: z
            .string()
            .describe(
              "Detailed beat instructions for this scene - what happens, key moments, character actions"
            ),
          mood: z
            .enum([
              "tense",
              "romantic",
              "mysterious",
              "humorous",
              "melancholic",
              "hopeful",
              "dramatic",
              "peaceful",
              "action",
              "suspenseful",
            ])
            .optional()
            .describe("Scene mood"),
          tension_level: z
            .enum(["low", "medium", "high", "peak"])
            .optional()
            .describe("Tension level (peak = climactic moments)"),
          // Node references for auto-linking
          characters: z
            .array(z.string())
            .optional()
            .describe("Names of characters appearing in this scene"),
          pov_character: z
            .string()
            .optional()
            .describe("Name of the POV character for this scene (if applicable)"),
          location: z
            .string()
            .optional()
            .describe("Name of the location where this scene takes place"),
        })
      ),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const { bookId, projectId, chapterCount, scenesPerChapter, model: requestedModel } =
      await request.json();

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
    const concepts = storyNodes?.filter((n) => n.node_type === "concept") || [];

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
    if (project.description) contextStr += `World: ${project.description}\n`;

    contextStr += `\n## Book: ${book.title}\n`;
    if (book.subtitle) contextStr += `Subtitle: ${book.subtitle}\n`;
    if (book.synopsis) contextStr += `Synopsis: ${book.synopsis}\n`;

    // Add style settings
    const styleSettings: string[] = [];
    if (book.pov_style) styleSettings.push(`POV: ${book.pov_style}`);
    if (book.tense) styleSettings.push(`Tense: ${book.tense}`);
    if (book.prose_style) styleSettings.push(`Prose Style: ${book.prose_style}`);
    if (book.pacing) styleSettings.push(`Pacing: ${book.pacing}`);
    if (book.content_rating) styleSettings.push(`Rating: ${book.content_rating}`);
    if (book.tone && Array.isArray(book.tone)) styleSettings.push(`Tone: ${book.tone.join(", ")}`);
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

    // Add concepts (world-building elements)
    if (concepts.length > 0) {
      contextStr += `\n## Concepts (World-building)\n`;
      concepts.forEach((c) => {
        contextStr += formatNode(c) + "\n";
      });
    }

    // Add relationships
    contextStr += formatRelationships();

    const systemPrompt = `You are an expert fiction writer and story architect. Your task is to create a detailed chapter-by-chapter outline for a novel based on the provided story universe and book details.

${contextStr}

## Guidelines for Outline Generation

1. **Structure**: Create ${chapterCount || "10-15"} chapters, each with ${scenesPerChapter || "2-4"} scenes
2. **Pacing**: Follow classic story structure (setup, rising action, midpoint, climax, resolution)
3. **Characters**: Feature the established characters appropriately based on their roles
4. **Locations**: Use the defined locations meaningfully
5. **Consistency**: Respect established relationships and world rules
6. **Beat Instructions**: Each scene's beat_instructions should be detailed enough (2-4 sentences) to guide prose generation, including:
   - What happens in the scene
   - Key character actions or dialogue moments
   - Emotional beats and tension points
   - Setting details if relevant

## Scene Node References (IMPORTANT)
For each scene, you MUST specify:
- **characters**: An array of character names (from the Characters list above) who appear in this scene. Use exact names as listed.
- **pov_character**: The name of the POV character for the scene (if the story uses limited POV). Must be one of the characters in the scene.
- **location**: The name of the location (from the Locations list above) where the scene takes place. Use exact name as listed.

These references will be used to automatically link story elements to scenes.

Create a compelling narrative arc that fits the synopsis and uses the established story elements.`;

    console.log("\n========== AI OUTLINE GENERATION ==========");
    console.log("Book:", book.title);
    console.log("Provider:", provider);
    console.log("Model:", modelId);
    console.log("Chapters requested:", chapterCount || "10-15");
    console.log("Scenes per chapter:", scenesPerChapter || "2-4");
    console.log("Story Nodes:", {
      characters: characters.length,
      locations: locations.length,
      factions: factions.length,
      events: events.length,
      items: items.length,
      concepts: concepts.length,
    });
    console.log("Relationships:", storyEdges?.length || 0);
    console.log("============================================\n");

    const startTime = Date.now();

    const result = await generateObject({
      model: instance.getModel(modelId),
      schema: outlineSchema,
      system: systemPrompt,
      prompt: `Generate a complete chapter outline for "${book.title}". Create a compelling narrative structure with detailed scene beats that can be expanded into full prose.`,
    });

    const durationMs = Date.now() - startTime;
    const { inputTokens, outputTokens } = extractUsageFromResult(result);

    // Track AI usage (no word quota - BYOK model)
    await trackAIUsage({
      userId: user.id,
      projectId,
      bookId,
      endpoint: "generate-outline",
      model: `${provider}:${modelId}`,
      inputTokens,
      outputTokens,
      durationMs,
      status: "success",
    });

    console.log(`AI Usage: ${inputTokens} input, ${outputTokens} output tokens in ${durationMs}ms`);

    // Build node name-to-ID mapping for the frontend to link scenes to nodes
    const nodeMapping: Record<string, { id: string; type: string }> = {};
    if (storyNodes) {
      for (const node of storyNodes) {
        // Use lowercase name as key for case-insensitive matching
        nodeMapping[node.name.toLowerCase()] = {
          id: node.id,
          type: node.node_type,
        };
      }
    }

    return Response.json({
      ...result.object,
      nodeMapping,
    });
  } catch (error) {
    console.error("Error generating outline:", error);

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
