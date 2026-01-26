"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Minimize2,
  Maximize2,
  RefreshCw,
  Eye,
  MessageCircle,
  Flame,
  Feather,
  ArrowRight,
  Check,
  Pencil,
} from "lucide-react";
import { EditAction, EDIT_ACTIONS } from "@/lib/ai/edit-prompts";

interface SelectionToolbarProps {
  rect: DOMRect;
  onAction: (action: EditAction, customPrompt?: string) => void;
  onDismiss: () => void;
}

const ACTION_ICONS: Record<EditAction, React.ReactNode> = {
  shorten: <Minimize2 className="h-3 w-3" />,
  expand: <Maximize2 className="h-3 w-3" />,
  rewrite: <RefreshCw className="h-3 w-3" />,
  show_dont_tell: <Eye className="h-3 w-3" />,
  dialogue: <MessageCircle className="h-3 w-3" />,
  intensify: <Flame className="h-3 w-3" />,
  soften: <Feather className="h-3 w-3" />,
  continue: <ArrowRight className="h-3 w-3" />,
  fix: <Check className="h-3 w-3" />,
  custom: <Pencil className="h-3 w-3" />,
};

export function SelectionToolbar({
  rect,
  onAction,
  onDismiss,
}: SelectionToolbarProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Measure toolbar width after mount for accurate positioning
  useEffect(() => {
    if (mounted && toolbarRef.current) {
      setMeasuredWidth(toolbarRef.current.offsetWidth);
    }
  }, [mounted]);

  // Position the toolbar above the selection (fixed positioning uses viewport coords)
  // rect from getBoundingClientRect() is already viewport-relative
  const toolbarHeight = 48;

  // Use measured width if available, otherwise estimate
  const toolbarWidth = measuredWidth || 520;

  // Clamp top to stay within viewport (at least 10px from top)
  const top = Math.max(10, rect.top - toolbarHeight - 8);

  // Center horizontally on selection, but keep within viewport
  const idealLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
  const left = Math.max(10, Math.min(idealLeft, window.innerWidth - toolbarWidth - 20));

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onDismiss]);

  const handleAction = (action: EditAction) => {
    if (action === "custom") {
      setShowCustomInput(true);
    } else {
      onAction(action);
    }
  };

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      onAction("custom", customPrompt);
      setShowCustomInput(false);
      setCustomPrompt("");
    }
  };

  if (!mounted) return null;

  const toolbar = (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <div className="flex items-center gap-0.5 rounded-lg border bg-popover/95 backdrop-blur-sm p-1 shadow-lg max-w-[calc(100vw-20px)]">
        {/* Core Actions */}
        <ActionButton
          action="shorten"
          icon={ACTION_ICONS.shorten}
          label={EDIT_ACTIONS.shorten.shortLabel}
          onClick={() => handleAction("shorten")}
        />
        <ActionButton
          action="expand"
          icon={ACTION_ICONS.expand}
          label={EDIT_ACTIONS.expand.shortLabel}
          onClick={() => handleAction("expand")}
        />
        <ActionButton
          action="rewrite"
          icon={ACTION_ICONS.rewrite}
          label={EDIT_ACTIONS.rewrite.shortLabel}
          onClick={() => handleAction("rewrite")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Fiction Actions */}
        <ActionButton
          action="show_dont_tell"
          icon={ACTION_ICONS.show_dont_tell}
          label={EDIT_ACTIONS.show_dont_tell.shortLabel}
          onClick={() => handleAction("show_dont_tell")}
        />
        <ActionButton
          action="dialogue"
          icon={ACTION_ICONS.dialogue}
          label={EDIT_ACTIONS.dialogue.shortLabel}
          onClick={() => handleAction("dialogue")}
        />
        <ActionButton
          action="intensify"
          icon={ACTION_ICONS.intensify}
          label={EDIT_ACTIONS.intensify.shortLabel}
          onClick={() => handleAction("intensify")}
        />
        <ActionButton
          action="soften"
          icon={ACTION_ICONS.soften}
          label={EDIT_ACTIONS.soften.shortLabel}
          onClick={() => handleAction("soften")}
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Utility Actions */}
        <ActionButton
          action="continue"
          icon={ACTION_ICONS.continue}
          label={EDIT_ACTIONS.continue.shortLabel}
          onClick={() => handleAction("continue")}
        />
        <ActionButton
          action="fix"
          icon={ACTION_ICONS.fix}
          label={EDIT_ACTIONS.fix.shortLabel}
          onClick={() => handleAction("fix")}
        />

        {/* Custom Action with Popover */}
        <Popover open={showCustomInput} onOpenChange={setShowCustomInput}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-xs"
              title={EDIT_ACTIONS.custom.description}
            >
              {ACTION_ICONS.custom}
              <span className="hidden sm:inline">
                {EDIT_ACTIONS.custom.shortLabel}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" side="bottom" align="end">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCustomSubmit();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Custom instruction..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-8">
                Go
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return createPortal(toolbar, document.body);
}

interface ActionButtonProps {
  action: EditAction;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick, action }: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 gap-1 text-xs"
      onClick={onClick}
      title={EDIT_ACTIONS[action].description}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
