"use client";

import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";

interface ClickablePreviewProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function ClickablePreview({ src, alt, priority = false }: ClickablePreviewProps) {
  const handleClick = () => {
    trackEvent.ctaClicked("preview-image", alt);
  };

  return (
    <Link href="/signup" onClick={handleClick}>
      <div className="aspect-video rounded-lg bg-muted overflow-hidden relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-primary/50">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
        />
      </div>
    </Link>
  );
}
