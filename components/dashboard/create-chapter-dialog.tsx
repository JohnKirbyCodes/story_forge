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

interface CreateChapterDialogProps {
  bookId: string;
  projectId: string;
}

export function CreateChapterDialog({ bookId, projectId }: CreateChapterDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current max order_index for this book
      const { data: chapters } = await supabase
        .from("chapters")
        .select("order_index")
        .eq("book_id", bookId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = chapters && chapters.length > 0
        ? (chapters[0].order_index ?? 0) + 1
        : 1;

      const { error } = await supabase
        .from("chapters")
        .insert({
          title,
          summary: summary || null,
          book_id: bookId,
          order_index: nextOrderIndex,
        });

      if (error) throw error;

      setOpen(false);
      setTitle("");
      setSummary("");
      router.refresh();
    } catch (error) {
      console.error("Error creating chapter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to organize your scenes. Chapters can contain
              multiple scenes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Chapter 1: The Beginning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary (optional)</Label>
              <Textarea
                id="summary"
                placeholder="A brief summary of what happens in this chapter..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
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
            <Button type="submit" disabled={isLoading || !title}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Chapter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
