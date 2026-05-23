"use client";

import { QUICK_COLORS } from "@/shared/constants/drawing";
import { ColorSwatch } from "@/canvas/components/atoms/ColorSwatch";
import { ToolButton } from "@/canvas/components/molecules/ToolButton";
import type { DrawingTool } from "@/canvas/hooks/useDrawingBoard";

type ToolSidebarProps = {
  activeTool: DrawingTool;
  brushColor: string;
  canvasBackgroundColor: string;
  onToolSelect: (tool: DrawingTool) => void;
  onColorSelect: (color: string) => void;
  onToggleBackground: () => void;
};

export function ToolSidebar({
  activeTool,
  brushColor,
  canvasBackgroundColor,
  onToolSelect,
  onColorSelect,
  onToggleBackground,
}: ToolSidebarProps) {
  return (
    <aside className="flex h-full w-24 flex-col gap-3 border-r border-white/10 bg-black/20 p-3 backdrop-blur-md">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <p className="w-full truncate text-[10px] uppercase tracking-[0.08em] text-slate-300">
          Herramientas
        </p>
        <div className="flex flex-col gap-2">
          <ToolButton
            tool="brush"
            label="Pincel"
            isActive={activeTool === "brush"}
            onSelect={onToolSelect}
          />
          <ToolButton
            tool="bucket"
            label="Balde"
            isActive={activeTool === "bucket"}
            onSelect={onToolSelect}
          />
          <ToolButton
            tool="eraser"
            label="Borrador"
            isActive={activeTool === "eraser"}
            onSelect={onToolSelect}
          />
          <ToolButton
            tool="eyedropper"
            label="Cuenta gotas"
            isActive={activeTool === "eyedropper"}
            onSelect={onToolSelect}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
        <p className="w-full truncate text-[10px] uppercase tracking-[0.08em] text-slate-300">
          Colores
        </p>
        <div className="flex flex-col items-center gap-2">
          {QUICK_COLORS.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              isActive={brushColor === color}
              onSelect={onColorSelect}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleBackground}
        className="mt-auto rounded-2xl border border-white/10 bg-white/10 px-2 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition hover:bg-white/15"
        title="Cambiar color del canvas"
      >
        {canvasBackgroundColor === "#ffffff" ? "Blanco" : "Negro"}
      </button>
    </aside>
  );
}
