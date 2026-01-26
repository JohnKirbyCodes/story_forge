"use client";

import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeTypes,
  EdgeTypes,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { StoryNode, StoryEdge } from "@/types/database";
import { Button } from "@/components/ui/button";
import { StoryNodeComponent } from "./story-node";
import { CreateNodeDialog } from "./create-node-dialog";
import { NodeDetailPanel } from "./node-detail-panel";
import { EditEdgeDialog } from "./edit-edge-dialog";
import { LabeledEdge } from "./labeled-edge";
import { EdgeFilterPanel } from "./edge-filter-panel";
import { Plus, Users, MapPin, Swords, Lightbulb, Package, Calendar } from "lucide-react";
import { RELATIONSHIP_TYPES } from "@/lib/story-universe-schema";

const nodeTypes: NodeTypes = {
  storyNode: StoryNodeComponent,
};

const edgeTypes: EdgeTypes = {
  labeledEdge: LabeledEdge,
};

// Helper to get edge pair key (normalized so A-B and B-A are the same)
function getEdgePairKey(sourceId: string, targetId: string): string {
  return [sourceId, targetId].sort().join("-");
}

// Calculate offset for parallel edges
function calculateEdgeOffset(index: number, total: number): number {
  if (total === 1) return 0;
  const spread = 30; // pixels between parallel edges
  const middle = (total - 1) / 2;
  return (index - middle) * spread;
}

// Get category for an edge based on relationship type
function getEdgeCategory(edge: StoryEdge): string {
  // Search through RELATIONSHIP_TYPES to find the category
  for (const [, types] of Object.entries(RELATIONSHIP_TYPES)) {
    const found = types.find((t) => t.value === edge.relationship_type);
    if (found) return found.category;
  }
  return "Other";
}

// Colors for different node types
const nodeTypeColors: Record<string, string> = {
  character: "#3b82f6", // blue
  location: "#22c55e", // green
  event: "#f59e0b", // amber
  item: "#8b5cf6", // purple
  faction: "#ef4444", // red
  concept: "#06b6d4", // cyan
};

const nodeTypeIcons: Record<string, React.ReactNode> = {
  character: <Users className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  item: <Package className="h-4 w-4" />,
  faction: <Swords className="h-4 w-4" />,
  concept: <Lightbulb className="h-4 w-4" />,
};

interface KnowledgeGraphProps {
  projectId: string;
  initialNodes: StoryNode[];
  initialEdges: StoryEdge[];
}

export function KnowledgeGraph({
  projectId,
  initialNodes,
  initialEdges,
}: KnowledgeGraphProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<string>("character");

  // Focus mode and filtering state
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Label offset state (for draggable labels)
  // Note: Offsets are stored in local state only for this session
  // To persist across page reloads, add a label_offset_x/y column to story_edges table
  const [labelOffsets, setLabelOffsets] = useState<Record<string, { x: number; y: number }>>({});

  // Handle label drag - update local state
  const handleLabelDrag = useCallback((edgeId: string, offsetX: number, offsetY: number) => {
    setLabelOffsets((prev) => ({
      ...prev,
      [edgeId]: { x: offsetX, y: offsetY },
    }));
  }, []);

  // Edge editing state
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNode: StoryNode;
    targetNode: StoryNode;
  } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{
    edge: StoryEdge;
    sourceNode: StoryNode;
    targetNode: StoryNode;
  } | null>(null);

  // Convert database nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(
    () =>
      initialNodes.map((node) => ({
        id: node.id,
        type: "storyNode",
        position: node.position_x && node.position_y
          ? { x: node.position_x, y: node.position_y }
          : { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          ...node,
          color: nodeTypeColors[node.node_type] || "#6b7280",
          icon: nodeTypeIcons[node.node_type],
        },
      })),
    [initialNodes]
  );

  // Group edges by node pair for offset calculation
  const edgeGroups = useMemo(() => {
    const groups: Record<string, StoryEdge[]> = {};
    initialEdges.forEach((edge) => {
      const key = getEdgePairKey(edge.source_node_id, edge.target_node_id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(edge);
    });
    return groups;
  }, [initialEdges]);

  // Convert database edges to React Flow edges with grouping, filtering, and focus mode
  const flowEdges: Edge[] = useMemo(() => {
    return initialEdges.map((edge) => {
      // Get edge group for offset calculation
      const pairKey = getEdgePairKey(edge.source_node_id, edge.target_node_id);
      const group = edgeGroups[pairKey] || [edge];
      const indexInGroup = group.indexOf(edge);
      const offset = calculateEdgeOffset(indexInGroup, group.length);

      // Determine edge category for filtering
      const category = getEdgeCategory(edge);
      const isHiddenByCategory = hiddenCategories.has(category);

      // Determine focus mode state
      const hasFocus = focusedNodeIds.length > 0;
      const isConnectedToFocused = hasFocus && (
        focusedNodeIds.includes(edge.source_node_id) ||
        focusedNodeIds.includes(edge.target_node_id)
      );
      const isDimmed = hasFocus && !isConnectedToFocused;
      const isFocused = hasFocus && isConnectedToFocused;

      return {
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        label: edge.label || edge.relationship_type,
        type: "labeledEdge",
        animated: false,
        hidden: isHiddenByCategory,
        markerEnd: edge.is_bidirectional ? undefined : {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        data: {
          ...edge,
          offset,
          isDimmed,
          isFocused,
          category,
          labelOffsetX: labelOffsets[edge.id]?.x || 0,
          labelOffsetY: labelOffsets[edge.id]?.y || 0,
          onLabelDrag: handleLabelDrag,
        },
      };
    });
  }, [initialEdges, edgeGroups, focusedNodeIds, hiddenCategories, labelOffsets, handleLabelDrag]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Handle new connection - open dialog to select relationship type
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceNode = initialNodes.find((n) => n.id === params.source);
      const targetNode = initialNodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        setPendingConnection({ sourceNode, targetNode });
        setSelectedEdge(null);
        setEdgeDialogOpen(true);
      }
    },
    [initialNodes]
  );

  // Handle edge click - open dialog to edit
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const storyEdge = initialEdges.find((e) => e.id === edge.id);
      const sourceNode = initialNodes.find((n) => n.id === edge.source);
      const targetNode = initialNodes.find((n) => n.id === edge.target);

      if (storyEdge && sourceNode && targetNode) {
        setSelectedEdge({ edge: storyEdge, sourceNode, targetNode });
        setPendingConnection(null);
        setEdgeDialogOpen(true);
      }
    },
    [initialEdges, initialNodes]
  );

  // Handle edge saved - add to graph
  const handleEdgeSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  // Handle edge deleted - remove from graph
  const handleEdgeDeleted = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.edge.id));
    }
    router.refresh();
  }, [selectedEdge, setEdges, router]);

  // Handle node position change
  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      try {
        await supabase
          .from("story_nodes")
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
          })
          .eq("id", node.id);
      } catch (error) {
        console.error("Error updating node position:", error);
      }
    },
    [supabase]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const storyNode = initialNodes.find((n) => n.id === node.id);
      setSelectedNode(storyNode || null);
    },
    [initialNodes]
  );

  // Handle node created
  const onNodeCreated = useCallback(
    (newNode: StoryNode) => {
      setNodes((nds) => [
        ...nds,
        {
          id: newNode.id,
          type: "storyNode",
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          data: {
            ...newNode,
            color: nodeTypeColors[newNode.node_type] || "#6b7280",
            icon: nodeTypeIcons[newNode.node_type],
          },
        },
      ]);
      router.refresh();
    },
    [setNodes, router]
  );

  // Handle opening create dialog with type
  const handleCreateNode = (type: string) => {
    setCreateNodeType(type);
    setCreateDialogOpen(true);
  };

  // Edge filter handlers
  const handleCategoryToggle = useCallback((category: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setHiddenCategories(new Set());
    setFocusedNodeIds([]);
  }, []);

  // Get all categories for hide/show all
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(RELATIONSHIP_TYPES).forEach((types) => {
      types.forEach((type) => {
        categories.add(type.category);
      });
    });
    return categories;
  }, []);

  const handleHideAllCategories = useCallback(() => {
    setHiddenCategories(new Set(allCategories));
  }, [allCategories]);

  const handleShowAllCategories = useCallback(() => {
    setHiddenCategories(new Set());
  }, []);

  // Calculate edge counts for filter panel
  const totalEdgeCount = initialEdges.length;
  const visibleEdgeCount = useMemo(() => {
    return flowEdges.filter((e) => !e.hidden).length;
  }, [flowEdges]);

  // Toggle focus mode on double-click
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setFocusedNodeIds((prev) => {
        if (prev.includes(node.id)) {
          return prev.filter((id) => id !== node.id);
        }
        return [...prev, node.id];
      });
    },
    []
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-muted/30"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => node.data.color as string}
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Toolbar */}
        <Panel position="top-left" className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("character")}
            className="bg-background"
          >
            <Users className="mr-2 h-4 w-4 text-blue-500" />
            Character
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("location")}
            className="bg-background"
          >
            <MapPin className="mr-2 h-4 w-4 text-green-500" />
            Location
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("event")}
            className="bg-background"
          >
            <Calendar className="mr-2 h-4 w-4 text-amber-500" />
            Event
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("item")}
            className="bg-background"
          >
            <Package className="mr-2 h-4 w-4 text-purple-500" />
            Item
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("faction")}
            className="bg-background"
          >
            <Swords className="mr-2 h-4 w-4 text-red-500" />
            Faction
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateNode("concept")}
            className="bg-background"
          >
            <Lightbulb className="mr-2 h-4 w-4 text-cyan-500" />
            Concept
          </Button>
          <div className="border-l pl-2 ml-1">
            <EdgeFilterPanel
              focusedNodeIds={focusedNodeIds}
              onFocusChange={setFocusedNodeIds}
              hiddenCategories={hiddenCategories}
              onCategoryToggle={handleCategoryToggle}
              onHideAllCategories={handleHideAllCategories}
              onShowAllCategories={handleShowAllCategories}
              onClearFilters={handleClearFilters}
              edgeCount={totalEdgeCount}
              visibleEdgeCount={visibleEdgeCount}
            />
          </div>
        </Panel>

        {/* Instructions */}
        <Panel position="bottom-center" className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded">
          Click node to edit • Double-click to focus • Drag labels to reposition
        </Panel>
      </ReactFlow>

      {/* Node Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          projectId={projectId}
        />
      )}

      {/* Create Node Dialog */}
      <CreateNodeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        nodeType={createNodeType}
        onCreated={onNodeCreated}
      />

      {/* Edit Edge Dialog */}
      <EditEdgeDialog
        open={edgeDialogOpen}
        onOpenChange={(open) => {
          setEdgeDialogOpen(open);
          if (!open) {
            setPendingConnection(null);
            setSelectedEdge(null);
          }
        }}
        edge={selectedEdge?.edge}
        sourceNode={pendingConnection?.sourceNode || selectedEdge?.sourceNode}
        targetNode={pendingConnection?.targetNode || selectedEdge?.targetNode}
        projectId={projectId}
        onSaved={handleEdgeSaved}
        onDeleted={handleEdgeDeleted}
      />
    </div>
  );
}
