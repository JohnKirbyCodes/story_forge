"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Users, MapPin, Swords, Package, Calendar, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface GenerateUniverseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function GenerateUniverseDialog({
  open,
  onOpenChange,
  projectId,
}: GenerateUniverseDialogProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generation options
  const [characterCount, setCharacterCount] = useState(6);
  const [locationCount, setLocationCount] = useState(4);
  const [factionCount, setFactionCount] = useState(2);
  const [itemCount, setItemCount] = useState(2);
  const [eventCount, setEventCount] = useState(3);
  const [conceptCount, setConceptCount] = useState(1);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const supabase = createClient();

      // Get user session for auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Please sign in to generate content");
        return;
      }

      // Call Supabase Edge Function (longer timeout than Vercel)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-universe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          options: {
            characterCount,
            locationCount,
            factionCount,
            itemCount,
            eventCount,
            conceptCount,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle provider errors (missing API key, etc.)
        if (data.error === "provider_error") {
          toast.error(data.message, {
            description: "Go to Settings → AI to configure your API key.",
            action: {
              label: "Go to Settings",
              onClick: () => router.push("/dashboard/settings/ai"),
            },
          });
          return;
        }
        throw new Error(data.message || "Failed to generate universe");
      }

      toast.success(
        `Generated ${data.generated.characters} characters, ${data.generated.locations} locations, ${data.generated.factions} factions, and ${data.generated.relationships} relationships!`
      );

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate story universe",
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const totalElements =
    characterCount + locationCount + factionCount + itemCount + eventCount + conceptCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate Story Universe
          </DialogTitle>
          <DialogDescription>
            AI will generate characters, locations, factions, and relationships based on
            your project&apos;s genre, themes, and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Characters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Characters
              </Label>
              <span className="text-sm text-muted-foreground">{characterCount}</span>
            </div>
            <Slider
              value={[characterCount]}
              onValueChange={([v]: number[]) => setCharacterCount(v)}
              min={2}
              max={12}
              step={1}
            />
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                Locations
              </Label>
              <span className="text-sm text-muted-foreground">{locationCount}</span>
            </div>
            <Slider
              value={[locationCount]}
              onValueChange={([v]: number[]) => setLocationCount(v)}
              min={1}
              max={8}
              step={1}
            />
          </div>

          {/* Factions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-red-500" />
                Factions
              </Label>
              <span className="text-sm text-muted-foreground">{factionCount}</span>
            </div>
            <Slider
              value={[factionCount]}
              onValueChange={([v]: number[]) => setFactionCount(v)}
              min={0}
              max={6}
              step={1}
            />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                Items
              </Label>
              <span className="text-sm text-muted-foreground">{itemCount}</span>
            </div>
            <Slider
              value={[itemCount]}
              onValueChange={([v]: number[]) => setItemCount(v)}
              min={0}
              max={6}
              step={1}
            />
          </div>

          {/* Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                Events (Backstory)
              </Label>
              <span className="text-sm text-muted-foreground">{eventCount}</span>
            </div>
            <Slider
              value={[eventCount]}
              onValueChange={([v]: number[]) => setEventCount(v)}
              min={0}
              max={6}
              step={1}
            />
          </div>

          {/* Concepts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-cyan-500" />
                Concepts (World-building)
              </Label>
              <span className="text-sm text-muted-foreground">{conceptCount}</span>
            </div>
            <Slider
              value={[conceptCount]}
              onValueChange={([v]: number[]) => setConceptCount(v)}
              min={0}
              max={4}
              step={1}
            />
          </div>

          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p>
              <strong>Total elements:</strong> {totalElements}
            </p>
            <p className="mt-1">
              AI will also generate relationships between these elements based on the
              story&apos;s needs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || totalElements < 3}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Universe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
