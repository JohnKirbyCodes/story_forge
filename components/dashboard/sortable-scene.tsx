"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableSceneProps {
  id: string;
  chapterId: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableScene({ id, chapterId, children, disabled }: SortableSceneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "scene",
      chapterId,
    },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-90 shadow-lg rounded-lg"
      )}
    >
      <div className="flex items-center gap-1">
        {/* Drag Handle */}
        <button
          className={cn(
            "p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100",
            disabled && "opacity-0 cursor-not-allowed"
          )}
          {...attributes}
          {...listeners}
          suppressHydrationWarning
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {/* Scene Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
