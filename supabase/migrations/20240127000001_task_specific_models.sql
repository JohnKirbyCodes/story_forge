-- Migration: Add task-specific default model columns to profiles table
-- Allows users to configure different AI models for each task type

-- Add task-specific model columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_model_outline text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_model_synopsis text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_model_scene text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_model_edit text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.ai_model_outline IS 'Default model for outline generation';
COMMENT ON COLUMN public.profiles.ai_model_synopsis IS 'Default model for synopsis generation';
COMMENT ON COLUMN public.profiles.ai_model_scene IS 'Default model for scene generation';
COMMENT ON COLUMN public.profiles.ai_model_edit IS 'Default model for text editing';

-- Note: The existing ai_default_model column serves as the fallback when task-specific models aren't set
