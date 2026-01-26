import {
  GraphContext,
  ContextNode,
  ContextRelationship,
  DEFAULT_TOKEN_BUDGET,
  TokenBudget,
} from "@/types/graph-context";

/**
 * Format GraphContext into a structured prompt for AI generation
 */
export function formatContextForPrompt(
  context: GraphContext,
  tokenBudget: Partial<TokenBudget> = {}
): string {
  const budget = { ...DEFAULT_TOKEN_BUDGET, ...tokenBudget };
  const sections: string[] = [];

  // 1. Story World / Project context
  sections.push(formatProjectSection(context));

  // 2. Book context (for series)
  const bookSection = formatBookSection(context);
  if (bookSection) sections.push(bookSection);

  // 3. Writing style guidelines (from book metadata)
  const writingStyleSection = formatWritingStyleSection(context);
  if (writingStyleSection) sections.push(writingStyleSection);

  // 4. Chapter context
  const chapterSection = formatChapterSection(context);
  if (chapterSection) sections.push(chapterSection);

  // 5. Characters in scene (with POV first)
  const characterSection = formatCharactersSection(context, budget);
  if (characterSection) sections.push(characterSection);

  // 6. Relationships
  const relationshipSection = formatRelationshipsSection(context, budget);
  if (relationshipSection) sections.push(relationshipSection);

  // 7. Location context
  const locationSection = formatLocationSection(context);
  if (locationSection) sections.push(locationSection);

  // 8. Faction dynamics
  const factionSection = formatFactionSection(context);
  if (factionSection) sections.push(factionSection);

  // 9. Recent events
  const eventsSection = formatEventsSection(context, budget);
  if (eventsSection) sections.push(eventsSection);

  // 10. Previous scene context
  const previousSection = formatPreviousScenesSection(context, budget);
  if (previousSection) sections.push(previousSection);

  // 11. Chapter summaries (if available)
  const summariesSection = formatChapterSummariesSection(context, budget);
  if (summariesSection) sections.push(summariesSection);

  return sections.join("\n\n");
}

/**
 * Format project/world information
 */
function formatProjectSection(context: GraphContext): string {
  const lines = ["## Story World"];
  lines.push(`Project: ${context.project.title}`);

  if (context.project.genre) {
    lines.push(`Genre: ${context.project.genre}`);
  }

  if (context.project.worldSetting) {
    lines.push(`Setting: ${context.project.worldSetting}`);
  }

  if (context.project.timePeriod) {
    lines.push(`Time Period: ${context.project.timePeriod}`);
  }

  if (context.project.worldDescription) {
    lines.push(`World Description: ${context.project.worldDescription}`);
  }

  if (context.project.themes && context.project.themes.length > 0) {
    lines.push(`Themes: ${context.project.themes.join(", ")}`);
  }

  if (context.project.targetAudience) {
    lines.push(`Target Audience: ${context.project.targetAudience}`);
  }

  if (context.project.narrativeConventions && context.project.narrativeConventions.length > 0) {
    lines.push(`Narrative Conventions: ${context.project.narrativeConventions.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Format book context for series awareness
 */
function formatBookSection(context: GraphContext): string | null {
  const currentBook = context.bookContext.find((b) => b.isCurrent);
  if (!currentBook) return null;

  const lines = [`## Current Book: ${currentBook.title}`];

  // If this is part of a series, show book order
  if (context.bookContext.length > 1) {
    const bookNumber = currentBook.sortOrder + 1;
    lines[0] = `## Current Book: ${currentBook.title} (Book ${bookNumber} of ${context.bookContext.length})`;
  }

  if (currentBook.synopsis) {
    lines.push(`Synopsis: ${currentBook.synopsis}`);
  }

  // Add context from previous books in series
  const previousBooks = context.bookContext.filter(
    (b) => b.sortOrder < currentBook.sortOrder && b.synopsis
  );

  if (previousBooks.length > 0) {
    lines.push("");
    lines.push("Previous Books:");
    for (const book of previousBooks) {
      const excerpt =
        book.synopsis && book.synopsis.length > 150
          ? book.synopsis.slice(0, 150) + "..."
          : book.synopsis;
      lines.push(`- ${book.title}: ${excerpt}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format writing style guidelines from book metadata
 */
function formatWritingStyleSection(context: GraphContext): string | null {
  const currentBook = context.bookContext.find((b) => b.isCurrent);
  if (!currentBook) return null;

  const lines: string[] = [];
  let hasContent = false;

  // POV and Tense
  if (currentBook.povStyle || currentBook.tense) {
    lines.push("## Writing Style");
    hasContent = true;

    if (currentBook.povStyle) {
      const povLabels: Record<string, string> = {
        first_person: "First Person (I/me)",
        third_limited: "Third Person Limited",
        third_omniscient: "Third Person Omniscient",
        second_person: "Second Person (you)",
        multiple_pov: "Multiple POV",
      };
      lines.push(`- Point of View: ${povLabels[currentBook.povStyle] || currentBook.povStyle}`);
    }

    if (currentBook.tense) {
      lines.push(`- Tense: ${currentBook.tense === "past" ? "Past Tense" : "Present Tense"}`);
    }

    if (currentBook.proseStyle) {
      const proseLabels: Record<string, string> = {
        literary: "Literary (rich, layered prose)",
        commercial: "Commercial (accessible, engaging)",
        sparse: "Sparse/Minimalist (Hemingway-style)",
        ornate: "Ornate (detailed, descriptive)",
        conversational: "Conversational (informal, natural)",
      };
      lines.push(`- Prose Style: ${proseLabels[currentBook.proseStyle] || currentBook.proseStyle}`);
    }

    if (currentBook.pacing) {
      const pacingLabels: Record<string, string> = {
        fast: "Fast-paced (action-driven)",
        moderate: "Moderate (balanced)",
        slow: "Slow/deliberate (character-focused)",
        variable: "Variable (scene-dependent)",
      };
      lines.push(`- Pacing: ${pacingLabels[currentBook.pacing] || currentBook.pacing}`);
    }

    if (currentBook.dialogueStyle) {
      lines.push(`- Dialogue Style: ${currentBook.dialogueStyle}`);
    }
  }

  // Tone
  if (currentBook.tone && currentBook.tone.length > 0) {
    if (!hasContent) {
      lines.push("## Writing Style");
      hasContent = true;
    }
    lines.push(`- Tone: ${currentBook.tone.join(", ")}`);
  }

  // Content Guidelines
  if (currentBook.contentRating || currentBook.violenceLevel || currentBook.romanceLevel) {
    lines.push("");
    lines.push("### Content Guidelines");

    if (currentBook.contentRating) {
      const ratingLabels: Record<string, string> = {
        all_ages: "All Ages (G)",
        teen: "Teen (PG-13)",
        mature: "Mature (R)",
        adult: "Adult (18+)",
      };
      lines.push(`- Content Rating: ${ratingLabels[currentBook.contentRating] || currentBook.contentRating}`);
    }

    if (currentBook.violenceLevel) {
      const violenceLabels: Record<string, string> = {
        none: "None",
        mild: "Mild (implied, off-screen)",
        moderate: "Moderate (some action/combat)",
        graphic: "Graphic (detailed violence)",
      };
      lines.push(`- Violence: ${violenceLabels[currentBook.violenceLevel] || currentBook.violenceLevel}`);
    }

    if (currentBook.romanceLevel) {
      const romanceLabels: Record<string, string> = {
        none: "None",
        sweet: "Sweet/Clean (fade to black)",
        sensual: "Sensual (suggestive)",
        steamy: "Steamy (explicit)",
      };
      lines.push(`- Romance: ${romanceLabels[currentBook.romanceLevel] || currentBook.romanceLevel}`);
    }
  }

  return hasContent || lines.length > 0 ? lines.join("\n") : null;
}

/**
 * Format chapter context
 */
function formatChapterSection(context: GraphContext): string | null {
  const currentChapterSummary = context.chapterSummaries.find(
    (ch) => ch.id === context.currentChapterId
  );

  if (!currentChapterSummary && !context.scene.timeInStory) return null;

  const lines = ["## Current Chapter"];

  if (currentChapterSummary) {
    lines.push(`Title: ${currentChapterSummary.title}`);
    if (currentChapterSummary.summary) {
      lines.push(`Summary: ${currentChapterSummary.summary}`);
    }
  }

  if (context.scene.title) {
    lines.push(`Scene: ${context.scene.title}`);
  }

  if (context.scene.timeInStory) {
    lines.push(`Time in Story: ${context.scene.timeInStory}`);
  }

  return lines.join("\n");
}

/**
 * Format characters section with POV character first
 */
function formatCharactersSection(
  context: GraphContext,
  _budget: TokenBudget
): string | null {
  const characters = context.nodes.filter((n) => n.type === "character");
  if (characters.length === 0) return null;

  // Sort: POV first, then by depth
  characters.sort((a, b) => {
    if (a.isPov && !b.isPov) return -1;
    if (!a.isPov && b.isPov) return 1;
    return a.depth - b.depth;
  });

  const lines = ["## Characters in This Scene"];

  for (const char of characters) {
    lines.push("");
    const povLabel = char.isPov ? " (POV Character)" : "";
    lines.push(`### ${char.name}${povLabel}`);

    if (char.characterRole) {
      lines.push(`- Role: ${capitalize(char.characterRole)}`);
    }

    if (char.description) {
      lines.push(`- Description: ${char.description}`);
    }

    if (char.characterArc) {
      lines.push(`- Arc: ${char.characterArc}`);
    }

    // Format custom attributes
    const attrStr = formatAttributes(char.attributes);
    if (attrStr) {
      lines.push(`- Attributes: ${attrStr}`);
    }

    if (char.tags && char.tags.length > 0) {
      lines.push(`- Tags: ${char.tags.join(", ")}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format relationships section
 */
function formatRelationshipsSection(
  context: GraphContext,
  _budget: TokenBudget
): string | null {
  if (context.relationships.length === 0) return null;

  const lines = ["## Character Relationships"];

  // Group relationships by source character for readability
  const grouped = new Map<string, ContextRelationship[]>();

  for (const rel of context.relationships) {
    // Only show relationships involving characters
    if (rel.sourceType !== "character" && rel.targetType !== "character") {
      continue;
    }

    const key = rel.sourceName;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(rel);
  }

  for (const [sourceName, rels] of grouped) {
    for (const rel of rels) {
      const relType = formatRelationshipType(rel.relationshipType);
      let line = `- ${sourceName} **${relType}** ${rel.targetName}`;

      // Add timeline context if available
      if (rel.validFromBookTitle) {
        line += ` (since ${rel.validFromBookTitle})`;
      }
      if (rel.validUntilBookTitle) {
        line += ` (until ${rel.validUntilBookTitle})`;
      }

      lines.push(line);

      // Add relationship description if available
      if (rel.description) {
        lines.push(`  ${rel.description}`);
      }
    }
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

/**
 * Format location section
 */
function formatLocationSection(context: GraphContext): string | null {
  const locations = context.nodes.filter((n) => n.type === "location");
  if (locations.length === 0) return null;

  // Get the primary location (depth 0)
  const primaryLocation = locations.find((l) => l.depth === 0);
  if (!primaryLocation) return null;

  const lines = [`## Location: ${primaryLocation.name}`];

  if (primaryLocation.locationType) {
    lines.push(`- Type: ${capitalize(primaryLocation.locationType)}`);
  }

  if (primaryLocation.description) {
    lines.push(`- Description: ${primaryLocation.description}`);
  }

  // Show location hierarchy if we have connected locations
  const connectedLocations = locations.filter((l) => l.depth > 0);
  if (connectedLocations.length > 0) {
    const hierarchy = connectedLocations.map((l) => l.name).join(" → ");
    lines.push(`- Part of: ${primaryLocation.name} → ${hierarchy}`);
  }

  return lines.join("\n");
}

/**
 * Format faction dynamics
 */
function formatFactionSection(context: GraphContext): string | null {
  const factions = context.nodes.filter((n) => n.type === "faction");
  if (factions.length === 0) return null;

  // Get faction-related relationships
  const factionRels = context.relationships.filter(
    (r) => r.sourceType === "faction" || r.targetType === "faction"
  );

  if (factionRels.length === 0 && factions.length === 0) return null;

  const lines = ["## Faction Dynamics"];

  // List factions with descriptions
  for (const faction of factions) {
    lines.push(`- ${faction.name}: ${faction.description || "No description"}`);
  }

  // Add faction relationships
  for (const rel of factionRels) {
    const relType = formatRelationshipType(rel.relationshipType);
    lines.push(`- ${rel.sourceName} is **${relType}** ${rel.targetName}`);
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

/**
 * Format events section
 */
function formatEventsSection(
  context: GraphContext,
  _budget: TokenBudget
): string | null {
  if (context.events.length === 0) return null;

  const lines = ["## Recent Events"];

  for (const event of context.events.slice(0, 5)) {
    // Limit to 5 events
    let line = `- ${event.name}`;

    if (event.eventDate) {
      line += ` (${event.eventDate})`;
    }

    lines.push(line);

    if (event.description) {
      const desc =
        event.description.length > 100
          ? event.description.slice(0, 100) + "..."
          : event.description;
      lines.push(`  ${desc}`);
    }

    if (event.involvedCharacterNames.length > 0) {
      lines.push(`  Involved: ${event.involvedCharacterNames.join(", ")}`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

/**
 * Format previous scenes section
 */
function formatPreviousScenesSection(
  context: GraphContext,
  _budget: TokenBudget
): string | null {
  if (context.previousScenes.length === 0) return null;

  const lines = ["## Previous Scene Context"];

  for (const scene of context.previousScenes) {
    const chapterNote = scene.isCurrentChapter
      ? ""
      : ` (${scene.chapterTitle})`;

    if (scene.title) {
      lines.push(`### ${scene.title}${chapterNote}`);
    } else {
      lines.push(`### Previous Scene${chapterNote}`);
    }

    lines.push(scene.excerpt);
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Format chapter summaries section
 */
function formatChapterSummariesSection(
  context: GraphContext,
  _budget: TokenBudget
): string | null {
  // Only include summaries from chapters before the current one
  const currentChapterIndex = context.chapterSummaries.findIndex(
    (ch) => ch.id === context.currentChapterId
  );

  if (currentChapterIndex <= 0) return null;

  const previousSummaries = context.chapterSummaries.slice(
    0,
    currentChapterIndex
  );
  if (previousSummaries.length === 0) return null;

  const lines = ["## Previous Chapter Summaries"];

  // Only include last 3 chapters to save tokens
  const recentSummaries = previousSummaries.slice(-3);

  for (const ch of recentSummaries) {
    if (ch.summary) {
      lines.push(`### ${ch.title}`);
      lines.push(ch.summary);
      lines.push("");
    }
  }

  return lines.length > 1 ? lines.join("\n").trim() : null;
}

/**
 * Helper: Format relationship type for display
 */
function formatRelationshipType(type: string): string {
  return type.replace(/_/g, " ");
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Format attributes JSON into readable string
 */
function formatAttributes(
  attributes: ContextNode["attributes"]
): string | null {
  if (!attributes || typeof attributes !== "object") return null;

  const entries = Object.entries(attributes as Record<string, unknown>);
  if (entries.length === 0) return null;

  return entries
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

/**
 * Build cacheable system prompt parts for AI generation
 * Returns separate parts for prompt caching optimization:
 * - staticPart: Universal guidelines (highly cacheable)
 * - bookPart: Book-level style settings (cacheable per book)
 * - contextPart: Scene-specific context (not cacheable)
 */
export function buildCacheableSystemPrompt(
  contextStr: string,
  guidelines: string[] = [],
  context?: GraphContext
): { staticPart: string; bookPart: string; contextPart: string } {
  const currentBook = context?.bookContext.find((b) => b.isCurrent);

  // Part 1: Static universal instructions (highly cacheable - same for all users)
  const staticPart = `You are a professional fiction writer helping to write a novel. Your task is to expand the beat instructions into engaging, polished prose.

## Universal Writing Standards
- Show, don't tell - use sensory details and actions
- Create smooth transitions if following previous content
- Write approximately 500-1000 words per scene unless specified otherwise
- Do not include meta-commentary or notes, only the prose itself
- Maintain timeline consistency with established events`;

  // Part 2: Book-level guidelines (cacheable per book - same for all scenes in book)
  const bookGuidelines: string[] = [];

  // POV guidance
  if (currentBook?.povStyle) {
    const povInstructions: Record<string, string> = {
      first_person: "Write in first person perspective (I/me). The narrator is the POV character experiencing events directly.",
      third_limited: "Write in third person limited perspective. Stay in the POV character's head - only show what they perceive, think, and feel.",
      third_omniscient: "Write in third person omniscient perspective. You may reveal any character's thoughts and provide narrative insight beyond any single character's knowledge.",
      second_person: "Write in second person perspective (you). Address the reader as the protagonist.",
      multiple_pov: "Write in third person with the designated POV character's perspective. Stay in their head for this scene.",
    };
    bookGuidelines.push(povInstructions[currentBook.povStyle] || "Write in third person limited perspective.");
  } else {
    bookGuidelines.push("Write in third person limited perspective unless specified otherwise.");
  }

  // Tense guidance
  if (currentBook?.tense) {
    bookGuidelines.push(
      currentBook.tense === "present"
        ? "Use present tense throughout (walks, sees, feels)."
        : "Use past tense throughout (walked, saw, felt)."
    );
  }

  // Prose style guidance
  if (currentBook?.proseStyle) {
    const styleInstructions: Record<string, string> = {
      literary: "Use rich, layered prose with careful attention to language, metaphor, and subtext.",
      commercial: "Use accessible, engaging prose that prioritizes clarity and forward momentum.",
      sparse: "Use sparse, minimalist prose. Short sentences. Let actions speak. Trust the reader.",
      ornate: "Use detailed, descriptive prose with elaborate imagery and flowing sentences.",
      conversational: "Use informal, natural prose that feels like someone telling a story to a friend.",
    };
    if (styleInstructions[currentBook.proseStyle]) {
      bookGuidelines.push(styleInstructions[currentBook.proseStyle]);
    }
  }

  // Pacing guidance
  if (currentBook?.pacing) {
    const pacingInstructions: Record<string, string> = {
      fast: "Maintain a fast pace with quick cuts, short paragraphs, and urgent momentum.",
      moderate: "Balance action with reflection. Vary paragraph length for rhythm.",
      slow: "Take time to breathe. Linger on moments, internal thoughts, and sensory details.",
      variable: "Match pacing to the scene's emotional beats - speed up for tension, slow down for intimacy.",
    };
    if (pacingInstructions[currentBook.pacing]) {
      bookGuidelines.push(pacingInstructions[currentBook.pacing]);
    }
  }

  // Content rating guidance
  if (currentBook?.contentRating) {
    const ratingInstructions: Record<string, string> = {
      all_ages: "Keep content appropriate for all ages. No explicit violence, romance, or mature themes.",
      teen: "Content suitable for teens. Violence can be implied but not graphic. Romance stays PG-13.",
      mature: "Mature content allowed. Violence and romantic tension can be more explicit but not gratuitous.",
      adult: "Adult content permitted. Handle mature themes with craft and purpose.",
    };
    if (ratingInstructions[currentBook.contentRating]) {
      bookGuidelines.push(ratingInstructions[currentBook.contentRating]);
    }
  }

  // Add tone and genre guidelines
  bookGuidelines.push("Match the tone and style appropriate for the genre");
  bookGuidelines.push("Maintain consistency with established characters and world");
  bookGuidelines.push("Reference character relationships and world details naturally");

  // Add any custom guidelines
  bookGuidelines.push(...guidelines);

  const bookPart = bookGuidelines.length > 0
    ? `## Book Style Guidelines\n${bookGuidelines.map((g) => `- ${g}`).join("\n")}`
    : "";

  // Part 3: Scene-specific context (changes per scene, not cacheable)
  const contextPart = contextStr;

  return { staticPart, bookPart, contextPart };
}

/**
 * Build the complete system prompt for AI generation
 * @deprecated Use buildCacheableSystemPrompt for better caching support
 */
export function buildSystemPrompt(
  contextStr: string,
  guidelines: string[] = [],
  context?: GraphContext
): string {
  // Build dynamic guidelines based on book/project settings
  const dynamicGuidelines: string[] = [];

  // Get current book for writing style
  const currentBook = context?.bookContext.find((b) => b.isCurrent);

  // POV guidance
  if (currentBook?.povStyle) {
    const povInstructions: Record<string, string> = {
      first_person: "Write in first person perspective (I/me). The narrator is the POV character experiencing events directly.",
      third_limited: "Write in third person limited perspective. Stay in the POV character's head - only show what they perceive, think, and feel.",
      third_omniscient: "Write in third person omniscient perspective. You may reveal any character's thoughts and provide narrative insight beyond any single character's knowledge.",
      second_person: "Write in second person perspective (you). Address the reader as the protagonist.",
      multiple_pov: "Write in third person with the designated POV character's perspective. Stay in their head for this scene.",
    };
    dynamicGuidelines.push(povInstructions[currentBook.povStyle] || "Write in third person limited perspective.");
  } else {
    dynamicGuidelines.push("Write in third person limited perspective unless specified otherwise.");
  }

  // Tense guidance
  if (currentBook?.tense) {
    dynamicGuidelines.push(
      currentBook.tense === "present"
        ? "Use present tense throughout (walks, sees, feels)."
        : "Use past tense throughout (walked, saw, felt)."
    );
  }

  // Prose style guidance
  if (currentBook?.proseStyle) {
    const styleInstructions: Record<string, string> = {
      literary: "Use rich, layered prose with careful attention to language, metaphor, and subtext.",
      commercial: "Use accessible, engaging prose that prioritizes clarity and forward momentum.",
      sparse: "Use sparse, minimalist prose. Short sentences. Let actions speak. Trust the reader.",
      ornate: "Use detailed, descriptive prose with elaborate imagery and flowing sentences.",
      conversational: "Use informal, natural prose that feels like someone telling a story to a friend.",
    };
    if (styleInstructions[currentBook.proseStyle]) {
      dynamicGuidelines.push(styleInstructions[currentBook.proseStyle]);
    }
  }

  // Pacing guidance
  if (currentBook?.pacing) {
    const pacingInstructions: Record<string, string> = {
      fast: "Maintain a fast pace with quick cuts, short paragraphs, and urgent momentum.",
      moderate: "Balance action with reflection. Vary paragraph length for rhythm.",
      slow: "Take time to breathe. Linger on moments, internal thoughts, and sensory details.",
      variable: "Match pacing to the scene's emotional beats - speed up for tension, slow down for intimacy.",
    };
    if (pacingInstructions[currentBook.pacing]) {
      dynamicGuidelines.push(pacingInstructions[currentBook.pacing]);
    }
  }

  // Content rating guidance
  if (currentBook?.contentRating) {
    const ratingInstructions: Record<string, string> = {
      all_ages: "Keep content appropriate for all ages. No explicit violence, romance, or mature themes.",
      teen: "Content suitable for teens. Violence can be implied but not graphic. Romance stays PG-13.",
      mature: "Mature content allowed. Violence and romantic tension can be more explicit but not gratuitous.",
      adult: "Adult content permitted. Handle mature themes with craft and purpose.",
    };
    if (ratingInstructions[currentBook.contentRating]) {
      dynamicGuidelines.push(ratingInstructions[currentBook.contentRating]);
    }
  }

  // Standard guidelines that apply to all prose
  const standardGuidelines = [
    "Show, don't tell - use sensory details and actions",
    "Match the tone and style appropriate for the genre",
    "Maintain consistency with established characters and world",
    "Create smooth transitions if following previous content",
    "Write approximately 500-1000 words per scene unless specified otherwise",
    "Do not include meta-commentary or notes, only the prose itself",
    "Reference character relationships and world details naturally",
    "Maintain timeline consistency with established events",
  ];

  const allGuidelines = [...dynamicGuidelines, ...standardGuidelines, ...guidelines];

  return `You are a professional fiction writer helping to write a novel. Your task is to expand the beat instructions into engaging, polished prose.

${contextStr}

## Writing Guidelines
${allGuidelines.map((g) => `- ${g}`).join("\n")}`;
}
