"use client";

import { Icon } from "@/shared/icons";
import type { DrawingTool } from "@/canvas/types";
import type { IconName } from "@/shared/icons";

type ToolButtonProps = {
  tool: DrawingTool;
  label: string;
  isActive: boolean;
  onSelect: (tool: DrawingTool) => void;
};

const TOOL_ICON: Record<DrawingTool, IconName> = {
  brush: "brush",
  bucket: "bucket",
  eraser: "eraser",
  eyedropper: "eyedropper",
  shapes: "shapes",
  hand: "hand",
};

export function ToolButton({ tool, label, isActive, onSelect }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      className={[
        "group flex h-10 w-full items-center justify-center rounded-2xl border transition",
        isActive
          ? "border-cyan-300 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
          : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      aria-label={label}
      title={label}
    >
      <Icon name={TOOL_ICON[tool]} />
    </button>
  );
}
