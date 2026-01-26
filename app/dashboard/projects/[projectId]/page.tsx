import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BooksList } from "@/components/dashboard/books-list";
import { CreateBookDialog } from "@/components/dashboard/create-book-dialog";
import { BookOpen, Settings } from "lucide-react";
import { ProjectSettingsDialog } from "@/components/dashboard/project-settings-dialog";
import { StoryUniverseSheet } from "@/components/dashboard/story-universe-sheet";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  const { data: nodeCount } = await supabase
    .from("story_nodes")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.genre && <Badge variant="secondary">{project.genre}</Badge>}
          </div>
          {project.description && (
            <p className="mt-2 text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ProjectSettingsDialog project={project} />
          <StoryUniverseSheet projectId={projectId} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Story Elements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeCount?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books?.reduce((sum, b) => sum + (b.current_word_count || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="books" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="books">
              <BookOpen className="mr-2 h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <CreateBookDialog projectId={projectId} />
        </div>

        <TabsContent value="books" className="space-y-4">
          <BooksList books={books || []} projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>World Bible</CardTitle>
                  <CardDescription>
                    Core elements of your story universe
                  </CardDescription>
                </div>
                <ProjectSettingsDialog project={project} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">World Setting</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.world_setting || "Not defined yet"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Time Period</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.time_period || "Not defined yet"}
                  </p>
                </div>
              </div>
              {project.world_description && (
                <div>
                  <label className="text-sm font-medium">World Description</label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {project.world_description}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Themes</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {project.themes?.length ? (
                    project.themes.map((theme) => (
                      <Badge key={theme} variant="outline">
                        {theme}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No themes defined
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
