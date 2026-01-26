"use client";

import { useState, useMemo } from "react";
import { StoryNode, StoryEdge } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  User,
  MapPin,
  Calendar,
  Box,
  Users,
  Lightbulb,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Link2,
  ArrowRight,
} from "lucide-react";
import { CHARACTER_ROLES, RELATIONSHIP_TYPES } from "@/lib/story-universe-schema";
import { NodeDetailPanel } from "@/components/graph/node-detail-panel";

interface StoryNodesListProps {
  nodes: StoryNode[];
  edges: StoryEdge[];
  projectId: string;
  onNodeUpdated?: () => void;
}

type SortField = "name" | "node_type" | "character_role" | "created_at";
type SortDirection = "asc" | "desc";

const NODE_TYPE_ICONS: Record<string, React.ReactNode> = {
  character: <User className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  item: <Box className="h-4 w-4" />,
  faction: <Users className="h-4 w-4" />,
  concept: <Lightbulb className="h-4 w-4" />,
};

const NODE_TYPE_LABELS: Record<string, string> = {
  character: "Character",
  location: "Location",
  event: "Event",
  item: "Item",
  faction: "Faction",
  concept: "Concept",
};

const NODE_TYPE_COLORS: Record<string, string> = {
  character: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  location: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  item: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  faction: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  concept: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export function StoryNodesList({
  nodes,
  edges,
  projectId,
  onNodeUpdated,
}: StoryNodesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(["character", "location", "event", "item", "faction", "concept"])
  );

  // Count connections for each node
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    edges.forEach((edge) => {
      counts[edge.source_node_id] = (counts[edge.source_node_id] || 0) + 1;
      counts[edge.target_node_id] = (counts[edge.target_node_id] || 0) + 1;
    });
    return counts;
  }, [edges]);

  // Create a map of nodes by ID for quick lookup
  const nodesById = useMemo(() => {
    const map: Record<string, StoryNode> = {};
    nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [nodes]);

  // Get connections for a specific node
  const getNodeConnections = (nodeId: string) => {
    return edges.filter(
      (edge) => edge.source_node_id === nodeId || edge.target_node_id === nodeId
    ).map((edge) => {
      const isSource = edge.source_node_id === nodeId;
      const connectedNodeId = isSource ? edge.target_node_id : edge.source_node_id;
      const connectedNode = nodesById[connectedNodeId];
      return {
        edge,
        connectedNode,
        direction: isSource ? "outgoing" : "incoming",
      };
    });
  };

  // Get human-readable relationship label
  const getRelationshipLabel = (relationshipType: string) => {
    // Search through all relationship type categories
    for (const category of Object.values(RELATIONSHIP_TYPES)) {
      const found = category.find((r) => r.value === relationshipType);
      if (found) return found.label;
    }
    // Fallback: convert snake_case to Title Case
    return relationshipType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Connections badge with popover
  const ConnectionsBadge = ({ nodeId, count }: { nodeId: string; count: number }) => {
    if (count === 0) {
      return (
        <Badge variant="secondary" className="text-xs opacity-50">
          0
        </Badge>
      );
    }

    const connections = getNodeConnections(nodeId);

    return (
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="secondary"
            className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            <Link2 className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b">
            <h4 className="font-medium text-sm">Connections ({count})</h4>
            <p className="text-xs text-muted-foreground">
              Relationships with other story elements
            </p>
          </div>
          <ScrollArea className="max-h-75">
            <div className="p-2">
              {connections.map(({ edge, connectedNode, direction }) => (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => connectedNode && handleNodeClick(connectedNode)}
                >
                  <span
                    className={`p-1 rounded ${
                      connectedNode ? NODE_TYPE_COLORS[connectedNode.node_type] : "bg-muted"
                    }`}
                  >
                    {connectedNode ? NODE_TYPE_ICONS[connectedNode.node_type] : <Box className="h-3 w-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      {direction === "outgoing" ? (
                        <>
                          <span className="text-muted-foreground truncate">
                            {getRelationshipLabel(edge.relationship_type)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {connectedNode?.name || "Unknown"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium truncate">
                            {connectedNode?.name || "Unknown"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {getRelationshipLabel(edge.relationship_type)}
                          </span>
                        </>
                      )}
                    </div>
                    {edge.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {edge.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  };

  // Filter and sort nodes
  const filteredNodes = useMemo(() => {
    let result = [...nodes];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (node) =>
          node.name.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((node) => node.node_type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "node_type":
          comparison = a.node_type.localeCompare(b.node_type);
          break;
        case "character_role":
          comparison = (a.character_role || "").localeCompare(b.character_role || "");
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [nodes, searchQuery, typeFilter, sortField, sortDirection]);

  // Group nodes by type
  const nodesByType = useMemo(() => {
    const grouped: Record<string, StoryNode[]> = {};
    filteredNodes.forEach((node) => {
      if (!grouped[node.node_type]) {
        grouped[node.node_type] = [];
      }
      grouped[node.node_type].push(node);
    });
    return grouped;
  }, [filteredNodes]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleTypeExpanded = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return null;
    const found = CHARACTER_ROLES.find((r) => r.value === role);
    return found?.label || role;
  };

  const handleNodeClick = (node: StoryNode) => {
    setSelectedNode(node);
  };

  const handleCloseDetail = () => {
    setSelectedNode(null);
    onNodeUpdated?.();
  };

  // Render grouped view
  const renderGroupedView = () => {
    const typeOrder = ["character", "location", "faction", "item", "event", "concept"];
    const sortedTypes = typeOrder.filter((type) => nodesByType[type]?.length > 0);

    if (sortedTypes.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No story elements found matching your criteria.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {sortedTypes.map((type) => {
          const typeNodes = nodesByType[type];
          const isExpanded = expandedTypes.has(type);

          return (
            <Card key={type}>
              <button
                onClick={() => toggleTypeExpanded(type)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`p-1.5 rounded ${NODE_TYPE_COLORS[type]}`}>
                    {NODE_TYPE_ICONS[type]}
                  </span>
                  <span className="font-medium">{NODE_TYPE_LABELS[type]}s</span>
                  <Badge variant="secondary" className="text-xs">
                    {typeNodes.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        {type === "character" && (
                          <TableHead className="w-[120px]">Role</TableHead>
                        )}
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="w-[100px] text-center">Connections</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeNodes.map((node) => (
                        <TableRow
                          key={node.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleNodeClick(node)}
                        >
                          <TableCell className="font-medium">{node.name}</TableCell>
                          {type === "character" && (
                            <TableCell>
                              {node.character_role && (
                                <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(node.character_role)}
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-100">
                            {node.description || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <ConnectionsBadge
                              nodeId={node.id}
                              count={connectionCounts[node.id] || 0}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // Render flat table view
  const renderFlatView = () => {
    if (filteredNodes.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No story elements found matching your criteria.
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2"
                  onClick={() => toggleSort("name")}
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 -ml-2"
                  onClick={() => toggleSort("character_role")}
                >
                  Role
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="w-[100px] text-center">Connections</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNodes.map((node) => (
              <TableRow
                key={node.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleNodeClick(node)}
              >
                <TableCell>
                  <span
                    className={`p-1.5 rounded inline-flex ${NODE_TYPE_COLORS[node.node_type]}`}
                    title={NODE_TYPE_LABELS[node.node_type]}
                  >
                    {NODE_TYPE_ICONS[node.node_type]}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{node.name}</TableCell>
                <TableCell>
                  {node.character_role && (
                    <Badge variant="outline" className="text-xs">
                      {getRoleLabel(node.character_role)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-100">
                  {node.description || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <ConnectionsBadge
                    nodeId={node.id}
                    count={connectionCounts[node.id] || 0}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search story elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="character">Characters</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="faction">Factions</SelectItem>
            <SelectItem value="item">Items</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="concept">Concepts</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredNodes.length} of {nodes.length} elements
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {typeFilter === "all" ? renderGroupedView() : renderFlatView()}
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={handleCloseDetail}
          projectId={projectId}
        />
      )}
    </div>
  );
}
