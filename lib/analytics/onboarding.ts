import { track } from "@vercel/analytics";

/**
 * Onboarding analytics helper for tracking user progress through the onboarding flow.
 * Uses Vercel Analytics for event tracking.
 */
export const onboardingAnalytics = {
  /**
   * Track when onboarding starts
   */
  started: (source: "first_login" | "banner_resume") => {
    track("onboarding_started", { source });
  },

  /**
   * Track completion of each onboarding step
   */
  stepCompleted: (phase: number, step: string, durationMs: number) => {
    track("onboarding_step_completed", {
      phase,
      step,
      duration_ms: durationMs,
    });
  },

  /**
   * Track AI provider selection
   */
  aiProviderSelected: (provider: "anthropic" | "openai" | "google") => {
    track("onboarding_ai_provider_selected", { provider });
  },

  /**
   * Track API key validation attempt
   */
  aiKeyValidated: (provider: string, success: boolean) => {
    track("onboarding_ai_key_validated", { provider, success });
  },

  /**
   * Track when user skips AI setup
   */
  aiSetupSkipped: (step: string) => {
    track("onboarding_ai_setup_skipped", { step });
  },

  /**
   * Track first project creation
   */
  projectCreated: (genre: string, hasWorldBible: boolean) => {
    track("onboarding_project_created", {
      genre,
      has_world_bible: hasWorldBible,
    });
  },

  /**
   * Track story node creation during onboarding
   */
  nodeCreated: (type: "character" | "location") => {
    track("onboarding_node_created", { type });
  },

  /**
   * Track first relationship/edge creation
   */
  edgeCreated: (edgeType: string) => {
    track("onboarding_edge_created", { edge_type: edgeType });
  },

  /**
   * Track first AI prose generation
   */
  firstGeneration: (model: string, provider: string, wordCount: number) => {
    track("onboarding_first_generation", {
      model,
      provider,
      word_count: wordCount,
    });
  },

  /**
   * Track full onboarding completion
   */
  completed: (durationMs: number, stepsSkipped: string[]) => {
    track("onboarding_completed", {
      duration_ms: durationMs,
      steps_skipped: stepsSkipped.join(","),
      steps_skipped_count: stepsSkipped.length,
    });
  },

  /**
   * Track when user skips entire onboarding
   */
  skipped: (stepReached: string) => {
    track("onboarding_skipped", { step_reached: stepReached });
  },

  /**
   * Track when user dismisses the "Complete Setup" banner
   */
  bannerDismissed: () => {
    track("onboarding_banner_dismissed", {});
  },

  /**
   * Track when user resumes onboarding from banner
   */
  resumed: (resumeStep: string) => {
    track("onboarding_resumed", { resume_step: resumeStep });
  },

  /**
   * Track contextual tooltip dismissal
   */
  tooltipDismissed: (tooltipId: string) => {
    track("onboarding_tooltip_dismissed", { tooltip_id: tooltipId });
  },
};

export type OnboardingStep =
  | "welcome"
  | "welcome_seen"
  | "pain_points"
  | "solution_preview"
  | "welcome_complete"
  | "ai_intro"
  | "ai_provider_select"
  | "ai_key_entry"
  | "ai_key_success"
  | "ai_model_select"
  | "ai_skipped"
  | "ai_complete"
  | "project_intro"
  | "project_form"
  | "world_bible"
  | "project_complete"
  | "graph_intro"
  | "create_character"
  | "create_location"
  | "create_relationship"
  | "graph_reveal"
  | "universe_complete"
  | "book_creation"
  | "style_sheet"
  | "scene_setup"
  | "beats_explanation"
  | "first_generation"
  | "completed";
