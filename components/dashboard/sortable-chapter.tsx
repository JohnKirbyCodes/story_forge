"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableChapterProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableChapter({ id, children, disabled }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-90 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <button
          className={cn(
            "mt-4 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...attributes}
          {...listeners}
          suppressHydrationWarning
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {/* Chapter Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
