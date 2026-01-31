import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { decryptApiKey, decryptApiKeyEmbedded } from "@/lib/crypto/api-key-encryption";
import { createProviderInstance, ProviderInstance } from "./factory";
import { AIProvider, getProviderConfig, getDefaultModel, isValidModel, getProviderForModel } from "./config";

export type ProviderErrorCode =
  | "NO_KEY"
  | "INVALID_KEY"
  | "DECRYPTION_ERROR"
  | "PROVIDER_ERROR";

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: ProviderErrorCode,
    public provider: AIProvider
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface UserProviderResult {
  instance: ProviderInstance;
  provider: AIProvider;
  defaultModelId: string;
}

export async function getUserProvider(
  supabase: SupabaseClient<Database>,
  userId: string,
  requestedModel?: string
): Promise<UserProviderResult> {
  // Fetch user's provider settings
  // Try with multi-provider columns first, fall back to legacy if columns don't exist
  let profile: {
    ai_provider?: string | null;
    ai_default_model?: string | null;
    ai_api_key_encrypted?: string | null;
    ai_api_key_iv?: string | null;
    ai_key_anthropic?: string | null;
    ai_key_openai?: string | null;
    ai_key_google?: string | null;
    ai_key_valid_anthropic?: boolean | null;
    ai_key_valid_openai?: boolean | null;
    ai_key_valid_google?: boolean | null;
  } | null = null;

  // Try to fetch with all columns (including multi-provider)
  const { data: fullProfile, error: fullError } = await supabase
    .from("profiles")
    .select(`
      ai_provider,
      ai_default_model,
      ai_api_key_encrypted,
      ai_api_key_iv,
      ai_key_anthropic,
      ai_key_openai,
      ai_key_google,
      ai_key_valid_anthropic,
      ai_key_valid_openai,
      ai_key_valid_google
    `)
    .eq("id", userId)
    .single();

  if (!fullError) {
    profile = fullProfile;
  } else {
    // Fall back to legacy columns only (migration may not have run)
    const { data: legacyProfile, error: legacyError } = await supabase
      .from("profiles")
      .select(`
        ai_provider,
        ai_default_model,
        ai_api_key_encrypted,
        ai_api_key_iv
      `)
      .eq("id", userId)
      .single();

    if (legacyError) {
      throw new ProviderError(
        "Failed to load AI settings. Please try again or contact support.",
        "PROVIDER_ERROR",
        "anthropic"
      );
    }
    profile = legacyProfile;
  }

  // Determine provider: from requested model, or fall back to user default
  let provider: AIProvider;
  if (requestedModel) {
    const modelProvider = getProviderForModel(requestedModel);
    provider = modelProvider || (profile?.ai_provider as AIProvider) || "anthropic";
  } else {
    provider = (profile?.ai_provider || "anthropic") as AIProvider;
  }

  const config = getProviderConfig(provider);

  // Try to get API key: first per-provider key, then legacy key
  let apiKey: string | null = null;

  // Per-provider key columns
  const providerKeyMap = {
    anthropic: profile?.ai_key_anthropic,
    openai: profile?.ai_key_openai,
    google: profile?.ai_key_google,
  };
  const providerValidMap = {
    anthropic: profile?.ai_key_valid_anthropic,
    openai: profile?.ai_key_valid_openai,
    google: profile?.ai_key_valid_google,
  };

  const perProviderKey = providerKeyMap[provider];
  const perProviderValid = providerValidMap[provider];

  if (perProviderKey && perProviderValid) {
    // Use per-provider key (embedded IV format)
    try {
      apiKey = decryptApiKeyEmbedded(perProviderKey);
    } catch {
      throw new ProviderError(
        `Failed to decrypt ${config.displayName} API key. Please re-enter your key in Settings.`,
        "DECRYPTION_ERROR",
        provider
      );
    }
  } else if (
    profile?.ai_api_key_encrypted &&
    profile?.ai_api_key_iv &&
    profile?.ai_provider === provider
  ) {
    // Fall back to legacy key if it matches the requested provider
    try {
      apiKey = decryptApiKey({
        encrypted: profile.ai_api_key_encrypted,
        iv: profile.ai_api_key_iv,
      });
    } catch {
      throw new ProviderError(
        "Failed to decrypt API key. Please re-enter your key in Settings.",
        "DECRYPTION_ERROR",
        provider
      );
    }
  }

  if (!apiKey) {
    throw new ProviderError(
      `No API key configured for ${config.displayName}. Please add your API key in Settings.`,
      "NO_KEY",
      provider
    );
  }

  // Get user's default model, falling back to provider default
  let defaultModelId = requestedModel || profile?.ai_default_model;
  if (!defaultModelId || !isValidModel(provider, defaultModelId)) {
    defaultModelId = getDefaultModel(provider);
  }

  // Create provider instance
  try {
    const instance = createProviderInstance(provider, apiKey);
    return {
      instance,
      provider,
      defaultModelId,
    };
  } catch {
    throw new ProviderError(
      `Failed to initialize ${config.displayName} provider`,
      "PROVIDER_ERROR",
      provider
    );
  }
}
