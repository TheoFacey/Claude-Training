"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolCallLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const rawPath = typeof args.path === "string" ? args.path : "";
  const filename = rawPath ? rawPath.split("/").pop() || rawPath : "";

  if (toolName === "str_replace_editor") {
    const command = typeof args.command === "string" ? args.command : "";
    switch (command) {
      case "create":      return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace": return filename ? `Editing ${filename}` : "Editing file";
      case "insert":      return filename ? `Editing ${filename}` : "Editing file";
      case "view":        return filename ? `Reading ${filename}` : "Reading file";
      case "undo_edit":   return filename ? `Undoing edit in ${filename}` : "Undoing edit";
    }
  }

  if (toolName === "file_manager") {
    const command = typeof args.command === "string" ? args.command : "";
    switch (command) {
      case "rename": return filename ? `Renaming ${filename}` : "Renaming file";
      case "delete": return filename ? `Deleting ${filename}` : "Deleting file";
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolCallLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>
  );
  const isCompleted =
    toolInvocation.state === "result" && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
