// Supabase Edge Function for generating story universe elements
// This runs with longer timeouts than Vercel serverless functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";
import { scryptAsync } from "https://esm.sh/@noble/hashes@1.3.3/scrypt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Character roles for the schema
const CHARACTER_ROLES = [
  "protagonist", "antagonist", "deuteragonist", "love_interest",
  "mentor", "ally", "rival", "foil", "confidant", "comic_relief",
  "supporting", "minor"
] as const;

// Relationship types
const RELATIONSHIP_TYPES = [
  "friend_of", "enemy_of", "family_of", "lover_of", "mentor_of",
  "student_of", "ally_of", "rival_of", "works_for", "employs",
  "member_of", "leader_of", "lives_in", "born_in", "died_in",
  "owns", "created", "destroyed", "participated_in", "witnessed"
];

interface GenerateRequest {
  projectId: string;
  options?: {
    characterCount?: number;
    locationCount?: number;
    factionCount?: number;
    itemCount?: number;
    eventCount?: number;
    conceptCount?: number;
  };
}

interface GeneratedElement {
  name: string;
  description: string;
  [key: string]: unknown;
}

interface GeneratedUniverse {
  characters: Array<GeneratedElement & { character_role?: string; character_arc?: string; tags?: string[] }>;
  locations: Array<GeneratedElement & { location_type?: string; tags?: string[] }>;
  factions: Array<GeneratedElement & { tags?: string[] }>;
  items: Array<GeneratedElement & { tags?: string[] }>;
  events: Array<GeneratedElement & { event_date?: string; tags?: string[] }>;
  concepts: Array<GeneratedElement & { tags?: string[] }>;
  relationships: Array<{
    source_name: string;
    target_name: string;
    relationship_type: string;
    description?: string;
    is_bidirectional: boolean;
  }>;
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { projectId, options = {} }: GenerateRequest = await req.json();

    const {
      characterCount = 6,
      locationCount = 4,
      factionCount = 2,
      itemCount = 2,
      eventCount = 3,
      conceptCount = 1,
    } = options;

    console.log("========== EDGE FUNCTION: AI UNIVERSE GENERATION ==========");
    console.log("User:", user.id);
    console.log("Project:", projectId);
    console.log("Counts:", { characterCount, locationCount, factionCount, itemCount, eventCount, conceptCount });

    // Use admin client for data operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user owns the project
    const { data: project, error: projectError } = await adminSupabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's API key
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("ai_key_anthropic, ai_key_valid_anthropic")
      .eq("id", user.id)
      .single();

    if (!profile?.ai_key_anthropic || !profile?.ai_key_valid_anthropic) {
      return new Response(
        JSON.stringify({
          error: "provider_error",
          message: "No valid Anthropic API key configured. Please add your API key in Settings."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt API key (embedded format: base64(IV + ciphertext + authTag))
    const encryptionSecret = Deno.env.get("API_KEY_ENCRYPTION_SECRET");
    if (!encryptionSecret || encryptionSecret.length < 32) {
      console.error("API_KEY_ENCRYPTION_SECRET not configured or too short");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the combined base64 string
    const IV_LENGTH = 16;
    const AUTH_TAG_LENGTH = 16;
    const combined = Uint8Array.from(atob(profile.ai_key_anthropic), c => c.charCodeAt(0));

    // Extract parts: IV (first 16 bytes), authTag (last 16 bytes), ciphertext (middle)
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(-AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH, -AUTH_TAG_LENGTH);

    // Combine ciphertext + authTag for AES-GCM (Web Crypto expects them together)
    const encryptedWithTag = new Uint8Array(ciphertext.length + authTag.length);
    encryptedWithTag.set(ciphertext, 0);
    encryptedWithTag.set(authTag, ciphertext.length);

    // Derive key using scrypt (matching Node.js implementation)
    const SCRYPT_SALT = new TextEncoder().encode("novelworld-ai-key-encryption-v1");
    const KEY_LENGTH = 32;
    const derivedKey = await scryptAsync(
      new TextEncoder().encode(encryptionSecret),
      SCRYPT_SALT,
      { N: 16384, r: 8, p: 1, dkLen: KEY_LENGTH }
    );

    // Import the derived key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      derivedKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Decrypt
    let apiKey: string;
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encryptedWithTag
      );
      apiKey = new TextDecoder().decode(decrypted);
    } catch (decryptError) {
      console.error("Decryption failed, trying legacy key:", decryptError);
      // Fall back to legacy key (raw bytes from secret)
      const legacyKey = new TextEncoder().encode(encryptionSecret.slice(0, KEY_LENGTH));
      const legacyCryptoKey = await crypto.subtle.importKey(
        "raw",
        legacyKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        legacyCryptoKey,
        encryptedWithTag
      );
      apiKey = new TextDecoder().decode(decrypted);
    }

    // Build context from project
    let contextStr = `# Project: ${project.title}\n\n`;
    if (project.genre) contextStr += `**Genre:** ${project.genre}\n`;
    if (project.subgenres?.length) contextStr += `**Subgenres:** ${project.subgenres.join(", ")}\n`;
    if (project.world_setting) contextStr += `**Setting:** ${project.world_setting}\n`;
    if (project.time_period) contextStr += `**Time Period:** ${project.time_period}\n`;
    if (project.target_audience) contextStr += `**Target Audience:** ${project.target_audience}\n`;
    if (project.themes?.length) contextStr += `**Themes:** ${project.themes.join(", ")}\n`;
    if (project.description) contextStr += `\n**Description:** ${project.description}\n`;

    const systemPrompt = `You are a creative fiction writer and worldbuilder. Generate a story universe based on the project details.

${contextStr}

## Requirements
Create exactly:
- ${characterCount} Characters (mix of protagonists, antagonists, supporting)
- ${locationCount} Locations (key settings)
- ${factionCount} Factions/Organizations
- ${itemCount} Items (significant objects)
- ${eventCount} Events (backstory events)
- ${conceptCount} Concepts (world-building elements)

## Valid Character Roles
${CHARACTER_ROLES.join(", ")}

## Valid Relationship Types
${RELATIONSHIP_TYPES.join(", ")}

Respond with valid JSON matching this exact structure:
{
  "characters": [{"name": "string", "description": "string", "character_role": "protagonist|antagonist|...", "character_arc": "optional string", "tags": ["optional"]}],
  "locations": [{"name": "string", "description": "string", "location_type": "city|town|building|...", "tags": ["optional"]}],
  "factions": [{"name": "string", "description": "string", "tags": ["optional"]}],
  "items": [{"name": "string", "description": "string", "tags": ["optional"]}],
  "events": [{"name": "string", "description": "string", "event_date": "optional", "tags": ["optional"]}],
  "concepts": [{"name": "string", "description": "string", "tags": ["optional"]}],
  "relationships": [{"source_name": "string", "target_name": "string", "relationship_type": "friend_of|enemy_of|...", "description": "optional", "is_bidirectional": true|false}]
}`;

    // Call Anthropic API directly
    console.log("Calling Anthropic API...");
    const startTime = Date.now();

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Generate a complete story universe for "${project.title}". Create compelling, interconnected elements. Respond ONLY with valid JSON, no markdown or explanation.`
        }
      ],
      system: systemPrompt,
    });

    const durationMs = Date.now() - startTime;
    console.log(`AI call completed in ${durationMs}ms`);
    console.log("Usage:", message.usage);

    // Parse the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    console.log("Response length:", responseText.length);

    let generated: GeneratedUniverse;
    try {
      // Try to extract JSON from the response (in case there's markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      generated = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw response:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", details: String(parseError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed counts:", {
      characters: generated.characters?.length || 0,
      locations: generated.locations?.length || 0,
      factions: generated.factions?.length || 0,
      items: generated.items?.length || 0,
      events: generated.events?.length || 0,
      concepts: generated.concepts?.length || 0,
      relationships: generated.relationships?.length || 0,
    });

    // Calculate positions
    const nodesByType = {
      character: generated.characters?.length || 0,
      location: generated.locations?.length || 0,
      faction: generated.factions?.length || 0,
      item: generated.items?.length || 0,
      event: generated.events?.length || 0,
      concept: generated.concepts?.length || 0,
    };
    const positions = calculateNodePositions(nodesByType);

    // Insert nodes
    const nodeNameToId: Record<string, string> = {};
    const insertedNodes: Array<{ id: string; name: string; node_type: string }> = [];

    // Insert characters
    for (let i = 0; i < (generated.characters?.length || 0); i++) {
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
    for (let i = 0; i < (generated.locations?.length || 0); i++) {
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
    for (let i = 0; i < (generated.factions?.length || 0); i++) {
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
    for (let i = 0; i < (generated.items?.length || 0); i++) {
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
    for (let i = 0; i < (generated.events?.length || 0); i++) {
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
    for (let i = 0; i < (generated.concepts?.length || 0); i++) {
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

    // Insert relationships
    let insertedEdges = 0;
    for (const rel of generated.relationships || []) {
      const sourceId = nodeNameToId[rel.source_name.toLowerCase()];
      const targetId = nodeNameToId[rel.target_name.toLowerCase()];

      if (sourceId && targetId) {
        const { error } = await adminSupabase.from("story_edges").insert({
          project_id: projectId,
          source_node_id: sourceId,
          target_node_id: targetId,
          relationship_type: rel.relationship_type,
          description: rel.description,
          is_bidirectional: rel.is_bidirectional,
        });

        if (!error) insertedEdges++;
      }
    }

    console.log(`Inserted ${insertedNodes.length} nodes and ${insertedEdges} edges`);

    return new Response(
      JSON.stringify({
        success: true,
        nodes: insertedNodes,
        edgesCreated: insertedEdges,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          durationMs,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Generation failed", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
