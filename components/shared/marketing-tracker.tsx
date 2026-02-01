"use client";

import { useEffect, useRef, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/events";

interface SectionTrackerProps {
  sectionId: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tracks when a section becomes visible in the viewport
 */
export function SectionTracker({ sectionId, children, className }: SectionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            trackEvent.sectionViewed(sectionId);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [sectionId]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface TrackedButtonProps {
  location: string;
  variant: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

/**
 * Wrapper to track button/CTA clicks
 */
export function TrackedCTA({ location, variant, onClick, children }: TrackedButtonProps) {
  const handleClick = () => {
    trackEvent.ctaClicked(location, variant);
    onClick?.();
  };

  return (
    <span onClick={handleClick} className="contents">
      {children}
    </span>
  );
}

interface TrackedFAQProps {
  question: string;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Track FAQ accordion opens
 */
export function trackFAQOpen(question: string) {
  trackEvent.faqOpened(question);
}

/**
 * Track comparison table view
 */
export function useComparisonTracker() {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            trackEvent.comparisonViewed();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
