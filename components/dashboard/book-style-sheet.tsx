"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Book } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Loader2, X, Save } from "lucide-react";
import {
  POV_STYLES,
  TENSE_OPTIONS,
  PROSE_STYLES,
  PACING_OPTIONS,
  CONTENT_RATINGS,
  VIOLENCE_LEVELS,
  ROMANCE_LEVELS,
  TONE_OPTIONS,
} from "@/lib/story-universe-schema";

interface BookStyleSheetProps {
  book: Book;
}

export function BookStyleSheet({ book }: BookStyleSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Basic info
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle || "");
  const [synopsis, setSynopsis] = useState(book.synopsis || "");
  const [targetWordCount, setTargetWordCount] = useState(book.target_word_count?.toString() || "");

  // Writing style - these fields may not exist yet, so we use type assertions
  const bookWithMetadata = book as Book & {
    pov_style?: string | null;
    tense?: string | null;
    prose_style?: string | null;
    pacing?: string | null;
    dialogue_style?: string | null;
    description_density?: string | null;
    content_rating?: string | null;
    violence_level?: string | null;
    romance_level?: string | null;
    profanity_level?: string | null;
    tone?: string[] | null;
  };

  const [povStyle, setPovStyle] = useState(bookWithMetadata.pov_style || "none");
  const [tense, setTense] = useState(bookWithMetadata.tense || "none");
  const [proseStyle, setProseStyle] = useState(bookWithMetadata.prose_style || "none");
  const [pacing, setPacing] = useState(bookWithMetadata.pacing || "none");
  const [dialogueStyle, setDialogueStyle] = useState(bookWithMetadata.dialogue_style || "none");

  // Content guidelines
  const [contentRating, setContentRating] = useState(bookWithMetadata.content_rating || "none");
  const [violenceLevel, setViolenceLevel] = useState(bookWithMetadata.violence_level || "none");
  const [romanceLevel, setRomanceLevel] = useState(bookWithMetadata.romance_level || "none");

  // Tone
  const [selectedTones, setSelectedTones] = useState<string[]>(bookWithMetadata.tone || []);

  // Convert "none" to null for database storage
  const toNullable = (value: string) => (value && value !== "none" ? value : null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("books")
        .update({
          title,
          subtitle: subtitle || null,
          synopsis: synopsis || null,
          target_word_count: targetWordCount ? parseInt(targetWordCount) : null,
          pov_style: toNullable(povStyle),
          tense: toNullable(tense),
          prose_style: toNullable(proseStyle),
          pacing: toNullable(pacing),
          dialogue_style: toNullable(dialogueStyle),
          content_rating: toNullable(contentRating),
          violence_level: toNullable(violenceLevel),
          romance_level: toNullable(romanceLevel),
          tone: selectedTones.length > 0 ? selectedTones : null,
        })
        .eq("id", book.id);

      if (error) throw error;

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving book settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="mr-2 h-4 w-4" />
          Book Style
        </Button>
      </SheetTrigger>
      <SheetContent className="w-125 sm:w-160 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6">
          <SheetTitle>Book Style &amp; Settings</SheetTitle>
          <SheetDescription>
            Configure your book&apos;s metadata and writing style guidelines for AI generation.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 mt-4">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="tone">Tone</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-4">
            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 py-2 mt-0">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (optional)</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Book subtitle..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Brief summary of the book..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWordCount">Word Count Goal</Label>
                <Input
                  id="targetWordCount"
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(e.target.value)}
                  placeholder="e.g., 80000"
                />
                <p className="text-xs text-muted-foreground">
                  Typical novel: 70,000-100,000 words
                </p>
              </div>
            </TabsContent>

            {/* Writing Style */}
            <TabsContent value="style" className="space-y-4 py-2 mt-0">
              <div className="space-y-2">
                <Label>Point of View</Label>
                <Select value={povStyle} onValueChange={setPovStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select POV style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {POV_STYLES.map((pov) => (
                      <SelectItem key={pov.value} value={pov.value}>
                        <div className="flex flex-col">
                          <span>{pov.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {pov.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tense</Label>
                <Select value={tense} onValueChange={setTense}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tense..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {TENSE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex flex-col">
                          <span>{t.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prose Style</Label>
                <Select value={proseStyle} onValueChange={setProseStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prose style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PROSE_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        <div className="flex flex-col">
                          <span>{style.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {style.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pacing</Label>
                <Select value={pacing} onValueChange={setPacing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pacing..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {PACING_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialogueStyle">Dialogue Style</Label>
                <Input
                  id="dialogueStyle"
                  value={dialogueStyle === "none" ? "" : dialogueStyle}
                  onChange={(e) => setDialogueStyle(e.target.value || "none")}
                  placeholder="e.g., Witty banter, Formal, Regional dialects..."
                />
              </div>
            </TabsContent>

            {/* Tone */}
            <TabsContent value="tone" className="space-y-4 py-2 mt-0">
              <div className="space-y-2">
                <Label>Overall Tone</Label>
                <p className="text-sm text-muted-foreground">
                  Select the tones that best describe your book. These guide AI generation.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {TONE_OPTIONS.map((tone) => (
                    <Badge
                      key={tone.value}
                      variant={selectedTones.includes(tone.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTone(tone.value)}
                    >
                      {tone.label}
                      {selectedTones.includes(tone.value) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedTones.length > 0 && (
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="text-sm font-medium">Selected Tones:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTones.map((t) => TONE_OPTIONS.find((o) => o.value === t)?.label).join(", ")}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Content Guidelines */}
            <TabsContent value="content" className="space-y-4 py-2 mt-0">
              <div className="space-y-2">
                <Label>Content Rating</Label>
                <Select value={contentRating} onValueChange={setContentRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {CONTENT_RATINGS.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        <div className="flex flex-col">
                          <span>{rating.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {rating.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Violence Level</Label>
                <Select value={violenceLevel} onValueChange={setViolenceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {VIOLENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {level.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Romance Level</Label>
                <Select value={romanceLevel} onValueChange={setRomanceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {ROMANCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {level.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border p-3 bg-muted/50 mt-4">
                <p className="text-sm font-medium">How these are used</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Content guidelines are included in AI prompts to ensure
                  generated prose matches your book&apos;s target audience and
                  style requirements.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-4 px-6 pb-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
