"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Group, Panel, Separator } from "react-resizable-panels";
import { createClient } from "@/lib/supabase/client";
import { Scene, StoryNode, SceneCharacter } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TiptapEditor } from "./tiptap-editor";
import { Sparkles, Save, Loader2, Users, MapPin, GripVertical, X, Star, Calendar, Package, Swords, Lightbulb } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import { useTextSelection } from "@/hooks/use-text-selection";
import { SelectionToolbar } from "@/components/dashboard/selection-toolbar";
import { FloatingEditPreview } from "@/components/dashboard/edit-preview";
import { EditAction } from "@/lib/ai/edit-prompts";
import { ModelSelector } from "@/components/shared/model-selector";
import { AIProvider } from "@/lib/ai/providers/config";

interface SceneCharacterWithNode extends SceneCharacter {
  story_nodes?: StoryNode;
}

interface SceneEditorProps {
  scene: Scene;
  projectId: string;
  storyNodes: StoryNode[];
  sceneCharacters: SceneCharacterWithNode[];
  validProviders: AIProvider[];
  aiSceneModel: string;
  aiEditModel: string;
  hasValidKey: boolean;
}

interface EditState {
  originalText: string;
  action: EditAction;
  customPrompt?: string;
  selectionRect: DOMRect;
}

export function SceneEditor({
  scene,
  projectId,
  storyNodes,
  sceneCharacters,
  validProviders,
  aiSceneModel,
  aiEditModel,
  hasValidKey,
}: SceneEditorProps) {
  const [beatInstructions, setBeatInstructions] = useState(
    scene.beat_instructions || ""
  );
  const [prose, setProse] = useState(scene.edited_prose || scene.generated_prose || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [linkedNodes, setLinkedNodes] = useState<SceneCharacterWithNode[]>(sceneCharacters);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [selectedSceneModel, setSelectedSceneModel] = useState(aiSceneModel);
  const [selectedEditModel, setSelectedEditModel] = useState(aiEditModel);
  const proseContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Selection detection for AI editing
  const { selection, clearSelection } = useTextSelection({
    containerRef: proseContainerRef,
    enabled: !editState,
  });

  // AI completion for editing selected text
  const {
    complete: completeEdit,
    completion: editCompletion,
    isLoading: isEditing,
    error: editError,
    stop: stopEdit,
  } = useCompletion({
    api: "/api/ai/edit-prose",
    streamProtocol: "text",
    body: {
      model: selectedEditModel,
    },
    onFinish: (_prompt, completionText) => {
      console.log("Edit generation complete:", completionText.length, "chars");
    },
    onError: (err) => {
      console.error("Edit generation error:", err);
    },
  });

  // Add a node to the scene
  const addNodeToScene = async (nodeId: string, nodeType: string) => {
    try {
      const { data, error } = await supabase
        .from("scene_characters")
        .insert({
          scene_id: scene.id,
          character_id: nodeId,
          node_id: nodeId,
          pov: false,
        })
        .select(`*, story_nodes (*)`)
        .single();

      if (error) throw error;
      setLinkedNodes((prev) => [...prev, data as SceneCharacterWithNode]);
    } catch (error) {
      console.error("Error adding node to scene:", error);
    }
  };

  // Remove a node from the scene
  const removeNodeFromScene = async (sceneCharacterId: string) => {
    try {
      const { error } = await supabase
        .from("scene_characters")
        .delete()
        .eq("id", sceneCharacterId);

      if (error) throw error;
      setLinkedNodes((prev) => prev.filter((sc) => sc.id !== sceneCharacterId));
    } catch (error) {
      console.error("Error removing node from scene:", error);
    }
  };

  // Toggle POV status for a character
  const togglePov = async (sceneCharacterId: string, currentPov: boolean) => {
    try {
      // If setting this as POV, first unset all others
      if (!currentPov) {
        await supabase
          .from("scene_characters")
          .update({ pov: false })
          .eq("scene_id", scene.id);
      }

      const { error } = await supabase
        .from("scene_characters")
        .update({ pov: !currentPov })
        .eq("id", sceneCharacterId);

      if (error) throw error;

      setLinkedNodes((prev) =>
        prev.map((sc) => ({
          ...sc,
          pov: sc.id === sceneCharacterId ? !currentPov : (!currentPov ? false : sc.pov),
        }))
      );
    } catch (error) {
      console.error("Error toggling POV:", error);
    }
  };

  // AI completion using Vercel AI SDK
  const { complete, completion, isLoading: isGenerating, error } = useCompletion({
    api: "/api/ai/generate-scene",
    streamProtocol: "text",
    body: {
      sceneId: scene.id,
      projectId,
      model: selectedSceneModel,
    },
    onFinish: (_prompt, completionText) => {
      setProse(completionText);
      saveScene(beatInstructions, completionText);
    },
    onError: (err) => {
      console.error("Generation error:", err);
    },
  });

  // Update prose in real-time during streaming
  // Only use completion if it has content, otherwise keep showing existing prose
  const displayProse = isGenerating && completion ? completion : prose;

  // Count words in prose
  const wordCount = displayProse.trim().split(/\s+/).filter(Boolean).length;

  // Filter nodes by type
  const characters = storyNodes.filter((n) => n.node_type === "character");
  const locations = storyNodes.filter((n) => n.node_type === "location");
  const events = storyNodes.filter((n) => n.node_type === "event");
  const items = storyNodes.filter((n) => n.node_type === "item");
  const factions = storyNodes.filter((n) => n.node_type === "faction");
  const concepts = storyNodes.filter((n) => n.node_type === "concept");

  // Get linked node IDs
  const linkedNodeIds = new Set(
    linkedNodes.map((sc) => sc.node_id)
  );

  const saveScene = useCallback(
    async (beats: string, proseContent: string) => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("scenes")
          .update({
            beat_instructions: beats || null,
            edited_prose: proseContent || null,
            word_count: proseContent.trim().split(/\s+/).filter(Boolean).length,
          })
          .eq("id", scene.id);

        if (error) throw error;
        setLastSaved(new Date());
        router.refresh();
      } catch (error) {
        console.error("Error saving scene:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [scene.id, supabase, router]
  );

  const handleGenerateProse = async () => {
    if (!beatInstructions.trim()) return;

    // Build context from linked nodes
    const context = linkedNodes
      .map((sc) => sc.story_nodes)
      .filter(Boolean)
      .map((node) => `${node!.name}: ${node!.description || ""}`)
      .join("\n");

    const prompt = `${beatInstructions}\n\nContext:\n${context}`;
    await complete(prompt);
  };

  const handleSave = () => {
    saveScene(beatInstructions, prose);
  };

  // Handle AI edit action from toolbar
  const handleEditAction = useCallback(
    async (action: EditAction, customPrompt?: string) => {
      if (!selection) return;

      setEditState({
        originalText: selection.text,
        action,
        customPrompt,
        selectionRect: selection.rect,
      });

      document.getSelection()?.removeAllRanges();
      clearSelection();

      await completeEdit(selection.text, {
        body: {
          selectedText: selection.text,
          action,
          customPrompt,
          sceneId: scene.id,
          projectId,
        },
      });
    },
    [selection, clearSelection, completeEdit, scene.id, projectId]
  );

  // Handle accepting the edit
  const handleAcceptEdit = useCallback(() => {
    if (!editState || !editCompletion) return;

    const newProse = prose.replace(editState.originalText, editCompletion);
    setProse(newProse);
    saveScene(beatInstructions, newProse);
    setEditState(null);
  }, [editState, editCompletion, prose, beatInstructions, saveScene]);

  // Handle rejecting the edit
  const handleRejectEdit = useCallback(() => {
    stopEdit();
    setEditState(null);
  }, [stopEdit]);

  // Handle retry
  const handleRetryEdit = useCallback(async () => {
    if (!editState) return;

    await completeEdit(editState.originalText, {
      body: {
        selectedText: editState.originalText,
        action: editState.action,
        customPrompt: editState.customPrompt,
        sceneId: scene.id,
        projectId,
      },
    });
  }, [editState, completeEdit, scene.id, projectId]);

  // Dismiss toolbar
  const handleDismissToolbar = useCallback(() => {
    document.getSelection()?.removeAllRanges();
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Group orientation="horizontal" className="flex-1">
        {/* Left Panel - Beats Editor */}
        <Panel defaultSize={35} minSize={20}>
          <div className="flex h-full flex-col border-r">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h2 className="font-semibold">Beat Instructions</h2>
              <div className="flex items-center gap-2">
                {hasValidKey && (
                  <ModelSelector
                    provider={validProviders}
                    value={selectedSceneModel}
                    onChange={setSelectedSceneModel}
                    disabled={isGenerating}
                    compact
                  />
                )}
                <Button
                  size="sm"
                  onClick={handleGenerateProse}
                  disabled={isGenerating || !beatInstructions.trim() || !hasValidKey}
                  title={!hasValidKey ? "Configure your API key in Settings" : undefined}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <Textarea
                value={beatInstructions}
                onChange={(e) => setBeatInstructions(e.target.value)}
                placeholder="Write your scene beats here...

Example:
- Character enters the tavern
- Notices the mysterious stranger in the corner
- Approaches and introduces themselves
- Stranger reveals important information about the quest"
                className="min-h-[300px] resize-none border-0 p-0 focus-visible:ring-0"
              />

              {/* Context Cards */}
              <div className="mt-6 space-y-4">
                {/* Linked Nodes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      Scene Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {linkedNodes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {linkedNodes.map((sc) => (
                          <Badge
                            key={sc.id}
                            variant={sc.pov ? "default" : "secondary"}
                            className="flex items-center gap-1 pr-1"
                          >
                            {sc.story_nodes?.node_type === "character" && (
                              <button
                                onClick={() => togglePov(sc.id, !!sc.pov)}
                                className="hover:text-yellow-400 transition-colors"
                                title={sc.pov ? "Remove POV" : "Set as POV"}
                              >
                                <Star
                                  className={`h-3 w-3 ${sc.pov ? "fill-current" : ""}`}
                                />
                              </button>
                            )}
                            <span>{sc.story_nodes?.name || "Unknown"}</span>
                            <button
                              onClick={() => removeNodeFromScene(sc.id)}
                              className="ml-1 hover:text-destructive transition-colors"
                              title="Remove from scene"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click on nodes below to add context to this scene.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Available Characters */}
                {characters.filter((c) => !linkedNodeIds.has(c.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Available Characters
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {characters
                          .filter((c) => !linkedNodeIds.has(c.id))
                          .map((char) => (
                            <Badge
                              key={char.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(char.id, "character")}
                            >
                              + {char.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Available Locations */}
                {locations.filter((l) => !linkedNodeIds.has(l.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        Available Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {locations
                          .filter((l) => !linkedNodeIds.has(l.id))
                          .map((loc) => (
                            <Badge
                              key={loc.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(loc.id, "location")}
                            >
                              + {loc.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Available Events */}
                {events.filter((e) => !linkedNodeIds.has(e.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        Available Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {events
                          .filter((e) => !linkedNodeIds.has(e.id))
                          .map((event) => (
                            <Badge
                              key={event.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(event.id, "event")}
                            >
                              + {event.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Available Items */}
                {items.filter((i) => !linkedNodeIds.has(i.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4" />
                        Available Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {items
                          .filter((i) => !linkedNodeIds.has(i.id))
                          .map((item) => (
                            <Badge
                              key={item.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(item.id, "item")}
                            >
                              + {item.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Available Factions */}
                {factions.filter((f) => !linkedNodeIds.has(f.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Swords className="h-4 w-4" />
                        Available Factions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {factions
                          .filter((f) => !linkedNodeIds.has(f.id))
                          .map((faction) => (
                            <Badge
                              key={faction.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(faction.id, "faction")}
                            >
                              + {faction.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Available Concepts */}
                {concepts.filter((c) => !linkedNodeIds.has(c.id)).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4" />
                        Available Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {concepts
                          .filter((c) => !linkedNodeIds.has(c.id))
                          .map((concept) => (
                            <Badge
                              key={concept.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-secondary transition-colors"
                              onClick={() => addNodeToScene(concept.id, "concept")}
                            >
                              + {concept.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </Panel>

        {/* Resize Handle */}
        <Separator className="w-1 bg-border hover:bg-primary/20 transition-colors cursor-col-resize flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Separator>

        {/* Right Panel - Prose Editor */}
        <Panel defaultSize={65} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold">Prose</h2>
                <span className="text-sm text-muted-foreground">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
            <div ref={proseContainerRef} data-scene-id={scene.id} className="flex-1 overflow-hidden relative">
              {isGenerating && (
                <div className="bg-muted/50 px-4 py-2 text-sm text-muted-foreground border-b">
                  Generating... ({completion?.length || 0} characters)
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 px-4 py-2 text-sm text-destructive border-b">
                  Error: {error.message}
                </div>
              )}
              {editError && (
                <div className="bg-destructive/10 px-4 py-2 text-sm text-destructive border-b">
                  Edit Error: {editError.message}
                </div>
              )}
              <TiptapEditor
                content={displayProse}
                onChange={setProse}
                placeholder="Your generated or written prose will appear here..."
              />
            </div>
          </div>
        </Panel>
      </Group>

      {/* Selection Toolbar for AI editing */}
      {selection && !editState && (
        <SelectionToolbar
          rect={selection.rect}
          onAction={handleEditAction}
          onDismiss={handleDismissToolbar}
        />
      )}

      {/* Edit Preview */}
      {editState && (
        <FloatingEditPreview
          rect={editState.selectionRect}
          originalText={editState.originalText}
          generatedText={editCompletion || ""}
          isStreaming={isEditing}
          onAccept={handleAcceptEdit}
          onReject={handleRejectEdit}
          onRetry={handleRetryEdit}
        />
      )}
    </div>
  );
}
