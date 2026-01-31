export type AIProvider = "anthropic" | "openai" | "google";

export interface ModelConfig {
  id: string;
  displayName: string;
  description: string;
  tier: "premium" | "standard" | "fast";
  contextWindow: number;
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  apiKeyPrefix: string;
  apiKeyPlaceholder: string;
  docsUrl: string;
  models: ModelConfig[];
  defaultModel: string;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  anthropic: {
    name: "anthropic",
    displayName: "Anthropic (Claude)",
    apiKeyPrefix: "sk-ant-",
    apiKeyPlaceholder: "sk-ant-api03-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      {
        id: "claude-opus-4-20250514",
        displayName: "Claude Opus 4",
        description: "Most capable, best for complex creative writing",
        tier: "premium",
        contextWindow: 200000,
      },
      {
        id: "claude-sonnet-4-20250514",
        displayName: "Claude Sonnet 4",
        description: "Balanced performance and speed",
        tier: "standard",
        contextWindow: 200000,
      },
      {
        id: "claude-3-5-haiku-20241022",
        displayName: "Claude 3.5 Haiku",
        description: "Fast and efficient for quick edits",
        tier: "fast",
        contextWindow: 200000,
      },
    ],
  },
  openai: {
    name: "openai",
    displayName: "OpenAI (GPT)",
    apiKeyPrefix: "sk-",
    apiKeyPlaceholder: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
    models: [
      {
        id: "gpt-4o",
        displayName: "GPT-4o",
        description: "Latest flagship model, great for creative writing",
        tier: "premium",
        contextWindow: 128000,
      },
      {
        id: "gpt-4-turbo",
        displayName: "GPT-4 Turbo",
        description: "Powerful with large context window",
        tier: "standard",
        contextWindow: 128000,
      },
      {
        id: "gpt-4o-mini",
        displayName: "GPT-4o Mini",
        description: "Fast and cost-effective",
        tier: "fast",
        contextWindow: 128000,
      },
    ],
  },
  google: {
    name: "google",
    displayName: "Google (Gemini)",
    apiKeyPrefix: "AI",
    apiKeyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-2.0-flash",
    models: [
      {
        id: "gemini-2.5-pro-preview-06-05",
        displayName: "Gemini 2.5 Pro",
        description: "Most capable Gemini model",
        tier: "premium",
        contextWindow: 1000000,
      },
      {
        id: "gemini-2.0-flash",
        displayName: "Gemini 2.0 Flash",
        description: "Fast and efficient",
        tier: "standard",
        contextWindow: 1000000,
      },
      {
        id: "gemini-2.0-flash-lite",
        displayName: "Gemini 2.0 Flash Lite",
        description: "Fastest, most cost-effective",
        tier: "fast",
        contextWindow: 1000000,
      },
    ],
  },
};

export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.anthropic;
}

export function getModelConfig(provider: AIProvider, modelId: string): ModelConfig | undefined {
  const config = getProviderConfig(provider);
  return config.models.find(m => m.id === modelId);
}

export function getDefaultModel(provider: AIProvider): string {
  return getProviderConfig(provider).defaultModel;
}

export function validateApiKeyFormat(
  provider: AIProvider,
  apiKey: string
): boolean {
  const config = PROVIDER_CONFIGS[provider];
  // OpenAI keys can start with sk-proj- or sk-
  if (provider === "openai") {
    return apiKey.startsWith("sk-");
  }
  return apiKey.startsWith(config.apiKeyPrefix);
}

export function isValidProvider(provider: string): provider is AIProvider {
  return provider in PROVIDER_CONFIGS;
}

export function isValidModel(provider: AIProvider, modelId: string): boolean {
  const config = getProviderConfig(provider);
  return config.models.some(m => m.id === modelId);
}

// Multi-provider support

export interface ModelWithProvider extends ModelConfig {
  provider: AIProvider;
  providerDisplayName: string;
}

/**
 * Get provider from a model ID. Returns undefined if model not found.
 */
export function getProviderForModel(modelId: string): AIProvider | undefined {
  for (const [provider, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (config.models.some(m => m.id === modelId)) {
      return provider as AIProvider;
    }
  }
  return undefined;
}

/**
 * Get all models from specified providers (or all providers if none specified)
 */
export function getAllModels(providers?: AIProvider[]): ModelWithProvider[] {
  const targetProviders = providers || (Object.keys(PROVIDER_CONFIGS) as AIProvider[]);
  const models: ModelWithProvider[] = [];

  for (const provider of targetProviders) {
    const config = PROVIDER_CONFIGS[provider];
    for (const model of config.models) {
      models.push({
        ...model,
        provider,
        providerDisplayName: config.displayName,
      });
    }
  }

  return models;
}

/**
 * Get models grouped by provider
 */
export function getModelsGroupedByProvider(providers?: AIProvider[]): Record<AIProvider, ModelConfig[]> {
  const targetProviders = providers || (Object.keys(PROVIDER_CONFIGS) as AIProvider[]);
  const grouped: Partial<Record<AIProvider, ModelConfig[]>> = {};

  for (const provider of targetProviders) {
    grouped[provider] = PROVIDER_CONFIGS[provider].models;
  }

  return grouped as Record<AIProvider, ModelConfig[]>;
}

/**
 * Check if a model ID is valid for any of the given providers
 */
export function isValidModelForProviders(modelId: string, providers: AIProvider[]): boolean {
  for (const provider of providers) {
    if (isValidModel(provider, modelId)) {
      return true;
    }
  }
  return false;
}

/**
 * Get the first valid default model from a list of providers
 */
export function getDefaultModelFromProviders(providers: AIProvider[]): string {
  if (providers.length === 0) {
    return PROVIDER_CONFIGS.anthropic.defaultModel;
  }
  return PROVIDER_CONFIGS[providers[0]].defaultModel;
}
