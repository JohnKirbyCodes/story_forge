"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, PenLine, Loader2, Check, AlertCircle } from "lucide-react";
import { ModelSelector } from "@/components/shared/model-selector";
import { AIProvider } from "@/lib/ai/providers/config";

interface AddSynopsisCardProps {
  bookId: string;
  projectId: string;
  validProviders: AIProvider[];
  aiDefaultModel: string;
  hasValidKey: boolean;
}

export function AddSynopsisCard({
  bookId,
  projectId,
  validProviders,
  aiDefaultModel,
  hasValidKey,
}: AddSynopsisCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [synopsis, setSynopsis] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(aiDefaultModel);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    if (!synopsis.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("books")
        .update({ synopsis: synopsis.trim() })
        .eq("id", bookId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Error saving synopsis:", error);
      setError("Failed to save synopsis. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate-synopsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, projectId, model: selectedModel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "quota_exceeded") {
          setError(errorData.message || "You've reached your monthly AI generation limit.");
          return;
        }
        if (errorData.error === "provider_error") {
          setError(errorData.message || "AI provider error. Please check your API key in Settings.");
          return;
        }
        throw new Error(errorData.error || "Failed to generate synopsis");
      }

      const data = await response.json();
      setSynopsis(data.synopsis);
      setIsEditing(true);
    } catch (error) {
      console.error("Error generating synopsis:", error);
      setError("Failed to generate synopsis. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Synopsis</label>
                <div className="flex items-center gap-2">
                  {hasValidKey && (
                    <ModelSelector
                      provider={validProviders}
                      value={selectedModel}
                      onChange={setSelectedModel}
                      disabled={isGenerating || isSaving}
                      compact
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || isSaving || !hasValidKey}
                    className="text-xs"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    {isGenerating ? "Generating..." : "Regenerate"}
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Write a brief synopsis of your book. This will help AI generate better chapter outlines and scene content..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={6}
                className="resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A good synopsis includes the main characters, central conflict, and story arc.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setSynopsis("");
                  setError(null);
                }}
                disabled={isSaving || isGenerating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!synopsis.trim() || isSaving || isGenerating}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Synopsis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <PenLine className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Add a Synopsis</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              A synopsis helps AI understand your story and generate better chapter outlines and scene content.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Required for AI outline generation</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            {hasValidKey && (
              <ModelSelector
                provider={validProviders}
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isGenerating}
                compact
              />
            )}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isGenerating}>
                <PenLine className="mr-2 h-4 w-4" />
                Write Synopsis
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !hasValidKey}
                title={!hasValidKey ? "Configure your API key in Settings" : undefined}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Auto-generate"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
