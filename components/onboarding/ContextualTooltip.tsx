"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./OnboardingProvider";
import { X } from "lucide-react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface ContextualTooltipProps {
  id: string;
  title: string;
  description: string;
  ctaText?: string;
  position?: TooltipPosition;
  targetRef?: React.RefObject<HTMLElement>;
  className?: string;
  onDismiss?: () => void;
}

export function ContextualTooltip({
  id,
  title,
  description,
  ctaText = "Got it!",
  position = "bottom",
  targetRef,
  className,
  onDismiss,
}: ContextualTooltipProps) {
  const { isTooltipDismissed, dismissTooltip, isCompleted } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Don't show tooltips if onboarding is not completed
  const shouldShow = isCompleted && !isTooltipDismissed(id);

  useEffect(() => {
    if (!shouldShow) return;

    // Delay showing tooltip for smooth page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldShow]);

  useEffect(() => {
    if (!isVisible || !targetRef?.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const targetRect = targetRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = targetRect.top - tooltipRect.height - 12;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          break;
        case "bottom":
          top = targetRect.bottom + 12;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.left - tooltipRect.width - 12;
          break;
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.right + 12;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isVisible, position, targetRef]);

  const handleDismiss = async () => {
    setIsVisible(false);
    await dismissTooltip(id);
    onDismiss?.();
  };

  if (!shouldShow || !isVisible) {
    return null;
  }

  // If no targetRef, render inline
  if (!targetRef) {
    return (
      <div
        className={cn(
          "relative rounded-lg border bg-popover p-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
        <h4 className="mb-1 pr-6 font-semibold leading-none">{title}</h4>
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
        <Button size="sm" onClick={handleDismiss}>
          {ctaText}
        </Button>
      </div>
    );
  }

  // Render as floating tooltip
  return (
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 50,
      }}
      className={cn(
        "max-w-xs rounded-lg border bg-popover p-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
    >
      {/* Arrow */}
      <div
        className={cn(
          "absolute h-2 w-2 rotate-45 border bg-popover",
          position === "top" && "bottom-[-5px] left-1/2 -translate-x-1/2 border-l-0 border-t-0",
          position === "bottom" && "top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0",
          position === "left" && "right-[-5px] top-1/2 -translate-y-1/2 border-b-0 border-l-0",
          position === "right" && "left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0"
        )}
      />

      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>

      <h4 className="mb-1 pr-6 font-semibold leading-none">{title}</h4>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      <Button size="sm" onClick={handleDismiss}>
        {ctaText}
      </Button>
    </div>
  );
}

// Pre-defined tooltip configurations from the plan
export const TOOLTIP_CONFIGS = {
  GRAPH_INTRO: {
    id: "graph_intro",
    title: "Your Series Universe",
    description:
      'Click "+ Add Node" to create characters, locations, events, and more. Drag nodes to organize. Click edges to see relationships.',
    ctaText: "Got it!",
  },
  OUTLINE_INTRO: {
    id: "outline_intro",
    title: "AI-Powered Outlining",
    description:
      "Describe your book's premise and AI will generate a complete outline with chapters, scenes, and beat instructions.",
    ctaText: "Let's Try It!",
  },
  TEXT_EDIT_INTRO: {
    id: "text_edit_intro",
    title: "AI Text Editing",
    description:
      "Select any text and use AI to expand, shorten, rewrite, or change the tone.",
    ctaText: "Got it!",
  },
  EXPORT_INTRO: {
    id: "export_intro",
    title: "Export Your Work",
    description:
      "When you're ready, export your book to DOCX, EPUB, or TXT formats.",
    ctaText: "Got it!",
  },
  MULTI_PROVIDER_INTRO: {
    id: "multi_provider_intro",
    title: "Add More AI Providers",
    description:
      "You can add keys from multiple providers and use different models for different tasks.",
    ctaText: "Got it!",
  },
} as const;
