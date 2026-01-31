"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Eye, EyeOff, Check, ArrowLeft, Loader2, Crown, Cpu, Zap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./OnboardingProvider";
import { SuccessCheck } from "./SuccessAnimation";
import { onboardingAnalytics } from "@/lib/analytics/onboarding";
import { toast } from "sonner";
import {
  PROVIDER_CONFIGS,
  type AIProvider,
  validateApiKeyFormat,
  getDefaultModel,
} from "@/lib/ai/providers/config";

type AISubStep =
  | "ai_intro"
  | "ai_provider_select"
  | "ai_key_entry"
  | "ai_key_success"
  | "ai_model_select";

interface AISetupStepsProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function AISetupSteps({ onComplete, onSkip }: AISetupStepsProps) {
  const { currentStep, setStep } = useOnboarding();
  const [subStep, setSubStep] = useState<AISubStep>(() => {
    if (
      currentStep === "ai_provider_select" ||
      currentStep === "ai_key_entry" ||
      currentStep === "ai_key_success" ||
      currentStep === "ai_model_select"
    ) {
      return currentStep as AISubStep;
    }
    return "ai_intro";
  });
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const handleSkip = async () => {
    await setStep("ai_skipped");
    onboardingAnalytics.aiSetupSkipped(subStep);
    toast.info("You can configure AI anytime in Settings → AI");
    onSkip();
  };

  const goToProviderSelect = async () => {
    await setStep("ai_provider_select");
    setSubStep("ai_provider_select");
  };

  const handleProviderSelect = async (provider: AIProvider) => {
    setSelectedProvider(provider);
    setSelectedModel(getDefaultModel(provider));
    onboardingAnalytics.aiProviderSelected(provider);
    await setStep("ai_key_entry");
    setSubStep("ai_key_entry");
  };

  const handleValidateKey = async () => {
    if (!selectedProvider || !apiKey) return;

    // Validate format first
    if (!validateApiKeyFormat(selectedProvider, apiKey)) {
      const config = PROVIDER_CONFIGS[selectedProvider];
      toast.error(
        `That doesn't look like a valid ${config.displayName} API key. Keys should start with '${config.apiKeyPrefix}'.`
      );
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/settings/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        onboardingAnalytics.aiKeyValidated(selectedProvider, false);
        toast.error(
          data.message ||
            "We couldn't validate this key. Please check it's correct and has billing enabled."
        );
        return;
      }

      onboardingAnalytics.aiKeyValidated(selectedProvider, true);
      await setStep("ai_key_success");
      setSubStep("ai_key_success");
    } catch (error) {
      console.error("Error validating key:", error);
      toast.error("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const goToModelSelect = async () => {
    await setStep("ai_model_select");
    setSubStep("ai_model_select");
  };

  const handleSaveModel = async () => {
    if (!selectedProvider || !selectedModel) return;

    try {
      const response = await fetch("/api/settings/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          defaultModel: selectedModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to save model selection");
        return;
      }

      toast.success("AI setup complete!");
      onComplete();
    } catch (error) {
      console.error("Error saving model:", error);
      toast.error("Failed to save model selection");
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-8">
      {subStep === "ai_intro" && (
        <AIIntroScreen onNext={goToProviderSelect} onSkip={handleSkip} />
      )}
      {subStep === "ai_provider_select" && (
        <ProviderSelectScreen
          onSelect={handleProviderSelect}
          selectedProvider={selectedProvider}
        />
      )}
      {subStep === "ai_key_entry" && selectedProvider && (
        <KeyEntryScreen
          provider={selectedProvider}
          apiKey={apiKey}
          showKey={showKey}
          isValidating={isValidating}
          onApiKeyChange={setApiKey}
          onToggleShowKey={() => setShowKey(!showKey)}
          onValidate={handleValidateKey}
          onBack={() => {
            setSubStep("ai_provider_select");
            setApiKey("");
          }}
        />
      )}
      {subStep === "ai_key_success" && selectedProvider && (
        <KeySuccessScreen
          provider={selectedProvider}
          apiKey={apiKey}
          onContinue={goToModelSelect}
          onAddAnother={() => {
            setSubStep("ai_provider_select");
            setApiKey("");
            setSelectedProvider(null);
          }}
        />
      )}
      {subStep === "ai_model_select" && selectedProvider && (
        <ModelSelectScreen
          provider={selectedProvider}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onSave={handleSaveModel}
        />
      )}
    </div>
  );
}

// Step 2.1: AI Setup Introduction
function AIIntroScreen({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const benefits = [
    "Pay only for what you use—no monthly AI fees",
    "Choose your preferred AI provider",
    "Your keys are encrypted and never leave our servers",
  ];

  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Shield className="h-10 w-10 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="mb-3 text-2xl font-bold">Power Your Writing with AI</h2>

      {/* Body */}
      <p className="mb-6 text-muted-foreground">
        NovelWorld uses your own AI API key to generate prose, outlines, and
        more. This gives you full control over costs and model selection.
      </p>

      {/* Benefits */}
      <div className="mb-6 space-y-3 text-left">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm text-muted-foreground">{benefit}</p>
          </div>
        ))}
      </div>

      {/* Security Note */}
      <p className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        Your API key is encrypted with AES-256-GCM and stored securely.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onNext}>
          Choose Your AI Provider
        </Button>
        <Button variant="ghost" size="lg" onClick={onSkip}>
          Set Up Later
        </Button>
      </div>
    </div>
  );
}

// Step 2.2: Provider Selection
function ProviderSelectScreen({
  onSelect,
  selectedProvider,
}: {
  onSelect: (provider: AIProvider) => void;
  selectedProvider: AIProvider | null;
}) {
  const providers: { id: AIProvider; tagline: string; color: string }[] = [
    {
      id: "anthropic",
      tagline: "Best for nuanced, creative writing with strong character voices",
      color: "border-purple-500",
    },
    {
      id: "openai",
      tagline: "Versatile and widely-used with strong general capabilities",
      color: "border-green-500",
    },
    {
      id: "google",
      tagline: "Excellent context window for long-form content",
      color: "border-blue-500",
    },
  ];

  return (
    <div className="flex max-w-2xl flex-col items-center animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-2 text-2xl font-bold">Choose Your AI Provider</h2>
      <p className="mb-8 text-muted-foreground">
        You can add more providers later in Settings
      </p>

      {/* Provider Cards */}
      <div className="mb-8 grid w-full gap-4 sm:grid-cols-3">
        {providers.map(({ id, tagline, color }) => {
          const config = PROVIDER_CONFIGS[id];
          const isSelected = selectedProvider === id;

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "flex flex-col items-center rounded-lg border-2 bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-md",
                isSelected && `${color} ring-2 ring-offset-2`
              )}
            >
              <h3 className="mb-2 font-semibold">{config.displayName}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{tagline}</p>
              <p className="text-xs text-muted-foreground">
                Models: {config.models.map((m) => m.displayName).join(", ")}
              </p>
            </button>
          );
        })}
      </div>

      {/* Help Link */}
      <p className="text-sm text-muted-foreground">
        Not sure which to choose?{" "}
        <a
          href="https://docs.storyforge.ai/ai-providers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          Learn more about AI providers
        </a>
      </p>
    </div>
  );
}

// Step 2.3: API Key Entry
function KeyEntryScreen({
  provider,
  apiKey,
  showKey,
  isValidating,
  onApiKeyChange,
  onToggleShowKey,
  onValidate,
  onBack,
}: {
  provider: AIProvider;
  apiKey: string;
  showKey: boolean;
  isValidating: boolean;
  onApiKeyChange: (value: string) => void;
  onToggleShowKey: () => void;
  onValidate: () => void;
  onBack: () => void;
}) {
  const config = PROVIDER_CONFIGS[provider];
  const isValidFormat = apiKey.length > 0 && validateApiKeyFormat(provider, apiKey);

  return (
    <div className="flex max-w-lg flex-col items-center animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 self-start"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Choose Different Provider
      </Button>

      {/* Headline */}
      <h2 className="mb-6 text-2xl font-bold">
        Enter Your {config.displayName} API Key
      </h2>

      {/* Instructions */}
      <div className="mb-6 w-full rounded-lg bg-muted/50 p-4 text-sm">
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>
            Go to{" "}
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
            >
              {config.docsUrl.replace("https://", "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>Click &quot;Create Key&quot; or &quot;Create new secret key&quot;</li>
          <li>Copy and paste it below</li>
        </ol>
      </div>

      {/* API Key Input */}
      <div className="mb-4 w-full space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="relative">
          <Input
            id="api-key"
            type={showKey ? "text" : "password"}
            placeholder={config.apiKeyPlaceholder}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {apiKey.length > 0 && (
              <SuccessCheck show={isValidFormat} />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleShowKey}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <p className="mb-6 text-sm text-muted-foreground">
        Your key is encrypted before storage and never sent to our servers
        unencrypted.
      </p>

      {/* CTA */}
      <Button
        size="lg"
        onClick={onValidate}
        disabled={!isValidFormat || isValidating}
        className="w-full"
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          "Validate & Save Key"
        )}
      </Button>
    </div>
  );
}

// Step 2.4: Key Validation Success
function KeySuccessScreen({
  provider,
  apiKey,
  onContinue,
  onAddAnother,
}: {
  provider: AIProvider;
  apiKey: string;
  onContinue: () => void;
  onAddAnother: () => void;
}) {
  const config = PROVIDER_CONFIGS[provider];
  const maskedKey = `${apiKey.slice(0, 7)}****...****${apiKey.slice(-4)}`;

  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-500">
      {/* Success Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>

      {/* Headline */}
      <h2 className="mb-3 text-2xl font-bold">You&apos;re Connected!</h2>

      {/* Body */}
      <p className="mb-4 text-muted-foreground">
        Your {config.displayName} API key is validated and securely stored.
      </p>

      {/* Masked Key */}
      <p className="mb-8 font-mono text-sm text-muted-foreground">
        Key: {maskedKey}
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onContinue}>
          Choose Your Model
        </Button>
        <Button variant="outline" size="lg" onClick={onAddAnother}>
          Add Another Provider
        </Button>
      </div>
    </div>
  );
}

// Step 2.5: Model Selection
function ModelSelectScreen({
  provider,
  selectedModel,
  onModelChange,
  onSave,
}: {
  provider: AIProvider;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSave: () => void;
}) {
  const config = PROVIDER_CONFIGS[provider];
  const defaultModel = config.models.find((m) => m.id === config.defaultModel);

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

  return (
    <div className="flex max-w-lg flex-col items-center animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-2 text-2xl font-bold">Choose Your Default Model</h2>
      <p className="mb-8 text-center text-muted-foreground">
        This will be used for all AI generation. You can customize per-task later.
      </p>

      {/* Model Selector */}
      <div className="mb-4 w-full space-y-2">
        <Label>Default Model</Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {config.models.map((model) => {
              const TierIcon = tierIcons[model.tier];
              return (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <TierIcon className={cn("h-4 w-4", tierColors[model.tier])} />
                    <span>{model.displayName}</span>
                    <span className="text-muted-foreground">
                      ({Math.round(model.contextWindow / 1000)}k tokens)
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tier Legend */}
      <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Crown className="h-4 w-4 text-amber-500" />
          Premium: Best quality
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="h-4 w-4 text-blue-500" />
          Standard: Balanced
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-green-500" />
          Fast: Quick & cheap
        </div>
      </div>

      {/* Recommendation */}
      {defaultModel && (
        <p className="mb-8 text-center text-sm text-muted-foreground">
          We recommend <span className="font-medium">{defaultModel.displayName}</span>{" "}
          for most writers—great quality at reasonable cost.
        </p>
      )}

      {/* CTA */}
      <Button size="lg" onClick={onSave} className="w-full">
        Save & Continue
      </Button>
    </div>
  );
}
