"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderKanban, Loader2, Sparkles, Globe, Clock } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";
import { onboardingAnalytics } from "@/lib/analytics/onboarding";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type ProjectSubStep = "project_intro" | "project_form" | "world_bible";

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery/Thriller",
  "Romance",
  "Horror",
  "Literary Fiction",
  "Historical Fiction",
  "Young Adult",
  "Other",
];

interface ProjectCreationStepsProps {
  onComplete: () => void;
}

export function ProjectCreationSteps({ onComplete }: ProjectCreationStepsProps) {
  const { currentStep, setStep, setCreatedProjectId } = useOnboarding();
  const [subStep, setSubStep] = useState<ProjectSubStep>(() => {
    if (currentStep === "project_form" || currentStep === "world_bible") {
      return currentStep as ProjectSubStep;
    }
    return "project_intro";
  });

  // Form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [worldSetting, setWorldSetting] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingWorld, setIsSavingWorld] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleStartCreation = async () => {
    await setStep("project_form");
    setSubStep("project_form");
  };

  const handleCreateProject = async () => {
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre: genre || null,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create project");
        return;
      }

      setProjectId(data.id);
      setCreatedProjectId(data.id);
      onboardingAnalytics.projectCreated(genre || "none", false);

      await setStep("world_bible");
      setSubStep("world_bible");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveWorldBible = async () => {
    if (!projectId) return;

    setIsSavingWorld(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("projects")
        .update({
          world_setting: worldSetting.trim() || null,
          time_period: timePeriod.trim() || null,
        })
        .eq("id", projectId);

      if (error) {
        console.error("Error saving world bible:", error);
        toast.error("Failed to save world bible");
        return;
      }

      onboardingAnalytics.projectCreated(
        genre || "none",
        !!(worldSetting.trim() || timePeriod.trim())
      );

      toast.success("Project created!");
      onComplete();
    } catch (error) {
      console.error("Error saving world bible:", error);
      toast.error("Failed to save world bible");
    } finally {
      setIsSavingWorld(false);
    }
  };

  const handleSkipWorldBible = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col items-center px-6 py-8">
      {subStep === "project_intro" && (
        <ProjectIntroScreen onNext={handleStartCreation} />
      )}
      {subStep === "project_form" && (
        <ProjectFormScreen
          title={title}
          genre={genre}
          description={description}
          isCreating={isCreating}
          onTitleChange={setTitle}
          onGenreChange={setGenre}
          onDescriptionChange={setDescription}
          onCreate={handleCreateProject}
        />
      )}
      {subStep === "world_bible" && (
        <WorldBibleScreen
          worldSetting={worldSetting}
          timePeriod={timePeriod}
          isSaving={isSavingWorld}
          onWorldSettingChange={setWorldSetting}
          onTimePeriodChange={setTimePeriod}
          onSave={handleSaveWorldBible}
          onSkip={handleSkipWorldBible}
        />
      )}
    </div>
  );
}

// Step 3.1: Project Concept Explanation
function ProjectIntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <FolderKanban className="h-10 w-10 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="mb-3 text-2xl font-bold">Create Your Story Universe</h2>

      {/* Body */}
      <p className="mb-6 text-muted-foreground">
        A <span className="font-medium text-foreground">Project</span> is your
        story&apos;s home—containing all characters, locations, lore, and books in
        one connected universe.
      </p>

      {/* Examples */}
      <p className="mb-8 text-sm text-muted-foreground">
        Examples: &quot;The Dragonfire Chronicles&quot;, &quot;Detective Noir Series&quot;,
        &quot;Sci-Fi Anthology&quot;
      </p>

      {/* CTA */}
      <Button size="lg" onClick={onNext}>
        <Sparkles className="mr-2 h-4 w-4" />
        Create My First Project
      </Button>
    </div>
  );
}

// Step 3.2: Project Creation Form
function ProjectFormScreen({
  title,
  genre,
  description,
  isCreating,
  onTitleChange,
  onGenreChange,
  onDescriptionChange,
  onCreate,
}: {
  title: string;
  genre: string;
  description: string;
  isCreating: boolean;
  onTitleChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-6 text-center text-2xl font-bold">Name Your Universe</h2>

      {/* Form */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="project-title">Project Title</Label>
          <Input
            id="project-title"
            placeholder="e.g., The Midnight Saga"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This is the name of your story universe, not a single book
          </p>
        </div>

        {/* Genre */}
        <div className="space-y-2">
          <Label htmlFor="project-genre">Primary Genre</Label>
          <Select value={genre} onValueChange={onGenreChange}>
            <SelectTrigger id="project-genre">
              <SelectValue placeholder="Select a genre" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="project-description">Brief Description (optional)</Label>
          <Textarea
            id="project-description"
            placeholder="A dark fantasy world where magic comes at a terrible cost..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
          />
          <p className="text-right text-sm text-muted-foreground">
            {description.length}/500
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        onClick={onCreate}
        disabled={!title.trim() || isCreating}
        className="mt-6"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Project"
        )}
      </Button>
    </div>
  );
}

// Step 3.4: World Bible Quick Setup
function WorldBibleScreen({
  worldSetting,
  timePeriod,
  isSaving,
  onWorldSettingChange,
  onTimePeriodChange,
  onSave,
  onSkip,
}: {
  worldSetting: string;
  timePeriod: string;
  isSaving: boolean;
  onWorldSettingChange: (value: string) => void;
  onTimePeriodChange: (value: string) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Headline */}
      <h2 className="mb-2 text-center text-2xl font-bold">Set the Stage</h2>
      <p className="mb-6 text-center text-muted-foreground">
        These details help AI understand your world. You can update anytime.
      </p>

      {/* Form */}
      <div className="space-y-4">
        {/* World Setting */}
        <div className="space-y-2">
          <Label htmlFor="world-setting" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            World Setting
          </Label>
          <Textarea
            id="world-setting"
            placeholder="e.g., A medieval fantasy realm, Modern-day New York, A generation ship in deep space"
            value={worldSetting}
            onChange={(e) => onWorldSettingChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Time Period */}
        <div className="space-y-2">
          <Label htmlFor="time-period" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Period
          </Label>
          <Input
            id="time-period"
            placeholder="e.g., 1920s, Far future, Alternate Victorian era"
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value)}
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onSkip}
          disabled={isSaving}
          className="flex-1"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
