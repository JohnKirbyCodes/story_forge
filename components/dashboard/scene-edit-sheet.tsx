"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Scene, StoryNode, SceneCharacter } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, X, Star, Users, MapPin } from "lucide-react";

interface SceneCharacterWithNode extends SceneCharacter {
  story_nodes?: StoryNode;
}

interface SceneEditSheetProps {
  scene: Scene;
  storyNodes: StoryNode[];
  sceneCharacters: SceneCharacterWithNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_OF_DAY_OPTIONS = [
  { value: "dawn", label: "Dawn" },
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "midnight", label: "Midnight" },
];

const MOOD_OPTIONS = [
  { value: "tense", label: "Tense" },
  { value: "romantic", label: "Romantic" },
  { value: "mysterious", label: "Mysterious" },
  { value: "humorous", label: "Humorous" },
  { value: "melancholic", label: "Melancholic" },
  { value: "hopeful", label: "Hopeful" },
  { value: "dramatic", label: "Dramatic" },
  { value: "peaceful", label: "Peaceful" },
  { value: "action", label: "Action" },
  { value: "suspenseful", label: "Suspenseful" },
];

const TENSION_LEVEL_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "climactic", label: "Climactic" },
];

const ROLE_OPTIONS = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "mentioned", label: "Mentioned" },
];

export function SceneEditSheet({
  scene,
  storyNodes,
  sceneCharacters: initialSceneCharacters,
  open,
  onOpenChange,
}: SceneEditSheetProps) {
  const [title, setTitle] = useState(scene.title || "");
  const [beatInstructions, setBeatInstructions] = useState(scene.beat_instructions || "");
  const [timeInStory, setTimeInStory] = useState(scene.time_in_story || "");
  const [timeOfDay, setTimeOfDay] = useState(scene.time_of_day || "");
  const [mood, setMood] = useState(scene.mood || "");
  const [tensionLevel, setTensionLevel] = useState(scene.tension_level || "");
  const [locationId, setLocationId] = useState(scene.location_id || "");
  const [sceneCharacters, setSceneCharacters] = useState<SceneCharacterWithNode[]>(initialSceneCharacters);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Reset form when scene changes
  useEffect(() => {
    setTitle(scene.title || "");
    setBeatInstructions(scene.beat_instructions || "");
    setTimeInStory(scene.time_in_story || "");
    setTimeOfDay(scene.time_of_day || "");
    setMood(scene.mood || "");
    setTensionLevel(scene.tension_level || "");
    setLocationId(scene.location_id || "");
    setSceneCharacters(initialSceneCharacters);
  }, [scene, initialSceneCharacters]);

  // Filter nodes by type
  const characters = storyNodes.filter((n) => n.node_type === "character");
  const locations = storyNodes.filter((n) => n.node_type === "location");

  // Get linked character IDs
  const linkedCharacterIds = new Set(sceneCharacters.map((sc) => sc.node_id));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("scenes")
        .update({
          title: title || null,
          beat_instructions: beatInstructions || null,
          time_in_story: timeInStory || null,
          time_of_day: timeOfDay || null,
          mood: mood || null,
          tension_level: tensionLevel || null,
          location_id: locationId || null,
        })
        .eq("id", scene.id);

      if (error) throw error;

      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving scene:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add character to scene
  const addCharacter = async (nodeId: string) => {
    try {
      const { data, error } = await supabase
        .from("scene_characters")
        .insert({
          scene_id: scene.id,
          character_id: nodeId,
          node_id: nodeId,
          pov: false,
          role_in_scene: "major",
        })
        .select(`*, story_nodes (*)`)
        .single();

      if (error) throw error;
      setSceneCharacters((prev) => [...prev, data as SceneCharacterWithNode]);
    } catch (error) {
      console.error("Error adding character:", error);
    }
  };

  // Remove character from scene
  const removeCharacter = async (sceneCharacterId: string) => {
    try {
      const { error } = await supabase
        .from("scene_characters")
        .delete()
        .eq("id", sceneCharacterId);

      if (error) throw error;
      setSceneCharacters((prev) => prev.filter((sc) => sc.id !== sceneCharacterId));
    } catch (error) {
      console.error("Error removing character:", error);
    }
  };

  // Toggle POV status
  const togglePov = async (sceneCharacterId: string, currentPov: boolean) => {
    try {
      // If setting this as POV, first unset all others
      if (!currentPov) {
        await supabase
          .from("scene_characters")
          .update({ pov: false })
          .eq("scene_id", scene.id);
      }

      const { error } = await supabase
        .from("scene_characters")
        .update({ pov: !currentPov })
        .eq("id", sceneCharacterId);

      if (error) throw error;

      setSceneCharacters((prev) =>
        prev.map((sc) => ({
          ...sc,
          pov: sc.id === sceneCharacterId ? !currentPov : (!currentPov ? false : sc.pov),
        }))
      );
    } catch (error) {
      console.error("Error toggling POV:", error);
    }
  };

  // Update character role
  const updateRole = async (sceneCharacterId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("scene_characters")
        .update({ role_in_scene: role })
        .eq("id", sceneCharacterId);

      if (error) throw error;

      setSceneCharacters((prev) =>
        prev.map((sc) =>
          sc.id === sceneCharacterId ? { ...sc, role_in_scene: role } : sc
        )
      );
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-125 sm:w-160 flex flex-col h-full overflow-hidden">
        <SheetHeader className="shrink-0 px-6">
          <SheetTitle>Edit Scene</SheetTitle>
          <SheetDescription>
            Update scene details, characters, and metadata.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pr-4">
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="scene-title">Title</Label>
              <Input
                id="scene-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scene title (optional)..."
              />
            </div>

            {/* Beat Instructions */}
            <div className="space-y-2">
              <Label htmlFor="beat-instructions">Beat Instructions</Label>
              <Textarea
                id="beat-instructions"
                value={beatInstructions}
                onChange={(e) => setBeatInstructions(e.target.value)}
                placeholder="High-level instructions for this scene..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These instructions guide the AI when generating prose.
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={locationId || "__none__"} onValueChange={(val) => setLocationId(val === "__none__" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time-in-story">Time in Story</Label>
                <Input
                  id="time-in-story"
                  value={timeInStory}
                  onChange={(e) => setTimeInStory(e.target.value)}
                  placeholder="Day 3, Year 1042..."
                />
              </div>
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Select value={timeOfDay || "__none__"} onValueChange={(val) => setTimeOfDay(val === "__none__" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {TIME_OF_DAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mood and Tension */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={mood || "__none__"} onValueChange={(val) => setMood(val === "__none__" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {MOOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tension Level</Label>
                <Select value={tensionLevel || "__none__"} onValueChange={(val) => setTensionLevel(val === "__none__" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {TENSION_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scene Characters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Scene Characters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sceneCharacters.length > 0 ? (
                  <div className="space-y-2">
                    {sceneCharacters.map((sc) => (
                      <div
                        key={sc.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => togglePov(sc.id, !!sc.pov)}
                            className={`p-1 rounded hover:bg-muted transition-colors ${
                              sc.pov ? "text-yellow-500" : "text-muted-foreground"
                            }`}
                            title={sc.pov ? "Remove POV" : "Set as POV"}
                          >
                            <Star className={`h-4 w-4 ${sc.pov ? "fill-current" : ""}`} />
                          </button>
                          <span className="font-medium text-sm">
                            {sc.story_nodes?.name || "Unknown"}
                          </span>
                          {sc.pov && (
                            <Badge variant="default" className="text-xs">POV</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={sc.role_in_scene || "major"}
                            onValueChange={(value) => updateRole(sc.id, value)}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeCharacter(sc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No characters assigned to this scene.
                  </p>
                )}

                {/* Available Characters */}
                {characters.filter((c) => !linkedCharacterIds.has(c.id)).length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Add characters:</p>
                    <div className="flex flex-wrap gap-2">
                      {characters
                        .filter((c) => !linkedCharacterIds.has(c.id))
                        .map((char) => (
                          <Badge
                            key={char.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => addCharacter(char.id)}
                          >
                            + {char.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 mt-auto pt-4 border-t px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
