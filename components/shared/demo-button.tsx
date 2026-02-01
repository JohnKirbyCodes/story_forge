"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/events";

interface DemoButtonProps {
  location: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export function DemoButton({ location, size = "lg", variant = "outline", className }: DemoButtonProps) {
  const handleClick = () => {
    trackEvent.ctaClicked(location, "demo");
    toast.info("Demo coming soon!", {
      description: "We're working on a video walkthrough. Sign up to be notified when it's ready.",
    });
  };

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick}>
      Watch Demo (2 min)
    </Button>
  );
}
