"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

interface CreateSceneDialogProps {
  chapterId: string;
  bookId: string;
  projectId: string;
  nextOrderIndex: number;
}

export function CreateSceneDialog({
  chapterId,
  bookId,
  projectId,
  nextOrderIndex,
}: CreateSceneDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [beatInstructions, setBeatInstructions] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("scenes")
        .insert({
          title: title || null,
          beat_instructions: beatInstructions || null,
          chapter_id: chapterId,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;

      setOpen(false);
      setTitle("");
      setBeatInstructions("");
      router.push(`/dashboard/projects/${projectId}/books/${bookId}/editor/${data.id}`);
    } catch (error) {
      console.error("Error creating scene:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Scene
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Scene</DialogTitle>
            <DialogDescription>
              Add a scene to this chapter. You can write beat instructions to
              guide the AI in generating prose.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Scene Title (optional)</Label>
              <Input
                id="title"
                placeholder="The First Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beatInstructions">Beat Instructions (optional)</Label>
              <Textarea
                id="beatInstructions"
                placeholder="High-level instructions for this scene:
- Character enters the tavern
- Meets mysterious stranger
- Learns about the quest"
                value={beatInstructions}
                onChange={(e) => setBeatInstructions(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                These instructions will guide the AI when generating prose for this scene.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Scene
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
