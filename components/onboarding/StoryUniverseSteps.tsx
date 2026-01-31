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
import { Network, User, MapPin, Link2, Loader2, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./OnboardingProvider";
import { onboardingAnalytics } from "@/lib/analytics/onboarding";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type UniverseSubStep =
  | "graph_intro"
  | "create_character"
  | "create_location"
  | "create_relationship"
  | "graph_reveal";

const RELATIONSHIP_TYPES = [
  { value: "lives_in", label: "Lives in" },
  { value: "works_at", label: "Works at" },
  { value: "born_in", label: "Born in" },
  { value: "visits", label: "Visits" },
  { value: "owns", label: "Owns" },
  { value: "imprisoned_in", label: "Imprisoned in" },
  { value: "other", label: "Other" },
];

const LOCATION_TYPES = ["City", "Building", "Wilderness", "Vehicle", "Other"];

interface StoryUniverseStepsProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function StoryUniverseSteps({ onComplete, onSkip }: StoryUniverseStepsProps) {
  const {
    currentStep,
    setStep,
    createdProjectId,
    setCreatedCharacterId,
    setCreatedLocationId,
  } = useOnboarding();

  const [subStep, setSubStep] = useState<UniverseSubStep>(() => {
    const validSteps: UniverseSubStep[] = [
      "graph_intro",
      "create_character",
      "create_location",
      "create_relationship",
      "graph_reveal",
    ];
    if (validSteps.includes(currentStep as UniverseSubStep)) {
      return currentStep as UniverseSubStep;
    }
    return "graph_intro";
  });

  // Character state
  const [characterName, setCharacterName] = useState("");
  const [characterRole, setCharacterRole] = useState("");
  const [characterTraits, setCharacterTraits] = useState("");
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [characterId, setCharacterId] = useState<string | null>(null);

  // Location state
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);

  // Relationship state
  const [relationshipType, setRelationshipType] = useState("");
  const [relationshipContext, setRelationshipContext] = useState("");
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false);

  const handleGraphIntroComplete = async () => {
    await setStep("create_character");
    setSubStep("create_character");
  };

  const handleSkipUniverse = () => {
    // Skip the entire universe creation and move to book phase
    onSkip?.() || onComplete();
  };

  const handleCreateCharacter = async () => {
    if (!characterName.trim() || !createdProjectId) {
      toast.error("Please enter a character name");
      return;
    }

    setIsCreatingCharacter(true);
    try {
      const response = await fetch("/api/story-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: characterName.trim(),
          description: characterRole.trim() || null,
          node_type: "character",
          project_id: createdProjectId,
          position_x: 200,
          position_y: 200,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create character");
        return;
      }

      // Update with attributes
      if (characterRole || characterTraits) {
        const supabase = createClient();
        await supabase
          .from("story_nodes")
          .update({
            attributes: {
              role: characterRole.trim() || null,
              traits: characterTraits.trim() || null,
            },
          })
          .eq("id", data.id);
      }

      setCharacterId(data.id);
      setCreatedCharacterId(data.id);
      onboardingAnalytics.nodeCreated("character");

      toast.success("Character created!");
      await setStep("create_location");
      setSubStep("create_location");
    } catch (error) {
      console.error("Error creating character:", error);
      toast.error("Failed to create character");
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!locationName.trim() || !createdProjectId) {
      toast.error("Please enter a location name");
      return;
    }

    setIsCreatingLocation(true);
    try {
      const response = await fetch("/api/story-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationName.trim(),
          description: locationDescription.trim() || null,
          node_type: "location",
          project_id: createdProjectId,
          position_x: 500,
          position_y: 200,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create location");
        return;
      }

      // Update with attributes
      if (locationType) {
        const supabase = createClient();
        await supabase
          .from("story_nodes")
          .update({
            attributes: {
              type: locationType,
            },
          })
          .eq("id", data.id);
      }

      setLocationId(data.id);
      setCreatedLocationId(data.id);
      onboardingAnalytics.nodeCreated("location");

      toast.success("Location created!");
      await setStep("create_relationship");
      setSubStep("create_relationship");
    } catch (error) {
      console.error("Error creating location:", error);
      toast.error("Failed to create location");
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const handleCreateRelationship = async () => {
    if (!relationshipType || !characterId || !locationId || !createdProjectId) {
      toast.error("Please select a relationship type");
      return;
    }

    setIsCreatingRelationship(true);
    try {
      const supabase = createClient();
      const selectedType = RELATIONSHIP_TYPES.find((t) => t.value === relationshipType);

      const { error } = await supabase.from("story_edges").insert({
        project_id: createdProjectId,
        source_node_id: characterId,
        target_node_id: locationId,
        relationship_type: relationshipType,
        label: selectedType?.label || relationshipType,
        description: relationshipContext.trim() || null,
        is_bidirectional: false,
      });

      if (error) throw error;

      onboardingAnalytics.edgeCreated(relationshipType);

      toast.success("Connection created!");
      await setStep("graph_reveal");
      setSubStep("graph_reveal");
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create connection");
    } finally {
      setIsCreatingRelationship(false);
    }
  };

  const handleGraphRevealComplete = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col items-center px-6 py-8">
      {subStep === "graph_intro" && (
        <GraphIntroScreen onNext={handleGraphIntroComplete} />
      )}
      {subStep === "create_character" && (
        <CreateCharacterScreen
          name={characterName}
          role={characterRole}
          traits={characterTraits}
          isCreating={isCreatingCharacter}
          onNameChange={setCharacterName}
          onRoleChange={setCharacterRole}
          onTraitsChange={setCharacterTraits}
          onCreate={handleCreateCharacter}
          onSkip={handleSkipUniverse}
        />
      )}
      {subStep === "create_location" && (
        <CreateLocationScreen
          name={locationName}
          type={locationType}
          description={locationDescription}
          isCreating={isCreatingLocation}
          onNameChange={setLocationName}
          onTypeChange={setLocationType}
          onDescriptionChange={setLocationDescription}
          onCreate={handleCreateLocation}
        />
      )}
      {subStep === "create_relationship" && (
        <CreateRelationshipScreen
          characterName={characterName}
          locationName={locationName}
          relationshipType={relationshipType}
          context={relationshipContext}
          isCreating={isCreatingRelationship}
          onTypeChange={setRelationshipType}
          onContextChange={setRelationshipContext}
          onCreate={handleCreateRelationship}
        />
      )}
      {subStep === "graph_reveal" && (
        <GraphRevealScreen
          characterName={characterName}
          locationName={locationName}
          relationshipType={relationshipType}
          onContinue={handleGraphRevealComplete}
        />
      )}
    </div>
  );
}

// Step 4.1: Graph Concept
function GraphIntroScreen({ onNext }: { onNext: () => void }) {
  const benefits = [
    "AI uses this graph for every generation",
    "Never re-explain your world",
    "Track changes across your series",
  ];

  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Network className="h-10 w-10 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="mb-3 text-2xl font-bold">Meet Your Story Graph</h2>

      {/* Body */}
      <p className="mb-6 text-muted-foreground">
        Your Story Universe is a{" "}
        <span className="font-medium text-foreground">knowledge graph</span>—a
        visual map of everything in your story. Characters connect to locations,
        events link to characters, and relationships evolve across books.
      </p>

      {/* Benefits */}
      <div className="mb-8 space-y-3 text-left">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-muted-foreground">{benefit}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button size="lg" onClick={onNext}>
        <User className="mr-2 h-4 w-4" />
        Create My First Character
      </Button>
    </div>
  );
}

// Step 4.2: Create Character
function CreateCharacterScreen({
  name,
  role,
  traits,
  isCreating,
  onNameChange,
  onRoleChange,
  onTraitsChange,
  onCreate,
  onSkip,
}: {
  name: string;
  role: string;
  traits: string;
  isCreating: boolean;
  onNameChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onTraitsChange: (v: string) => void;
  onCreate: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      <h2 className="mb-2 text-center text-2xl font-bold">Create Your Protagonist</h2>
      <p className="mb-6 text-center text-muted-foreground">
        Start with your main character. You can add as much or as little detail
        as you want.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="char-name">Character Name</Label>
          <Input
            id="char-name"
            placeholder="e.g., Elena Blackwood"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="char-role">Role in Story</Label>
          <Input
            id="char-role"
            placeholder="e.g., Reluctant hero, Kingdom's last hope"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="char-traits">Key Traits (optional)</Label>
          <Textarea
            id="char-traits"
            placeholder="e.g., Stubborn, loyal, haunted by past"
            value={traits}
            onChange={(e) => onTraitsChange(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        You can add detailed attributes like appearance, backstory, and
        relationships later
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          onClick={onCreate}
          disabled={!name.trim() || isCreating}
          className="w-full sm:w-auto"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Character"
          )}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onSkip}
          disabled={isCreating}
          className="w-full sm:w-auto"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}

// Step 4.3: Create Location
function CreateLocationScreen({
  name,
  type,
  description,
  isCreating,
  onNameChange,
  onTypeChange,
  onDescriptionChange,
  onCreate,
}: {
  name: string;
  type: string;
  description: string;
  isCreating: boolean;
  onNameChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      <h2 className="mb-2 text-center text-2xl font-bold">
        Where Does Your Story Begin?
      </h2>
      <p className="mb-6 text-center text-muted-foreground">
        Add a key location from your story.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="loc-name">Location Name</Label>
          <Input
            id="loc-name"
            placeholder="e.g., The Crimson Tower, Harborview Café"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc-type">Location Type</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger id="loc-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc-desc">Brief Description (optional)</Label>
          <Textarea
            id="loc-desc"
            placeholder="e.g., An ancient fortress overlooking the sea..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <Button
        size="lg"
        onClick={onCreate}
        disabled={!name.trim() || isCreating}
        className="mt-6"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Location"
        )}
      </Button>
    </div>
  );
}

// Step 4.4: Create Relationship
function CreateRelationshipScreen({
  characterName,
  locationName,
  relationshipType,
  context,
  isCreating,
  onTypeChange,
  onContextChange,
  onCreate,
}: {
  characterName: string;
  locationName: string;
  relationshipType: string;
  context: string;
  isCreating: boolean;
  onTypeChange: (v: string) => void;
  onContextChange: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      <h2 className="mb-2 text-center text-2xl font-bold">Connect the Dots</h2>
      <p className="mb-6 text-center text-muted-foreground">
        Relationships are what make your Story Universe powerful. Let&apos;s
        connect your character to your location.
      </p>

      {/* Visual */}
      <div className="mb-6 flex items-center justify-center gap-4 rounded-lg bg-muted/50 p-4">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <User className="h-6 w-6 text-primary" />
          </div>
          <span className="mt-2 text-sm font-medium">{characterName}</span>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <span className="mt-2 text-sm font-medium">{locationName}</span>
        </div>
      </div>

      <p className="mb-4 text-center text-muted-foreground">
        How is <span className="font-medium text-foreground">{characterName}</span>{" "}
        connected to <span className="font-medium text-foreground">{locationName}</span>?
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rel-type">Relationship Type</Label>
          <Select value={relationshipType} onValueChange={onTypeChange}>
            <SelectTrigger id="rel-type">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rel-context">Additional Context (optional)</Label>
          <Input
            id="rel-context"
            placeholder="e.g., Has lived here for 10 years, Visits secretly at night"
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
          />
        </div>
      </div>

      <Button
        size="lg"
        onClick={onCreate}
        disabled={!relationshipType || isCreating}
        className="mt-6"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Link2 className="mr-2 h-4 w-4" />
            Create Connection
          </>
        )}
      </Button>
    </div>
  );
}

// Step 4.5: Graph Reveal
function GraphRevealScreen({
  characterName,
  locationName,
  relationshipType,
  onContinue,
}: {
  characterName: string;
  locationName: string;
  relationshipType: string;
  onContinue: () => void;
}) {
  const selectedType = RELATIONSHIP_TYPES.find((t) => t.value === relationshipType);

  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-500">
      {/* Success Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>

      {/* Headline */}
      <h2 className="mb-3 text-2xl font-bold">Your Story Universe is Born!</h2>

      {/* Body */}
      <p className="mb-6 text-muted-foreground">
        This is the beginning of your knowledge graph. As you add more
        characters, locations, and events, your universe will grow.
      </p>

      {/* Mini Graph Preview */}
      <div className="mb-6 flex items-center justify-center gap-4 rounded-lg border bg-card p-6">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="mt-2 text-sm font-medium">{characterName}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-0.5 w-16 bg-primary" />
          <span className="mt-1 text-xs text-muted-foreground">
            {selectedType?.label || relationshipType}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <MapPin className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <span className="mt-2 text-sm font-medium">{locationName}</span>
        </div>
      </div>

      {/* Stats */}
      <p className="mb-8 text-sm text-muted-foreground">
        2 nodes • 1 relationship
      </p>

      {/* CTA */}
      <Button size="lg" onClick={onContinue}>
        Create My First Book
      </Button>
    </div>
  );
}
