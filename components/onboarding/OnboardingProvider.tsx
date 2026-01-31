"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onboardingAnalytics, type OnboardingStep } from "@/lib/analytics/onboarding";
import type { OnboardingStatus } from "@/app/api/onboarding/status/route";

// Define phases and their steps
export const ONBOARDING_PHASES = {
  WELCOME: 1,
  AI_SETUP: 2,
  PROJECT: 3,
  UNIVERSE: 4,
  BOOK: 5,
  TOOLTIPS: 6,
} as const;

export type OnboardingPhase = (typeof ONBOARDING_PHASES)[keyof typeof ONBOARDING_PHASES];

// Map steps to phases
const STEP_TO_PHASE: Record<OnboardingStep, OnboardingPhase> = {
  welcome: ONBOARDING_PHASES.WELCOME,
  welcome_seen: ONBOARDING_PHASES.WELCOME,
  pain_points: ONBOARDING_PHASES.WELCOME,
  solution_preview: ONBOARDING_PHASES.WELCOME,
  welcome_complete: ONBOARDING_PHASES.WELCOME,
  ai_intro: ONBOARDING_PHASES.AI_SETUP,
  ai_provider_select: ONBOARDING_PHASES.AI_SETUP,
  ai_key_entry: ONBOARDING_PHASES.AI_SETUP,
  ai_key_success: ONBOARDING_PHASES.AI_SETUP,
  ai_model_select: ONBOARDING_PHASES.AI_SETUP,
  ai_skipped: ONBOARDING_PHASES.AI_SETUP,
  ai_complete: ONBOARDING_PHASES.AI_SETUP,
  project_intro: ONBOARDING_PHASES.PROJECT,
  project_form: ONBOARDING_PHASES.PROJECT,
  world_bible: ONBOARDING_PHASES.PROJECT,
  project_complete: ONBOARDING_PHASES.PROJECT,
  graph_intro: ONBOARDING_PHASES.UNIVERSE,
  create_character: ONBOARDING_PHASES.UNIVERSE,
  create_location: ONBOARDING_PHASES.UNIVERSE,
  create_relationship: ONBOARDING_PHASES.UNIVERSE,
  graph_reveal: ONBOARDING_PHASES.UNIVERSE,
  universe_complete: ONBOARDING_PHASES.UNIVERSE,
  book_creation: ONBOARDING_PHASES.BOOK,
  style_sheet: ONBOARDING_PHASES.BOOK,
  scene_setup: ONBOARDING_PHASES.BOOK,
  beats_explanation: ONBOARDING_PHASES.BOOK,
  first_generation: ONBOARDING_PHASES.BOOK,
  completed: ONBOARDING_PHASES.BOOK,
};

interface OnboardingContextValue {
  // State
  isLoading: boolean;
  isOpen: boolean;
  currentStep: OnboardingStep;
  currentPhase: OnboardingPhase;
  isCompleted: boolean;
  isSkipped: boolean;
  showBanner: boolean;
  hasValidAiKey: boolean;
  tooltipsDismissed: string[];

  // Created resources during onboarding
  createdProjectId: string | null;
  createdBookId: string | null;
  createdCharacterId: string | null;
  createdLocationId: string | null;

  // Actions
  setStep: (step: OnboardingStep) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  dismissBanner: () => Promise<void>;
  dismissTooltip: (tooltipId: string) => Promise<void>;
  isTooltipDismissed: (tooltipId: string) => boolean;
  openOnboarding: (resumeFromStep?: OnboardingStep) => void;
  closeOnboarding: () => void;

  // Resource setters
  setCreatedProjectId: (id: string) => void;
  setCreatedBookId: (id: string) => void;
  setCreatedCharacterId: (id: string) => void;
  setCreatedLocationId: (id: string) => void;

  // Timing for analytics
  startTime: number;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// Step order for navigation
const STEP_ORDER: OnboardingStep[] = [
  // Phase 1: Welcome
  "welcome",
  "pain_points",
  "solution_preview",
  // Phase 2: AI Setup
  "ai_intro",
  "ai_provider_select",
  "ai_key_entry",
  "ai_key_success",
  "ai_model_select",
  // Phase 3: Project
  "project_intro",
  "project_form",
  "world_bible",
  // Phase 4: Universe
  "graph_intro",
  "create_character",
  "create_location",
  "create_relationship",
  "graph_reveal",
  // Phase 5: Book
  "book_creation",
  "style_sheet",
  "scene_setup",
  "beats_explanation",
  "first_generation",
  "completed",
];

interface OnboardingProviderProps {
  children: React.ReactNode;
  initialStatus?: OnboardingStatus | null;
}

export function OnboardingProvider({ children, initialStatus }: OnboardingProviderProps) {
  const [isLoading, setIsLoading] = useState(!initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    (initialStatus?.onboarding_current_step as OnboardingStep) || "welcome"
  );
  const [isCompleted, setIsCompleted] = useState(initialStatus?.onboarding_completed ?? false);
  const [isSkipped, setIsSkipped] = useState(!!initialStatus?.onboarding_skipped_at);
  const [bannerDismissed, setBannerDismissed] = useState(
    initialStatus?.onboarding_banner_dismissed ?? false
  );
  const [hasValidAiKey, setHasValidAiKey] = useState(initialStatus?.has_valid_ai_key ?? false);
  const [tooltipsDismissed, setTooltipsDismissed] = useState<string[]>(
    initialStatus?.tooltips_dismissed ?? []
  );

  // Created resources
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdBookId, setCreatedBookId] = useState<string | null>(null);
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(null);
  const [createdLocationId, setCreatedLocationId] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());

  // Track if status has been successfully fetched
  const [statusFetched, setStatusFetched] = useState(!!initialStatus);

  // Fetch initial status if not provided
  useEffect(() => {
    if (initialStatus) {
      setIsLoading(false);
      setStatusFetched(true);
      return;
    }

    async function fetchStatus() {
      try {
        const response = await fetch("/api/onboarding/status");
        if (response.ok) {
          const data: OnboardingStatus = await response.json();
          setCurrentStep((data.onboarding_current_step as OnboardingStep) || "welcome");
          setIsCompleted(data.onboarding_completed);
          setIsSkipped(!!data.onboarding_skipped_at);
          setBannerDismissed(data.onboarding_banner_dismissed);
          setHasValidAiKey(data.has_valid_ai_key);
          setTooltipsDismissed(data.tooltips_dismissed);
          setStatusFetched(true);
        } else {
          // If API fails, don't auto-open onboarding
          console.error("Failed to fetch onboarding status:", response.status);
          setStatusFetched(false);
        }
      } catch (error) {
        console.error("Failed to fetch onboarding status:", error);
        setStatusFetched(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [initialStatus]);

  // Auto-open onboarding for new users
  useEffect(() => {
    // Only auto-open if status was successfully fetched and user hasn't completed/skipped
    if (!isLoading && statusFetched && !isCompleted && !isSkipped) {
      setIsOpen(true);
      startTimeRef.current = Date.now();
      onboardingAnalytics.started("first_login");
    }
  }, [isLoading, statusFetched, isCompleted, isSkipped]);

  const currentPhase = STEP_TO_PHASE[currentStep] || ONBOARDING_PHASES.WELCOME;
  const showBanner = isSkipped && !isCompleted && !bannerDismissed;

  const setStep = useCallback(async (step: OnboardingStep) => {
    const prevStep = currentStep;
    setCurrentStep(step);

    // Track step completion
    const duration = Date.now() - startTimeRef.current;
    onboardingAnalytics.stepCompleted(STEP_TO_PHASE[prevStep], prevStep, duration);
    startTimeRef.current = Date.now();

    // Persist to server
    try {
      await fetch("/api/onboarding/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
    } catch (error) {
      console.error("Failed to update step:", error);
    }
  }, [currentStep]);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[currentIndex + 1];
      setStep(next);
    }
  }, [currentStep, setStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prev = STEP_ORDER[currentIndex - 1];
      setStep(prev);
    }
  }, [currentStep, setStep]);

  const skipOnboarding = useCallback(async () => {
    setIsSkipped(true);
    setIsOpen(false);
    onboardingAnalytics.skipped(currentStep);

    try {
      await fetch("/api/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStep }),
      });
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(async () => {
    setIsCompleted(true);
    setIsOpen(false);

    const duration = Date.now() - startTimeRef.current;
    onboardingAnalytics.completed(duration, []);

    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  }, []);

  const dismissBanner = useCallback(async () => {
    setBannerDismissed(true);
    onboardingAnalytics.bannerDismissed();

    try {
      await fetch("/api/onboarding/dismiss-banner", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to dismiss banner:", error);
    }
  }, []);

  const dismissTooltip = useCallback(async (tooltipId: string) => {
    setTooltipsDismissed((prev) => [...prev, tooltipId]);
    onboardingAnalytics.tooltipDismissed(tooltipId);

    try {
      await fetch("/api/onboarding/dismiss-tooltip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tooltipId }),
      });
    } catch (error) {
      console.error("Failed to dismiss tooltip:", error);
    }
  }, []);

  const isTooltipDismissed = useCallback(
    (tooltipId: string) => tooltipsDismissed.includes(tooltipId),
    [tooltipsDismissed]
  );

  const openOnboarding = useCallback((resumeFromStep?: OnboardingStep) => {
    if (resumeFromStep) {
      setCurrentStep(resumeFromStep);
    }
    setIsOpen(true);
    startTimeRef.current = Date.now();
    onboardingAnalytics.resumed(resumeFromStep || currentStep);
  }, [currentStep]);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: OnboardingContextValue = {
    isLoading,
    isOpen,
    currentStep,
    currentPhase,
    isCompleted,
    isSkipped,
    showBanner,
    hasValidAiKey,
    tooltipsDismissed,
    createdProjectId,
    createdBookId,
    createdCharacterId,
    createdLocationId,
    setStep,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    dismissBanner,
    dismissTooltip,
    isTooltipDismissed,
    openOnboarding,
    closeOnboarding,
    setCreatedProjectId,
    setCreatedBookId,
    setCreatedCharacterId,
    setCreatedLocationId,
    startTime: startTimeRef.current,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
