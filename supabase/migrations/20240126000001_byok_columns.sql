-- Migration: Add BYOK (Bring Your Own Key) columns to profiles table
-- Allows users to configure their own AI provider API keys

-- Add AI provider preference column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_provider text
CHECK (ai_provider IN ('anthropic', 'openai', 'google'));

-- Add encrypted API key storage columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_api_key_encrypted text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_api_key_iv text;

-- Add validation status column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_api_key_valid boolean DEFAULT false;

-- Add default model preference column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_default_model text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.ai_provider IS 'User preferred AI provider: anthropic, openai, or google';
COMMENT ON COLUMN public.profiles.ai_api_key_encrypted IS 'AES-256-GCM encrypted API key';
COMMENT ON COLUMN public.profiles.ai_api_key_iv IS 'Initialization vector for API key decryption';
COMMENT ON COLUMN public.profiles.ai_api_key_valid IS 'Whether the API key has been validated with the provider';
COMMENT ON COLUMN public.profiles.ai_default_model IS 'User default model ID for AI generation';

-- Note: word quota columns are kept for historical tracking but no longer enforced
-- words_used_this_month, words_quota, billing_period_start, billing_period_end
