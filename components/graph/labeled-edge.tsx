"use client";

import { memo, useState, useCallback, useRef } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "reactflow";
import { cn } from "@/lib/utils";
import { GripHorizontal } from "lucide-react";

interface LabeledEdgeData {
  offset?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  label?: string;
  relationship_type?: string;
  is_bidirectional?: boolean;
  weight?: number;
  isFocused?: boolean;
  isDimmed?: boolean;
  onLabelDrag?: (edgeId: string, offsetX: number, offsetY: number) => void;
}

export const LabeledEdge = memo(function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
  style,
  selected,
}: EdgeProps<LabeledEdgeData>) {
  const { getZoom } = useReactFlow();
  const zoom = getZoom();

  // Local drag state
  const [isDragging, setIsDragging] = useState(false);
  const [localOffset, setLocalOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Calculate offset for parallel edges
  const offset = data?.offset || 0;

  // Calculate perpendicular offset direction
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = len > 0 ? -dy / len : 0;
  const perpY = len > 0 ? dx / len : 0;

  // Apply offset to source and target
  const offsetSourceX = sourceX + perpX * offset;
  const offsetSourceY = sourceY + perpY * offset;
  const offsetTargetX = targetX + perpX * offset;
  const offsetTargetY = targetY + perpY * offset;

  // Get bezier path with offset
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: offsetSourceX,
    sourceY: offsetSourceY,
    sourcePosition,
    targetX: offsetTargetX,
    targetY: offsetTargetY,
    targetPosition,
    curvature: 0.25,
  });

  // Get stored label offset from data, or use local offset while dragging
  const storedOffsetX = data?.labelOffsetX || 0;
  const storedOffsetY = data?.labelOffsetY || 0;
  const finalLabelX = labelX + (isDragging ? localOffset.x : storedOffsetX);
  const finalLabelY = labelY + (isDragging ? localOffset.y : storedOffsetY);

  // Determine if edge should be dimmed (focus mode)
  const isDimmed = data?.isDimmed || false;
  const isFocused = data?.isFocused || false;

  // Calculate label font size based on zoom
  const baseFontSize = 11;
  const fontSize = Math.max(9, Math.min(14, baseFontSize / Math.max(0.5, zoom)));

  // Get display label
  const displayLabel = label || data?.label || data?.relationship_type || "";

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: storedOffsetX,
      offsetY: storedOffsetY,
    };
    setLocalOffset({ x: storedOffsetX, y: storedOffsetY });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (moveEvent.clientY - dragStartRef.current.y) / zoom;
      setLocalOffset({
        x: dragStartRef.current.offsetX + deltaX,
        y: dragStartRef.current.offsetY + deltaY,
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = (upEvent.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (upEvent.clientY - dragStartRef.current.y) / zoom;
      const finalX = dragStartRef.current.offsetX + deltaX;
      const finalY = dragStartRef.current.offsetY + deltaY;

      setIsDragging(false);

      // Notify parent of new position
      if (data?.onLabelDrag) {
        data.onLabelDrag(id, finalX, finalY);
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [id, zoom, storedOffsetX, storedOffsetY, data]);

  // Double-click to reset position
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (data?.onLabelDrag) {
      data.onLabelDrag(id, 0, 0);
    }
  }, [id, data]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "#3b82f6" : isDimmed ? "#d1d5db" : "#64748b",
          strokeWidth: selected ? 2.5 : isFocused ? 2 : isDimmed ? 1 : 1.5,
          opacity: isDimmed ? 0.3 : 1,
          transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s",
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute pointer-events-auto select-none",
              "px-2 py-0.5 rounded-full text-xs font-medium",
              "border shadow-sm transition-colors duration-150",
              "flex items-center gap-1",
              isDragging
                ? "cursor-grabbing ring-2 ring-blue-400 ring-offset-1"
                : "cursor-grab",
              selected
                ? "bg-blue-500 text-white border-blue-600"
                : isDimmed
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${finalLabelX}px, ${finalLabelY}px)`,
              fontSize: `${fontSize}px`,
              opacity: isDimmed ? 0.5 : 1,
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Drag to reposition, double-click to reset"
          >
            <GripHorizontal className="h-3 w-3 opacity-40" />
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export default LabeledEdge;
