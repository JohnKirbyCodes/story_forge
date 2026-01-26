"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StoryNode, StoryEdge } from "@/types/database";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";
import { StoryNodesList } from "@/components/dashboard/story-nodes-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Loader2, List } from "lucide-react";

interface StoryUniverseSheetProps {
  projectId: string;
  trigger?: React.ReactNode;
}

type ViewMode = "graph" | "list";

export function StoryUniverseSheet({ projectId, trigger }: StoryUniverseSheetProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [edges, setEdges] = useState<StoryEdge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch nodes and edges when sheet opens
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [nodesResult, edgesResult] = await Promise.all([
          supabase
            .from("story_nodes")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true }),
          supabase
            .from("story_edges")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true }),
        ]);

        if (nodesResult.error) throw nodesResult.error;
        if (edgesResult.error) throw edgesResult.error;

        setNodes(nodesResult.data || []);
        setEdges(edgesResult.data || []);
      } catch (err) {
        console.error("Error fetching story universe data:", err);
        setError("Failed to load story universe");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, projectId, supabase]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Network className="h-4 w-4" />
          Story Universe
        </Button>
      )}
      <SheetContent
        side="right"
        className="w-full sm:w-[90vw] sm:max-w-[90vw] p-0"
        showCloseButton={true}
      >
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Story Universe
              </SheetTitle>
              <SheetDescription>
                Explore and edit your world&apos;s characters, locations, and relationships
              </SheetDescription>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="graph" className="gap-2">
                  <Network className="h-4 w-4" />
                  Graph
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        <div className="flex-1 h-[calc(100vh-100px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : viewMode === "graph" ? (
            <KnowledgeGraph
              projectId={projectId}
              initialNodes={nodes}
              initialEdges={edges}
            />
          ) : (
            <StoryNodesList
              nodes={nodes}
              edges={edges}
              projectId={projectId}
              onNodeUpdated={() => {
                // Refetch data when a node is updated
                setOpen(true);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
