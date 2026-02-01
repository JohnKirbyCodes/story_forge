import { track } from "@vercel/analytics";

/**
 * Analytics event tracking for user actions.
 * Uses Vercel Analytics for event tracking.
 */
export const trackEvent = {
  /**
   * Track project creation
   */
  projectCreated: (genre?: string) => {
    track("project_created", { genre: genre || "none" });
  },

  /**
   * Track book creation
   */
  bookCreated: (projectId: string) => {
    track("book_created", { project_id: projectId });
  },

  /**
   * Track AI outline generation
   */
  outlineGenerated: (bookId: string, chapterCount: number, sceneCount: number) => {
    track("outline_generated", {
      book_id: bookId,
      chapters: chapterCount,
      scenes: sceneCount,
    });
  },

  /**
   * Track AI scene prose generation
   */
  sceneGenerated: (sceneId: string, wordCount: number) => {
    track("scene_generated", { scene_id: sceneId, words: wordCount });
  },

  /**
   * Track AI synopsis generation
   */
  synopsisGenerated: (bookId: string) => {
    track("synopsis_generated", { book_id: bookId });
  },

  /**
   * Track AI prose enhancement (edit actions)
   */
  aiEnhancement: (action: string, sceneId: string) => {
    track("ai_enhancement", { action, scene_id: sceneId });
  },

  /**
   * Track AI node enrichment
   */
  nodeEnriched: (nodeType: string) => {
    track("node_enriched", { node_type: nodeType });
  },

  /**
   * Track AI story universe generation
   */
  universeGenerated: (projectId: string, nodeCount: number, edgeCount: number) => {
    track("universe_generated", {
      project_id: projectId,
      nodes: nodeCount,
      edges: edgeCount,
    });
  },

  // ============================================================
  // Marketing / Conversion Events
  // ============================================================

  /**
   * Track CTA button clicks on marketing pages
   */
  ctaClicked: (location: string, variant: string) => {
    track("cta_clicked", { location, variant });
  },

  /**
   * Track navigation link clicks
   */
  navClicked: (destination: string, source: string) => {
    track("nav_clicked", { destination, source });
  },

  /**
   * Track FAQ accordion opens
   */
  faqOpened: (question: string) => {
    track("faq_opened", { question });
  },

  /**
   * Track section visibility (scroll depth)
   */
  sectionViewed: (section: string) => {
    track("section_viewed", { section });
  },

  /**
   * Track pricing plan hover/interaction
   */
  pricingViewed: (plan: string) => {
    track("pricing_viewed", { plan });
  },

  /**
   * Track feature comparison table interaction
   */
  comparisonViewed: () => {
    track("comparison_viewed");
  },

  /**
   * Track demo video play
   */
  demoPlayed: () => {
    track("demo_played");
  },

  /**
   * Track signup form started (user began typing)
   */
  signupStarted: (source: string) => {
    track("signup_started", { source });
  },

  /**
   * Track signup completed
   */
  signupCompleted: (method: "email" | "google") => {
    track("signup_completed", { method });
  },
};
