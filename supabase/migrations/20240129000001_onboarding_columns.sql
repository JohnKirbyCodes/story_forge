-- Add onboarding tracking columns to profiles table
-- These columns track user progress through the onboarding flow

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT null;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_current_step text DEFAULT 'welcome';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz DEFAULT null;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_banner_dismissed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tooltips_dismissed text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN profiles.onboarding_current_step IS 'Current step in onboarding flow (for resume)';
COMMENT ON COLUMN profiles.onboarding_skipped_at IS 'Timestamp when user skipped onboarding';
COMMENT ON COLUMN profiles.onboarding_banner_dismissed IS 'Whether user dismissed the "Complete Setup" banner';
COMMENT ON COLUMN profiles.tooltips_dismissed IS 'Array of tooltip IDs the user has dismissed';
