"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Users, MapPin, Swords, Package, Calendar, Lightbulb, Crown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { conversionAnalytics } from "@/lib/analytics/conversion";
import { trackEvent } from "@/lib/analytics/events";

interface GenerateUniverseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const FREE_TIER_LIMIT = 15;

export function GenerateUniverseDialog({
  open,
  onOpenChange,
  projectId,
}: GenerateUniverseDialogProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [currentNodeCount, setCurrentNodeCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">("free");

  // Generation options
  const [characterCount, setCharacterCount] = useState(6);
  const [locationCount, setLocationCount] = useState(4);
  const [factionCount, setFactionCount] = useState(2);
  const [itemCount, setItemCount] = useState(2);
  const [eventCount, setEventCount] = useState(3);
  const [conceptCount, setConceptCount] = useState(1);

  // Fetch current quota when dialog opens
  useEffect(() => {
    if (open) {
      fetchQuota();
    }
  }, [open, projectId]);

  const fetchQuota = async () => {
    setIsLoadingQuota(true);
    try {
      const supabase = createClient();

      // Get current node count
      const { count } = await supabase
        .from("story_nodes")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Get user's subscription tier
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();

        setSubscriptionTier((profile?.subscription_tier as "free" | "pro") || "free");
      }

      setCurrentNodeCount(count || 0);

      // Track quota check
      conversionAnalytics.quotaChecked(
        "generate_universe",
        count || 0,
        FREE_TIER_LIMIT,
        subscriptionTier
      );
    } catch (error) {
      console.error("Failed to fetch quota:", error);
    } finally {
      setIsLoadingQuota(false);
    }
  };

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
        // Handle tier limit errors
        if (data.error === "tier_limit") {
          conversionAnalytics.tierLimitHit(
            "generate_universe",
            data.currentCount,
            data.limit,
            data.requestedCount
          );
          conversionAnalytics.upgradePromptShown("generate_universe", "limit_hit");

          toast.error(data.message, {
            description: `You have ${data.currentCount}/${data.limit} elements. Upgrade to Pro for unlimited.`,
            duration: 10000,
            action: {
              label: "Upgrade to Pro",
              onClick: () => {
                conversionAnalytics.upgradeClicked("generate_universe", "toast");
                router.push("/dashboard/settings/billing");
              },
            },
          });
          return;
        }

        // Handle provider errors (missing API key, etc.)
        if (data.error === "provider_error") {
          toast.error(data.message, {
            description: "Go to Settings -> AI to configure your API key.",
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

      // Track universe generation
      trackEvent.universeGenerated(projectId, data.nodes, data.edges);

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

  const handleUpgradeClick = () => {
    conversionAnalytics.upgradeClicked("generate_universe", "dialog");
    router.push("/dashboard/settings/billing");
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && remainingQuota <= 0) {
      conversionAnalytics.upgradeDismissed("generate_universe");
    }
    onOpenChange(isOpen);
  };

  const totalElements =
    characterCount + locationCount + factionCount + itemCount + eventCount + conceptCount;

  const remainingQuota = subscriptionTier === "pro" ? Infinity : FREE_TIER_LIMIT - currentNodeCount;
  const isOverQuota = subscriptionTier !== "pro" && totalElements > remainingQuota;
  const isAtLimit = subscriptionTier !== "pro" && remainingQuota <= 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
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

        {/* Quota Warning for Free Tier */}
        {subscriptionTier !== "pro" && !isLoadingQuota && (
          <div className="space-y-2">
            {isAtLimit ? (
              <Alert variant="destructive">
                <Crown className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>You&apos;ve reached the free tier limit ({currentNodeCount}/{FREE_TIER_LIMIT} elements).</span>
                  <Button size="sm" variant="outline" onClick={handleUpgradeClick}>
                    Upgrade to Pro
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isOverQuota ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You can only generate {remainingQuota} more elements ({currentNodeCount}/{FREE_TIER_LIMIT} used).
                  Reduce the count below or <button onClick={handleUpgradeClick} className="underline font-medium">upgrade to Pro</button> for unlimited.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <span className="font-medium">{remainingQuota}</span> elements remaining ({currentNodeCount}/{FREE_TIER_LIMIT} used)
              </div>
            )}
          </div>
        )}

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
              disabled={isAtLimit}
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
              disabled={isAtLimit}
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
              disabled={isAtLimit}
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
              disabled={isAtLimit}
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
              disabled={isAtLimit}
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
              disabled={isAtLimit}
            />
          </div>

          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p>
              <strong>Total elements:</strong> {totalElements}
              {isOverQuota && (
                <span className="text-destructive ml-2">
                  (exceeds remaining quota of {remainingQuota})
                </span>
              )}
            </p>
            <p className="mt-1">
              AI will also generate relationships between these elements based on the
              story&apos;s needs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
          {isAtLimit ? (
            <Button onClick={handleUpgradeClick}>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || totalElements < 3 || isOverQuota || isLoadingQuota}
            >
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
