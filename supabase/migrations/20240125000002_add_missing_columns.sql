-- Add missing columns to support the UI

-- Add position columns to story_nodes for graph visualization
ALTER TABLE public.story_nodes
ADD COLUMN IF NOT EXISTS position_x float DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y float DEFAULT 0;

-- Add order_index columns (alias for sort_order for clearer semantics)
-- We'll use sort_order in the database but the code expects order_index
-- Actually, let's add order_index as well for clearer semantics
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

ALTER TABLE public.scenes
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Update order_index from sort_order if it exists
UPDATE public.chapters SET order_index = sort_order WHERE order_index = 0 AND sort_order > 0;
UPDATE public.scenes SET order_index = sort_order WHERE order_index = 0 AND sort_order > 0;

-- Add synopsis to books (separate from description for short summaries)
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS synopsis text;

-- Add world_description to projects (for AI context)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS world_description text;

-- Update profiles table for subscription management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS words_used_this_month integer DEFAULT 0;

-- Add node_id alias to scene_characters (pointing to character_id)
-- Actually we need to rename character_id to node_id for flexibility
-- Or better - add a pov column to scene_characters for POV tracking
ALTER TABLE public.scene_characters
ADD COLUMN IF NOT EXISTS pov boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS node_id uuid;

-- Update node_id from character_id
UPDATE public.scene_characters SET node_id = character_id WHERE node_id IS NULL;

-- Make node_id not null after populating
-- ALTER TABLE public.scene_characters ALTER COLUMN node_id SET NOT NULL;
