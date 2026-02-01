import { NodeType, Json } from "./database";

/**
 * Options for building graph context for AI generation
 */
export interface GraphContextOptions {
  sceneId: string;
  projectId: string;
  bookId: string;
  chapterId: string;
  focusNodeIds: string[];
  povNodeId?: string;
  depth?: number; // Default: 2
  tokenBudget?: number; // Default: 2500
}

/**
 * A node from the knowledge graph with context metadata
 */
export interface ContextNode {
  id: string;
  type: NodeType;
  name: string;
  description: string | null;
  attributes: Json | null;
  // Character-specific
  characterRole?: string | null;
  characterArc?: string | null;
  // Location-specific
  locationType?: string | null;
  // Event-specific
  eventDate?: string | null;
  // Graph traversal metadata
  depth: number; // 0 = focus node, 1 = direct connection, 2 = 2-hop
  isPov: boolean;
  tags?: string[] | null;
}

/**
 * A relationship between nodes
 */
export interface ContextRelationship {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: NodeType;
  targetId: string;
  targetName: string;
  targetType: NodeType;
  relationshipType: string;
  label: string | null;
  description: string | null;
  weight: number;
  isBidirectional: boolean;
  // Timeline validity
  validFromBookTitle?: string | null;
  validUntilBookTitle?: string | null;
}

/**
 * A scene excerpt for narrative context
 */
export interface SceneExcerpt {
  id: string;
  title: string | null;
  excerpt: string;
  chapterTitle: string;
  orderIndex: number;
  isCurrentChapter: boolean;
}

/**
 * A chapter summary
 */
export interface ChapterSummary {
  id: string;
  title: string;
  summary: string | null;
  orderIndex: number;
  bookTitle: string;
}

/**
 * Book context for series awareness
 */
export interface BookContext {
  id: string;
  title: string;
  synopsis: string | null;
  sortOrder: number;
  isCurrent: boolean;
  // Series recap for current book
  previouslyOn: string | null;
  // Writing style metadata
  povStyle: string | null;
  tense: string | null;
  proseStyle: string | null;
  pacing: string | null;
  dialogueStyle: string | null;
  // Content guidelines
  contentRating: string | null;
  violenceLevel: string | null;
  romanceLevel: string | null;
  // Tone
  tone: string[] | null;
}

/**
 * Event context
 */
export interface EventContext {
  id: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  involvedCharacterNames: string[];
}

/**
 * The complete graph context for AI generation
 */
export interface GraphContext {
  // Scene metadata
  scene: {
    id: string;
    title: string | null;
    timeInStory: string | null;
  };

  // Project/World context
  project: {
    title: string;
    genre: string | null;
    worldDescription: string | null;
    themes: string[] | null;
    // Extended universe metadata
    worldSetting: string | null;
    timePeriod: string | null;
    seriesType: string | null;
    targetAudience: string | null;
    narrativeConventions: string[] | null;
  };

  // Graph data
  nodes: ContextNode[];
  relationships: ContextRelationship[];

  // Narrative context
  previousScenes: SceneExcerpt[];
  chapterSummaries: ChapterSummary[];
  bookContext: BookContext[];
  events: EventContext[];

  // Metadata
  focusNodeIds: string[];
  povNodeId: string | null;
  currentBookId: string;
  currentChapterId: string;
}

/**
 * Result from get_connected_subgraph RPC call
 */
export interface SubgraphRow {
  // Node fields
  node_id: string;
  node_type: NodeType;
  node_name: string;
  node_description: string | null;
  node_attributes: Json | null;
  node_character_role: string | null;
  node_character_arc: string | null;
  node_location_type: string | null;
  node_event_date: string | null;
  node_tags: string[] | null;
  // Edge fields
  edge_id: string | null;
  edge_type: string | null;
  edge_label: string | null;
  edge_description: string | null;
  edge_weight: number | null;
  edge_is_bidirectional: boolean | null;
  // Graph traversal
  connected_to: string | null;
  depth: number;
}

/**
 * Options for context formatting
 */
export interface FormatContextOptions {
  projectTitle: string;
  genre: string | null;
  worldDescription: string | null;
  themes?: string[] | null;
}

/**
 * Token budget allocation by section
 */
export interface TokenBudget {
  sceneMetadata: number;
  povCharacter: number;
  directCharacters: number;
  relationships: number;
  location: number;
  previousScenes: number;
  chapterContext: number;
  twoHopNodes: number;
  events: number;
  factions: number;
}

export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  sceneMetadata: 100,
  povCharacter: 300,
  directCharacters: 400,
  relationships: 400,
  location: 200,
  previousScenes: 500,
  chapterContext: 300,
  twoHopNodes: 200,
  events: 200,
  factions: 200,
};
