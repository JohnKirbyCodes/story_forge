"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StoryNode, Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Save, Trash2, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { NodeAttributeEditor } from "./node-attribute-editor";
import { NODE_ATTRIBUTES } from "@/lib/story-universe-schema";

interface NodeDetailPanelProps {
  node: StoryNode;
  onClose: () => void;
  projectId: string;
}

export function NodeDetailPanel({
  node,
  onClose,
  projectId,
}: NodeDetailPanelProps) {
  const [name, setName] = useState(node.name);
  const [description, setDescription] = useState(node.description || "");
  const [notes, setNotes] = useState(node.notes || "");
  const [characterRole, setCharacterRole] = useState(node.character_role);
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    (node.attributes as Record<string, unknown>) || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichSuccess, setEnrichSuccess] = useState(false);
  const [enrichVersion, setEnrichVersion] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Default to "attributes" tab for node types with many attributes (characters, locations)
  const defaultTab = ["character", "location"].includes(node.node_type) ? "attributes" : "basic";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Calculate attribute completeness for display
  const attributeFields = NODE_ATTRIBUTES[node.node_type] || [];
  const filledAttributeCount = useMemo(() => {
    return Object.keys(attributes).filter(key => {
      const value = attributes[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== "";
    }).length;
  }, [attributes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("story_nodes")
        .update({
          name,
          description: description || null,
          notes: notes || null,
          character_role: characterRole || null,
          attributes: Object.keys(attributes).length > 0 ? (attributes as Json) : null,
        })
        .eq("id", node.id);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error saving node:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("story_nodes")
        .delete()
        .eq("id", node.id);

      if (error) throw error;
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error deleting node:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnrich = async () => {
    setIsEnriching(true);

    try {
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
          nodeIds: [node.id],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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
        throw new Error(data.message || data.error || "Failed to enrich node");
      }

      // Fetch the updated node data to show changes immediately
      const { data: updatedNode, error: fetchError } = await supabase
        .from("story_nodes")
        .select("*")
        .eq("id", node.id)
        .single();

      if (!fetchError && updatedNode) {
        // Update local state with enriched data
        setDescription(updatedNode.description || "");
        setAttributes((updatedNode.attributes as Record<string, unknown>) || {});
        if (updatedNode.character_role) {
          setCharacterRole(updatedNode.character_role);
        }
        // Force re-render of NodeAttributeEditor
        setEnrichVersion(v => v + 1);
      }

      // Show success state on button
      setEnrichSuccess(true);
      setTimeout(() => setEnrichSuccess(false), 2000);

      // Switch to attributes tab to show new data
      setActiveTab("attributes");

      toast.success("Node enriched with AI-generated details!", {
        duration: 5000,
      });

      // Refresh the graph view in the background
      router.refresh();
    } catch (error) {
      console.error("Enrichment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to enrich node",
        { duration: 5000 }
      );
    } finally {
      setIsEnriching(false);
    }
  };

  const nodeTypeLabels: Record<string, string> = {
    character: "Character",
    location: "Location",
    event: "Event",
    item: "Item",
    faction: "Faction",
    concept: "Concept",
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-125 sm:w-160 flex flex-col h-full overflow-hidden">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{node.name}</SheetTitle>
            <Badge variant="outline" className="capitalize">
              {nodeTypeLabels[node.node_type] || node.node_type}
            </Badge>
          </div>
          <SheetDescription>
            Edit the details of this story element.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden px-4">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-1.5">
              Attributes
              {attributeFields.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-5">
                  {filledAttributeCount}/{attributeFields.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-2">
            <TabsContent value="basic" className="space-y-6 py-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe this element in detail..."
                />
                <p className="text-xs text-muted-foreground">
                  This description is used by AI during scene generation.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Metadata</Label>
                <div className="rounded-md border p-3 space-y-1 text-sm text-muted-foreground">
                  <p>Created: {new Date(node.created_at).toLocaleString()}</p>
                  {node.updated_at && (
                    <p>Updated: {new Date(node.updated_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attributes" className="py-4 mt-0">
              <NodeAttributeEditor
                key={enrichVersion}
                nodeType={node.node_type}
                attributes={attributes}
                onChange={setAttributes}
                characterRole={characterRole}
                onCharacterRoleChange={setCharacterRole}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 py-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="notes">Private Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={12}
                  placeholder="Author notes (not used by AI)..."
                />
                <p className="text-xs text-muted-foreground">
                  These notes are for your reference only and are not included in AI context.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between border-t pt-4 mt-4 px-4 pb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isEnriching}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {node.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this story node and all its
                  connections. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEnrich}
              disabled={isEnriching || isSaving || enrichSuccess}
            >
              {enrichSuccess ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Enriched!
                </>
              ) : isEnriching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enrich
                </>
              )}
            </Button>

            <Button onClick={handleSave} disabled={isSaving || isEnriching || !name}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
