"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Network, BookOpen, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./OnboardingProvider";
import type { OnboardingStep } from "@/lib/analytics/onboarding";

type WelcomeSubStep = "welcome" | "pain_points" | "solution_preview";

interface WelcomeStepsProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeSteps({ onComplete, onSkip }: WelcomeStepsProps) {
  const { currentStep, setStep } = useOnboarding();
  const [subStep, setSubStep] = useState<WelcomeSubStep>(
    currentStep === "pain_points" || currentStep === "solution_preview"
      ? (currentStep as WelcomeSubStep)
      : "welcome"
  );

  const handleNext = async () => {
    if (subStep === "welcome") {
      await setStep("pain_points");
      setSubStep("pain_points");
    } else if (subStep === "pain_points") {
      await setStep("solution_preview");
      setSubStep("solution_preview");
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center py-6">
      {subStep === "welcome" && (
        <WelcomeScreen onNext={handleNext} onSkip={onSkip} />
      )}
      {subStep === "pain_points" && (
        <PainPointsScreen onNext={handleNext} />
      )}
      {subStep === "solution_preview" && (
        <SolutionPreviewScreen onNext={handleNext} />
      )}
    </div>
  );
}

// Step 1.1: Welcome Screen
function WelcomeScreen({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center px-4 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Logo/Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>

      {/* Headline */}
      <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome to NovelWorld
      </h1>

      {/* Subheadline */}
      <p className="mb-4 text-lg text-muted-foreground sm:text-xl">
        The AI writing assistant that actually remembers your story
      </p>

      {/* Body */}
      <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
        Unlike generic AI tools that forget your characters mid-chapter, NovelWorld
        maintains a living knowledge graph of your entire story universe—every
        character, location, relationship, and plot thread.
      </p>

      {/* CTAs */}
      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={onNext} className="w-full sm:w-auto">
          Let&apos;s Get Started
        </Button>
        <Button variant="ghost" size="lg" onClick={onSkip} className="w-full sm:w-auto">
          Skip Setup
        </Button>
      </div>
    </div>
  );
}

// Step 1.2: Pain Point Acknowledgment
function PainPointsScreen({ onNext }: { onNext: () => void }) {
  const [visiblePoints, setVisiblePoints] = useState(0);

  const painPoints = [
    "Your AI assistant forgot your protagonist's eye color—again",
    "You spend more time re-explaining your world than writing",
    "Character relationships get tangled across chapters",
    "Your multi-book series? The AI has no idea Book 1 happened",
  ];

  useEffect(() => {
    // Animate pain points appearing one by one
    if (visiblePoints < painPoints.length) {
      const timer = setTimeout(() => {
        setVisiblePoints((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visiblePoints, painPoints.length]);

  return (
    <div className="flex w-full flex-col items-center px-4 text-center animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">Sound Familiar?</h2>

      {/* Pain Points */}
      <div className="mb-6 max-w-md space-y-3 text-left">
        {painPoints.map((point, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 transition-all duration-300",
              index < visiblePoints
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-4"
            )}
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <X className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-muted-foreground sm:text-base">{point}</p>
          </div>
        ))}
      </div>

      {/* Solution Tease */}
      <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
        NovelWorld solves this with a{" "}
        <span className="font-medium text-foreground">Story Universe</span>—a
        knowledge graph that grows with your story.
      </p>

      {/* CTA */}
      <Button size="lg" onClick={onNext}>
        Show Me How It Works
      </Button>
    </div>
  );
}

// Step 1.3: Solution Preview
function SolutionPreviewScreen({ onNext }: { onNext: () => void }) {
  const features = [
    {
      icon: Network,
      title: "Knowledge Graph",
      description:
        "Every character, location, and plot thread—connected and searchable",
    },
    {
      icon: BookOpen,
      title: "Series Support",
      description: "Write multi-book sagas without losing context",
    },
    {
      icon: Sparkles,
      title: "Smart AI Generation",
      description: "AI that knows your world as well as you do",
    },
  ];

  return (
    <div className="flex w-full flex-col items-center px-4 text-center animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">Meet Your Story Universe</h2>

      {/* Feature Cards */}
      <div className="mb-6 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-lg border bg-card p-4 text-center transition-all hover:border-primary/50 hover:shadow-md"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
            <p className="text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button size="lg" onClick={onNext}>
        Set Up My Account
      </Button>
    </div>
  );
}
