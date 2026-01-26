"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Scene } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Square,
} from "lucide-react";
import { useGenerationStore } from "@/stores/generation-store";

interface ChapterGenerateDialogProps {
  chapterId: string;
  chapterTitle: string;
  scenes: Scene[];
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SceneStatus = "pending" | "generating" | "completed" | "error" | "skipped";

interface SceneGenerationStatus {
  sceneId: string;
  title: string;
  status: SceneStatus;
  error?: string;
  hasExistingProse: boolean;
}

export function ChapterGenerateDialog({
  chapterId,
  chapterTitle,
  scenes,
  projectId,
  open,
  onOpenChange,
}: ChapterGenerateDialogProps) {
  const [skipExisting, setSkipExisting] = useState(true);
  const [sceneStatuses, setSceneStatuses] = useState<SceneGenerationStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const {
    startBatchGeneration,
    advanceBatchIndex,
    addBatchError,
    cancelBatchGeneration,
    endBatchGeneration,
    resetBatch,
  } = useGenerationStore();

  // Initialize scene statuses when dialog opens
  useEffect(() => {
    if (open) {
      const statuses = scenes.map((scene) => ({
        sceneId: scene.id,
        title: scene.title || `Scene ${scene.order_index}`,
        status: "pending" as SceneStatus,
        hasExistingProse: !!(scene.edited_prose || scene.generated_prose),
      }));
      setSceneStatuses(statuses);
      setIsGenerating(false);
      setCancelled(false);
      setCurrentIndex(0);
    }
  }, [open, scenes]);

  // Count scenes to generate
  const scenesToGenerate = sceneStatuses.filter(
    (s) => !skipExisting || !s.hasExistingProse
  );
  const completedCount = sceneStatuses.filter(
    (s) => s.status === "completed"
  ).length;
  const errorCount = sceneStatuses.filter((s) => s.status === "error").length;
  const progress =
    scenesToGenerate.length > 0
      ? (currentIndex / scenesToGenerate.length) * 100
      : 0;

  // Generate a single scene
  const generateScene = useCallback(
    async (sceneId: string, beatInstructions: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/ai/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneId,
            projectId,
            prompt: beatInstructions,
          }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        // For streaming response, we need to consume it
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let fullText = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value);
        }

        return true;
      } catch (error) {
        console.error("Error generating scene:", error);
        return false;
      }
    },
    [projectId]
  );

  // Run batch generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setCancelled(false);
    setCurrentIndex(0);

    const toGenerate = scenes.filter((scene) => {
      if (skipExisting && (scene.edited_prose || scene.generated_prose)) {
        return false;
      }
      return !!scene.beat_instructions;
    });

    // Mark skipped scenes
    setSceneStatuses((prev) =>
      prev.map((s) => {
        const scene = scenes.find((sc) => sc.id === s.sceneId);
        const willSkip =
          (skipExisting && s.hasExistingProse) || !scene?.beat_instructions;
        return {
          ...s,
          status: willSkip ? ("skipped" as SceneStatus) : s.status,
        };
      })
    );

    startBatchGeneration(
      chapterId,
      toGenerate.map((s) => s.id),
      skipExisting
    );

    for (let i = 0; i < toGenerate.length; i++) {
      // Check if cancelled
      if (cancelled) {
        break;
      }

      const scene = toGenerate[i];
      setCurrentIndex(i + 1);

      // Update status to generating
      setSceneStatuses((prev) =>
        prev.map((s) =>
          s.sceneId === scene.id ? { ...s, status: "generating" } : s
        )
      );

      // Generate the scene
      const success = await generateScene(
        scene.id,
        scene.beat_instructions || ""
      );

      // Update status based on result
      setSceneStatuses((prev) =>
        prev.map((s) =>
          s.sceneId === scene.id
            ? {
                ...s,
                status: success ? "completed" : "error",
                error: success ? undefined : "Generation failed",
              }
            : s
        )
      );

      if (!success) {
        addBatchError(scene.id, "Generation failed");
      }

      advanceBatchIndex();
    }

    endBatchGeneration();
    setIsGenerating(false);
    router.refresh();
  };

  // Handle cancel
  const handleCancel = () => {
    setCancelled(true);
    cancelBatchGeneration();
  };

  // Handle close
  const handleClose = () => {
    if (isGenerating) {
      handleCancel();
    }
    resetBatch();
    onOpenChange(false);
  };

  const getStatusIcon = (status: SceneStatus) => {
    switch (status) {
      case "pending":
        return <Square className="h-4 w-4 text-muted-foreground" />;
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Chapter Scenes
          </DialogTitle>
          <DialogDescription>
            Generate prose for all scenes in &quot;{chapterTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Skip existing option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-existing"
              checked={skipExisting}
              onCheckedChange={(checked: boolean | "indeterminate") => setSkipExisting(!!checked)}
              disabled={isGenerating}
            />
            <Label htmlFor="skip-existing" className="text-sm">
              Skip scenes with existing prose
            </Label>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Generating scene {currentIndex} of {scenesToGenerate.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Scene list */}
          <ScrollArea className="h-[250px] rounded-md border p-3">
            <div className="space-y-2">
              {sceneStatuses.map((sceneStatus) => (
                <div
                  key={sceneStatus.sceneId}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(sceneStatus.status)}
                    <span className="text-sm truncate">{sceneStatus.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sceneStatus.hasExistingProse && (
                      <Badge variant="outline" className="text-xs">
                        has prose
                      </Badge>
                    )}
                    {sceneStatus.error && (
                      <Badge variant="destructive" className="text-xs">
                        error
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{scenesToGenerate.length} to generate</span>
            {completedCount > 0 && (
              <span className="text-green-600">{completedCount} completed</span>
            )}
            {errorCount > 0 && (
              <span className="text-destructive">{errorCount} failed</span>
            )}
          </div>
        </div>

        <DialogFooter>
          {isGenerating ? (
            <Button variant="destructive" onClick={handleCancel}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={scenesToGenerate.length === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {scenesToGenerate.length} Scene
                {scenesToGenerate.length !== 1 && "s"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
