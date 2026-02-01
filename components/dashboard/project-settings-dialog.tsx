"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Project } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TagsInput } from "@/components/ui/tags-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Loader2 } from "lucide-react";
import {
  TARGET_AUDIENCES,
  SERIES_TYPES,
  CONTENT_RATINGS,
} from "@/lib/story-universe-schema";

interface ProjectSettingsDialogProps {
  project: Project;
}

export function ProjectSettingsDialog({ project }: ProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Project with extended metadata
  const projectWithMetadata = project as Project & {
    subgenres?: string[] | null;
    target_audience?: string | null;
    content_rating?: string | null;
    narrative_conventions?: string[] | null;
    series_type?: string | null;
    planned_books?: number | null;
  };

  // Basic info
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [genre, setGenre] = useState(project.genre || "");
  const [subgenres, setSubgenres] = useState<string[]>(projectWithMetadata.subgenres || []);

  // World building
  const [worldSetting, setWorldSetting] = useState(project.world_setting || "");
  const [worldDescription, setWorldDescription] = useState(project.world_description || "");
  const [timePeriod, setTimePeriod] = useState(project.time_period || "");
  const [themes, setThemes] = useState<string[]>(project.themes || []);

  // Series settings
  const [seriesType, setSeriesType] = useState(projectWithMetadata.series_type || "");
  const [plannedBooks, setPlannedBooks] = useState(projectWithMetadata.planned_books?.toString() || "");
  const [targetAudience, setTargetAudience] = useState(projectWithMetadata.target_audience || "");
  const [contentRating, setContentRating] = useState(projectWithMetadata.content_rating || "");
  const [narrativeConventions, setNarrativeConventions] = useState<string[]>(
    projectWithMetadata.narrative_conventions || []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          description: description || null,
          genre: genre || null,
          subgenres: subgenres.length > 0 ? subgenres : null,
          world_setting: worldSetting || null,
          world_description: worldDescription || null,
          time_period: timePeriod || null,
          themes: themes.length > 0 ? themes : null,
          series_type: seriesType || null,
          planned_books: plannedBooks ? parseInt(plannedBooks) : null,
          target_audience: targetAudience || null,
          content_rating: contentRating || null,
          narrative_conventions: narrativeConventions.length > 0 ? narrativeConventions : null,
        })
        .eq("id", project.id);

      if (error) throw error;

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving series settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Series Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Series Settings</DialogTitle>
          <DialogDescription>
            Configure your story universe and series settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="world">World</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 py-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="title">Series Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your series..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Primary Genre</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g., Fantasy, Science Fiction, Mystery..."
                />
              </div>

              <div className="space-y-2">
                <Label>Subgenres</Label>
                <TagsInput
                  value={subgenres}
                  onChange={setSubgenres}
                  placeholder="Add subgenres..."
                />
                <p className="text-xs text-muted-foreground">
                  e.g., Epic Fantasy, Cozy Mystery, Space Opera
                </p>
              </div>
            </TabsContent>

            {/* World Building */}
            <TabsContent value="world" className="space-y-4 py-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="worldSetting">World Setting</Label>
                <Input
                  id="worldSetting"
                  value={worldSetting}
                  onChange={(e) => setWorldSetting(e.target.value)}
                  placeholder="e.g., Medieval Europe, Far-future space colony..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="worldDescription">World Description</Label>
                <Textarea
                  id="worldDescription"
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  placeholder="Describe your world in detail. This is used as context for AI generation..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  This description is included in every AI generation request.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timePeriod">Time Period</Label>
                <Input
                  id="timePeriod"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  placeholder="e.g., 1920s, Year 3000, The Third Age..."
                />
              </div>

              <div className="space-y-2">
                <Label>Themes</Label>
                <TagsInput
                  value={themes}
                  onChange={setThemes}
                  placeholder="Add themes..."
                />
                <p className="text-xs text-muted-foreground">
                  e.g., Redemption, Power, Identity, Love, Sacrifice
                </p>
              </div>
            </TabsContent>

            {/* Series Settings */}
            <TabsContent value="series" className="space-y-4 py-4 mt-0">
              <div className="space-y-2">
                <Label>Series Type</Label>
                <Select value={seriesType} onValueChange={setSeriesType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select series type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {SERIES_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {seriesType && seriesType !== "standalone" && (
                <div className="space-y-2">
                  <Label htmlFor="plannedBooks">Planned Number of Books</Label>
                  <Input
                    id="plannedBooks"
                    type="number"
                    value={plannedBooks}
                    onChange={(e) => setPlannedBooks(e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
                    {TARGET_AUDIENCES.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        <div className="flex flex-col">
                          <span>{audience.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {audience.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Rating</Label>
                <Select value={contentRating} onValueChange={setContentRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not specified</SelectItem>
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
                <Label>Narrative Conventions</Label>
                <TagsInput
                  value={narrativeConventions}
                  onChange={setNarrativeConventions}
                  placeholder="Add conventions..."
                />
                <p className="text-xs text-muted-foreground">
                  Rules for your story. e.g., &quot;No deus ex machina&quot;, &quot;Characters can die&quot;, &quot;Magic has costs&quot;
                </p>
              </div>

              <div className="rounded-md border p-3 bg-muted/50 mt-4">
                <p className="text-sm font-medium">How these are used</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Series settings apply to all books in this project and guide
                  AI generation to maintain consistency across your entire story
                  universe.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
