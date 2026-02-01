// Supabase Edge Function for enriching story nodes with AI-generated details
// Takes selected nodes and generates additional attributes, expanded descriptions, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";
import { scryptAsync } from "https://esm.sh/@noble/hashes@1.3.3/scrypt";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Node attribute schemas for each type
const NODE_ATTRIBUTE_KEYS: Record<string, string[]> = {
  character: [
    "full_name", "aliases", "age", "date_of_birth", "gender", "pronouns", "species", "occupation",
    "height", "build", "hair_color", "hair_style", "eye_color", "skin_tone", "distinguishing_features", "voice",
    "personality_traits", "strengths", "flaws", "fears", "desires", "values", "quirks", "speech_patterns",
    "backstory", "secrets", "skills",
    "motivation", "internal_conflict", "external_conflict", "arc_summary"
  ],
  location: [
    "location_subtype", "climate", "terrain", "atmosphere",
    "sounds", "smells", "population", "government", "economy", "culture", "architecture",
    "dangers", "resources", "history", "secrets"
  ],
  event: [
    "event_type", "start_date", "end_date", "duration", "location_name",
    "participants", "outcome", "consequences", "causes", "public_knowledge", "historical_significance"
  ],
  item: [
    "item_type", "material", "size", "color", "condition",
    "origin", "creator", "age", "previous_owners", "current_owner",
    "powers", "value", "rarity", "history"
  ],
  faction: [
    "faction_type", "founding_date", "founder", "headquarters", "size",
    "leadership", "ranks", "goals", "methods", "ideology", "symbols", "motto",
    "allies", "enemies", "reputation", "secrets"
  ],
  concept: [
    "concept_type", "origin", "practitioners", "rules", "limitations",
    "manifestations", "history", "public_knowledge", "symbols", "examples"
  ],
};

interface EnrichRequest {
  projectId: string;
  nodeIds: string[];
}

interface StoryNode {
  id: string;
  name: string;
  node_type: string;
  description: string | null;
  character_role: string | null;
  attributes: Record<string, unknown> | null;
}

interface EnrichedNode {
  id: string;
  description?: string;
  attributes: Record<string, unknown>;
}

Deno.serve(async (req) => {
  console.log("========== ENRICH-NODES: Request received ==========");
  console.log("Method:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      console.log("ERROR: Missing authorization header");
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
    console.log("Verifying user...");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("ERROR: Auth failed", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("User verified:", user.id);

    // Parse request
    console.log("Parsing request body...");
    const { projectId, nodeIds }: EnrichRequest = await req.json();
    console.log("Request parsed - projectId:", projectId, "nodeIds count:", nodeIds?.length);

    if (!nodeIds || nodeIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No nodes specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("========== EDGE FUNCTION: ENRICH NODES ==========");
    console.log("User:", user.id);
    console.log("Project:", projectId);
    console.log("Node count:", nodeIds.length);

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

    // Get the nodes to enrich
    const { data: nodes, error: nodesError } = await adminSupabase
      .from("story_nodes")
      .select("*")
      .in("id", nodeIds)
      .eq("project_id", projectId);

    if (nodesError || !nodes || nodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid nodes found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found nodes:", nodes.map(n => `${n.name} (${n.node_type})`));

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

    // Decrypt API key
    const encryptionSecret = Deno.env.get("API_KEY_ENCRYPTION_SECRET");
    if (!encryptionSecret || encryptionSecret.length < 32) {
      console.error("API_KEY_ENCRYPTION_SECRET not configured or too short");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const IV_LENGTH = 16;
    const AUTH_TAG_LENGTH = 16;
    const KEY_LENGTH = 32;
    const combined = Uint8Array.from(atob(profile.ai_key_anthropic), c => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(-AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH, -AUTH_TAG_LENGTH);

    const encryptedWithTag = new Uint8Array(ciphertext.length + authTag.length);
    encryptedWithTag.set(ciphertext, 0);
    encryptedWithTag.set(authTag, ciphertext.length);

    const SCRYPT_SALT = new TextEncoder().encode("novelworld-ai-key-encryption-v1");
    const derivedKey = await scryptAsync(
      new TextEncoder().encode(encryptionSecret),
      SCRYPT_SALT,
      { N: 16384, r: 8, p: 1, dkLen: KEY_LENGTH }
    );

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      derivedKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    let apiKey: string;
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encryptedWithTag
      );
      apiKey = new TextDecoder().decode(decrypted);
    } catch (decryptError) {
      console.error("Decryption failed:", decryptError);
      return new Response(
        JSON.stringify({ error: "Failed to decrypt API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from project
    let projectContext = `# Project: ${project.title}\n\n`;
    if (project.genre) projectContext += `**Genre:** ${project.genre}\n`;
    if (project.subgenres?.length) projectContext += `**Subgenres:** ${project.subgenres.join(", ")}\n`;
    if (project.world_setting) projectContext += `**Setting:** ${project.world_setting}\n`;
    if (project.time_period) projectContext += `**Time Period:** ${project.time_period}\n`;
    if (project.themes?.length) projectContext += `**Themes:** ${project.themes.join(", ")}\n`;
    if (project.description) projectContext += `\n**Description:** ${project.description}\n`;

    // Build the enrichment prompt
    const nodeDescriptions = nodes.map((node: StoryNode) => {
      const existingAttrs = node.attributes || {};
      const attrKeys = NODE_ATTRIBUTE_KEYS[node.node_type] || [];
      const missingAttrs = attrKeys.filter(key => !existingAttrs[key]);

      return {
        id: node.id,
        name: node.name,
        type: node.node_type,
        description: node.description,
        role: node.character_role,
        existingAttributes: existingAttrs,
        missingAttributes: missingAttrs,
      };
    });

    const systemPrompt = `You are a creative fiction writer enriching story universe elements with detailed attributes.

${projectContext}

## Task
For each node provided, generate rich, creative details that fit the story's genre and setting.
Fill in missing attributes while maintaining consistency with existing data.

## Attribute Types
- Text fields: Single values (strings)
- Tags/arrays: Multiple related items (arrays of strings)
- Textarea: Longer descriptions
- Boolean: true/false values

## Guidelines
- Be creative but consistent with the established setting
- Make characters feel real with flaws and complexity
- Give locations sensory details and atmosphere
- Make items and factions distinctive
- Connect elements to the broader story world
- Maintain internal consistency

Respond with valid JSON only, no markdown or explanation.`;

    const userPrompt = `Enrich these ${nodes.length} story elements with detailed attributes.

Current nodes to enrich:
${JSON.stringify(nodeDescriptions, null, 2)}

For each node, generate:
1. An enhanced description (if the current one is brief)
2. All missing attributes appropriate for the node type

Response format (JSON only):
{
  "enriched": [
    {
      "id": "node-uuid",
      "description": "Enhanced description (optional, only if improving)",
      "attributes": {
        "attribute_key": "value or [array of values]",
        ...
      }
    }
  ]
}`;

    // Call Anthropic API
    console.log("Calling Anthropic API...");
    const startTime = Date.now();

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ],
      system: systemPrompt,
    });

    const durationMs = Date.now() - startTime;
    console.log(`AI call completed in ${durationMs}ms`);
    console.log("Usage:", message.usage);

    // Parse the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let enrichedData: { enriched: EnrichedNode[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      enrichedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw response:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", details: String(parseError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update each node
    let updatedCount = 0;
    const updateResults: Array<{ id: string; name: string; success: boolean; error?: string }> = [];

    for (const enriched of enrichedData.enriched || []) {
      const originalNode = nodes.find((n: StoryNode) => n.id === enriched.id);
      if (!originalNode) {
        updateResults.push({ id: enriched.id, name: "Unknown", success: false, error: "Node not found" });
        continue;
      }

      // Merge existing attributes with new ones (new values override)
      const mergedAttributes = {
        ...(originalNode.attributes || {}),
        ...enriched.attributes,
      };

      const updateData: Record<string, unknown> = {
        attributes: mergedAttributes,
      };

      // Update description if provided and longer than existing
      if (enriched.description &&
          (!originalNode.description || enriched.description.length > originalNode.description.length)) {
        updateData.description = enriched.description;
      }

      const { error: updateError } = await adminSupabase
        .from("story_nodes")
        .update(updateData)
        .eq("id", enriched.id);

      if (updateError) {
        console.error(`Failed to update node ${originalNode.name}:`, updateError);
        updateResults.push({ id: enriched.id, name: originalNode.name, success: false, error: updateError.message });
      } else {
        updatedCount++;
        updateResults.push({ id: enriched.id, name: originalNode.name, success: true });
      }
    }

    console.log(`Updated ${updatedCount}/${nodes.length} nodes`);

    return new Response(
      JSON.stringify({
        success: true,
        enriched: updatedCount,
        total: nodes.length,
        results: updateResults,
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
      JSON.stringify({ error: "Enrichment failed", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
