"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { Chapter, Scene, StoryNode } from "@/types/database";
import { BookOpen, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SelectionToolbar } from "./selection-toolbar";
import { FloatingEditPreview } from "./edit-preview";
import { EditAction } from "@/lib/ai/edit-prompts";

interface SceneWithCharacters extends Scene {
  scene_characters?: Array<{
    id: string;
    story_nodes?: StoryNode;
  }>;
}

interface ChapterWithScenes extends Chapter {
  scenes?: SceneWithCharacters[];
}

interface ManuscriptViewProps {
  chapters: ChapterWithScenes[];
  bookId: string;
  projectId: string;
  bookTitle: string;
}

interface EditState {
  sceneId: string;
  originalText: string;
  action: EditAction;
  customPrompt?: string;
  selectionRect: DOMRect;
}

export function ManuscriptView({
  chapters,
  bookId,
  projectId,
  bookTitle,
}: ManuscriptViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [localChapters, setLocalChapters] = useState(chapters);

  // Selection hook
  const { selection, clearSelection } = useTextSelection({
    containerRef,
    enabled: !editState, // Disable selection when editing
  });

  // AI completion for editing
  const {
    complete,
    completion,
    isLoading: isStreaming,
    error,
    stop,
  } = useCompletion({
    api: "/api/ai/edit-prose",
    streamProtocol: "text",
    onFinish: (_prompt, completionText) => {
      // Completion finished - user can now accept/reject
      console.log("Edit generation complete:", completionText.length, "chars");
    },
    onError: (err) => {
      console.error("Edit generation error:", err);
    },
  });

  // Sort chapters by order
  const sortedChapters = useMemo(
    () =>
      [...localChapters].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [localChapters]
  );

  // Calculate totals
  const totalWords = useMemo(
    () =>
      sortedChapters.reduce(
        (acc, ch) =>
          acc +
          (ch.scenes?.reduce(
            (sceneAcc, scene) => sceneAcc + (scene.word_count || 0),
            0
          ) || 0),
        0
      ),
    [sortedChapters]
  );

  const chaptersWithContent = useMemo(
    () =>
      sortedChapters.filter((ch) =>
        ch.scenes?.some(
          (scene) => scene.edited_prose || scene.generated_prose
        )
      ),
    [sortedChapters]
  );

  // Handle AI action from toolbar
  const handleAction = useCallback(
    async (action: EditAction, customPrompt?: string) => {
      if (!selection) return;

      setEditState({
        sceneId: selection.sceneId,
        originalText: selection.text,
        action,
        customPrompt,
        selectionRect: selection.rect,
      });

      // Clear the browser selection
      document.getSelection()?.removeAllRanges();
      clearSelection();

      // Start the AI completion
      await complete(selection.text, {
        body: {
          selectedText: selection.text,
          action,
          customPrompt,
          sceneId: selection.sceneId,
          projectId,
        },
      });
    },
    [selection, clearSelection, complete, projectId]
  );

  // Handle accepting the edit
  const handleAccept = useCallback(async () => {
    if (!editState || !completion) return;

    try {
      // Find the scene and update its prose
      const scene = findSceneById(localChapters, editState.sceneId);
      if (!scene) {
        console.error("Scene not found:", editState.sceneId);
        return;
      }

      const currentProse = scene.edited_prose || scene.generated_prose || "";
      const newProse = currentProse.replace(editState.originalText, completion);

      // Update database
      const { error } = await supabase
        .from("scenes")
        .update({
          edited_prose: newProse,
          word_count: newProse.trim().split(/\s+/).filter(Boolean).length,
        })
        .eq("id", editState.sceneId);

      if (error) {
        console.error("Error saving edit:", error);
        return;
      }

      // Update local state
      setLocalChapters((prev) =>
        prev.map((ch) => ({
          ...ch,
          scenes: ch.scenes?.map((s) =>
            s.id === editState.sceneId
              ? {
                  ...s,
                  edited_prose: newProse,
                  word_count: newProse.trim().split(/\s+/).filter(Boolean).length,
                }
              : s
          ),
        }))
      );

      // Clear edit state
      setEditState(null);
      router.refresh();
    } catch (error) {
      console.error("Error accepting edit:", error);
    }
  }, [editState, completion, localChapters, supabase, router]);

  // Handle rejecting the edit
  const handleReject = useCallback(() => {
    stop();
    setEditState(null);
  }, [stop]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!editState) return;

    await complete(editState.originalText, {
      body: {
        selectedText: editState.originalText,
        action: editState.action,
        customPrompt: editState.customPrompt,
        sceneId: editState.sceneId,
        projectId,
      },
    });
  }, [editState, complete, projectId]);

  // Dismiss toolbar
  const handleDismissToolbar = useCallback(() => {
    document.getSelection()?.removeAllRanges();
    clearSelection();
  }, [clearSelection]);

  if (sortedChapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No chapters yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create chapters and scenes in the Outline view first.
        </p>
      </div>
    );
  }

  if (chaptersWithContent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No prose written yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate or write prose in your scenes to see the manuscript here.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Manuscript Header */}
      <div className="text-center border-b pb-6">
        <h2 className="text-2xl font-serif font-bold">{bookTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {totalWords.toLocaleString()} words
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Select text to edit with AI
        </p>
      </div>

      {/* Manuscript Content - Clean reading view */}
      <div className="max-w-2xl mx-auto space-y-12">
        {sortedChapters.map((chapter) => {
          const sortedScenes = [...(chapter.scenes || [])].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );

          return (
            <div key={chapter.id} className="space-y-6">
              {/* Chapter Header */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">
                  Chapter {chapter.order_index}
                </p>
                <h3 className="text-xl font-serif font-semibold">
                  {chapter.title}
                </h3>
              </div>

              {/* Scenes */}
              {sortedScenes.map((scene) => {
                const prose = scene.edited_prose || scene.generated_prose;
                if (!prose) return null;

                return (
                  <div
                    key={scene.id}
                    data-scene-id={scene.id}
                    className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed"
                  >
                    {prose.split(/\n\n+/).map((paragraph, idx) => (
                      <p
                        key={idx}
                        data-paragraph-index={idx}
                        className="text-justify indent-8 my-4"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                );
              })}

              {/* Chapter divider */}
              <div className="flex justify-center pt-8">
                <span className="text-muted-foreground text-2xl">* * *</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* End of Manuscript */}
      <div className="text-center py-12 border-t">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          The End
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {totalWords.toLocaleString()} words
        </p>
      </div>

      {/* Selection Toolbar */}
      {selection && !editState && (
        <SelectionToolbar
          rect={selection.rect}
          onAction={handleAction}
          onDismiss={handleDismissToolbar}
        />
      )}

      {/* Edit Preview */}
      {editState && (
        <FloatingEditPreview
          rect={editState.selectionRect}
          originalText={editState.originalText}
          generatedText={completion || ""}
          isStreaming={isStreaming}
          onAccept={handleAccept}
          onReject={handleReject}
          onRetry={handleRetry}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to find a scene by ID within the chapters structure
 */
function findSceneById(
  chapters: ChapterWithScenes[],
  sceneId: string
): SceneWithCharacters | undefined {
  for (const chapter of chapters) {
    const scene = chapter.scenes?.find((s) => s.id === sceneId);
    if (scene) return scene;
  }
  return undefined;
}
