"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SelectionData {
  text: string;
  sceneId: string;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

interface UseTextSelectionOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

/**
 * Hook to detect text selection within a manuscript container.
 * Tracks which scene the selection belongs to via data-scene-id attributes.
 */
export function useTextSelection({
  containerRef,
  enabled = true,
}: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const isSelectingRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      // Only clear if we're not in the middle of selecting
      if (!isSelectingRef.current) {
        setSelection(null);
      }
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) {
      return;
    }

    // Check if selection is within our container
    const range = sel.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const container = containerRef.current;

    // Walk up from commonAncestor to check if it's within our container
    let node: Node | null = commonAncestor;
    let isWithinContainer = false;
    while (node) {
      if (node === container) {
        isWithinContainer = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isWithinContainer) {
      return;
    }

    // Find the scene element containing the selection
    const sceneElement = findSceneElement(range.startContainer);
    if (!sceneElement) {
      return;
    }

    const sceneId = sceneElement.getAttribute("data-scene-id");
    if (!sceneId) {
      return;
    }

    // Find paragraph index within scene
    const paragraphElement = findParagraphElement(range.startContainer);
    const paragraphIndex = paragraphElement
      ? parseInt(paragraphElement.getAttribute("data-paragraph-index") || "0", 10)
      : 0;

    // Get the bounding rect for positioning the toolbar
    const rect = range.getBoundingClientRect();

    setSelection({
      text: selectedText,
      sceneId,
      paragraphIndex,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      rect,
    });
  }, [enabled, containerRef]);

  const handleMouseDown = useCallback(() => {
    isSelectingRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isSelectingRef.current = false;
    // Delay to ensure selection is finalized
    setTimeout(handleSelectionChange, 10);
  }, [handleSelectionChange]);

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      // Handle Escape to clear selection
      if (e.key === "Escape") {
        document.getSelection()?.removeAllRanges();
        setSelection(null);
        return;
      }
      // Check for shift+arrow selection
      if (e.shiftKey) {
        handleSelectionChange();
      }
    },
    [handleSelectionChange]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, handleMouseDown, handleMouseUp, handleKeyUp]);

  return {
    selection,
    clearSelection,
  };
}

/**
 * Walk up the DOM tree to find the scene element with data-scene-id
 */
function findSceneElement(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-scene-id")
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

/**
 * Walk up the DOM tree to find a paragraph element with data-paragraph-index
 */
function findParagraphElement(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-paragraph-index")
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}
