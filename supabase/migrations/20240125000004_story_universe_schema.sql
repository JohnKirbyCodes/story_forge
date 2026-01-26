-- Story Universe Schema Enhancement
-- Adds book-level metadata, project-level settings, and scene metadata

-- ============================================================================
-- BOOK-LEVEL METADATA
-- ============================================================================

-- Narrative voice settings
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pov_style text
  CHECK (pov_style IN ('first_person', 'third_limited', 'third_omniscient', 'second_person', 'multiple_pov'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pov_character_ids uuid[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tense text
  CHECK (tense IN ('past', 'present'));

-- Writing style settings
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS prose_style text
  CHECK (prose_style IN ('literary', 'commercial', 'sparse', 'ornate', 'conversational'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pacing text
  CHECK (pacing IN ('fast', 'moderate', 'slow', 'varied'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS dialogue_style text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description_density text
  CHECK (description_density IN ('minimal', 'moderate', 'rich'));

-- Content guidelines
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS content_rating text
  CHECK (content_rating IN ('G', 'PG', 'PG-13', 'R', 'Adult'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS violence_level text
  CHECK (violence_level IN ('none', 'mild', 'moderate', 'graphic'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS romance_level text
  CHECK (romance_level IN ('none', 'fade_to_black', 'moderate', 'explicit'));
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS profanity_level text
  CHECK (profanity_level IN ('none', 'mild', 'moderate', 'strong'));

-- Tone
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tone text[];

-- ============================================================================
-- PROJECT-LEVEL METADATA
-- ============================================================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subgenres text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_audience text
  CHECK (target_audience IN ('middle_grade', 'young_adult', 'new_adult', 'adult'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS content_rating text
  CHECK (content_rating IN ('G', 'PG', 'PG-13', 'R', 'Adult'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narrative_conventions text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS series_type text
  CHECK (series_type IN ('standalone', 'duology', 'trilogy', 'series', 'open_ended'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS planned_books integer;

-- ============================================================================
-- SCENE-LEVEL METADATA
-- ============================================================================

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS scene_type text
  CHECK (scene_type IN ('action', 'dialogue', 'introspection', 'exposition', 'transition', 'flashback'));
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS tension_level text
  CHECK (tension_level IN ('low', 'medium', 'high', 'peak'));
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day text
  CHECK (time_of_day IN ('dawn', 'morning', 'afternoon', 'evening', 'night', 'late_night'));
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS weather text;

-- ============================================================================
-- BOOK-CHARACTER JUNCTION TABLE (for book-scoped roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.book_characters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  node_id uuid REFERENCES public.story_nodes(id) ON DELETE CASCADE NOT NULL,
  role_in_book text,
  is_pov_character boolean DEFAULT false,
  introduction_chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(book_id, node_id)
);

-- RLS for book_characters
ALTER TABLE public.book_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own book characters"
  ON public.book_characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = book_characters.book_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create book characters"
  ON public.book_characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = book_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own book characters"
  ON public.book_characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = book_characters.book_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own book characters"
  ON public.book_characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = book_characters.book_id
      AND projects.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_book_characters_book ON public.book_characters(book_id);
CREATE INDEX IF NOT EXISTS idx_book_characters_node ON public.book_characters(node_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.books.pov_style IS 'Point of view style: first_person, third_limited, third_omniscient, second_person, multiple_pov';
COMMENT ON COLUMN public.books.prose_style IS 'Writing prose style: literary, commercial, sparse, ornate, conversational';
COMMENT ON COLUMN public.books.tone IS 'Array of tone descriptors: dark, hopeful, comedic, tragic, epic, intimate, suspenseful, etc.';
COMMENT ON COLUMN public.projects.target_audience IS 'Target reader age group';
COMMENT ON COLUMN public.projects.series_type IS 'Type of series: standalone, duology, trilogy, series, open_ended';
