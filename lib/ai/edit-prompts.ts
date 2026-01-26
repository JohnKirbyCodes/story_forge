/**
 * AI Edit Action Types and Prompt Templates
 */

import { GraphContext } from "@/types/graph-context";

export type EditAction =
  | "shorten"
  | "expand"
  | "rewrite"
  | "show_dont_tell"
  | "dialogue"
  | "intensify"
  | "soften"
  | "continue"
  | "fix"
  | "custom";

export interface EditActionConfig {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  category: "core" | "fiction" | "utility";
}

export const EDIT_ACTIONS: Record<EditAction, EditActionConfig> = {
  shorten: {
    label: "Shorten",
    shortLabel: "Short",
    description: "Make text more concise",
    icon: "compress",
    category: "core",
  },
  expand: {
    label: "Expand",
    shortLabel: "Expand",
    description: "Add more detail and description",
    icon: "expand",
    category: "core",
  },
  rewrite: {
    label: "Re-Write",
    shortLabel: "Rewrite",
    description: "Rephrase while keeping meaning",
    icon: "refresh",
    category: "core",
  },
  show_dont_tell: {
    label: "Show, Don't Tell",
    shortLabel: "Show",
    description: "Convert telling to vivid showing",
    icon: "eye",
    category: "fiction",
  },
  dialogue: {
    label: "Add Dialogue",
    shortLabel: "Dialog",
    description: "Insert or enhance character dialogue",
    icon: "message-circle",
    category: "fiction",
  },
  intensify: {
    label: "Intensify",
    shortLabel: "Intense",
    description: "Make more dramatic, raise stakes",
    icon: "flame",
    category: "fiction",
  },
  soften: {
    label: "Soften",
    shortLabel: "Soften",
    description: "Make lighter, reduce intensity",
    icon: "feather",
    category: "fiction",
  },
  continue: {
    label: "Continue",
    shortLabel: "Continue",
    description: "Write what comes next",
    icon: "arrow-right",
    category: "utility",
  },
  fix: {
    label: "Fix Prose",
    shortLabel: "Fix",
    description: "Grammar, spelling, awkward phrasing",
    icon: "check",
    category: "utility",
  },
  custom: {
    label: "Custom...",
    shortLabel: "Custom",
    description: "Enter specific instructions",
    icon: "edit",
    category: "utility",
  },
};

const SYSTEM_PROMPT = `You are a skilled fiction editor helping a novelist refine their prose. Your task is to edit the selected text according to the specific instruction given.

Guidelines:
- Maintain the author's voice and style
- Keep the same point of view (POV) and tense
- Preserve character names and important details
- Output ONLY the edited text, no explanations or commentary
- Match the approximate length of the original unless specifically asked to expand or shorten
- Maintain consistent formatting (no markdown, just prose)`;

const PROMPTS: Record<EditAction, string> = {
  shorten: `Make this text more concise while preserving its meaning and impact. Remove unnecessary words and tighten the prose.

TEXT:
{text}

SHORTENED VERSION:`,

  expand: `Expand this text with more sensory detail, description, and depth. Add richness without changing the core meaning.

TEXT:
{text}

EXPANDED VERSION:`,

  rewrite: `Rewrite this text with different phrasing while keeping the same meaning. Use fresh word choices and sentence structures.

TEXT:
{text}

REWRITTEN VERSION:`,

  show_dont_tell: `Transform this text from "telling" to "showing." Replace abstract statements with concrete actions, sensory details, and dialogue. Let readers experience the scene rather than being told about it.

TEXT:
{text}

SHOWN VERSION:`,

  dialogue: `Add or enhance dialogue in this passage. Give characters distinct voices and use dialogue to reveal character and advance the story.

TEXT:
{text}

WITH ENHANCED DIALOGUE:`,

  intensify: `Make this text more dramatic and intense. Raise the emotional stakes, heighten tension, and make the prose more gripping.

TEXT:
{text}

INTENSIFIED VERSION:`,

  soften: `Make this text lighter and less intense. Reduce dramatic tension while maintaining the core meaning. Create a more relaxed, gentle tone.

TEXT:
{text}

SOFTENED VERSION:`,

  continue: `Continue writing from where this text ends. Match the style, tone, and voice. Write the next natural paragraph or beat.

TEXT:
{text}

CONTINUATION:`,

  fix: `Fix any grammar, spelling, punctuation, or awkward phrasing in this text. Maintain the original meaning and style.

TEXT:
{text}

CORRECTED VERSION:`,

  custom: `{customPrompt}

TEXT:
{text}

EDITED VERSION:`,
};

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function getEditPrompt(
  action: EditAction,
  text: string,
  customPrompt?: string
): string {
  let prompt = PROMPTS[action];

  if (action === "custom" && customPrompt) {
    prompt = prompt.replace("{customPrompt}", customPrompt);
  }

  return prompt.replace("{text}", text);
}

export function getActionsByCategory() {
  const categories = {
    core: [] as EditAction[],
    fiction: [] as EditAction[],
    utility: [] as EditAction[],
  };

  for (const [action, config] of Object.entries(EDIT_ACTIONS)) {
    categories[config.category].push(action as EditAction);
  }

  return categories;
}

/**
 * Actions that benefit from knowledge graph context
 * These actions may reference characters, locations, or world details
 */
export const CONTEXT_ACTIONS: EditAction[] = [
  "expand",
  "dialogue",
  "continue",
  "show_dont_tell",
  "intensify",
  "custom",
];

/**
 * Check if an action needs graph context
 */
export function actionNeedsContext(action: EditAction): boolean {
  return CONTEXT_ACTIONS.includes(action);
}

/**
 * Build a system prompt enriched with knowledge graph context
 * Used for actions that need character/location/world information
 */
export function getSystemPromptWithContext(graphContext: GraphContext): string {
  const parts: string[] = [SYSTEM_PROMPT];

  // Add book style info for consistent writing
  const currentBook = graphContext.bookContext.find(b => b.isCurrent);
  if (currentBook) {
    const styleLines: string[] = [];
    if (currentBook.povStyle) styleLines.push(`- POV: ${currentBook.povStyle}`);
    if (currentBook.tense) styleLines.push(`- Tense: ${currentBook.tense}`);
    if (currentBook.proseStyle) styleLines.push(`- Prose Style: ${currentBook.proseStyle}`);
    if (currentBook.pacing) styleLines.push(`- Pacing: ${currentBook.pacing}`);
    if (currentBook.dialogueStyle) styleLines.push(`- Dialogue Style: ${currentBook.dialogueStyle}`);
    if (currentBook.tone && currentBook.tone.length > 0) {
      styleLines.push(`- Tone: ${currentBook.tone.join(", ")}`);
    }

    if (styleLines.length > 0) {
      parts.push(`\n## Book Style Guidelines\nMatch these writing conventions:\n${styleLines.join("\n")}`);
    }
  }

  // Add project/world context
  if (graphContext.project.genre || graphContext.project.worldSetting) {
    const worldLines: string[] = [];
    if (graphContext.project.genre) worldLines.push(`- Genre: ${graphContext.project.genre}`);
    if (graphContext.project.worldSetting) worldLines.push(`- Setting: ${graphContext.project.worldSetting}`);
    if (graphContext.project.timePeriod) worldLines.push(`- Time Period: ${graphContext.project.timePeriod}`);

    if (worldLines.length > 0) {
      parts.push(`\n## World Context\n${worldLines.join("\n")}`);
    }
  }

  // Add characters in the scene
  const characters = graphContext.nodes.filter(n => n.type === "character");
  if (characters.length > 0) {
    const charLines: string[] = [];

    // POV character first
    const povChar = characters.find(c => c.isPov);
    if (povChar) {
      let povLine = `- **${povChar.name}** (POV character)`;
      if (povChar.description) povLine += `: ${povChar.description}`;
      charLines.push(povLine);
    }

    // Other characters
    for (const char of characters) {
      if (char.isPov) continue; // Already added
      let charLine = `- **${char.name}**`;
      if (char.characterRole) charLine += ` (${char.characterRole})`;
      if (char.description) charLine += `: ${char.description}`;
      charLines.push(charLine);
    }

    if (charLines.length > 0) {
      parts.push(`\n## Characters in Scene\n${charLines.join("\n")}`);
    }
  }

  // Add key relationships for dialogue/interaction context
  const relevantRelationships = graphContext.relationships.filter(
    r => r.sourceType === "character" && r.targetType === "character"
  );
  if (relevantRelationships.length > 0) {
    const relLines = relevantRelationships.slice(0, 5).map(r => {
      let line = `- ${r.sourceName} → ${r.targetName}: ${r.relationshipType}`;
      if (r.label) line += ` (${r.label})`;
      return line;
    });
    parts.push(`\n## Character Relationships\n${relLines.join("\n")}`);
  }

  // Add location context
  const locations = graphContext.nodes.filter(n => n.type === "location");
  if (locations.length > 0) {
    const loc = locations[0]; // Primary location
    let locLine = `- **${loc.name}**`;
    if (loc.locationType) locLine += ` (${loc.locationType})`;
    if (loc.description) locLine += `: ${loc.description}`;
    parts.push(`\n## Current Location\n${locLine}`);
  }

  return parts.join("\n");
}
