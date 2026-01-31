"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Trash2,
  Cpu,
  Zap,
  Crown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  PROVIDER_CONFIGS,
  AIProvider,
  getAllModels,
  getProviderForModel,
} from "@/lib/ai/providers/config";

interface AISettingsProps {
  profile: {
    ai_provider?: string | null;
    ai_api_key_valid?: boolean | null;
    ai_default_model?: string | null;
    ai_model_outline?: string | null;
    ai_model_synopsis?: string | null;
    ai_model_scene?: string | null;
    ai_model_edit?: string | null;
    ai_model_universe?: string | null;
    // Multi-provider validity flags only - encrypted keys NEVER sent to client
    ai_key_valid_anthropic?: boolean | null;
    ai_key_valid_openai?: boolean | null;
    ai_key_valid_google?: boolean | null;
  } | null;
}

type TaskType = "outline" | "synopsis" | "scene" | "edit" | "universe";

const TASK_CONFIG: Record<TaskType, { label: string; description: string }> = {
  outline: {
    label: "Outline Generation",
    description: "Creating chapter structure and scene beats",
  },
  synopsis: {
    label: "Synopsis Generation",
    description: "Generating book summaries",
  },
  scene: {
    label: "Scene Generation",
    description: "Writing prose from beat instructions",
  },
  edit: {
    label: "Text Editing",
    description: "Expanding, shortening, and rewriting text",
  },
  universe: {
    label: "Universe Generation",
    description: "Creating characters, locations, factions, and relationships",
  },
};

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

// Helper to determine valid providers from profile
function getValidProviders(profile: AISettingsProps["profile"]): AIProvider[] {
  if (!profile) return [];
  const valid: AIProvider[] = [];

  // Check new multi-provider columns
  if (profile.ai_key_valid_anthropic) valid.push("anthropic");
  if (profile.ai_key_valid_openai) valid.push("openai");
  if (profile.ai_key_valid_google) valid.push("google");

  // Fallback to legacy single-provider if no multi-provider keys
  if (
    valid.length === 0 &&
    profile.ai_api_key_valid &&
    profile.ai_provider
  ) {
    valid.push(profile.ai_provider as AIProvider);
  }

  return valid;
}

export function AISettings({ profile }: AISettingsProps) {
  // Valid providers with API keys
  const [validProviders, setValidProviders] = useState<AIProvider[]>(
    getValidProviders(profile)
  );

  // Model settings
  const [defaultModel, setDefaultModel] = useState<string>(
    profile?.ai_default_model || "claude-sonnet-4-20250514"
  );
  const [taskModels, setTaskModels] = useState<Record<TaskType, string | null>>({
    outline: profile?.ai_model_outline || null,
    synopsis: profile?.ai_model_synopsis || null,
    scene: profile?.ai_model_scene || null,
    edit: profile?.ai_model_edit || null,
    universe: profile?.ai_model_universe || null,
  });

  // API key management per provider
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    anthropic: "",
    openai: "",
    google: "",
  });
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
  });
  const [validatingProvider, setValidatingProvider] = useState<AIProvider | null>(null);
  const [removingProvider, setRemovingProvider] = useState<AIProvider | null>(null);

  // UI state
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [savingTask, setSavingTask] = useState<TaskType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get all models from valid providers
  const availableModels = getAllModels(validProviders.length > 0 ? validProviders : undefined);

  const handleModelChange = async (modelId: string) => {
    setDefaultModel(modelId);
    setIsSavingModel(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultModel: modelId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update default model");
      }

      setSuccess("Default model updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update model");
      console.error("Failed to update model:", err);
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleTaskModelChange = async (task: TaskType, modelId: string | null) => {
    setTaskModels((prev) => ({ ...prev, [task]: modelId }));
    setSavingTask(task);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskModels: { [task]: modelId } }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update ${task} model`);
      }

      setSuccess(`${TASK_CONFIG[task].label} model updated!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // Revert on error
      setTaskModels((prev) => ({
        ...prev,
        [task]:
          task === "outline"
            ? profile?.ai_model_outline || null
            : task === "synopsis"
            ? profile?.ai_model_synopsis || null
            : task === "scene"
            ? profile?.ai_model_scene || null
            : task === "edit"
            ? profile?.ai_model_edit || null
            : profile?.ai_model_universe || null,
      }));
      setError(err instanceof Error ? err.message : "Failed to update model");
      console.error("Failed to update task model:", err);
    } finally {
      setSavingTask(null);
    }
  };

  const handleValidateAndSave = async (provider: AIProvider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey.trim()) {
      setError(`Please enter an API key for ${PROVIDER_CONFIGS[provider].displayName}`);
      return;
    }

    setValidatingProvider(provider);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setSuccess(`${PROVIDER_CONFIGS[provider].displayName} API key saved!`);
      setValidProviders((prev) =>
        prev.includes(provider) ? prev : [...prev, provider]
      );
      setApiKeys((prev) => ({ ...prev, [provider]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setValidatingProvider(null);
    }
  };

  const handleRemoveKey = async (provider: AIProvider) => {
    setRemovingProvider(provider);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/settings/ai-key?provider=${provider}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove API key");
      }

      setValidProviders((prev) => prev.filter((p) => p !== provider));
      setSuccess(`${PROVIDER_CONFIGS[provider].displayName} API key removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove API key");
    } finally {
      setRemovingProvider(null);
    }
  };

  // Render model select with grouped options
  const renderModelSelect = (
    value: string | null,
    onChange: (value: string | null) => void,
    disabled: boolean,
    showDefault: boolean = false
  ) => {
    const displayValue = value || defaultModel;
    const modelInfo = availableModels.find((m) => m.id === displayValue);

    return (
      <Select
        value={value || "__default__"}
        onValueChange={(v) => onChange(v === "__default__" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1">
          <SelectValue>
            {(() => {
              if (!modelInfo) return "Select model";
              const TierIcon = tierIcons[modelInfo.tier];
              return (
                <div className="flex items-center gap-2">
                  <TierIcon className={`h-4 w-4 ${tierColors[modelInfo.tier]}`} />
                  <span>{modelInfo.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({modelInfo.providerDisplayName.split(" ")[0]})
                  </span>
                  {showDefault && !value && (
                    <span className="text-muted-foreground">(default)</span>
                  )}
                </div>
              );
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showDefault && (
            <SelectItem value="__default__">
              <span className="text-muted-foreground">Use default model</span>
            </SelectItem>
          )}
          {validProviders.map((provider) => {
            const providerModels = availableModels.filter(
              (m) => m.provider === provider
            );
            if (providerModels.length === 0) return null;

            return (
              <SelectGroup key={provider}>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">
                  {PROVIDER_CONFIGS[provider].displayName}
                </SelectLabel>
                {providerModels.map((model) => {
                  const TierIcon = tierIcons[model.tier];
                  return (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <TierIcon className={`h-4 w-4 ${tierColors[model.tier]}`} />
                        <span>{model.displayName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            );
          })}
          {validProviders.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Add an API key to see available models
            </div>
          )}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      {/* API Keys Card - Multi-Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Configure API keys for one or more AI providers. You can mix and
            match models from different providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((provider) => {
            const config = PROVIDER_CONFIGS[provider];
            const isValid = validProviders.includes(provider);
            const isValidating = validatingProvider === provider;
            const isRemoving = removingProvider === provider;
            const showKey = showKeys[provider];
            const apiKey = apiKeys[provider];

            return (
              <div key={provider} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-medium">{config.displayName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {config.models.length} models available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isValid && (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    )}
                    <a
                      href={config.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Get Key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {isValid ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {config.apiKeyPrefix}************
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey(provider)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder={config.apiKeyPlaceholder}
                        value={apiKey}
                        onChange={(e) =>
                          setApiKeys((prev) => ({
                            ...prev,
                            [provider]: e.target.value,
                          }))
                        }
                        className="pr-10 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            [provider]: !prev[provider],
                          }))
                        }
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleValidateAndSave(provider)}
                      disabled={isValidating || !apiKey.trim()}
                    >
                      {isValidating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Validate & Save
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Model Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Model Settings
          </CardTitle>
          <CardDescription>
            Set a default model and optionally customize models for each task.
            You can use models from any provider with a valid API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validProviders.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Add at least one API key above to configure model settings.
              </AlertDescription>
            </Alert>
          )}

          {validProviders.length > 0 && (
            <>
              {/* Default Model */}
              <div className="space-y-2">
                <Label>Default Model</Label>
                {renderModelSelect(
                  defaultModel,
                  (v) => v && handleModelChange(v),
                  isSavingModel
                )}
                {isSavingModel && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Used when a task-specific model isn&apos;t set
                </p>
              </div>

              {/* Task-Specific Models */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Task-Specific Models</h4>
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                </div>
                <div className="grid gap-4">
                  {(Object.keys(TASK_CONFIG) as TaskType[]).map((task) => {
                    const taskConfig = TASK_CONFIG[task];
                    const currentModel = taskModels[task];
                    const isCustom = !!currentModel;
                    const isSaving = savingTask === task;

                    return (
                      <div
                        key={task}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-sm">
                              {taskConfig.label}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {taskConfig.description}
                            </p>
                          </div>
                          {isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderModelSelect(
                            currentModel,
                            (v) => handleTaskModelChange(task, v),
                            isSaving,
                            true
                          )}
                          {isSaving && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Reference */}
              <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                <h4 className="text-sm font-medium">Available Models</h4>
                <div className="space-y-4">
                  {validProviders.map((provider) => {
                    const config = PROVIDER_CONFIGS[provider];
                    return (
                      <div key={provider}>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                          {config.displayName}
                        </h5>
                        <div className="grid gap-1">
                          {config.models.map((model) => {
                            const TierIcon = tierIcons[model.tier];
                            return (
                              <div
                                key={model.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <TierIcon
                                    className={`h-3.5 w-3.5 ${tierColors[model.tier]}`}
                                  />
                                  <span>{model.displayName}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {model.contextWindow.toLocaleString()} tokens
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Crown className="inline h-3 w-3 text-amber-500 mr-1" />
                  Premium models are best for complex creative tasks.{" "}
                  <Zap className="inline h-3 w-3 text-green-500 mr-1" />
                  Fast models are efficient for quick edits.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
