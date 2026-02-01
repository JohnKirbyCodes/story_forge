import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";
import { ArrowLeft } from "lucide-react";

interface GraphPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function GraphPage({ params }: GraphPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch all story nodes for this project
  const { data: storyNodes } = await supabase
    .from("story_nodes")
    .select("*")
    .eq("project_id", projectId);

  // Fetch all story edges for this project
  const { data: storyEdges } = await supabase
    .from("story_edges")
    .select("*")
    .eq("project_id", projectId);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">{project.title}</h1>
            <p className="text-sm text-muted-foreground">Series Universe</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{storyNodes?.length || 0} nodes</span>
          <span>•</span>
          <span>{storyEdges?.length || 0} connections</span>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1">
        <KnowledgeGraph
          projectId={projectId}
          initialNodes={storyNodes || []}
          initialEdges={storyEdges || []}
        />
      </div>
    </div>
  );
}
