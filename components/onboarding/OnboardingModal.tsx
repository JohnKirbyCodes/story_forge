"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useOnboarding, ONBOARDING_PHASES } from "./OnboardingProvider";
import { OnboardingProgress } from "./OnboardingProgress";
import { WelcomeSteps } from "./WelcomeSteps";
import { AISetupSteps } from "./AISetupSteps";
import { ProjectCreationSteps } from "./ProjectCreationSteps";
import { StoryUniverseSteps } from "./StoryUniverseSteps";
import { FirstBookSteps } from "./FirstBookSteps";

// First step of each phase for transitions
const PHASE_FIRST_STEPS = {
  [ONBOARDING_PHASES.WELCOME]: "welcome",
  [ONBOARDING_PHASES.AI_SETUP]: "ai_intro",
  [ONBOARDING_PHASES.PROJECT]: "project_intro",
  [ONBOARDING_PHASES.UNIVERSE]: "graph_intro",
  [ONBOARDING_PHASES.BOOK]: "book_creation",
} as const;

export function OnboardingModal() {
  const { isOpen, currentPhase, closeOnboarding, completeOnboarding, skipOnboarding, setStep, isLoading } = useOnboarding();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render during SSR or while loading
  if (!mounted || isLoading) {
    return null;
  }

  const handlePhaseComplete = async () => {
    // Advance to the next phase
    switch (currentPhase) {
      case ONBOARDING_PHASES.WELCOME:
        await setStep("ai_intro");
        break;
      case ONBOARDING_PHASES.AI_SETUP:
        await setStep("project_intro");
        break;
      case ONBOARDING_PHASES.PROJECT:
        await setStep("graph_intro");
        break;
      case ONBOARDING_PHASES.UNIVERSE:
        await setStep("book_creation");
        break;
      case ONBOARDING_PHASES.BOOK:
        await completeOnboarding();
        break;
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case ONBOARDING_PHASES.WELCOME:
        return <WelcomeSteps onComplete={handlePhaseComplete} onSkip={handleSkip} />;
      case ONBOARDING_PHASES.AI_SETUP:
        return <AISetupSteps onComplete={handlePhaseComplete} onSkip={handleSkip} />;
      case ONBOARDING_PHASES.PROJECT:
        return <ProjectCreationSteps onComplete={handlePhaseComplete} />;
      case ONBOARDING_PHASES.UNIVERSE:
        return <StoryUniverseSteps onComplete={handlePhaseComplete} onSkip={handlePhaseComplete} />;
      case ONBOARDING_PHASES.BOOK:
        return <FirstBookSteps onComplete={closeOnboarding} />;
      default:
        return <WelcomeSteps onComplete={handlePhaseComplete} onSkip={handleSkip} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeOnboarding()}>
      <DialogContent
        className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-0"
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside during welcome phase
          if (currentPhase === ONBOARDING_PHASES.WELCOME) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing via Escape during welcome phase
          if (currentPhase === ONBOARDING_PHASES.WELCOME) {
            e.preventDefault();
          }
        }}
      >
        <VisuallyHidden>
          <DialogTitle>NovelWorld Onboarding</DialogTitle>
        </VisuallyHidden>

        {/* Progress indicator */}
        <div className="border-b bg-muted/30 py-4 pl-6 pr-12">
          <OnboardingProgress currentPhase={currentPhase} />
        </div>

        {/* Phase content */}
        <div className="min-h-100">
          {renderCurrentPhase()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
