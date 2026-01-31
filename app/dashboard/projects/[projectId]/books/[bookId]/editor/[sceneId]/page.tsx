import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SceneEditor } from "@/components/editor/scene-editor";
import { StoryUniverseSheet } from "@/components/dashboard/story-universe-sheet";
import { ArrowLeft } from "lucide-react";
import { AIProvider, getDefaultModel } from "@/lib/ai/providers/config";

interface SceneEditorPageProps {
  params: Promise<{
    projectId: string;
    bookId: string;
    sceneId: string;
  }>;
}

export default async function SceneEditorPage({ params }: SceneEditorPageProps) {
  const { projectId, bookId, sceneId } = await params;
  const supabase = await createClient();

  // Fetch scene with chapter info
  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .select(`
      *,
      chapters!inner (
        id,
        title,
        book_id,
        books!inner (
          id,
          title,
          project_id
        )
      )
    `)
    .eq("id", sceneId)
    .single();

  if (sceneError || !scene) {
    notFound();
  }

  // Verify the scene belongs to the correct book/project
  const chapter = scene.chapters as { id: string; title: string; book_id: string; books: { id: string; title: string; project_id: string } };
  if (chapter.book_id !== bookId || chapter.books.project_id !== projectId) {
    notFound();
  }

  // Fetch project for context
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  // Fetch all story nodes for context
  const { data: storyNodes } = await supabase
    .from("story_nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("name");

  // Fetch scene characters (linked nodes)
  const { data: sceneCharacters } = await supabase
    .from("scene_characters")
    .select(`
      *,
      story_nodes (*)
    `)
    .eq("scene_id", sceneId);

  // Fetch user profile for AI settings
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase
    .from("profiles")
    .select(`
      ai_provider,
      ai_default_model,
      ai_api_key_valid,
      ai_model_scene,
      ai_model_edit,
      ai_key_valid_anthropic,
      ai_key_valid_openai,
      ai_key_valid_google
    `)
    .eq("id", user.id)
    .single() : { data: null };

  // Get valid providers (multi-provider support)
  const validProviders: AIProvider[] = [];
  if (profile?.ai_key_valid_anthropic) validProviders.push("anthropic");
  if (profile?.ai_key_valid_openai) validProviders.push("openai");
  if (profile?.ai_key_valid_google) validProviders.push("google");
  // Fallback to legacy single-provider if no multi-provider keys
  if (validProviders.length === 0 && profile?.ai_api_key_valid && profile?.ai_provider) {
    validProviders.push(profile.ai_provider as AIProvider);
  }

  // Get AI settings
  const aiDefaultModel = profile?.ai_default_model || "claude-sonnet-4-20250514";
  const hasValidKey = validProviders.length > 0;
  // Task-specific defaults
  const aiSceneModel = profile?.ai_model_scene || aiDefaultModel;
  const aiEditModel = profile?.ai_model_edit || aiDefaultModel;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/projects/${projectId}/books/${bookId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="hover:text-foreground transition-colors"
            >
              {project?.title || "Project"}
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/projects/${projectId}/books/${bookId}`}
              className="hover:text-foreground transition-colors"
            >
              {chapter.books.title}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {scene.title || `Scene ${scene.order_index}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {(scene.word_count || 0).toLocaleString()} words
          </span>
          <StoryUniverseSheet projectId={projectId} />
        </div>
      </div>

      {/* Editor */}
      <SceneEditor
        scene={scene}
        projectId={projectId}
        storyNodes={storyNodes || []}
        sceneCharacters={sceneCharacters || []}
        validProviders={validProviders}
        aiSceneModel={aiSceneModel}
        aiEditModel={aiEditModel}
        hasValidKey={hasValidKey}
      />
    </div>
  );
}
