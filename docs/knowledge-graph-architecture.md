# Knowledge Graph Context Architecture

## Executive Summary

StoryForge's key differentiator is its **Knowledge Graph Architecture** where stories are modeled as connected graphs of Nodes and Edges. Currently, this architecture exists in the database but is **not utilized** for AI generation. This document outlines how to properly implement graph-powered context building.

---

## Current State vs Target State

```
CURRENT IMPLEMENTATION                    TARGET IMPLEMENTATION
========================                  ========================
Scene                                     Scene
  │                                         │
  ▼                                         ▼
Direct Node Lookup ──► Flat Context       Focus Nodes
  │                                         │
  │ (story_edges IGNORED)                   ▼
  │ (no graph traversal)                  Graph Traversal (depth=2)
  │ (2 scenes, same chapter)                │
  │                                         ├─► Relationships
  ▼                                         ├─► Connected Nodes
"Bob: A brave knight"                       ├─► Timeline-aware context
                                            ├─► Cross-chapter history
                                            ├─► Cross-book continuity
                                            │
                                            ▼
                                          Rich Structured Context
```

---

## Architecture Layers

### Layer 1: Database Functions (EXISTS)
```
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Functions                                    │
│  ─────────────────────                                   │
│  • get_connected_subgraph() - Recursive CTE traversal   │
│  • Vector similarity search via pgvector                 │
│  • Timeline-aware edge filtering                         │
└─────────────────────────────────────────────────────────┘
```

### Layer 2: Graph Context Service (TO BUILD)
```
┌─────────────────────────────────────────────────────────┐
│  lib/ai/graph-context.ts                                │
│  ────────────────────────                                │
│  • buildGraphContext(options) - Main orchestrator       │
│  • traverseGraph() - Calls get_connected_subgraph       │
│  • formatRelationships() - Human-readable edges         │
│  • buildNarrativeContext() - Scenes, chapters, books    │
│  • prioritizeContext() - Token budget management        │
└─────────────────────────────────────────────────────────┘
```

### Layer 3: Context Formatter (TO BUILD)
```
┌─────────────────────────────────────────────────────────┐
│  lib/ai/context-formatter.ts                            │
│  ───────────────────────────                             │
│  • formatForPrompt() - Converts context to AI text      │
│  • Sections: Characters, Relationships, Locations,      │
│              Events, Factions, Previous Scenes          │
└─────────────────────────────────────────────────────────┘
```

### Layer 4: API Integration (TO MODIFY)
```
┌─────────────────────────────────────────────────────────┐
│  app/api/ai/generate-scene/route.ts                     │
│  ──────────────────────────────────                      │
│  • Use GraphContextService instead of flat queries      │
│  • Pass rich context to system prompt                   │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        GENERATE SCENE REQUEST                     │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 1. IDENTIFY FOCUS NODES                                      │ │
│  │    • Characters linked via scene_characters                  │ │
│  │    • Location from scene.location_id                         │ │
│  │    • POV character from scene.pov_character_id               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 2. TRAVERSE GRAPH                                            │ │
│  │    SELECT * FROM get_connected_subgraph(                     │ │
│  │      project_id,                                             │ │
│  │      focus_node_ids[],                                       │ │
│  │      depth := 2,                                             │ │
│  │      current_book_id  -- for timeline filtering              │ │
│  │    )                                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 3. FETCH NARRATIVE CONTEXT                                   │ │
│  │    • Previous scenes (same chapter + previous chapters)      │ │
│  │    • Chapter summaries                                       │ │
│  │    • Book synopsis (current + previous in series)            │ │
│  │    • Events involving focus characters                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 4. FORMAT CONTEXT                                            │ │
│  │    • Prioritize by relevance (POV > direct > 2-hop)          │ │
│  │    • Apply token budget (~2500 tokens for context)           │ │
│  │    • Structure for AI consumption                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 5. GENERATE PROSE                                            │ │
│  │    System Prompt: World + Book + Chapter + Rich Context      │ │
│  │    User Prompt: Beat Instructions                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Context Structure

### Example Output for AI Prompt

```markdown
## Story World
- Project: The Crimson Chronicles
- Genre: Epic Fantasy
- World: A medieval realm where magic is fading...

## Current Book: The Shattered Crown (Book 2)
Synopsis: Following the fall of King Aldric, the realm descends into civil war...

## Current Chapter: The Merchant's Gambit
Summary: Tensions rise as trade routes are blocked...

## Characters in This Scene

### Sir Robert (POV Character)
- Role: Protagonist
- Description: A battle-scarred knight haunted by his failure to save the king
- Arc: Seeking redemption through protecting the heir
- Attributes: Age 34, former King's Guard, carries the Oathbreaker sword

### Lady Mira
- Description: Cunning merchant's daughter with connections to the underground
- Attributes: Age 28, speaks five languages, has a network of informants

## Character Relationships
- Sir Robert **is_married_to** Lady Elena (estranged since Book 1)
- Sir Robert **swore_fealty_to** Prince Aldric (the heir)
- Sir Robert **is_rivals_with** Lord Caine (over their differing loyalties)
- Lady Mira **is_allied_with** The Merchant's Guild
- Lady Mira **secretly_serves** Prince Aldric

## Location: The Rusty Dagger Tavern
- Type: Building
- Description: A seedy establishment in the Merchant District, known for discrete meetings
- Part of: Merchant District → Oldtown → Capital City

## Faction Dynamics
- The Merchant's Guild is currently **neutral** in the civil war
- The Crown Loyalists are **at_war_with** The Usurper's Forces
- The Thieves' Guild is **allied_with** whoever pays more

## Recent Events
- The Battle of Thornfield (3 chapters ago): Sir Robert's regiment was ambushed
- Lady Mira's Brother Executed (previous chapter): Creates tension with Crown

## Previous Scene Context
...The knight watched the flames consume the last of the dispatch. Whatever secrets
it held were now ash. He turned to face the merchant's daughter, her expression
unreadable in the flickering light. "You said you had information about the
Prince's whereabouts," he said, his hand resting on his sword hilt...

## Previous Chapter Summary
Sir Robert arrived in Oldtown seeking allies, only to find the city divided...
```

---

## Implementation Plan

### Phase 1: Graph Context Service
**File:** `lib/ai/graph-context.ts`

```typescript
interface GraphContextOptions {
  sceneId: string;
  projectId: string;
  bookId: string;
  chapterId: string;
  focusNodeIds: string[];
  depth?: number;
  tokenBudget?: number;
}

interface GraphContext {
  // Nodes from graph traversal
  nodes: {
    id: string;
    type: NodeType;
    name: string;
    description: string;
    attributes: Record<string, unknown>;
    depth: number; // 0 = focus, 1 = direct connection, 2 = 2-hop
    isPov: boolean;
  }[];

  // Edges from graph traversal
  relationships: {
    sourceId: string;
    sourceName: string;
    targetId: string;
    targetName: string;
    type: string;
    label: string;
    description: string;
    validFrom?: string; // book title
    validUntil?: string;
  }[];

  // Narrative context
  previousScenes: { title: string; excerpt: string; }[];
  chapterSummaries: { title: string; summary: string; }[];
  bookContext: { title: string; synopsis: string; }[];
  events: { name: string; description: string; when: string; }[];
}
```

### Phase 2: Database Queries

**Fetch Graph Data:**
```typescript
const { data } = await supabase.rpc('get_connected_subgraph', {
  p_project_id: projectId,
  p_focus_node_ids: focusNodeIds,
  p_depth: 2,
  p_current_book_id: bookId
});
```

**Fetch Narrative Context:**
```typescript
// Previous scenes (current chapter + previous chapter)
// Chapter summaries (current book)
// Previous book summaries (if series)
// Events involving focus characters
```

### Phase 3: Context Formatter
**File:** `lib/ai/context-formatter.ts`

- Format nodes by type (characters, locations, items, factions)
- Format relationships as natural language
- Format narrative context with excerpts
- Apply token budget with priority ordering

### Phase 4: API Integration
**File:** `app/api/ai/generate-scene/route.ts`

Replace flat queries with:
```typescript
const graphContext = await buildGraphContext({
  sceneId,
  projectId,
  bookId,
  chapterId,
  focusNodeIds,
  depth: 2,
  tokenBudget: 2500
});

const systemPrompt = formatContextForPrompt(graphContext);
```

---

## Token Budget Strategy

| Section | Max Tokens | Priority |
|---------|------------|----------|
| Scene Metadata | 100 | Required |
| POV Character | 300 | Required |
| Direct Characters | 400 | High |
| Relationships | 400 | High |
| Location | 200 | Medium |
| Previous Scenes | 500 | Medium |
| Chapter/Book Context | 300 | Medium |
| 2-hop Nodes | 200 | Low |
| Events | 200 | Low |
| **Total** | **2600** | - |

Priority ordering ensures most important context is included if budget is exceeded.

---

## Files to Create/Modify

### New Files
1. `lib/ai/graph-context.ts` - Graph traversal and context building
2. `lib/ai/context-formatter.ts` - Format context for AI prompts
3. `types/graph-context.ts` - TypeScript interfaces

### Modified Files
1. `app/api/ai/generate-scene/route.ts` - Use new context service

---

## Success Metrics

After implementation, the AI should be able to:
1. Reference character relationships not explicitly stated in beats
2. Maintain consistency with established facts from previous scenes/chapters
3. Incorporate faction dynamics and political context
4. Handle timeline-dependent relationships (e.g., "They were friends until Book 2")
5. Use location details and hierarchies naturally
6. Reference relevant events from story history
