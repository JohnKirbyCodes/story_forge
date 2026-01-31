"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";

interface EditPreviewProps {
  originalText: string;
  generatedText: string;
  isStreaming: boolean;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
}

export function EditPreview({
  originalText,
  generatedText,
  isStreaming,
  onAccept,
  onReject,
  onRetry,
}: EditPreviewProps) {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isStreaming) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onAccept();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onReject();
      }
    },
    [isStreaming, onAccept, onReject]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const displayText = generatedText || "";

  return (
    <span className="edit-preview-container">
      {/* Show original text with strikethrough when we have generated content */}
      {!isStreaming && generatedText && (
        <span className="line-through text-muted-foreground/50 mr-1">
          {originalText}
        </span>
      )}

      {/* Generated/streaming text */}
      <span className="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-1 rounded relative">
        {isStreaming ? (
          <>
            {displayText}
            <span className="animate-pulse">|</span>
          </>
        ) : (
          displayText
        )}
      </span>

      {/* Action buttons */}
      {!isStreaming && generatedText && (
        <span className="inline-flex items-center gap-1 ml-2 align-middle">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800"
            onClick={onAccept}
            title="Accept (Enter)"
          >
            <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
            onClick={onReject}
            title="Reject (Escape)"
          >
            <X className="h-3 w-3 text-red-700 dark:text-red-300" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={onRetry}
            title="Try again"
          >
            <RotateCcw className="h-3 w-3 text-gray-700 dark:text-gray-300" />
          </Button>
        </span>
      )}

      {/* Loading indicator */}
      {isStreaming && !displayText && (
        <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Generating...</span>
        </span>
      )}
    </span>
  );
}

/**
 * Standalone floating edit preview for when we can't inline the preview
 * into the existing DOM (complex selections spanning multiple elements)
 */
interface FloatingEditPreviewProps extends EditPreviewProps {
  rect: DOMRect;
}

export function FloatingEditPreview({
  rect,
  originalText,
  generatedText,
  isStreaming,
  onAccept,
  onReject,
  onRetry,
}: FloatingEditPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // Measure after render to get accurate height
  useEffect(() => {
    if (containerRef.current) {
      setMeasuredHeight(containerRef.current.offsetHeight);
    }
  }, [generatedText, isStreaming]);

  // Position below the selection (fixed positioning uses viewport coords)
  // rect from getBoundingClientRect() is already viewport-relative
  const previewHeight = measuredHeight || 250; // use measured or estimate
  const previewWidth = 500;
  const padding = 16; // Minimum padding from viewport edges

  // Calculate available space
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const spaceBelow = viewportHeight - rect.bottom - padding;
  const spaceAbove = rect.top - padding;

  // Determine if we should show above or below
  // Prefer below unless there's clearly more space above
  const showBelow = spaceBelow >= Math.min(previewHeight, 200) || spaceBelow >= spaceAbove;

  // Calculate max height based on available space (minimum 150px to be usable)
  const maxHeight = showBelow
    ? Math.max(150, Math.min(400, spaceBelow))
    : Math.max(150, Math.min(400, spaceAbove));

  // Calculate top position, ensuring it stays within viewport
  let top: number;
  if (showBelow) {
    top = rect.bottom + 8;
    // Clamp to prevent overflow at bottom
    const maxTop = viewportHeight - Math.min(previewHeight, maxHeight) - padding;
    top = Math.min(top, maxTop);
  } else {
    // Show above the selection
    top = rect.top - Math.min(previewHeight, maxHeight) - 8;
    // Clamp to prevent overflow at top
    top = Math.max(padding, top);
  }

  // Clamp left to stay within viewport
  const left = Math.max(padding, Math.min(rect.left, viewportWidth - previewWidth - padding));
  const maxWidth = Math.min(previewWidth, viewportWidth - left - padding);

  return (
    <div
      ref={containerRef}
      className="fixed z-50 animate-in fade-in-0 slide-in-from-top-2"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`,
      }}
    >
      <div className="rounded-lg border bg-popover/95 backdrop-blur-sm p-4 shadow-lg overflow-auto max-h-full">
        {/* Original text */}
        <div className="text-sm text-muted-foreground mb-2">
          <span className="font-medium">Original:</span>
          <p className="line-through opacity-60 mt-1">{originalText}</p>
        </div>

        {/* Generated text */}
        <div className="text-sm mb-3">
          <span className="font-medium text-foreground">
            {isStreaming ? "Generating:" : "Suggestion:"}
          </span>
          <p className="mt-1 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 p-2 rounded">
            {isStreaming ? (
              <>
                {generatedText}
                <span className="animate-pulse">|</span>
              </>
            ) : (
              generatedText || (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </span>
              )
            )}
          </p>
        </div>

        {/* Action buttons */}
        {!isStreaming && generatedText && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onAccept}
              className="gap-1"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="gap-1"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
