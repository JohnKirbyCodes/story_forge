"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_PHASES, type OnboardingPhase } from "./OnboardingProvider";

interface OnboardingProgressProps {
  currentPhase: OnboardingPhase;
  className?: string;
}

const PHASE_LABELS: Record<OnboardingPhase, string> = {
  [ONBOARDING_PHASES.WELCOME]: "Welcome",
  [ONBOARDING_PHASES.AI_SETUP]: "AI Setup",
  [ONBOARDING_PHASES.PROJECT]: "Project",
  [ONBOARDING_PHASES.UNIVERSE]: "Universe",
  [ONBOARDING_PHASES.BOOK]: "Book",
  [ONBOARDING_PHASES.TOOLTIPS]: "Tips",
};

// Only show main phases in progress (not tooltips)
const VISIBLE_PHASES: OnboardingPhase[] = [
  ONBOARDING_PHASES.WELCOME,
  ONBOARDING_PHASES.AI_SETUP,
  ONBOARDING_PHASES.PROJECT,
  ONBOARDING_PHASES.UNIVERSE,
  ONBOARDING_PHASES.BOOK,
];

export function OnboardingProgress({ currentPhase, className }: OnboardingProgressProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {VISIBLE_PHASES.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isCompleted = phase < currentPhase;

        return (
          <div key={phase} className="flex items-center">
            {/* Step indicator with label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  phase
                )}
              </div>
              {/* Label below circle */}
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isActive && "font-medium text-foreground",
                  !isActive && "text-muted-foreground"
                )}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>

            {/* Connector line (not after last item) */}
            {index < VISIBLE_PHASES.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-6 sm:w-10 transition-colors self-start mt-3.5",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact version showing just step number
interface OnboardingStepIndicatorProps {
  current: number;
  total: number;
  className?: string;
}

export function OnboardingStepIndicator({
  current,
  total,
  className,
}: OnboardingStepIndicatorProps) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Step {current} of {total}
    </div>
  );
}
