-- Add word count goal columns for chapters and scenes

-- Add target_word_count to chapters
ALTER TABLE public.chapters
ADD COLUMN IF NOT EXISTS target_word_count integer;

-- Add target_word_count to scenes
ALTER TABLE public.scenes
ADD COLUMN IF NOT EXISTS target_word_count integer;

-- Comment explaining usage
COMMENT ON COLUMN public.chapters.target_word_count IS 'Optional word count goal for the chapter';
COMMENT ON COLUMN public.scenes.target_word_count IS 'Optional word count goal for the scene';
