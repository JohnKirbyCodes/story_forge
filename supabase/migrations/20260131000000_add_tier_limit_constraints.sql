-- Migration: Add database-level constraints for subscription tier limits
-- This prevents race conditions in limit checks by enforcing limits at the database level

-- Function to check project count limit based on subscription tier
CREATE OR REPLACE FUNCTION check_project_limit()
RETURNS TRIGGER AS $$
DECLARE
  project_count INTEGER;
  user_tier TEXT;
  max_projects INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO user_tier
  FROM profiles
  WHERE id = NEW.user_id;

  -- Set limit based on tier
  IF user_tier = 'pro' THEN
    -- Pro users have unlimited projects
    RETURN NEW;
  ELSE
    -- Free tier: 1 project max
    max_projects := 1;
  END IF;

  -- Count existing projects
  SELECT COUNT(*) INTO project_count
  FROM projects
  WHERE user_id = NEW.user_id;

  -- Check limit
  IF project_count >= max_projects THEN
    RAISE EXCEPTION 'Project limit reached. Free tier allows % project(s). Upgrade to Pro for unlimited projects.', max_projects;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check book count limit per project
CREATE OR REPLACE FUNCTION check_book_limit()
RETURNS TRIGGER AS $$
DECLARE
  book_count INTEGER;
  user_tier TEXT;
  project_owner UUID;
  max_books INTEGER;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner
  FROM projects
  WHERE id = NEW.project_id;

  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO user_tier
  FROM profiles
  WHERE id = project_owner;

  -- Set limit based on tier
  IF user_tier = 'pro' THEN
    -- Pro users have unlimited books
    RETURN NEW;
  ELSE
    -- Free tier: 1 book per project
    max_books := 1;
  END IF;

  -- Count existing books in this project
  SELECT COUNT(*) INTO book_count
  FROM books
  WHERE project_id = NEW.project_id;

  -- Check limit
  IF book_count >= max_books THEN
    RAISE EXCEPTION 'Book limit reached. Free tier allows % book(s) per project. Upgrade to Pro for unlimited books.', max_books;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check story node count limit per project
CREATE OR REPLACE FUNCTION check_story_node_limit()
RETURNS TRIGGER AS $$
DECLARE
  node_count INTEGER;
  user_tier TEXT;
  project_owner UUID;
  max_nodes INTEGER;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner
  FROM projects
  WHERE id = NEW.project_id;

  -- Get user's subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO user_tier
  FROM profiles
  WHERE id = project_owner;

  -- Set limit based on tier
  IF user_tier = 'pro' THEN
    -- Pro users have unlimited nodes
    RETURN NEW;
  ELSE
    -- Free tier: 15 story nodes max per project
    max_nodes := 15;
  END IF;

  -- Count existing nodes in this project
  SELECT COUNT(*) INTO node_count
  FROM story_nodes
  WHERE project_id = NEW.project_id;

  -- Check limit
  IF node_count >= max_nodes THEN
    RAISE EXCEPTION 'Story element limit reached. Free tier allows % elements per project. Upgrade to Pro for unlimited elements.', max_nodes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (only if tables exist)
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS enforce_project_limit ON projects;
  DROP TRIGGER IF EXISTS enforce_book_limit ON books;
  DROP TRIGGER IF EXISTS enforce_story_node_limit ON story_nodes;

  -- Create project limit trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    CREATE TRIGGER enforce_project_limit
      BEFORE INSERT ON projects
      FOR EACH ROW
      EXECUTE FUNCTION check_project_limit();
  END IF;

  -- Create book limit trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books') THEN
    CREATE TRIGGER enforce_book_limit
      BEFORE INSERT ON books
      FOR EACH ROW
      EXECUTE FUNCTION check_book_limit();
  END IF;

  -- Create story node limit trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_nodes') THEN
    CREATE TRIGGER enforce_story_node_limit
      BEFORE INSERT ON story_nodes
      FOR EACH ROW
      EXECUTE FUNCTION check_story_node_limit();
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION check_project_limit() IS 'Enforces subscription tier limits on project creation';
COMMENT ON FUNCTION check_book_limit() IS 'Enforces subscription tier limits on book creation';
COMMENT ON FUNCTION check_story_node_limit() IS 'Enforces subscription tier limits on story node creation';
