"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { StoryNode } from "@/types/database";

interface StoryNodeData extends StoryNode {
  color: string;
  icon: React.ReactNode;
}

export const StoryNodeComponent = memo(function StoryNodeComponent({
  data,
  selected,
}: NodeProps<StoryNodeData>) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !border-background !w-3 !h-3"
      />
      <Card
        className={`min-w-[150px] max-w-[200px] cursor-pointer transition-all ${
          selected ? "ring-2 ring-primary" : ""
        }`}
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: data.color,
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: data.color + "20", color: data.color }}
            >
              {data.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{data.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {data.node_type}
              </p>
            </div>
          </div>
          {data.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-background !w-3 !h-3"
      />
    </>
  );
});
