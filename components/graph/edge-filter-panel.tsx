"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Eye, EyeOff, X } from "lucide-react";
import { RELATIONSHIP_TYPES } from "@/lib/story-universe-schema";

// Extract unique categories from relationship types
const getAllCategories = () => {
  const categories = new Set<string>();
  Object.values(RELATIONSHIP_TYPES).forEach((types) => {
    types.forEach((type) => {
      categories.add(type.category);
    });
  });
  return Array.from(categories).sort();
};

interface EdgeFilterPanelProps {
  focusedNodeIds: string[];
  onFocusChange: (nodeIds: string[]) => void;
  hiddenCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  onHideAllCategories: () => void;
  onShowAllCategories: () => void;
  onClearFilters: () => void;
  edgeCount: number;
  visibleEdgeCount: number;
}

export function EdgeFilterPanel({
  focusedNodeIds,
  onFocusChange,
  hiddenCategories,
  onCategoryToggle,
  onHideAllCategories,
  onShowAllCategories,
  onClearFilters,
  edgeCount,
  visibleEdgeCount,
}: EdgeFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const categories = getAllCategories();

  const hasActiveFilters = hiddenCategories.size > 0 || focusedNodeIds.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant={hasActiveFilters ? "default" : "outline"}
          className="bg-background"
        >
          <Filter className="mr-2 h-4 w-4" />
          Connections
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {visibleEdgeCount}/{edgeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter Connections</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onClearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          {/* Focus Mode Info */}
          {focusedNodeIds.length > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 dark:text-blue-300">
                  Focusing on {focusedNodeIds.length} node{focusedNodeIds.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => onFocusChange([])}
                >
                  Clear focus
                </Button>
              </div>
              <p className="text-blue-600 dark:text-blue-400 mt-1">
                Only showing connections to selected nodes
              </p>
            </div>
          )}

          <Separator />

          {/* Category Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Filter by Category
              </Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={onShowAllCategories}
                  disabled={hiddenCategories.size === 0}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={onHideAllCategories}
                  disabled={hiddenCategories.size === categories.length}
                >
                  <EyeOff className="mr-1 h-3 w-3" />
                  None
                </Button>
              </div>
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-3">
                {categories.map((category) => {
                  const isHidden = hiddenCategories.has(category);
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2">
                        {isHidden ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-green-600" />
                        )}
                        <span className={`text-sm ${isHidden ? "text-muted-foreground" : ""}`}>
                          {category}
                        </span>
                      </div>
                      <Switch
                        checked={!isHidden}
                        onCheckedChange={() => onCategoryToggle(category)}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Stats */}
          <div className="text-xs text-muted-foreground text-center">
            Showing {visibleEdgeCount} of {edgeCount} connections
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
