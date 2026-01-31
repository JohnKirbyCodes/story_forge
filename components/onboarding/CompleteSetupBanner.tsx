"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";

export function CompleteSetupBanner() {
  const { showBanner, openOnboarding, dismissBanner } = useOnboarding();
  const [isDismissing, setIsDismissing] = useState(false);

  if (!showBanner) {
    return null;
  }

  const handleResume = () => {
    openOnboarding();
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    await dismissBanner();
  };

  return (
    <div className="relative mb-6 flex items-center justify-between gap-4 rounded-lg border-l-4 border-primary bg-primary/10 px-4 py-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium">
          Complete your setup to unlock AI-powered writing features
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleResume}
          className="gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          Complete Setup
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
