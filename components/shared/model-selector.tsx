"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Cpu, Zap } from "lucide-react";
import {
  PROVIDER_CONFIGS,
  AIProvider,
  ModelConfig,
  getAllModels,
  getProviderForModel,
} from "@/lib/ai/providers/config";

interface ModelSelectorProps {
  /** Single provider (legacy) or array of valid providers */
  provider: AIProvider | AIProvider[];
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const tierIcons = {
  premium: Crown,
  standard: Cpu,
  fast: Zap,
};

const tierColors = {
  premium: "text-amber-500",
  standard: "text-blue-500",
  fast: "text-green-500",
};

export function ModelSelector({
  provider,
  value,
  onChange,
  disabled,
  compact = false,
}: ModelSelectorProps) {
  // Normalize provider to array
  const providers = Array.isArray(provider) ? provider : [provider];
  const isMultiProvider = providers.length > 1;

  // Get all models from valid providers
  const allModels = getAllModels(providers);

  // Find selected model
  const selectedModel = allModels.find((m) => m.id === value) || allModels[0];

  if (compact) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue>
            {selectedModel && (
              <div className="flex items-center gap-1.5">
                {(() => {
                  const TierIcon = tierIcons[selectedModel.tier];
                  return (
                    <TierIcon
                      className={`h-3 w-3 ${tierColors[selectedModel.tier]}`}
                    />
                  );
                })()}
                <span className="truncate">{selectedModel.displayName}</span>
                {isMultiProvider && (
                  <span className="text-muted-foreground text-[10px]">
                    ({selectedModel.providerDisplayName.split(" ")[0]})
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isMultiProvider ? (
            // Grouped by provider
            providers.map((p) => {
              const providerModels = allModels.filter((m) => m.provider === p);
              if (providerModels.length === 0) return null;

              return (
                <SelectGroup key={p}>
                  <SelectLabel className="text-[10px] font-semibold text-muted-foreground">
                    {PROVIDER_CONFIGS[p].displayName}
                  </SelectLabel>
                  {providerModels.map((model) => {
                    const TierIcon = tierIcons[model.tier];
                    return (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <TierIcon
                            className={`h-3 w-3 ${tierColors[model.tier]}`}
                          />
                          <span>{model.displayName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              );
            })
          ) : (
            // Single provider, flat list
            allModels.map((model) => {
              const TierIcon = tierIcons[model.tier];
              return (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <TierIcon className={`h-3 w-3 ${tierColors[model.tier]}`} />
                    <span>{model.displayName}</span>
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {selectedModel && (
            <div className="flex items-center gap-2">
              {(() => {
                const TierIcon = tierIcons[selectedModel.tier];
                return (
                  <TierIcon
                    className={`h-4 w-4 ${tierColors[selectedModel.tier]}`}
                  />
                );
              })()}
              <span>{selectedModel.displayName}</span>
              {isMultiProvider && (
                <span className="text-xs text-muted-foreground">
                  ({selectedModel.providerDisplayName.split(" ")[0]})
                </span>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {isMultiProvider ? (
          // Grouped by provider
          providers.map((p) => {
            const providerModels = allModels.filter((m) => m.provider === p);
            if (providerModels.length === 0) return null;

            return (
              <SelectGroup key={p}>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">
                  {PROVIDER_CONFIGS[p].displayName}
                </SelectLabel>
                {providerModels.map((model) => {
                  const TierIcon = tierIcons[model.tier];
                  return (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <TierIcon
                          className={`h-4 w-4 ${tierColors[model.tier]}`}
                        />
                        <div className="flex flex-col">
                          <span>{model.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            );
          })
        ) : (
          // Single provider, flat list
          allModels.map((model) => {
            const TierIcon = tierIcons[model.tier];
            return (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <TierIcon className={`h-4 w-4 ${tierColors[model.tier]}`} />
                  <div className="flex flex-col">
                    <span>{model.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}

// Export provider models for direct use
export function getProviderModels(provider: AIProvider): ModelConfig[] {
  return PROVIDER_CONFIGS[provider].models;
}

export function getDefaultModelId(provider: AIProvider): string {
  return PROVIDER_CONFIGS[provider].defaultModel;
}
