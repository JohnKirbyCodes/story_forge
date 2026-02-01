"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, BookOpen, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PreviouslyOnCardProps {
  bookId: string;
  projectId: string;
  bookNumber: number;
  previouslyOn: string | null;
  hasValidKey: boolean;
}

export function PreviouslyOnCard({
  bookId,
  projectId,
  bookNumber,
  previouslyOn,
  hasValidKey,
}: PreviouslyOnCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recap, setRecap] = useState(previouslyOn || "");
  const [editedRecap, setEditedRecap] = useState(previouslyOn || "");
  const router = useRouter();
  const supabase = createClient();

  // Only show for Book 2+
  if (bookNumber <= 1) {
    return null;
  }

  const handleGenerate = async () => {
    if (!hasValidKey) {
      toast.error("Please configure your AI API key in Settings");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "no_api_key") {
          toast.error("Please configure your AI API key in Settings");
        } else {
          toast.error(data.message || "Failed to generate recap");
        }
        return;
      }

      if (data.recap) {
        setRecap(data.recap);
        setEditedRecap(data.recap);
        toast.success("Previously On recap generated!");
        router.refresh();
      } else if (data.message) {
        toast.info(data.message);
      }
    } catch (error) {
      console.error("Error generating recap:", error);
      toast.error("Failed to generate recap");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("books")
        .update({ previously_on: editedRecap || null } as Record<string, unknown>)
        .eq("id", bookId);

      if (error) throw error;

      setRecap(editedRecap);
      setIsEditing(false);
      toast.success("Recap saved!");
      router.refresh();
    } catch (error) {
      console.error("Error saving recap:", error);
      toast.error("Failed to save recap");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedRecap(recap);
    setIsEditing(false);
  };

  // Empty state - no recap yet
  if (!recap && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Previously On...
          </CardTitle>
          <CardDescription>
            Generate a recap of Book {bookNumber - 1} to help maintain continuity.
            This context will be included when generating new scenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !hasValidKey}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recap
              </>
            )}
          </Button>
          {!hasValidKey && (
            <p className="mt-2 text-sm text-muted-foreground">
              Configure your AI API key in Settings to generate recaps.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing state
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Previously On...
          </CardTitle>
          <CardDescription>
            Edit the recap to fine-tune what context is included for AI generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={editedRecap}
            onChange={(e) => setEditedRecap(e.target.value)}
            rows={10}
            placeholder="Write a recap of what happened in the previous book(s)..."
            className="resize-y"
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display state - has recap
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Previously On...
            </CardTitle>
            <CardDescription>
              This recap is included as context when generating scenes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !hasValidKey}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{recap}</p>
      </CardContent>
    </Card>
  );
}
