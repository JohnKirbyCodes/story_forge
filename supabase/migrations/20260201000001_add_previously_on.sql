-- Add previously_on field to books table for series recap
-- This stores an AI-generated (or manually edited) summary of previous books
-- to provide context when writing later books in a series

ALTER TABLE books ADD COLUMN IF NOT EXISTS previously_on TEXT;

-- Add a comment explaining the field's purpose
COMMENT ON COLUMN books.previously_on IS 'AI-generated or manually edited recap of previous books in the series. Used to provide context for AI generation in later books.';
