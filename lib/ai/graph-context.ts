import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import {
  GraphContext,
  GraphContextOptions,
  ContextNode,
  ContextRelationship,
  SceneExcerpt,
  ChapterSummary,
  BookContext,
  EventContext,
  SubgraphRow,
} from "@/types/graph-context";

/**
 * Build comprehensive graph context for AI scene generation
 */
export async function buildGraphContext(
  supabase: SupabaseClient<Database>,
  options: GraphContextOptions
): Promise<GraphContext> {
  const {
    sceneId,
    projectId,
    bookId,
    chapterId,
    focusNodeIds,
    povNodeId,
    depth = 2,
  } = options;

  // Fetch all data in parallel for performance
  const [
    sceneData,
    projectData,
    graphData,
    sceneCharactersData,
    previousScenesData,
    chapterSummariesData,
    booksData,
    eventsData,
  ] = await Promise.all([
    // Scene metadata
    supabase
      .from("scenes")
      .select("id, title, time_in_story")
      .eq("id", sceneId)
      .single(),

    // Project metadata (including new universe fields)
    supabase
      .from("projects")
      .select("title, genre, world_description, themes, world_setting, time_period, series_type, target_audience, narrative_conventions")
      .eq("id", projectId)
      .single(),

    // Graph traversal - call the RPC function
    focusNodeIds.length > 0
      ? supabase.rpc("get_connected_subgraph", {
          p_project_id: projectId,
          p_focus_node_ids: focusNodeIds,
          p_depth: depth,
          p_current_book_id: bookId,
        })
      : Promise.resolve({ data: [], error: null }),

    // Scene characters with full node data
    supabase
      .from("scene_characters")
      .select(
        `
        pov,
        node_id,
        story_nodes (
          id,
          node_type,
          name,
          description,
          attributes,
          character_role,
          character_arc,
          location_type,
          event_date,
          tags
        )
      `
      )
      .eq("scene_id", sceneId),

    // Previous scenes (current chapter + previous chapter)
    fetchPreviousScenes(supabase, chapterId, bookId, sceneId),

    // Chapter summaries
    fetchChapterSummaries(supabase, bookId),

    // Book context (for series)
    fetchBookContext(supabase, projectId, bookId),

    // Events involving focus characters
    focusNodeIds.length > 0
      ? fetchRelatedEvents(supabase, projectId, focusNodeIds)
      : Promise.resolve([]),
  ]);

  // Process graph data into nodes and relationships
  const { nodes, relationships } = processGraphData(
    graphData.data as SubgraphRow[] | null,
    sceneCharactersData.data,
    povNodeId || null
  );

  // Build the context object
  const context: GraphContext = {
    scene: {
      id: sceneData.data?.id || sceneId,
      title: sceneData.data?.title || null,
      timeInStory: sceneData.data?.time_in_story || null,
    },
    project: {
      title: projectData.data?.title || "Untitled Project",
      genre: projectData.data?.genre || null,
      worldDescription: projectData.data?.world_description || null,
      themes: projectData.data?.themes || null,
      worldSetting: projectData.data?.world_setting || null,
      timePeriod: projectData.data?.time_period || null,
      seriesType: projectData.data?.series_type || null,
      targetAudience: projectData.data?.target_audience || null,
      narrativeConventions: projectData.data?.narrative_conventions || null,
    },
    nodes,
    relationships,
    previousScenes: previousScenesData,
    chapterSummaries: chapterSummariesData,
    bookContext: booksData,
    events: eventsData,
    focusNodeIds,
    povNodeId: povNodeId || null,
    currentBookId: bookId,
    currentChapterId: chapterId,
  };

  return context;
}

/**
 * Process raw graph data from RPC into structured nodes and relationships
 */
function processGraphData(
  graphRows: SubgraphRow[] | null,
  sceneCharacters: {
    pov: boolean | null;
    node_id: string | null;
    story_nodes: {
      id: string;
      node_type: Database["public"]["Enums"]["node_type"];
      name: string;
      description: string | null;
      attributes: Database["public"]["Tables"]["story_nodes"]["Row"]["attributes"];
      character_role: string | null;
      character_arc: string | null;
      location_type: string | null;
      event_date: string | null;
      tags: string[] | null;
    } | null;
  }[] | null,
  povNodeId: string | null
): { nodes: ContextNode[]; relationships: ContextRelationship[] } {
  const nodesMap = new Map<string, ContextNode>();
  const relationshipsMap = new Map<string, ContextRelationship>();

  // First, add nodes from scene_characters (depth 0 - focus nodes)
  if (sceneCharacters) {
    for (const sc of sceneCharacters) {
      if (sc.story_nodes) {
        const node = sc.story_nodes;
        nodesMap.set(node.id, {
          id: node.id,
          type: node.node_type,
          name: node.name,
          description: node.description,
          attributes: node.attributes,
          characterRole: node.character_role,
          characterArc: node.character_arc,
          locationType: node.location_type,
          eventDate: node.event_date,
          depth: 0,
          isPov: sc.pov || node.id === povNodeId,
          tags: node.tags,
        });
      }
    }
  }

  // Then add nodes from graph traversal (now includes full attributes)
  if (graphRows) {
    for (const row of graphRows) {
      // Add/update node with full attributes from enhanced RPC
      if (!nodesMap.has(row.node_id)) {
        nodesMap.set(row.node_id, {
          id: row.node_id,
          type: row.node_type,
          name: row.node_name,
          description: row.node_description,
          attributes: row.node_attributes,
          characterRole: row.node_character_role,
          characterArc: row.node_character_arc,
          locationType: row.node_location_type,
          eventDate: row.node_event_date,
          tags: row.node_tags,
          depth: row.depth,
          isPov: row.node_id === povNodeId,
        });
      }

      // Add relationship if this row represents an edge
      if (row.edge_id && row.connected_to) {
        const relKey = row.edge_id;
        if (!relationshipsMap.has(relKey)) {
          // Determine source and target based on connected_to
          const sourceNode = nodesMap.get(row.connected_to);
          const targetNode = nodesMap.get(row.node_id);

          if (sourceNode && targetNode) {
            relationshipsMap.set(relKey, {
              id: row.edge_id,
              sourceId: row.connected_to,
              sourceName: sourceNode.name,
              sourceType: sourceNode.type,
              targetId: row.node_id,
              targetName: targetNode.name,
              targetType: targetNode.type,
              relationshipType: row.edge_type || "related_to",
              label: row.edge_label,
              description: row.edge_description,
              weight: row.edge_weight ?? 5,
              isBidirectional: row.edge_is_bidirectional ?? false,
            });
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()).sort((a, b) => a.depth - b.depth),
    relationships: Array.from(relationshipsMap.values()),
  };
}

/**
 * Fetch previous scenes for narrative continuity
 */
async function fetchPreviousScenes(
  supabase: SupabaseClient<Database>,
  chapterId: string,
  bookId: string,
  currentSceneId: string
): Promise<SceneExcerpt[]> {
  const excerpts: SceneExcerpt[] = [];

  // Get current scene's order index
  const { data: currentScene } = await supabase
    .from("scenes")
    .select("order_index")
    .eq("id", currentSceneId)
    .single();

  const currentOrderIndex = currentScene?.order_index ?? 0;

  // Fetch previous scenes in current chapter
  const { data: currentChapterScenes } = await supabase
    .from("scenes")
    .select(
      `
      id,
      title,
      edited_prose,
      generated_prose,
      order_index,
      chapters (title)
    `
    )
    .eq("chapter_id", chapterId)
    .lt("order_index", currentOrderIndex)
    .order("order_index", { ascending: false })
    .limit(2);

  if (currentChapterScenes) {
    for (const scene of currentChapterScenes) {
      const prose = scene.edited_prose || scene.generated_prose;
      if (prose) {
        const excerpt =
          prose.length > 500 ? "..." + prose.slice(-500) : prose;
        excerpts.push({
          id: scene.id,
          title: scene.title,
          excerpt,
          chapterTitle: (scene.chapters as { title: string })?.title || "Unknown",
          orderIndex: scene.order_index ?? 0,
          isCurrentChapter: true,
        });
      }
    }
  }

  // Fetch last scene from previous chapter
  const { data: currentChapter } = await supabase
    .from("chapters")
    .select("order_index")
    .eq("id", chapterId)
    .single();

  if (currentChapter && currentChapter.order_index && currentChapter.order_index > 0) {
    const { data: previousChapter } = await supabase
      .from("chapters")
      .select("id, title")
      .eq("book_id", bookId)
      .lt("order_index", currentChapter.order_index)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    if (previousChapter) {
      const { data: lastScene } = await supabase
        .from("scenes")
        .select("id, title, edited_prose, generated_prose, order_index")
        .eq("chapter_id", previousChapter.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      if (lastScene) {
        const prose = lastScene.edited_prose || lastScene.generated_prose;
        if (prose) {
          const excerpt =
            prose.length > 300 ? "..." + prose.slice(-300) : prose;
          excerpts.push({
            id: lastScene.id,
            title: lastScene.title,
            excerpt,
            chapterTitle: previousChapter.title,
            orderIndex: lastScene.order_index ?? 0,
            isCurrentChapter: false,
          });
        }
      }
    }
  }

  return excerpts;
}

/**
 * Fetch chapter summaries for the current book
 */
async function fetchChapterSummaries(
  supabase: SupabaseClient<Database>,
  bookId: string
): Promise<ChapterSummary[]> {
  const { data: chapters } = await supabase
    .from("chapters")
    .select(
      `
      id,
      title,
      summary,
      order_index,
      books (title)
    `
    )
    .eq("book_id", bookId)
    .not("summary", "is", null)
    .order("order_index", { ascending: true });

  if (!chapters) return [];

  return chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    summary: ch.summary,
    orderIndex: ch.order_index ?? 0,
    bookTitle: (ch.books as { title: string })?.title || "Unknown",
  }));
}

/**
 * Fetch book context for series awareness
 */
async function fetchBookContext(
  supabase: SupabaseClient<Database>,
  projectId: string,
  currentBookId: string
): Promise<BookContext[]> {
  const { data: books } = await supabase
    .from("books")
    .select(`
      id, title, synopsis, sort_order,
      pov_style, tense, prose_style, pacing, dialogue_style,
      content_rating, violence_level, romance_level,
      tone
    `)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!books) return [];

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    synopsis: book.synopsis,
    sortOrder: book.sort_order ?? 0,
    isCurrent: book.id === currentBookId,
    // Writing style
    povStyle: book.pov_style || null,
    tense: book.tense || null,
    proseStyle: book.prose_style || null,
    pacing: book.pacing || null,
    dialogueStyle: book.dialogue_style || null,
    // Content guidelines
    contentRating: book.content_rating || null,
    violenceLevel: book.violence_level || null,
    romanceLevel: book.romance_level || null,
    // Tone
    tone: book.tone || null,
  }));
}

/**
 * Fetch events involving the focus characters
 */
async function fetchRelatedEvents(
  supabase: SupabaseClient<Database>,
  projectId: string,
  focusNodeIds: string[]
): Promise<EventContext[]> {
  // Find event nodes connected to focus nodes
  const { data: eventEdges } = await supabase
    .from("story_edges")
    .select(
      `
      source_node_id,
      target_node_id,
      story_nodes!story_edges_source_node_id_fkey (
        id,
        node_type,
        name,
        description,
        event_date
      )
    `
    )
    .eq("project_id", projectId)
    .in("target_node_id", focusNodeIds);

  if (!eventEdges) return [];

  const events: EventContext[] = [];
  const seenEventIds = new Set<string>();

  for (const edge of eventEdges) {
    const node = edge.story_nodes as {
      id: string;
      node_type: string;
      name: string;
      description: string | null;
      event_date: string | null;
    } | null;

    if (node && node.node_type === "event" && !seenEventIds.has(node.id)) {
      seenEventIds.add(node.id);

      // Find all characters involved in this event
      const { data: involvedEdges } = await supabase
        .from("story_edges")
        .select(
          `
          target_node_id,
          story_nodes!story_edges_target_node_id_fkey (name, node_type)
        `
        )
        .eq("source_node_id", node.id);

      const involvedCharacters =
        involvedEdges
          ?.filter(
            (e) =>
              (e.story_nodes as { node_type: string } | null)?.node_type === "character"
          )
          .map((e) => (e.story_nodes as { name: string })?.name)
          .filter(Boolean) || [];

      events.push({
        id: node.id,
        name: node.name,
        description: node.description,
        eventDate: node.event_date,
        involvedCharacterNames: involvedCharacters as string[],
      });
    }
  }

  return events;
}

/**
 * Get focus node IDs from scene data
 */
export async function getFocusNodeIds(
  supabase: SupabaseClient<Database>,
  sceneId: string
): Promise<{ focusNodeIds: string[]; povNodeId: string | null }> {
  const { data: sceneCharacters } = await supabase
    .from("scene_characters")
    .select("node_id, pov")
    .eq("scene_id", sceneId);

  const { data: scene } = await supabase
    .from("scenes")
    .select("location_id, pov_character_id")
    .eq("id", sceneId)
    .single();

  const focusNodeIds: string[] = [];
  let povNodeId: string | null = null;

  // Add scene characters
  if (sceneCharacters) {
    for (const sc of sceneCharacters) {
      if (sc.node_id) {
        focusNodeIds.push(sc.node_id);
        if (sc.pov) {
          povNodeId = sc.node_id;
        }
      }
    }
  }

  // Add scene location
  if (scene?.location_id && !focusNodeIds.includes(scene.location_id)) {
    focusNodeIds.push(scene.location_id);
  }

  // Set POV from scene if not set from scene_characters
  if (!povNodeId && scene?.pov_character_id) {
    povNodeId = scene.pov_character_id;
  }

  return { focusNodeIds, povNodeId };
}
