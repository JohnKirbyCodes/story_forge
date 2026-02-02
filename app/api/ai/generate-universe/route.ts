import { generateObject } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { trackAIUsage, extractUsageFromResult } from "@/lib/ai/usage-tracker";
import { getUserProvider, ProviderError } from "@/lib/ai/providers/user-provider";
import { isValidModel } from "@/lib/ai/providers/config";
import { RELATIONSHIP_TYPES, CHARACTER_ROLES } from "@/lib/story-universe-schema";
import { checkMultipleRateLimits, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

export const maxDuration = 180; // 3 minutes for complex generation

// Schema for generated story universe elements
const universeSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string().describe("Character name"),
      description: z.string().describe("Brief character description (2-3 sentences)"),
      character_role: z
        .enum([
          "protagonist",
          "antagonist",
          "deuteragonist",
          "love_interest",
          "mentor",
          "ally",
          "rival",
          "foil",
          "confidant",
          "comic_relief",
          "supporting",
          "minor",
        ])
        .describe("Role in the story"),
      character_arc: z.string().optional().describe("Character's growth trajectory"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  locations: z.array(
    z.object({
      name: z.string().describe("Location name"),
      description: z.string().describe("Description of the location (2-3 sentences)"),
      location_type: z
        .enum([
          "city",
          "town",
          "village",
          "building",
          "room",
          "wilderness",
          "forest",
          "mountain",
          "other",
        ])
        .optional()
        .describe("Type of location"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  factions: z.array(
    z.object({
      name: z.string().describe("Faction/organization name"),
      description: z.string().describe("Description of the faction (2-3 sentences)"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  items: z.array(
    z.object({
      name: z.string().describe("Item name"),
      description: z.string().describe("Description of the item (1-2 sentences)"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  events: z.array(
    z.object({
      name: z.string().describe("Event name"),
      description: z.string().describe("Description of the event (2-3 sentences)"),
      event_date: z.string().optional().describe("When the event occurred in-story"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  concepts: z.array(
    z.object({
      name: z.string().describe("Concept name (magic system, religion, custom, etc.)"),
      description: z.string().describe("Description of the concept (2-3 sentences)"),
      tags: z.array(z.string()).optional().describe("Relevant tags"),
    })
  ),
  relationships: z.array(
    z.object({
      source_name: z.string().describe("Name of the source entity"),
      target_name: z.string().describe("Name of the target entity"),
      relationship_type: z.string().describe("Type of relationship (e.g., friend_of, member_of, lives_in)"),
      description: z.string().optional().describe("Brief description of the relationship"),
      is_bidirectional: z.boolean().describe("Whether the relationship goes both ways"),
    })
  ),
});

// Get all valid relationship types as a flat array
function getAllRelationshipTypes(): string[] {
  const types: string[] = [];
  for (const [, relationshipTypes] of Object.entries(RELATIONSHIP_TYPES)) {
    for (const rt of relationshipTypes) {
      if (!types.includes(rt.value)) {
        types.push(rt.value);
      }
    }
  }
  return types;
}

// Calculate positions for nodes by type
function calculateNodePositions(
  nodesByType: Record<string, number>
): Record<string, { x: number; y: number }[]> {
  const positions: Record<string, { x: number; y: number }[]> = {};
  const typeOrder = ["character", "location", "faction", "item", "event", "concept"];
  const horizontalSpacing = 400;
  const verticalSpacing = 200;
  const typeGap = 500;
  const maxNodesPerColumn = 5;

  let currentX = 0;

  for (const type of typeOrder) {
    const count = nodesByType[type] || 0;
    if (count === 0) continue;

    positions[type] = [];
    const columns = Math.ceil(count / maxNodesPerColumn);

    for (let i = 0; i < count; i++) {
      const col = Math.floor(i / maxNodesPerColumn);
      const row = i % maxNodesPerColumn;
      positions[type].push({
        x: currentX + col * horizontalSpacing,
        y: row * verticalSpacing,
      });
    }

    currentX += columns * horizontalSpacing + typeGap;
  }

  return positions;
}

export async function POST(request: Request) {
  try {
    const {
      projectId,
      model: requestedModel,
      options = {},
    } = await request.json();

    const {
      characterCount = 6,
      locationCount = 4,
      factionCount = 2,
      itemCount = 2,
      eventCount = 3,
      conceptCount = 1,
    } = options;

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

    // Get user's model preference for universe generation
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("ai_model_universe, ai_default_model")
      .eq("id", user.id)
      .single();

    // Determine which model to use: request > universe-specific > default
    const effectiveModel = requestedModel
      || profile?.ai_model_universe
      || profile?.ai_default_model
      || undefined;

    // Get user's configured AI provider
    let providerResult;
    try {
      providerResult = await getUserProvider(adminSupabase, user.id, effectiveModel);
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
    const modelId =
      effectiveModel && isValidModel(provider, effectiveModel)
        ? effectiveModel
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

    // Build context from project settings
    let contextStr = `# Project: ${project.title}\n\n`;

    if (project.genre) contextStr += `**Genre:** ${project.genre}\n`;
    if (project.subgenres?.length)
      contextStr += `**Subgenres:** ${project.subgenres.join(", ")}\n`;
    if (project.world_setting) contextStr += `**Setting:** ${project.world_setting}\n`;
    if (project.time_period) contextStr += `**Time Period:** ${project.time_period}\n`;
    if (project.target_audience)
      contextStr += `**Target Audience:** ${project.target_audience}\n`;
    if (project.content_rating)
      contextStr += `**Content Rating:** ${project.content_rating}\n`;
    if (project.themes?.length)
      contextStr += `**Themes:** ${project.themes.join(", ")}\n`;
    if (project.narrative_conventions?.length)
      contextStr += `**Narrative Conventions:** ${project.narrative_conventions.join(", ")}\n`;
    if (project.description) contextStr += `\n**Description:** ${project.description}\n`;
    if (project.world_description)
      contextStr += `\n**World Description:** ${project.world_description}\n`;

    // Get all valid relationship types for the prompt
    const validRelationshipTypes = getAllRelationshipTypes();
    const characterRoleValues = CHARACTER_ROLES.map((r) => r.value);

    const systemPrompt = `You are a creative fiction writer and worldbuilder. Your task is to generate a rich, interconnected story universe based on the provided project details.

${contextStr}

## Generation Requirements

Create the following elements for this story universe:
- **${characterCount} Characters**: A mix of protagonists, antagonists, and supporting characters appropriate for the genre
- **${locationCount} Locations**: Key settings where the story takes place
- **${factionCount} Factions/Organizations**: Groups, organizations, or factions relevant to the story
- **${itemCount} Items**: Significant objects (weapons, artifacts, documents, etc.)
- **${eventCount} Events**: Important backstory events that shaped the world
- **${conceptCount} Concepts**: World-building elements (magic systems, customs, prophecies, etc.)

## Guidelines

1. **Genre Appropriate**: All elements should fit the ${project.genre || "story"} genre
2. **Interconnected**: Create relationships between characters, locations, and factions
3. **Conflict Ready**: Include natural sources of conflict and tension
4. **Diverse Cast**: Create varied characters with different backgrounds and motivations
5. **Thematic**: Elements should support the themes: ${project.themes?.join(", ") || "universal themes"}

## Valid Character Roles
${characterRoleValues.join(", ")}

## Valid Relationship Types
${validRelationshipTypes.join(", ")}

Create meaningful relationships between the generated elements. Focus on:
- Character-to-character relationships (family, friends, rivals, enemies)
- Character-to-faction memberships and roles
- Character-to-location connections (lives_in, born_in, works_at)
- Faction-to-faction dynamics (allies, rivals, at_war_with)`;

    logger.debug("AI universe generation started", {
      project: project.title,
      provider,
      model: modelId,
      requestedCounts: {
        characters: characterCount,
        locations: locationCount,
        factions: factionCount,
        items: itemCount,
        events: eventCount,
        concepts: conceptCount,
      },
    });

    const startTime = Date.now();

    let result;
    try {
      result = await generateObject({
        model: instance.getModel(modelId),
        schema: universeSchema,
        system: systemPrompt,
        prompt: `Generate a complete story universe for "${project.title}". Create compelling, interconnected elements that support the genre, themes, and setting. Ensure characters have clear roles, locations are vivid, and relationships create potential for conflict and drama.`,
      });
    } catch (genError) {
      logger.error("generateObject error", genError as Error);
      throw genError;
    }

    const durationMs = Date.now() - startTime;
    logger.debug("generateObject completed", {
      resultType: typeof result,
      hasObject: !!result?.object,
    });
    const { inputTokens, outputTokens } = extractUsageFromResult(result);

    // Track AI usage
    await trackAIUsage({
      userId: user.id,
      projectId,
      endpoint: "generate-universe",
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
      endpoint: "generate-universe",
    });

    const generated = result.object;

    logger.debug("Generated universe", {
      keys: Object.keys(generated || {}),
      counts: {
        characters: generated?.characters?.length || 0,
        locations: generated?.locations?.length || 0,
        factions: generated?.factions?.length || 0,
        items: generated?.items?.length || 0,
        events: generated?.events?.length || 0,
        concepts: generated?.concepts?.length || 0,
        relationships: generated?.relationships?.length || 0,
      },
    });

    // Calculate positions for all nodes
    const nodesByType = {
      character: generated.characters?.length || 0,
      location: generated.locations?.length || 0,
      faction: generated.factions?.length || 0,
      item: generated.items?.length || 0,
      event: generated.events?.length || 0,
      concept: generated.concepts?.length || 0,
    };
    const positions = calculateNodePositions(nodesByType);

    // Create a map for node names to IDs (for relationships)
    const nodeNameToId: Record<string, string> = {};

    // Insert all nodes
    const insertedNodes: Array<{ id: string; name: string; node_type: string }> = [];

    // Insert characters
    for (let i = 0; i < generated.characters.length; i++) {
      const char = generated.characters[i];
      const pos = positions.character?.[i] || { x: 0, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: char.name,
          node_type: "character",
          description: char.description,
          character_role: char.character_role,
          character_arc: char.character_arc,
          tags: char.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[char.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: char.name, node_type: "character" });
      }
    }

    // Insert locations
    for (let i = 0; i < generated.locations.length; i++) {
      const loc = generated.locations[i];
      const pos = positions.location?.[i] || { x: 500, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: loc.name,
          node_type: "location",
          description: loc.description,
          location_type: loc.location_type,
          tags: loc.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[loc.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: loc.name, node_type: "location" });
      }
    }

    // Insert factions
    for (let i = 0; i < generated.factions.length; i++) {
      const faction = generated.factions[i];
      const pos = positions.faction?.[i] || { x: 1000, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: faction.name,
          node_type: "faction",
          description: faction.description,
          tags: faction.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[faction.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: faction.name, node_type: "faction" });
      }
    }

    // Insert items
    for (let i = 0; i < generated.items.length; i++) {
      const item = generated.items[i];
      const pos = positions.item?.[i] || { x: 1500, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: item.name,
          node_type: "item",
          description: item.description,
          tags: item.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[item.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: item.name, node_type: "item" });
      }
    }

    // Insert events
    for (let i = 0; i < generated.events.length; i++) {
      const event = generated.events[i];
      const pos = positions.event?.[i] || { x: 2000, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: event.name,
          node_type: "event",
          description: event.description,
          event_date: event.event_date,
          tags: event.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[event.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: event.name, node_type: "event" });
      }
    }

    // Insert concepts
    for (let i = 0; i < generated.concepts.length; i++) {
      const concept = generated.concepts[i];
      const pos = positions.concept?.[i] || { x: 2500, y: i * 200 };
      const { data: node, error } = await adminSupabase
        .from("story_nodes")
        .insert({
          project_id: projectId,
          name: concept.name,
          node_type: "concept",
          description: concept.description,
          tags: concept.tags,
          position_x: pos.x,
          position_y: pos.y,
        })
        .select()
        .single();

      if (!error && node) {
        nodeNameToId[concept.name.toLowerCase()] = node.id;
        insertedNodes.push({ id: node.id, name: concept.name, node_type: "concept" });
      }
    }

    // Insert relationships (edges)
    let insertedEdges = 0;
    for (const rel of generated.relationships) {
      const sourceId = nodeNameToId[rel.source_name.toLowerCase()];
      const targetId = nodeNameToId[rel.target_name.toLowerCase()];

      if (sourceId && targetId && sourceId !== targetId) {
        // Validate relationship type
        const isValidType = validRelationshipTypes.includes(rel.relationship_type);
        const relType = isValidType ? rel.relationship_type : "related_to";

        const { error } = await adminSupabase.from("story_edges").insert({
          project_id: projectId,
          source_node_id: sourceId,
          target_node_id: targetId,
          relationship_type: relType,
          description: rel.description,
          is_bidirectional: rel.is_bidirectional,
        });

        if (!error) {
          insertedEdges++;
        }
      }
    }

    logger.debug("Inserted universe elements", { nodes: insertedNodes.length, edges: insertedEdges });

    return Response.json({
      success: true,
      nodes: insertedNodes.length,
      edges: insertedEdges,
      generated: {
        characters: generated.characters.length,
        locations: generated.locations.length,
        factions: generated.factions.length,
        items: generated.items.length,
        events: generated.events.length,
        concepts: generated.concepts.length,
        relationships: insertedEdges,
      },
    });
  } catch (error) {
    logger.error("Error generating universe", error as Error);

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
