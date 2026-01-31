"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Loader2, PenTool, Sparkles } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";
import { SuccessAnimation } from "./SuccessAnimation";
import { onboardingAnalytics } from "@/lib/analytics/onboarding";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type BookSubStep =
  | "book_creation"
  | "style_sheet"
  | "scene_setup"
  | "first_generation";

const POV_OPTIONS = [
  { value: "first_person", label: "First Person" },
  { value: "third_limited", label: "Third Person Limited" },
  { value: "third_omniscient", label: "Third Person Omniscient" },
  { value: "second_person", label: "Second Person" },
  { value: "multiple_pov", label: "Multiple POV" },
];

const TENSE_OPTIONS = [
  { value: "past", label: "Past Tense" },
  { value: "present", label: "Present Tense" },
];

const TONE_OPTIONS = [
  "Dark",
  "Hopeful",
  "Comedic",
  "Suspenseful",
  "Romantic",
  "Epic",
  "Intimate",
];

interface FirstBookStepsProps {
  onComplete: () => void;
}

export function FirstBookSteps({ onComplete }: FirstBookStepsProps) {
  const router = useRouter();
  const {
    currentStep,
    setStep,
    createdProjectId,
    setCreatedBookId,
    completeOnboarding,
  } = useOnboarding();

  const [subStep, setSubStep] = useState<BookSubStep>(() => {
    const validSteps: BookSubStep[] = [
      "book_creation",
      "style_sheet",
      "scene_setup",
      "first_generation",
    ];
    if (validSteps.includes(currentStep as BookSubStep)) {
      return currentStep as BookSubStep;
    }
    return "book_creation";
  });

  // Book state
  const [bookTitle, setBookTitle] = useState("");
  const [bookSubtitle, setBookSubtitle] = useState("");
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);

  // Style state
  const [pov, setPov] = useState("third_limited");
  const [tense, setTense] = useState("past");
  const [tone, setTone] = useState("Dark");
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  // Scene state
  const [sceneTitle, setSceneTitle] = useState("");
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCreateBook = async () => {
    if (!bookTitle.trim() || !createdProjectId) {
      toast.error("Please enter a book title");
      return;
    }

    setIsCreatingBook(true);
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle.trim(),
          subtitle: bookSubtitle.trim() || null,
          project_id: createdProjectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create book");
        return;
      }

      setBookId(data.id);
      setCreatedBookId(data.id);

      await setStep("style_sheet");
      setSubStep("style_sheet");
    } catch (error) {
      console.error("Error creating book:", error);
      toast.error("Failed to create book");
    } finally {
      setIsCreatingBook(false);
    }
  };

  const handleSaveStyle = async () => {
    if (!bookId) return;

    setIsSavingStyle(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("books")
        .update({
          pov_style: pov,
          tense: tense,
          tone: [tone],
        })
        .eq("id", bookId);

      if (error) {
        console.error("Error saving style:", error);
        toast.error("Failed to save style");
        return;
      }

      await setStep("scene_setup");
      setSubStep("scene_setup");
    } catch (error) {
      console.error("Error saving style:", error);
      toast.error("Failed to save style");
    } finally {
      setIsSavingStyle(false);
    }
  };

  const handleCreateScene = async () => {
    if (!bookId || !createdProjectId) return;

    setIsCreatingScene(true);
    try {
      const supabase = createClient();

      // Create Chapter 1
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          title: "Chapter 1",
          book_id: bookId,
          order_index: 0,
        })
        .select()
        .single();

      if (chapterError) {
        console.error("Error creating chapter:", chapterError);
        toast.error("Failed to create chapter");
        return;
      }

      setChapterId(chapterData.id);

      // Create Scene 1
      const { data: sceneData, error: sceneError } = await supabase
        .from("scenes")
        .insert({
          title: sceneTitle.trim() || "Opening Scene",
          chapter_id: chapterData.id,
          order_index: 0,
        })
        .select()
        .single();

      if (sceneError) {
        console.error("Error creating scene:", sceneError);
        toast.error("Failed to create scene");
        return;
      }

      setSceneId(sceneData.id);

      await setStep("first_generation");
      setSubStep("first_generation");
    } catch (error) {
      console.error("Error creating scene:", error);
      toast.error("Failed to create scene");
    } finally {
      setIsCreatingScene(false);
    }
  };

  const handleFinish = async () => {
    setShowCelebration(true);

    // Track completion
    onboardingAnalytics.firstGeneration("", "", 0);

    // Complete onboarding
    await completeOnboarding();

    // Wait for animation
    setTimeout(() => {
      toast.success("Welcome to NovelWorld! Start writing your story.");

      // Navigate to the scene editor
      if (createdProjectId && bookId && sceneId) {
        router.push(
          `/dashboard/projects/${createdProjectId}/books/${bookId}/editor/${sceneId}`
        );
      } else {
        router.push("/dashboard");
      }

      onComplete();
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center px-6 py-8">
      {subStep === "book_creation" && (
        <BookCreationScreen
          title={bookTitle}
          subtitle={bookSubtitle}
          isCreating={isCreatingBook}
          onTitleChange={setBookTitle}
          onSubtitleChange={setBookSubtitle}
          onCreate={handleCreateBook}
        />
      )}
      {subStep === "style_sheet" && (
        <StyleSheetScreen
          pov={pov}
          tense={tense}
          tone={tone}
          isSaving={isSavingStyle}
          onPovChange={setPov}
          onTenseChange={setTense}
          onToneChange={setTone}
          onSave={handleSaveStyle}
        />
      )}
      {subStep === "scene_setup" && (
        <SceneSetupScreen
          sceneTitle={sceneTitle}
          isCreating={isCreatingScene}
          onTitleChange={setSceneTitle}
          onCreate={handleCreateScene}
        />
      )}
      {subStep === "first_generation" && (
        <FirstGenerationScreen
          showCelebration={showCelebration}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}

// Step 5.1: Book Creation
function BookCreationScreen({
  title,
  subtitle,
  isCreating,
  onTitleChange,
  onSubtitleChange,
  onCreate,
}: {
  title: string;
  subtitle: string;
  isCreating: boolean;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold">Start Your First Book</h2>
      <p className="mb-6 text-center text-muted-foreground">
        A book lives within your project and uses all the characters and
        locations you&apos;ve created.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="book-title">Book Title</Label>
          <Input
            id="book-title"
            placeholder="e.g., The Awakening"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="book-subtitle">Subtitle (optional)</Label>
          <Input
            id="book-subtitle"
            placeholder="e.g., Book One of the Dragonfire Chronicles"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
          />
        </div>
      </div>

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
          "Create Book"
        )}
      </Button>
    </div>
  );
}

// Step 5.2: Style Sheet
function StyleSheetScreen({
  pov,
  tense,
  tone,
  isSaving,
  onPovChange,
  onTenseChange,
  onToneChange,
  onSave,
}: {
  pov: string;
  tense: string;
  tone: string;
  isSaving: boolean;
  onPovChange: (v: string) => void;
  onTenseChange: (v: string) => void;
  onToneChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      <h2 className="mb-2 text-center text-2xl font-bold">Set Your Writing Style</h2>
      <p className="mb-6 text-center text-muted-foreground">
        These preferences guide AI when generating prose for this book.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pov">Point of View</Label>
          <Select value={pov} onValueChange={onPovChange}>
            <SelectTrigger id="pov">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POV_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tense">Tense</Label>
          <Select value={tense} onValueChange={onTenseChange}>
            <SelectTrigger id="tense">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TENSE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Primary Tone</Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        You can adjust these anytime in Book Settings
      </p>

      <Button size="lg" onClick={onSave} disabled={isSaving} className="mt-6">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save & Continue"
        )}
      </Button>
    </div>
  );
}

// Step 5.3: Scene Setup
function SceneSetupScreen({
  sceneTitle,
  isCreating,
  onTitleChange,
  onCreate,
}: {
  sceneTitle: string;
  isCreating: boolean;
  onTitleChange: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col animate-in fade-in-0 slide-in-from-right-4 duration-500">
      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <PenTool className="h-10 w-10 text-primary" />
        </div>
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold">Write Your Opening Scene</h2>
      <p className="mb-6 text-center text-muted-foreground">
        NovelWorld uses a &quot;beats to prose&quot; workflow. You write what happens,
        AI expands it into polished prose.
      </p>

      <div className="mb-6 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          We&apos;ll automatically create <strong>Chapter 1</strong> and your first
          scene. You can start writing right away!
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scene-title">Scene Title (optional)</Label>
        <Input
          id="scene-title"
          placeholder="e.g., The Discovery"
          value={sceneTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <Button size="lg" onClick={onCreate} disabled={isCreating} className="mt-6">
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Open Scene Editor"
        )}
      </Button>
    </div>
  );
}

// Step 5.5: First Generation / Celebration
function FirstGenerationScreen({
  showCelebration,
  onFinish,
}: {
  showCelebration: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="flex max-w-lg flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-500">
      {showCelebration ? (
        <SuccessAnimation show={true} />
      ) : (
        <>
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>

          <h2 className="mb-3 text-2xl font-bold">You&apos;re All Set!</h2>

          <p className="mb-6 text-muted-foreground">
            Your story universe is ready. Head to the scene editor to start
            writing your first beats and generating AI prose that knows your
            characters and world.
          </p>

          <div className="mb-8 rounded-lg bg-muted/50 p-4 text-left">
            <p className="mb-2 text-sm font-medium">What&apos;s next:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Write beat instructions describing what happens</li>
              <li>Click &quot;Generate Prose&quot; to create AI-powered text</li>
              <li>Edit and refine your prose</li>
              <li>Add more characters, locations, and scenes</li>
            </ul>
          </div>

          <Button size="lg" onClick={onFinish}>
            <Sparkles className="mr-2 h-4 w-4" />
            Start Writing
          </Button>
        </>
      )}

      {showCelebration && (
        <div className="mt-6">
          <h2 className="mb-2 text-2xl font-bold">You Did It!</h2>
          <p className="text-muted-foreground">
            You&apos;ve just set up your story universe. Welcome to NovelWorld!
          </p>
        </div>
      )}
    </div>
  );
}
