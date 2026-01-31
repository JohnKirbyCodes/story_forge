-- Migration: Support multiple AI provider API keys
-- Users can now configure and use models from multiple providers simultaneously

-- Add per-provider API key columns (encrypted with embedded IV format)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_anthropic text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_openai text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_google text;

-- Add per-provider validity flags
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_valid_anthropic boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_valid_openai boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_key_valid_google boolean DEFAULT false;

-- IMPORTANT: We do NOT copy existing encrypted keys to the new columns because:
-- 1. Legacy keys use a different encryption format (separate IV in ai_api_key_iv)
-- 2. New per-provider keys use embedded IV format (IV included in the encrypted value)
-- 3. Copying would cause decryption failures with the new decryption function
--
-- Existing users will continue to use their legacy keys via the backward compatibility
-- code in getUserProvider(). When they save a new key through the UI, it will be
-- stored in the new per-provider columns with the correct embedded format.

-- Note: We keep the old columns (ai_provider, ai_api_key_encrypted, ai_api_key_valid)
-- for backward compatibility. They can be removed in a future migration after all users
-- have re-saved their keys.

-- Add comment explaining the new structure
COMMENT ON COLUMN public.profiles.ai_key_anthropic IS 'Encrypted Anthropic API key';
COMMENT ON COLUMN public.profiles.ai_key_openai IS 'Encrypted OpenAI API key';
COMMENT ON COLUMN public.profiles.ai_key_google IS 'Encrypted Google AI API key';
COMMENT ON COLUMN public.profiles.ai_key_valid_anthropic IS 'Whether the Anthropic API key has been validated';
COMMENT ON COLUMN public.profiles.ai_key_valid_openai IS 'Whether the OpenAI API key has been validated';
COMMENT ON COLUMN public.profiles.ai_key_valid_google IS 'Whether the Google AI API key has been validated';
