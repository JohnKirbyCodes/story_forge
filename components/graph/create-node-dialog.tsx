"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoryNode, NodeType } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, MapPin, Calendar, Package, Swords, Lightbulb, AlertCircle } from "lucide-react";

const nodeTypes = [
  { value: "character", label: "Character", icon: Users, color: "text-blue-500" },
  { value: "location", label: "Location", icon: MapPin, color: "text-green-500" },
  { value: "event", label: "Event", icon: Calendar, color: "text-amber-500" },
  { value: "item", label: "Item", icon: Package, color: "text-purple-500" },
  { value: "faction", label: "Faction", icon: Swords, color: "text-red-500" },
  { value: "concept", label: "Concept", icon: Lightbulb, color: "text-cyan-500" },
];

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  nodeType: string;
  onCreated: (node: StoryNode) => void;
}

export function CreateNodeDialog({
  open,
  onOpenChange,
  projectId,
  nodeType,
  onCreated,
}: CreateNodeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState(nodeType);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const router = useRouter();

  // Update selected type when prop changes
  useEffect(() => {
    if (open) {
      setSelectedType(nodeType);
    }
  }, [nodeType, open]);

  // Reset form when panel closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setError(null);
      setLimitReached(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLimitReached(false);

    try {
      const response = await fetch("/api/story-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          node_type: selectedType as NodeType,
          project_id: projectId,
          position_x: Math.random() * 500,
          position_y: Math.random() * 500,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "limit_exceeded") {
          setLimitReached(true);
          setError(data.message);
          return;
        }
        throw new Error(data.error || "Failed to create story node");
      }

      onCreated(data);
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating node:", err);
      setError(err instanceof Error ? err.message : "Failed to create story node");
    } finally {
      setIsLoading(false);
    }
  };

  const currentType = nodeTypes.find((t) => t.value === selectedType);
  const TypeIcon = currentType?.icon || Users;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-96 sm:w-110 flex flex-col h-full overflow-hidden">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>Create Story Node</SheetTitle>
            {currentType && (
              <Badge variant="outline" className="capitalize">
                <TypeIcon className={`mr-1 h-3 w-3 ${currentType.color}`} />
                {currentType.label}
              </Badge>
            )}
          </div>
          <SheetDescription>
            Add a new element to your Series Universe.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 px-4">
          {error && (
            <Alert variant={limitReached ? "default" : "destructive"} className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
                {limitReached && (
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1"
                    onClick={() => {
                      onOpenChange(false);
                      router.push("/dashboard/settings/billing");
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nodeType">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={
                  selectedType === "character"
                    ? "John Smith"
                    : selectedType === "location"
                    ? "The Dark Forest"
                    : selectedType === "event"
                    ? "The Battle of Dawn"
                    : selectedType === "item"
                    ? "The Ancient Sword"
                    : selectedType === "faction"
                    ? "The Brotherhood"
                    : "Enter name..."
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder={
                  selectedType === "character"
                    ? "A brave warrior with a mysterious past..."
                    : selectedType === "location"
                    ? "An ancient forest filled with magical creatures..."
                    : selectedType === "event"
                    ? "A pivotal moment that changed everything..."
                    : selectedType === "item"
                    ? "A legendary artifact with hidden powers..."
                    : selectedType === "faction"
                    ? "A secret organization working in the shadows..."
                    : "Describe this element..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This description is used by AI during scene generation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Node
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
