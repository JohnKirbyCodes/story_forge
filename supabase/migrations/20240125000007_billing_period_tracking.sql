-- Add billing period tracking for accurate quota resets
-- and update default word quota to 10,000 for free tier

-- Add billing period columns for tracking monthly quota cycles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_period_start date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS billing_period_end date DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date;

-- Update default words_quota from 5000 to 10000 for free tier
ALTER TABLE public.profiles
ALTER COLUMN words_quota SET DEFAULT 10000;

-- Update existing free tier users to new quota (only if they have the old default)
UPDATE public.profiles
SET words_quota = 10000
WHERE subscription_tier = 'free' AND words_quota = 5000;

-- Add index for efficient quota lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Function to reset monthly word usage
CREATE OR REPLACE FUNCTION reset_monthly_word_usage(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    words_used_this_month = 0,
    billing_period_start = CURRENT_DATE,
    billing_period_end = (CURRENT_DATE + INTERVAL '1 month')::date
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if billing period has expired and needs reset
CREATE OR REPLACE FUNCTION check_and_reset_billing_period(user_id uuid)
RETURNS boolean AS $$
DECLARE
  period_end date;
BEGIN
  SELECT billing_period_end INTO period_end
  FROM public.profiles
  WHERE id = user_id;

  IF period_end IS NULL OR CURRENT_DATE >= period_end THEN
    PERFORM reset_monthly_word_usage(user_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment word usage atomically
CREATE OR REPLACE FUNCTION increment_word_usage(user_id uuid, word_count integer)
RETURNS void AS $$
BEGIN
  -- First check if billing period needs reset
  PERFORM check_and_reset_billing_period(user_id);

  -- Then increment usage
  UPDATE public.profiles
  SET words_used_this_month = COALESCE(words_used_this_month, 0) + word_count
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
