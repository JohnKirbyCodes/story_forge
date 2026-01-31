"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  className?: string;
}

export function SuccessAnimation({ show, onComplete, className }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Start animation after mount
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      // Call onComplete after animation duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 transition-opacity duration-300",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Animated checkmark with glow */}
      <div className="relative">
        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-500/30 blur-xl transition-all duration-700",
            isAnimating ? "scale-150 opacity-100" : "scale-100 opacity-0"
          )}
        />

        {/* Pulse rings */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-green-500/50 transition-all duration-1000",
            isAnimating ? "scale-[2] opacity-0" : "scale-100 opacity-100"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-green-500/30 transition-all duration-1000 delay-200",
            isAnimating ? "scale-[2.5] opacity-0" : "scale-100 opacity-100"
          )}
        />

        {/* Main checkmark circle */}
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 transition-transform duration-500",
            isAnimating ? "scale-100" : "scale-75"
          )}
        >
          <Check
            className={cn(
              "h-10 w-10 text-green-600 dark:text-green-400 transition-all duration-500 delay-200",
              isAnimating ? "scale-100 opacity-100" : "scale-50 opacity-0"
            )}
            strokeWidth={3}
          />
        </div>
      </div>
    </div>
  );
}

// Smaller inline success indicator
interface SuccessCheckProps {
  show: boolean;
  className?: string;
}

export function SuccessCheck({ show, className }: SuccessCheckProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 animate-in zoom-in-50 duration-300",
        className
      )}
    >
      <Check className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={3} />
    </div>
  );
}
