"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Chapter, Scene, StoryNode, SceneCharacter } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BookOpen,
  Pencil,
  MoreHorizontal,
  Trash2,
  Sparkles,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { CreateSceneDialog } from "./create-scene-dialog";
import { SortableChapter } from "./sortable-chapter";
import { SortableScene } from "./sortable-scene";
import { ChapterEditSheet } from "./chapter-edit-sheet";
import { SceneEditSheet } from "./scene-edit-sheet";
import { ChapterGenerateDialog } from "./chapter-generate-dialog";
import { useGenerationStore } from "@/stores/generation-store";

interface SceneCharacterWithNode extends SceneCharacter {
  story_nodes?: StoryNode;
}

interface SceneWithCharacters extends Scene {
  scene_characters?: SceneCharacterWithNode[];
  story_nodes?: StoryNode; // location
}

interface ChapterWithScenes extends Chapter {
  scenes?: SceneWithCharacters[];
}

interface ChaptersListProps {
  chapters: ChapterWithScenes[];
  bookId: string;
  projectId: string;
  storyNodes?: StoryNode[];
}

type SceneStatus = "empty" | "draft" | "generated" | "edited";

function getSceneStatus(scene: Scene): SceneStatus {
  if (scene.edited_prose) return "edited";
  if (scene.generated_prose) return "generated";
  if (scene.beat_instructions) return "draft";
  return "empty";
}

function getStatusIcon(status: SceneStatus) {
  switch (status) {
    case "edited":
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case "generated":
      return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    case "draft":
      return <Circle className="h-3 w-3 text-yellow-500" />;
    case "empty":
      return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
  }
}

function getStatusLabel(status: SceneStatus) {
  switch (status) {
    case "edited":
      return "Edited";
    case "generated":
      return "Generated";
    case "draft":
      return "Draft";
    case "empty":
      return "Empty";
  }
}

export function ChaptersList({
  chapters,
  bookId,
  projectId,
  storyNodes = [],
}: ChaptersListProps) {
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "chapter" | "scene";
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingScene, setEditingScene] = useState<{
    scene: Scene;
    sceneCharacters: SceneCharacterWithNode[];
  } | null>(null);
  const [generatingChapter, setGeneratingChapter] = useState<{
    id: string;
    title: string;
    scenes: Scene[];
  } | null>(null);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const { generatingSceneId: storeGeneratingSceneId } = useGenerationStore();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle chapter reorder
  const handleChapterDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Calculate new order indices
      const updates = chapters.map((chapter, index) => {
        let newOrder = index + 1;
        if (index === oldIndex) {
          newOrder = newIndex + 1;
        } else if (oldIndex < newIndex && index > oldIndex && index <= newIndex) {
          newOrder = index;
        } else if (oldIndex > newIndex && index >= newIndex && index < oldIndex) {
          newOrder = index + 2;
        }
        return { id: chapter.id, order_index: newOrder };
      });

      // Update in database
      for (const update of updates) {
        await supabase
          .from("chapters")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      router.refresh();
    },
    [chapters, supabase, router]
  );

  // Handle scene reorder within a chapter
  const handleSceneDragEnd = useCallback(
    async (event: DragEndEvent, chapterId: string) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter?.scenes) return;

      const scenes = chapter.scenes;
      const oldIndex = scenes.findIndex((s) => s.id === active.id);
      const newIndex = scenes.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Calculate new order indices
      const updates = scenes.map((scene, index) => {
        let newOrder = index + 1;
        if (index === oldIndex) {
          newOrder = newIndex + 1;
        } else if (oldIndex < newIndex && index > oldIndex && index <= newIndex) {
          newOrder = index;
        } else if (oldIndex > newIndex && index >= newIndex && index < oldIndex) {
          newOrder = index + 2;
        }
        return { id: scene.id, order_index: newOrder };
      });

      // Update in database
      for (const update of updates) {
        await supabase
          .from("scenes")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      router.refresh();
    },
    [chapters, supabase, router]
  );

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === "chapter") {
        const { error } = await supabase
          .from("chapters")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("scenes")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Generate single scene
  const handleGenerateScene = async (scene: Scene) => {
    if (!scene.beat_instructions) return;

    setGeneratingSceneId(scene.id);
    setGenerationError(null);

    try {
      const response = await fetch("/api/ai/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: scene.id,
          projectId,
          prompt: scene.beat_instructions,
        }),
      });

      if (!response.ok) {
        // Parse error response for better error messages
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          if (errorData.error === "provider_error") {
            throw new Error(errorData.message || "Please configure your API key in Settings.");
          }
          throw new Error(errorData.error || "Generation failed");
        }
        throw new Error("Generation failed");
      }

      // Consume the stream
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      router.refresh();
    } catch (error) {
      console.error("Error generating scene:", error);
      setGenerationError(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGeneratingSceneId(null);
    }
  };

  if (chapters.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No chapters yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first chapter to start organizing your book.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort chapters by order_index
  const sortedChapters = [...chapters].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  return (
    <>
      {/* Error display for generation failures */}
      {generationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{generationError}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 hover:bg-transparent"
              onClick={() => setGenerationError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleChapterDragEnd}
      >
        <SortableContext
          items={sortedChapters.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <Accordion type="multiple" className="space-y-4">
            {sortedChapters.map((chapter) => {
              const sortedScenes = [...(chapter.scenes || [])].sort(
                (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
              );

              const chapterWordCount = sortedScenes.reduce(
                (acc, scene) => acc + (scene.word_count || 0),
                0
              );

              const scenesWithBeats = sortedScenes.filter(
                (s) => s.beat_instructions
              ).length;

              return (
                <SortableChapter key={chapter.id} id={chapter.id}>
                  <AccordionItem
                    value={chapter.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 hover:bg-muted/50 transition-colors">
                      <AccordionTrigger className="hover:no-underline flex-1 py-4">
                        <div className="flex items-center gap-4 text-left">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                            {chapter.order_index}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{chapter.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                              <span>
                                {sortedScenes.length} scene
                                {sortedScenes.length !== 1 ? "s" : ""}
                              </span>
                              <span>·</span>
                              <span>{chapterWordCount.toLocaleString()} words</span>
                              {scenesWithBeats > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-primary">
                                    {scenesWithBeats} ready to generate
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <div className="flex items-center gap-1">
                        {/* Quick action buttons */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChapter(chapter);
                          }}
                          title="Edit chapter"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {scenesWithBeats > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGeneratingChapter({
                                id: chapter.id,
                                title: chapter.title,
                                scenes: sortedScenes,
                              });
                            }}
                          >
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Generate All
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChapter(chapter);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Chapter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setGeneratingChapter({
                                  id: chapter.id,
                                  title: chapter.title,
                                  scenes: sortedScenes,
                                });
                              }}
                              disabled={scenesWithBeats === 0}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate All Scenes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  type: "chapter",
                                  id: chapter.id,
                                  title: chapter.title,
                                });
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Chapter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2 border-t">
                        {chapter.summary && (
                          <p className="text-sm text-muted-foreground pt-3">
                            {chapter.summary}
                          </p>
                        )}

                        {/* Scenes List with DnD */}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleSceneDragEnd(e, chapter.id)}
                        >
                          <SortableContext
                            items={sortedScenes.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {sortedScenes.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">
                                  No scenes in this chapter yet.
                                </p>
                              ) : (
                                sortedScenes.map((scene) => {
                                  const sceneStatus = getSceneStatus(scene);
                                  const isGenerating =
                                    generatingSceneId === scene.id ||
                                    storeGeneratingSceneId === scene.id;
                                  const location = storyNodes.find(
                                    (n) => n.id === scene.location_id
                                  );

                                  return (
                                    <SortableScene
                                      key={scene.id}
                                      id={scene.id}
                                      chapterId={chapter.id}
                                    >
                                      <Card className="group hover:border-primary/50 hover:shadow-sm transition-all">
                                        <CardContent className="flex items-center justify-between py-3 px-4">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium">
                                              {chapter.order_index}.
                                              {scene.order_index}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">
                                                  {scene.title ||
                                                    `Scene ${scene.order_index}`}
                                                </p>
                                                <span
                                                  className="flex items-center gap-1"
                                                  title={getStatusLabel(
                                                    sceneStatus
                                                  )}
                                                >
                                                  {getStatusIcon(sceneStatus)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                {location && (
                                                  <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {location.name}
                                                  </span>
                                                )}
                                                {scene.time_of_day && (
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {scene.time_of_day}
                                                  </span>
                                                )}
                                                {scene.beat_instructions && (
                                                  <span className="truncate max-w-[200px] italic opacity-75">
                                                    {scene.beat_instructions}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge
                                              variant="outline"
                                              className="text-xs hidden sm:flex"
                                            >
                                              {(
                                                scene.word_count || 0
                                              ).toLocaleString()}{" "}
                                              words
                                            </Badge>
                                            {/* Action buttons - visible on hover on desktop */}
                                            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                              {/* Edit button */}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                  setEditingScene({
                                                    scene,
                                                    sceneCharacters:
                                                      (scene.scene_characters as SceneCharacterWithNode[]) ||
                                                      [],
                                                  })
                                                }
                                                title="Edit scene details"
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              {/* Generate button */}
                                              {scene.beat_instructions && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  disabled={isGenerating}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    handleGenerateScene(scene);
                                                  }}
                                                  title="Generate prose"
                                                >
                                                  {isGenerating ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                    <Sparkles className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              )}
                                            </div>
                                            {/* Open Editor button - always visible */}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-8 text-xs"
                                              asChild
                                            >
                                              <Link
                                                href={`/dashboard/projects/${projectId}/books/${bookId}/editor/${scene.id}`}
                                              >
                                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                Open
                                              </Link>
                                            </Button>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                  <Link
                                                    href={`/dashboard/projects/${projectId}/books/${bookId}/editor/${scene.id}`}
                                                  >
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Open Editor
                                                  </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    setEditingScene({
                                                      scene,
                                                      sceneCharacters:
                                                        (scene.scene_characters as SceneCharacterWithNode[]) ||
                                                        [],
                                                    })
                                                  }
                                                >
                                                  <Pencil className="mr-2 h-4 w-4" />
                                                  Edit Scene
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  className="text-destructive focus:text-destructive"
                                                  onClick={() =>
                                                    setDeleteTarget({
                                                      type: "scene",
                                                      id: scene.id,
                                                      title:
                                                        scene.title ||
                                                        `Scene ${scene.order_index}`,
                                                    })
                                                  }
                                                >
                                                  <Trash2 className="mr-2 h-4 w-4" />
                                                  Delete Scene
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </SortableScene>
                                  );
                                })
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>

                        {/* Add Scene Button */}
                        <CreateSceneDialog
                          chapterId={chapter.id}
                          bookId={bookId}
                          projectId={projectId}
                          nextOrderIndex={sortedScenes.length + 1}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </SortableChapter>
              );
            })}
          </Accordion>
        </SortableContext>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "chapter" ? "Chapter" : "Scene"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              {deleteTarget?.type === "chapter" &&
                " This will also delete all scenes in this chapter."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chapter Edit Sheet */}
      {editingChapter && (
        <ChapterEditSheet
          chapter={editingChapter}
          storyNodes={storyNodes}
          open={!!editingChapter}
          onOpenChange={(open) => !open && setEditingChapter(null)}
        />
      )}

      {/* Scene Edit Sheet */}
      {editingScene && (
        <SceneEditSheet
          scene={editingScene.scene}
          storyNodes={storyNodes}
          sceneCharacters={editingScene.sceneCharacters}
          open={!!editingScene}
          onOpenChange={(open) => !open && setEditingScene(null)}
        />
      )}

      {/* Chapter Generate Dialog */}
      {generatingChapter && (
        <ChapterGenerateDialog
          chapterId={generatingChapter.id}
          chapterTitle={generatingChapter.title}
          scenes={generatingChapter.scenes}
          projectId={projectId}
          open={!!generatingChapter}
          onOpenChange={(open) => !open && setGeneratingChapter(null)}
        />
      )}
    </>
  );
}
