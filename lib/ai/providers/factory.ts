import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { AIProvider, getProviderConfig, getDefaultModel } from "./config";

export interface ProviderInstance {
  getModel: (modelId?: string) => LanguageModel;
  providerName: AIProvider;
  defaultModelId: string;
}

export function createProviderInstance(
  providerName: AIProvider,
  apiKey: string
): ProviderInstance {
  const config = getProviderConfig(providerName);
  const defaultModelId = config.defaultModel;

  switch (providerName) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return {
        getModel: (modelId?: string) => anthropic(modelId || defaultModelId),
        providerName,
        defaultModelId,
      };
    }

    case "openai": {
      const openai = createOpenAI({ apiKey });
      return {
        getModel: (modelId?: string) => openai(modelId || defaultModelId),
        providerName,
        defaultModelId,
      };
    }

    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return {
        getModel: (modelId?: string) => google(modelId || defaultModelId),
        providerName,
        defaultModelId,
      };
    }

    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
