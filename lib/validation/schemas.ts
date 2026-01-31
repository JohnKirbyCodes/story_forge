import { z } from "zod";

// Common validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;
const MAX_GENRE_LENGTH = 50;
const MAX_PROMPT_LENGTH = 10000;

// Sanitize string by trimming and removing control characters
const sanitizedString = z.string().transform((val) => {
  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  return val.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
});

// Project schemas
export const createProjectSchema = z.object({
  title: sanitizedString
    .pipe(z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less`)),
  description: sanitizedString
    .pipe(z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`))
    .optional()
    .nullable(),
  genre: sanitizedString
    .pipe(z.string().max(MAX_GENRE_LENGTH, `Genre must be ${MAX_GENRE_LENGTH} characters or less`))
    .optional()
    .nullable(),
});

// Book schemas
export const createBookSchema = z.object({
  title: sanitizedString
    .pipe(z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less`)),
  description: sanitizedString
    .pipe(z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`))
    .optional()
    .nullable(),
  project_id: z.string().uuid("Invalid project ID"),
});

// Story node schemas
export const storyNodeTypeSchema = z.enum([
  "character",
  "location",
  "faction",
  "event",
  "item",
  "concept",
]);

export const createStoryNodeSchema = z.object({
  name: sanitizedString
    .pipe(z.string().min(1, "Name is required").max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or less`)),
  description: sanitizedString
    .pipe(z.string().max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`))
    .optional()
    .nullable(),
  node_type: storyNodeTypeSchema,
  project_id: z.string().uuid("Invalid project ID"),
  position_x: z.number().min(-10000).max(10000).optional(),
  position_y: z.number().min(-10000).max(10000).optional(),
});

// AI generation schemas
export const generateSceneSchema = z.object({
  prompt: sanitizedString
    .pipe(z.string().min(1, "Prompt is required").max(MAX_PROMPT_LENGTH, `Prompt must be ${MAX_PROMPT_LENGTH} characters or less`)),
  sceneId: z.string().uuid("Invalid scene ID"),
  projectId: z.string().uuid("Invalid project ID"),
  model: z.string().max(100).optional(),
});

export const generateSynopsisSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  projectId: z.string().uuid("Invalid project ID"),
  existingContent: sanitizedString
    .pipe(z.string().max(50000))
    .optional()
    .nullable(),
  model: z.string().max(100).optional(),
});

export const generateOutlineSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  projectId: z.string().uuid("Invalid project ID"),
  synopsis: sanitizedString
    .pipe(z.string().max(50000))
    .optional()
    .nullable(),
  model: z.string().max(100).optional(),
});

export const editProseSchema = z.object({
  sceneId: z.string().uuid("Invalid scene ID"),
  projectId: z.string().uuid("Invalid project ID"),
  selectedText: sanitizedString
    .pipe(z.string().min(1, "Selected text is required").max(50000)),
  instruction: sanitizedString
    .pipe(z.string().min(1, "Instruction is required").max(MAX_PROMPT_LENGTH)),
  fullContent: sanitizedString
    .pipe(z.string().max(100000))
    .optional(),
  model: z.string().max(100).optional(),
});

// AI key settings
export const aiProviderSchema = z.enum(["anthropic", "openai", "google"]);

export const saveAiKeySchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string()
    .min(10, "API key is too short")
    .max(500, "API key is too long"),
});

// Helper to safely parse and return validation errors
export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError?.message || "Validation failed",
  };
}
