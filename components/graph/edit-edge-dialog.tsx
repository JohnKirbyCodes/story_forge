"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StoryNode, StoryEdge } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ArrowRight } from "lucide-react";
import { getRelationshipTypesForPair, RELATIONSHIP_TYPES } from "@/lib/story-universe-schema";

interface EditEdgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge?: StoryEdge | null;
  sourceNode?: StoryNode | null;
  targetNode?: StoryNode | null;
  projectId: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export function EditEdgeDialog({
  open,
  onOpenChange,
  edge,
  sourceNode,
  targetNode,
  projectId,
  onSaved,
  onDeleted,
}: EditEdgeDialogProps) {
  const [relationshipType, setRelationshipType] = useState(edge?.relationship_type || "related_to");
  const [label, setLabel] = useState(edge?.label || "");
  const [description, setDescription] = useState(edge?.description || "");
  const [isBidirectional, setIsBidirectional] = useState(edge?.is_bidirectional || false);
  const [weight, setWeight] = useState(edge?.weight || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isNew = !edge;

  // Get relevant relationship types based on node types
  const relationshipTypes = useMemo(() => {
    if (sourceNode && targetNode) {
      return getRelationshipTypesForPair(sourceNode.node_type, targetNode.node_type);
    }
    // Return all relationship types if we don't know the node types
    const allTypes = Object.values(RELATIONSHIP_TYPES).flat();
    const seen = new Set<string>();
    return allTypes.filter(t => {
      if (seen.has(t.value)) return false;
      seen.add(t.value);
      return true;
    });
  }, [sourceNode, targetNode]);

  // Group relationship types by category
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof relationshipTypes> = {};
    relationshipTypes.forEach((type) => {
      if (!groups[type.category]) groups[type.category] = [];
      groups[type.category].push(type);
    });
    return groups;
  }, [relationshipTypes]);

  const handleSave = async () => {
    if (!sourceNode || !targetNode) return;

    setIsSaving(true);
    try {
      const selectedType = relationshipTypes.find(t => t.value === relationshipType);

      if (isNew) {
        // Create new edge
        const { error } = await supabase.from("story_edges").insert({
          project_id: projectId,
          source_node_id: sourceNode.id,
          target_node_id: targetNode.id,
          relationship_type: relationshipType,
          label: label || selectedType?.label || relationshipType,
          description: description || null,
          is_bidirectional: selectedType?.bidirectional ?? isBidirectional,
          weight,
        });
        if (error) throw error;
      } else if (edge) {
        // Update existing edge
        const { error } = await supabase
          .from("story_edges")
          .update({
            relationship_type: relationshipType,
            label: label || null,
            description: description || null,
            is_bidirectional: isBidirectional,
            weight,
          })
          .eq("id", edge.id);
        if (error) throw error;
      }

      onSaved?.();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving edge:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!edge) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("story_edges")
        .delete()
        .eq("id", edge.id);

      if (error) throw error;

      onDeleted?.();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting edge:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-set bidirectional based on relationship type
  const handleRelationshipTypeChange = (value: string) => {
    setRelationshipType(value);
    const selectedType = relationshipTypes.find(t => t.value === value);
    if (selectedType) {
      setIsBidirectional(selectedType.bidirectional);
      if (!label) {
        setLabel(selectedType.label);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create Connection" : "Edit Connection"}
          </DialogTitle>
          <DialogDescription>
            Define the relationship between these story elements.
          </DialogDescription>
        </DialogHeader>

        {/* Node Preview */}
        {sourceNode && targetNode && (
          <div className="flex items-center justify-center gap-3 py-4 px-2 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Badge variant="outline" className="mb-1 capitalize">
                {sourceNode.node_type}
              </Badge>
              <p className="font-medium text-sm">{sourceNode.name}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="text-center">
              <Badge variant="outline" className="mb-1 capitalize">
                {targetNode.node_type}
              </Badge>
              <p className="font-medium text-sm">{targetNode.name}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select value={relationshipType} onValueChange={handleRelationshipTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="text-xs text-muted-foreground">{category}</SelectLabel>
                    {types.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.label}</span>
                          {type.bidirectional && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              mutual
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Label */}
          <div className="space-y-2">
            <Label>Display Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Custom label shown on graph..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this relationship in detail..."
              rows={3}
            />
          </div>

          {/* Bidirectional Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bidirectional</Label>
              <p className="text-xs text-muted-foreground">
                Relationship applies both ways
              </p>
            </div>
            <Switch
              checked={isBidirectional}
              onCheckedChange={setIsBidirectional}
            />
          </div>

          {/* Weight/Importance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Importance</Label>
              <span className="text-sm text-muted-foreground">{weight}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher importance = more likely to be included in AI context
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this relationship.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
