"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Chapter, StoryNode } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, X } from "lucide-react";

interface ChapterEditSheetProps {
  chapter: Chapter;
  storyNodes: StoryNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChapterEditSheet({
  chapter,
  storyNodes,
  open,
  onOpenChange,
}: ChapterEditSheetProps) {
  const [title, setTitle] = useState(chapter.title);
  const [summary, setSummary] = useState(chapter.summary || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Reset form when chapter changes
  useEffect(() => {
    setTitle(chapter.title);
    setSummary(chapter.summary || "");
  }, [chapter]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("chapters")
        .update({
          title,
          summary: summary || null,
        })
        .eq("id", chapter.id);

      if (error) throw error;

      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving chapter:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter for character nodes
  const characters = storyNodes.filter((n) => n.node_type === "character");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Chapter</SheetTitle>
          <SheetDescription>
            Update chapter details and metadata.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="chapter-title">Title</Label>
              <Input
                id="chapter-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter title..."
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="chapter-summary">Summary</Label>
              <Textarea
                id="chapter-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief summary of what happens in this chapter..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This summary helps AI understand the chapter context when generating scenes.
              </p>
            </div>

            {/* Order Index (read-only info) */}
            <div className="space-y-2">
              <Label>Chapter Order</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Chapter {chapter.order_index}</Badge>
                <span className="text-xs text-muted-foreground">
                  Drag chapters in the list to reorder
                </span>
              </div>
            </div>

            {/* Available Characters (info section) */}
            {characters.length > 0 && (
              <div className="space-y-2">
                <Label>Project Characters</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Assign characters to individual scenes within this chapter.
                </p>
                <div className="flex flex-wrap gap-2">
                  {characters.slice(0, 10).map((char) => (
                    <Badge key={char.id} variant="secondary">
                      {char.name}
                    </Badge>
                  ))}
                  {characters.length > 10 && (
                    <Badge variant="outline">+{characters.length - 10} more</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
