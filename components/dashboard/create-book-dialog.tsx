"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

interface CreateBookDialogProps {
  projectId: string;
}

export function CreateBookDialog({ projectId }: CreateBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [targetWordCount, setTargetWordCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLimitReached(false);

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          synopsis,
          target_word_count: targetWordCount ? parseInt(targetWordCount) : null,
          project_id: projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "limit_exceeded") {
          setLimitReached(true);
          setError(data.message);
          return;
        }
        throw new Error(data.error || "Failed to create book");
      }

      setOpen(false);
      setTitle("");
      setSubtitle("");
      setSynopsis("");
      setTargetWordCount("");
      trackEvent.bookCreated(projectId);
      router.refresh();
      router.push(`/dashboard/projects/${projectId}/books/${data.id}`);
    } catch (err) {
      console.error("Error creating book:", err);
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>
              Add a new book to this project. Books share the same Story
              Universe.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant={limitReached ? "default" : "destructive"} className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
                {limitReached && (
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1"
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard/settings/billing");
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="The Adventure Begins"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (optional)</Label>
              <Input
                id="subtitle"
                placeholder="Book One of the Series"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis (optional)</Label>
              <Textarea
                id="synopsis"
                placeholder="A brief summary of this book..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetWordCount">Target Word Count (optional)</Label>
              <Input
                id="targetWordCount"
                type="number"
                placeholder="80000"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(e.target.value)}
                min={0}
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
              Create Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
