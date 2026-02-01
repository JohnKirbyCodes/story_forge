"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StoryNode, StoryEdge } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  MapPin,
  Swords,
  Lightbulb,
  Package,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Link2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { NODE_ATTRIBUTES } from "@/lib/story-universe-schema";

interface MultiNodeDetailPanelProps {
  nodes: StoryNode[];
  edges: StoryEdge[];
  allNodes: StoryNode[];
  onClose: () => void;
  onNodeClick: (node: StoryNode) => void;
  projectId: string;
}

const nodeTypeIcons: Record<string, React.ReactNode> = {
  character: <Users className="h-4 w-4 text-blue-500" />,
  location: <MapPin className="h-4 w-4 text-green-500" />,
  event: <Calendar className="h-4 w-4 text-amber-500" />,
  item: <Package className="h-4 w-4 text-purple-500" />,
  faction: <Swords className="h-4 w-4 text-red-500" />,
  concept: <Lightbulb className="h-4 w-4 text-cyan-500" />,
};

const nodeTypeLabels: Record<string, string> = {
  character: "Character",
  location: "Location",
  event: "Event",
  item: "Item",
  faction: "Faction",
  concept: "Concept",
};

const nodeTypeColors: Record<string, string> = {
  character: "bg-blue-500/10 text-blue-700 border-blue-200",
  location: "bg-green-500/10 text-green-700 border-green-200",
  event: "bg-amber-500/10 text-amber-700 border-amber-200",
  item: "bg-purple-500/10 text-purple-700 border-purple-200",
  faction: "bg-red-500/10 text-red-700 border-red-200",
  concept: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
};

function NodeCard({
  node,
  edges,
  allNodes,
  selectedNodeIds,
  onNodeClick,
  defaultExpanded = false,
}: {
  node: StoryNode;
  edges: StoryEdge[];
  allNodes: StoryNode[];
  selectedNodeIds: Set<string>;
  onNodeClick: (node: StoryNode) => void;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get relationships for this node (only to/from other selected nodes)
  const relationships = useMemo(() => {
    return edges
      .filter(
        (edge) =>
          (edge.source_node_id === node.id && selectedNodeIds.has(edge.target_node_id)) ||
          (edge.target_node_id === node.id && selectedNodeIds.has(edge.source_node_id))
      )
      .map((edge) => {
        const isSource = edge.source_node_id === node.id;
        const otherNodeId = isSource ? edge.target_node_id : edge.source_node_id;
        const otherNode = allNodes.find((n) => n.id === otherNodeId);
        return {
          edge,
          otherNode,
          direction: isSource ? "outgoing" : "incoming",
        };
      })
      .filter((r) => r.otherNode);
  }, [node.id, edges, selectedNodeIds, allNodes]);

  // Get attribute fields for this node type
  const attributeFields = NODE_ATTRIBUTES[node.node_type] || [];
  const attributes = (node.attributes as Record<string, unknown>) || {};

  // Filter to only filled attributes
  const filledAttributes = attributeFields.filter((field) => {
    const value = attributes[field.key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="shrink-0">{nodeTypeIcons[node.node_type]}</span>
            <span className="font-medium flex-1 truncate">{node.name}</span>
            <Badge
              variant="outline"
              className={`shrink-0 capitalize text-xs ${nodeTypeColors[node.node_type]}`}
            >
              {nodeTypeLabels[node.node_type]}
            </Badge>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 space-y-3">
            <Separator />

            {/* Description */}
            {node.description && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{node.description}</p>
              </div>
            )}

            {/* Character Role */}
            {node.character_role && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Role
                </h4>
                <Badge variant="secondary" className="capitalize">
                  {node.character_role}
                </Badge>
              </div>
            )}

            {/* Attributes */}
            {filledAttributes.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Attributes ({filledAttributes.length}/{attributeFields.length})
                </h4>
                <div className="space-y-2">
                  {filledAttributes.map((field) => {
                    const value = attributes[field.key];
                    return (
                      <div key={field.key} className="text-sm">
                        <span className="text-muted-foreground">{field.label}:</span>{" "}
                        <span>
                          {Array.isArray(value)
                            ? value.join(", ")
                            : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Relationships within selection */}
            {relationships.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Relationships in Selection ({relationships.length})
                </h4>
                <div className="space-y-1">
                  {relationships.map(({ edge, otherNode, direction }) => (
                    <div
                      key={edge.id}
                      className="text-sm flex items-center gap-2 text-muted-foreground"
                    >
                      <span className="text-xs">
                        {direction === "outgoing" ? "→" : "←"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {edge.label || edge.relationship_type}
                      </Badge>
                      <span>{otherNode?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes preview */}
            {node.notes && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {node.notes}
                </p>
              </div>
            )}

            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node);
              }}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Open Full Editor
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function MultiNodeDetailPanel({
  nodes,
  edges,
  allNodes,
  onClose,
  onNodeClick,
  projectId,
}: MultiNodeDetailPanelProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // Group nodes by type
  const nodesByType = useMemo(() => {
    const groups: Record<string, StoryNode[]> = {};
    nodes.forEach((node) => {
      if (!groups[node.node_type]) {
        groups[node.node_type] = [];
      }
      groups[node.node_type].push(node);
    });
    return groups;
  }, [nodes]);

  const selectedNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  // Count relationships between selected nodes
  const internalRelationships = useMemo(() => {
    return edges.filter(
      (edge) =>
        selectedNodeIds.has(edge.source_node_id) &&
        selectedNodeIds.has(edge.target_node_id)
    );
  }, [edges, selectedNodeIds]);

  const typeOrder = ["character", "location", "faction", "item", "event", "concept"];

  // Handle AI enrichment
  const handleGenerateDetails = async () => {
    setIsGenerating(true);

    try {
      const supabase = createClient();

      // Get user session for auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Please sign in to generate content");
        return;
      }

      // Call Supabase Edge Function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/enrich-nodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          nodeIds: nodes.map((n) => n.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle provider errors (missing API key, etc.)
        if (data.error === "provider_error") {
          toast.error(data.message, {
            description: "Go to Settings -> AI to configure your API key.",
            action: {
              label: "Go to Settings",
              onClick: () => router.push("/dashboard/settings/ai"),
            },
          });
          return;
        }
        throw new Error(data.message || data.error || "Failed to enrich nodes");
      }

      toast.success(
        `Enhanced ${data.enriched} of ${data.total} elements with AI-generated details!`,
        { duration: 5000 }
      );

      // Refresh to show updated data
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate details",
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] flex flex-col h-full overflow-hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {nodes.length} Elements Selected
          </SheetTitle>
          <SheetDescription>
            View details for all selected story elements.
            {internalRelationships.length > 0 && (
              <span className="block mt-1">
                {internalRelationships.length} relationship
                {internalRelationships.length !== 1 ? "s" : ""} between selected
                elements.
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 py-2">
          {typeOrder.map((type) => {
            const count = nodesByType[type]?.length || 0;
            if (count === 0) return null;
            return (
              <Badge
                key={type}
                variant="secondary"
                className={`flex items-center gap-1 ${nodeTypeColors[type]}`}
              >
                {nodeTypeIcons[type]}
                {count} {nodeTypeLabels[type]}
                {count !== 1 ? "s" : ""}
              </Badge>
            );
          })}
        </div>

        <Separator />

        {/* Node list */}
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4 py-4">
            {typeOrder.map((type) => {
              const typeNodes = nodesByType[type];
              if (!typeNodes || typeNodes.length === 0) return null;

              return (
                <div key={type} className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    {nodeTypeIcons[type]}
                    {nodeTypeLabels[type]}s ({typeNodes.length})
                  </h3>
                  <div className="space-y-2">
                    {typeNodes.map((node, index) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        edges={edges}
                        allNodes={allNodes}
                        selectedNodeIds={selectedNodeIds}
                        onNodeClick={onNodeClick}
                        defaultExpanded={index === 0 && typeNodes.length <= 3}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-4 mt-2 space-y-2">
          <Button
            onClick={handleGenerateDetails}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Details...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Details for {nodes.length} Elements
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full" disabled={isGenerating}>
            Clear Selection
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
