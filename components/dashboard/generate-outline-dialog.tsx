"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Book } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
  FileText,
  ChevronRight,
  Users,
  MapPin,
  Eye,
} from "lucide-react";
import { ModelSelector } from "@/components/shared/model-selector";
import { AIProvider } from "@/lib/ai/providers/config";
import { toast } from "sonner";

interface GeneratedScene {
  title?: string;
  beat_instructions: string;
  mood?: string;
  tension_level?: string;
  // Node references for auto-linking
  characters?: string[];
  pov_character?: string;
  location?: string;
}

interface GeneratedChapter {
  title: string;
  summary: string;
  scenes: GeneratedScene[];
}

interface NodeMappingEntry {
  id: string;
  type: string;
}

interface GeneratedOutline {
  chapters: GeneratedChapter[];
  nodeMapping?: Record<string, NodeMappingEntry>;
}

interface GenerateOutlineDialogProps {
  bookId: string;
  projectId: string;
  book: Book;
  validProviders: AIProvider[];
  aiDefaultModel: string;
  hasValidKey: boolean;
}

type Step = "configure" | "generating" | "preview" | "saving" | "complete";

export function GenerateOutlineDialog({
  bookId,
  projectId,
  book,
  validProviders,
  aiDefaultModel,
  hasValidKey,
}: GenerateOutlineDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [chapterCount, setChapterCount] = useState("10");
  const [scenesPerChapter, setScenesPerChapter] = useState("3");
  const [outline, setOutline] = useState<GeneratedOutline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [selectedModel, setSelectedModel] = useState(aiDefaultModel);
  const router = useRouter();
  const supabase = createClient();

  const hasSynopsis = !!book.synopsis;

  const handleGenerate = async () => {
    setStep("generating");
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          projectId,
          chapterCount: parseInt(chapterCount),
          scenesPerChapter: parseInt(scenesPerChapter),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        // Parse error response for better error messages
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "provider_error") {
          throw new Error(errorData.message || "AI provider error. Please check your API key in Settings.");
        }
        throw new Error(errorData.error || "Failed to generate outline");
      }

      const data = await response.json();
      setOutline(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("configure");
    }
  };

  // Helper to resolve node name to ID using the mapping
  const resolveNodeId = (
    name: string | undefined,
    expectedType?: string
  ): string | null => {
    if (!name || !outline?.nodeMapping) return null;
    const entry = outline.nodeMapping[name.toLowerCase()];
    if (!entry) return null;
    if (expectedType && entry.type !== expectedType) return null;
    return entry.id;
  };

  const handleSave = async () => {
    if (!outline) return;

    setStep("saving");
    setError(null);
    const totalItems =
      outline.chapters.length +
      outline.chapters.reduce((acc, ch) => acc + ch.scenes.length, 0);
    setSaveProgress({ current: 0, total: totalItems });

    // Track linking issues for user feedback
    let failedCharacterLinks = 0;
    let unresolvedNodes = 0;

    try {
      let progress = 0;

      for (let i = 0; i < outline.chapters.length; i++) {
        const chapter = outline.chapters[i];

        // Create chapter
        const { data: newChapter, error: chapterError } = await supabase
          .from("chapters")
          .insert({
            book_id: bookId,
            title: chapter.title,
            summary: chapter.summary,
            order_index: i,
            sort_order: i,
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        progress++;
        setSaveProgress({ current: progress, total: totalItems });

        // Create scenes for this chapter
        for (let j = 0; j < chapter.scenes.length; j++) {
          const scene = chapter.scenes[j];

          // Map tension_level to valid database values (climactic -> peak)
          let tensionLevel = scene.tension_level || null;
          if (tensionLevel === "climactic") tensionLevel = "peak";

          // Resolve location and POV character IDs
          const locationId = resolveNodeId(scene.location, "location");
          const povCharacterId = resolveNodeId(scene.pov_character, "character");

          // Track unresolved nodes
          if (scene.location && !locationId) unresolvedNodes++;
          if (scene.pov_character && !povCharacterId) unresolvedNodes++;

          const { data: newScene, error: sceneError } = await supabase
            .from("scenes")
            .insert({
              chapter_id: newChapter.id,
              title: scene.title || null,
              beat_instructions: scene.beat_instructions,
              mood: scene.mood || null,
              tension_level: tensionLevel,
              order_index: j,
              sort_order: j,
              location_id: locationId,
              pov_character_id: povCharacterId,
            })
            .select()
            .single();

          if (sceneError) throw sceneError;

          // Build characters list, ensuring POV character is included
          let charactersToLink = scene.characters || [];
          if (scene.pov_character) {
            const povLower = scene.pov_character.toLowerCase();
            const hasPov = charactersToLink.some(
              (c) => c.toLowerCase() === povLower
            );
            if (!hasPov) {
              charactersToLink = [...charactersToLink, scene.pov_character];
            }
          }

          // Create scene_characters entries for all characters in this scene
          if (newScene && charactersToLink.length > 0) {
            const sceneCharacters = charactersToLink
              .map((charName) => {
                const charId = resolveNodeId(charName, "character");
                if (!charId) {
                  unresolvedNodes++;
                  return null;
                }
                return {
                  scene_id: newScene.id,
                  character_id: charId,
                  node_id: charId,
                  pov: charName.toLowerCase() === scene.pov_character?.toLowerCase(),
                  role_in_scene: "major" as const,
                };
              })
              .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

            if (sceneCharacters.length > 0) {
              const { error: charError } = await supabase
                .from("scene_characters")
                .insert(sceneCharacters);

              if (charError) {
                console.error("Error inserting scene characters:", charError);
                failedCharacterLinks += sceneCharacters.length;
              }
            }
          }

          progress++;
          setSaveProgress({ current: progress, total: totalItems });
        }
      }

      // Show warning if there were linking issues
      if (failedCharacterLinks > 0 || unresolvedNodes > 0) {
        const issues: string[] = [];
        if (unresolvedNodes > 0) {
          issues.push(`${unresolvedNodes} node(s) could not be matched`);
        }
        if (failedCharacterLinks > 0) {
          issues.push(`${failedCharacterLinks} character link(s) failed to save`);
        }
        toast.warning("Outline saved with warnings", {
          description: issues.join(". ") + ". You can manually link them in scene settings.",
        });
      }

      setStep("complete");
      // Refresh the page after a brief delay
      setTimeout(() => {
        router.refresh();
        setOpen(false);
        resetDialog();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save outline");
      setStep("preview");
    }
  };

  const resetDialog = () => {
    setStep("configure");
    setOutline(null);
    setError(null);
    setSaveProgress({ current: 0, total: 0 });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
    }
  };

  const totalScenes = outline
    ? outline.chapters.reduce((acc, ch) => acc + ch.scenes.length, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Outline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Chapter Outline
          </DialogTitle>
          <DialogDescription>
            AI will create chapters and scene beats based on your book&apos;s
            synopsis, style settings, and story universe.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Configure */}
        {step === "configure" && (
          <>
            <div className="space-y-6 py-4">
              {/* Warning if no synopsis */}
              {!hasSynopsis && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      No synopsis found
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Add a synopsis in Book Style settings for better results.
                      The AI will still attempt to generate an outline based on
                      available story elements.
                    </p>
                  </div>
                </div>
              )}

              {/* Configuration options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter-count">Number of Chapters</Label>
                  <Input
                    id="chapter-count"
                    type="number"
                    min="3"
                    max="50"
                    value={chapterCount}
                    onChange={(e) => setChapterCount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typical novel: 15-30 chapters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenes-per-chapter">Scenes per Chapter</Label>
                  <Input
                    id="scenes-per-chapter"
                    type="number"
                    min="1"
                    max="10"
                    value={scenesPerChapter}
                    onChange={(e) => setScenesPerChapter(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 2-4 scenes
                  </p>
                </div>
              </div>

              {/* Model Selection */}
              {hasValidKey && (
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <ModelSelector
                    provider={validProviders}
                    value={selectedModel}
                    onChange={setSelectedModel}
                  />
                </div>
              )}

              {/* Context summary */}
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Context being used:</p>
                <div className="flex flex-wrap gap-2">
                  {book.synopsis && (
                    <Badge variant="secondary">Synopsis</Badge>
                  )}
                  {book.pov_style && (
                    <Badge variant="secondary">POV: {book.pov_style}</Badge>
                  )}
                  {book.tense && (
                    <Badge variant="secondary">Tense: {book.tense}</Badge>
                  )}
                  {book.prose_style && (
                    <Badge variant="secondary">Prose: {book.prose_style}</Badge>
                  )}
                  {book.pacing && (
                    <Badge variant="secondary">Pacing: {book.pacing}</Badge>
                  )}
                  {book.content_rating && (
                    <Badge variant="secondary">Rating: {book.content_rating}</Badge>
                  )}
                  {book.tone && Array.isArray(book.tone) && book.tone.length > 0 && (
                    <Badge variant="secondary">
                      Tone: {book.tone.slice(0, 2).join(", ")}
                      {book.tone.length > 2 && "..."}
                    </Badge>
                  )}
                  <Badge variant="outline">+ Story Nodes</Badge>
                  <Badge variant="outline">+ Relationships</Badge>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!hasValidKey}
                title={!hasValidKey ? "Configure your API key in Settings" : undefined}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Outline
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Generating your outline...</p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take a minute. The AI is crafting {chapterCount}{" "}
                chapters with detailed scene beats.
              </p>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && outline && (
          <>
            <div className="flex items-center gap-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {outline.chapters.length} Chapters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{totalScenes} Scenes</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 -mx-6 max-h-[50vh] overflow-y-auto px-6">
                <Accordion type="multiple" className="w-full pb-4">
                  {outline.chapters.map((chapter, chapterIndex) => (
                    <AccordionItem
                      key={chapterIndex}
                      value={`chapter-${chapterIndex}`}
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="outline" className="shrink-0">
                            Ch. {chapterIndex + 1}
                          </Badge>
                          <span className="font-medium">{chapter.title}</span>
                          <Badge variant="secondary" className="ml-auto mr-2">
                            {chapter.scenes.length} scenes
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-4 border-l-2 ml-3">
                          <p className="text-sm text-muted-foreground italic">
                            {chapter.summary}
                          </p>
                          {chapter.scenes.map((scene, sceneIndex) => (
                            <div
                              key={sceneIndex}
                              className="p-3 rounded-lg bg-muted/50 space-y-2"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">
                                  Scene {sceneIndex + 1}
                                  {scene.title && `: ${scene.title}`}
                                </span>
                                {scene.mood && (
                                  <Badge variant="outline" className="text-xs">
                                    {scene.mood}
                                  </Badge>
                                )}
                                {scene.tension_level && (
                                  <Badge variant="outline" className="text-xs">
                                    {scene.tension_level}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground pl-5">
                                {scene.beat_instructions}
                              </p>
                              {/* Show linked nodes */}
                              {(scene.characters?.length || scene.location || scene.pov_character) && (
                                <div className="flex items-center gap-3 pl-5 pt-1 flex-wrap">
                                  {scene.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{scene.location}</span>
                                    </div>
                                  )}
                                  {scene.pov_character && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Eye className="h-3 w-3" />
                                      <span>POV: {scene.pov_character}</span>
                                    </div>
                                  )}
                                  {scene.characters && scene.characters.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Users className="h-3 w-3" />
                                      <span>{scene.characters.join(", ")}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOutline(null);
                  setStep("configure");
                }}
              >
                Regenerate
              </Button>
              <Button onClick={handleSave}>
                <Check className="mr-2 h-4 w-4" />
                Insert {outline.chapters.length} Chapters
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Saving */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Saving outline...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Creating chapters and scenes ({saveProgress.current}/
                {saveProgress.total})
              </p>
            </div>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Outline saved successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your chapters and scenes have been created.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
