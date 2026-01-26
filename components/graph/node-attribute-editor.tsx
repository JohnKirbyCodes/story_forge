"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/ui/tags-input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NODE_ATTRIBUTES,
  CHARACTER_ROLES,
  type AttributeField,
} from "@/lib/story-universe-schema";

interface NodeAttributeEditorProps {
  nodeType: string;
  attributes: Record<string, unknown>;
  onChange: (attributes: Record<string, unknown>) => void;
  characterRole?: string | null;
  onCharacterRoleChange?: (role: string | null) => void;
}

export function NodeAttributeEditor({
  nodeType,
  attributes,
  onChange,
  characterRole,
  onCharacterRoleChange,
}: NodeAttributeEditorProps) {
  const fields = NODE_ATTRIBUTES[nodeType] || [];

  // Group fields by their group property
  const groupedFields = useMemo(() => {
    const groups: Record<string, AttributeField[]> = {};
    fields.forEach((field) => {
      const group = field.group || "General";
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    });
    return groups;
  }, [fields]);

  const updateAttribute = (key: string, value: unknown) => {
    const newAttrs = { ...attributes };
    if (value === "" || value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      delete newAttrs[key];
    } else {
      newAttrs[key] = value;
    }
    onChange(newAttrs);
  };

  const renderField = (field: AttributeField) => {
    const value = attributes[field.key];

    switch (field.type) {
      case "text":
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => updateAttribute(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => updateAttribute(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => updateAttribute(field.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "tags":
        return (
          <TagsInput
            value={(value as string[]) || []}
            onChange={(v) => updateAttribute(field.key, v)}
            placeholder={field.placeholder}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={(value as boolean) || false}
              onCheckedChange={(v) => updateAttribute(field.key, v)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "Yes" : "No"}
            </span>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as number) || ""}
            onChange={(e) =>
              updateAttribute(
                field.key,
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder={field.placeholder}
          />
        );

      default:
        return (
          <Input
            value={(value as string) || ""}
            onChange={(e) => updateAttribute(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const groupNames = Object.keys(groupedFields);

  return (
    <div className="space-y-4">
      {/* Character Role (for characters only) */}
      {nodeType === "character" && onCharacterRoleChange && (
        <div className="space-y-2 pb-4 border-b">
          <Label>Story Role</Label>
          <Select
            value={characterRole || "__none__"}
            onValueChange={(v) => onCharacterRoleChange(v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {CHARACTER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex flex-col">
                    <span>{role.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {role.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Attribute Groups */}
      {groupNames.length > 0 && (
        <Accordion type="multiple" defaultValue={[groupNames[0]]} className="w-full">
          {groupNames.map((groupName) => (
            <AccordionItem key={groupName} value={groupName}>
              <AccordionTrigger className="text-sm font-medium">
                {groupName}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {groupedFields[groupName].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-sm">{field.label}</Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
