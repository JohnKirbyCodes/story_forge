import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChaptersList } from "@/components/dashboard/chapters-list";
import { CreateChapterDialog } from "@/components/dashboard/create-chapter-dialog";
import { ManuscriptView } from "@/components/dashboard/manuscript-view";
import { ArrowLeft, BookOpen, FileText, Target, List, BookText } from "lucide-react";
import { BookStyleSheet } from "@/components/dashboard/book-style-sheet";
import { StoryUniverseSheet } from "@/components/dashboard/story-universe-sheet";
import { GenerateOutlineDialog } from "@/components/dashboard/generate-outline-dialog";
import { AddSynopsisCard } from "@/components/dashboard/add-synopsis-card";
import { ExportBookButton } from "@/components/dashboard/export-book-button";

interface BookPageProps {
  params: Promise<{
    projectId: string;
    bookId: string;
  }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { projectId, bookId } = await params;
  const supabase = await createClient();

  // Fetch book with chapters, scenes, and scene_characters
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select(`
      *,
      chapters (
        *,
        scenes (
          *,
          scene_characters (
            *,
            story_nodes (*)
          )
        )
      )
    `)
    .eq("id", bookId)
    .eq("project_id", projectId)
    .single();

  if (bookError || !book) {
    notFound();
  }

  // Fetch project for breadcrumb
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  // Fetch story nodes for editing scenes (characters and locations)
  const { data: storyNodes } = await supabase
    .from("story_nodes")
    .select("*")
    .eq("project_id", projectId)
    .in("node_type", ["character", "location"]);

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    complete: "bg-green-100 text-green-800",
    published: "bg-purple-100 text-purple-800",
  };

  const totalScenes = book.chapters?.reduce(
    (acc, ch) => acc + (ch.scenes?.length || 0),
    0
  ) || 0;

  // Calculate actual word count from all scenes (more accurate than stored value)
  const actualWordCount = book.chapters?.reduce(
    (acc, ch) => acc + (ch.scenes?.reduce(
      (sceneAcc, scene) => sceneAcc + (scene.word_count || 0),
      0
    ) || 0),
    0
  ) || 0;

  const progress = book.target_word_count && actualWordCount
    ? Math.min((actualWordCount / book.target_word_count) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          {project?.title || "Project"}
        </Link>
        <span>/</span>
        <span className="text-foreground">{book.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/projects/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
                <Badge
                  variant="secondary"
                  className={statusColors[book.status as keyof typeof statusColors] || statusColors.draft}
                >
                  {book.status?.replace("_", " ") || "draft"}
                </Badge>
              </div>
              {book.subtitle && (
                <p className="text-muted-foreground">{book.subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportBookButton bookId={bookId} bookTitle={book.title} />
          <StoryUniverseSheet projectId={projectId} />
          <BookStyleSheet book={book} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{book.chapters?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScenes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Word Count</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actualWordCount.toLocaleString()}
            </div>
            {book.target_word_count && (
              <p className="text-xs text-muted-foreground mt-1">
                of {book.target_word_count.toLocaleString()} goal
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {book.target_word_count ? `${Math.round(progress)}%` : "—"}
            </div>
            {book.target_word_count && (
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Synopsis */}
      {book.synopsis ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Synopsis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{book.synopsis}</p>
          </CardContent>
        </Card>
      ) : (
        <AddSynopsisCard bookId={bookId} projectId={projectId} />
      )}

      {/* Chapters/Manuscript Tabs */}
      <Tabs defaultValue="outline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outline" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Outline
          </TabsTrigger>
          <TabsTrigger value="manuscript" className="flex items-center gap-2">
            <BookText className="h-4 w-4" />
            Read
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outline" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chapters</h2>
            <div className="flex items-center gap-2">
              <GenerateOutlineDialog
                bookId={bookId}
                projectId={projectId}
                book={book}
              />
              <CreateChapterDialog bookId={bookId} projectId={projectId} />
            </div>
          </div>
          <Suspense fallback={<div>Loading chapters...</div>}>
            <ChaptersList
              chapters={book.chapters || []}
              bookId={bookId}
              projectId={projectId}
              storyNodes={storyNodes || []}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="manuscript">
          <Suspense fallback={<div>Loading manuscript...</div>}>
            <ManuscriptView
              chapters={book.chapters || []}
              bookId={bookId}
              projectId={projectId}
              bookTitle={book.title}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
