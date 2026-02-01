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
  SelectionMode,
  OnSelectionChangeParams,
} from "reactflow";
import "reactflow/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { StoryNode, StoryEdge } from "@/types/database";
import { Button } from "@/components/ui/button";
import { StoryNodeComponent } from "./story-node";
import { CreateNodeDialog } from "./create-node-dialog";
import { NodeDetailPanel } from "./node-detail-panel";
import { MultiNodeDetailPanel } from "./multi-node-detail-panel";
import { EditEdgeDialog } from "./edit-edge-dialog";
import { LabeledEdge } from "./labeled-edge";
import { EdgeFilterPanel } from "./edge-filter-panel";
import { GenerateUniverseDialog } from "./generate-universe-dialog";
import { Plus, Users, MapPin, Swords, Lightbulb, Package, Calendar, LayoutGrid, Loader2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Layout algorithms for auto-organize feature
type LayoutType = "byType" | "radial" | "grid";

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

// Group nodes by type and arrange in clusters
function layoutByType(nodes: StoryNode[]): NodePosition[] {
  const nodesByType: Record<string, StoryNode[]> = {};

  // Group nodes by type
  nodes.forEach((node) => {
    if (!nodesByType[node.node_type]) {
      nodesByType[node.node_type] = [];
    }
    nodesByType[node.node_type].push(node);
  });

  const typeOrder = ["character", "location", "faction", "item", "event", "concept"];
  const positions: NodePosition[] = [];

  // Layout configuration - generous spacing for readability
  const horizontalSpacing = 400; // Space between columns within a type
  const verticalSpacing = 200;   // Space between nodes vertically
  const typeGap = 500;           // Extra gap between different node types
  const maxNodesPerColumn = 5;

  let currentX = 0;

  typeOrder.forEach((type) => {
    const typeNodes = nodesByType[type] || [];
    if (typeNodes.length === 0) return;

    // Calculate columns needed for this type
    const columns = Math.ceil(typeNodes.length / maxNodesPerColumn);

    typeNodes.forEach((node, index) => {
      const col = Math.floor(index / maxNodesPerColumn);
      const row = index % maxNodesPerColumn;

      positions.push({
        id: node.id,
        x: currentX + col * horizontalSpacing,
        y: row * verticalSpacing,
      });
    });

    // Move to next type cluster with generous gap
    currentX += columns * horizontalSpacing + typeGap;
  });

  return positions;
}

// Radial layout - arrange nodes in concentric circles by type
function layoutRadial(nodes: StoryNode[]): NodePosition[] {
  const nodesByType: Record<string, StoryNode[]> = {};

  nodes.forEach((node) => {
    if (!nodesByType[node.node_type]) {
      nodesByType[node.node_type] = [];
    }
    nodesByType[node.node_type].push(node);
  });

  const typeOrder = ["character", "location", "faction", "item", "event", "concept"];
  const positions: NodePosition[] = [];

  const centerX = 0;
  const centerY = 0;
  let currentRadius = 0;
  const radiusStep = 300;

  typeOrder.forEach((type, typeIndex) => {
    const typeNodes = nodesByType[type] || [];
    if (typeNodes.length === 0) return;

    currentRadius = (typeIndex + 1) * radiusStep;
    const angleStep = (2 * Math.PI) / typeNodes.length;

    typeNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      positions.push({
        id: node.id,
        x: centerX + currentRadius * Math.cos(angle),
        y: centerY + currentRadius * Math.sin(angle),
      });
    });
  });

  return positions;
}

// Simple grid layout
function layoutGrid(nodes: StoryNode[]): NodePosition[] {
  const positions: NodePosition[] = [];
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 250;

  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    positions.push({
      id: node.id,
      x: col * spacing,
      y: row * spacing,
    });
  });

  return positions;
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
  const [selectedNodes, setSelectedNodes] = useState<StoryNode[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<string>("character");

  // Focus mode and filtering state
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Organize/layout state
  const [isOrganizing, setIsOrganizing] = useState(false);

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

  // Handle node click (single selection without modifier keys)
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Don't handle if multi-select key is held (let React Flow handle it)
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const storyNode = initialNodes.find((n) => n.id === node.id);
      setSelectedNode(storyNode || null);
      setSelectedNodes([]); // Clear multi-selection on single click
    },
    [initialNodes]
  );

  // Handle selection change (marquee or Ctrl+click multi-select)
  const onSelectionChange = useCallback(
    ({ nodes: selectedFlowNodes }: OnSelectionChangeParams) => {
      if (selectedFlowNodes.length > 0) {
        // Any marquee/ctrl+click selection: show multi-node panel
        // (even for single node - user can click "Open Full Editor" if needed)
        const storyNodes = selectedFlowNodes
          .map((flowNode) => initialNodes.find((n) => n.id === flowNode.id))
          .filter((n): n is StoryNode => n !== undefined);
        setSelectedNodes(storyNodes);
        setSelectedNode(null); // Clear single selection panel
      } else {
        // No selection
        setSelectedNodes([]);
      }
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

  // Handle auto-organize layout
  const handleOrganize = useCallback(
    async (layoutType: LayoutType) => {
      setIsOrganizing(true);

      try {
        // Calculate new positions based on layout type
        let newPositions: NodePosition[];
        switch (layoutType) {
          case "byType":
            newPositions = layoutByType(initialNodes);
            break;
          case "radial":
            newPositions = layoutRadial(initialNodes);
            break;
          case "grid":
            newPositions = layoutGrid(initialNodes);
            break;
          default:
            newPositions = layoutByType(initialNodes);
        }

        // Update local node positions immediately for responsive UI
        setNodes((nds) =>
          nds.map((node) => {
            const newPos = newPositions.find((p) => p.id === node.id);
            if (newPos) {
              return {
                ...node,
                position: { x: newPos.x, y: newPos.y },
              };
            }
            return node;
          })
        );

        // Save all positions to database in parallel
        await Promise.all(
          newPositions.map((pos) =>
            supabase
              .from("story_nodes")
              .update({
                position_x: pos.x,
                position_y: pos.y,
              })
              .eq("id", pos.id)
          )
        );

        // Refresh to sync with database
        router.refresh();
      } catch (error) {
        console.error("Error organizing nodes:", error);
      } finally {
        setIsOrganizing(false);
      }
    },
    [initialNodes, setNodes, supabase, router]
  );

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
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Shift"
        panOnDrag
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGenerateDialogOpen(true)}
              className="bg-background"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              Generate
            </Button>
          </div>
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
          <div className="border-l pl-2 ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background"
                  disabled={isOrganizing}
                >
                  {isOrganizing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LayoutGrid className="mr-2 h-4 w-4" />
                  )}
                  Organize
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleOrganize("byType")}>
                  <Users className="mr-2 h-4 w-4" />
                  By Type (Columns)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOrganize("radial")}>
                  <div className="mr-2 h-4 w-4 rounded-full border-2" />
                  Radial (Circles)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOrganize("grid")}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Grid
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Panel>

        {/* Instructions */}
        <Panel position="bottom-center" className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded">
          Click to edit • Shift+drag to multi-select • ⌘/Ctrl+click to add • Double-click to focus
        </Panel>
      </ReactFlow>

      {/* Node Detail Panel (single selection) */}
      {selectedNode && selectedNodes.length === 0 && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          projectId={projectId}
        />
      )}

      {/* Multi-Node Detail Panel (marquee/ctrl+click selection) */}
      {selectedNodes.length >= 1 && (
        <MultiNodeDetailPanel
          nodes={selectedNodes}
          edges={initialEdges}
          allNodes={initialNodes}
          onClose={() => setSelectedNodes([])}
          onNodeClick={(node) => {
            setSelectedNode(node);
            setSelectedNodes([]);
          }}
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

      {/* Generate Universe Dialog */}
      <GenerateUniverseDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
