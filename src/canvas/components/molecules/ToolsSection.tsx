"use client";

import { useCallback, useState } from "react";
import { ToolButton } from "@/canvas/components/molecules/ToolButton";
import { ShapeMenu } from "@/canvas/components/organisms/ShapeMenu";
import type { DrawingTool, ShapeType } from "@/canvas/types";

type ToolConfig = {
  id: DrawingTool;
  label: string;
};

type ToolsSectionProps = {
  activeTool: DrawingTool;
  selectedShape: ShapeType;
  onToolSelect: (tool: DrawingTool) => void;
  onShapeSelect: (shape: ShapeType) => void;
};

const TOOLS: ToolConfig[] = [
  { id: "brush", label: "Pincel" },
  { id: "bucket", label: "Balde" },
  { id: "eraser", label: "Borrador" },
  { id: "eyedropper", label: "Cuenta gotas" },
  { id: "hand", label: "Mano" },
];

const SHAPE_SVG: Record<ShapeType, React.ReactNode> = {
  rectangle: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  ellipse: <ellipse cx="12" cy="12" rx="7.5" ry="5.5" />,
  triangle: <polygon points="12 5 5 19 19 19" />,
  line: <line x1="6" y1="18" x2="18" y2="6" />,
};

export function ToolsSection({ activeTool, selectedShape, onToolSelect, onShapeSelect }: ToolsSectionProps) {
  const [shapeButtonEl, setShapeButtonEl] = useState<HTMLButtonElement | null>(null);
  const shapeButtonRef = useCallback((el: HTMLButtonElement | null) => setShapeButtonEl(el), []);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
      <p className="w-full text-center text-[10px] uppercase tracking-[0.08em] text-slate-300">
        Herramientas
      </p>
      <div className="grid w-full grid-cols-3 gap-2">
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool.id}
            label={tool.label}
            isActive={activeTool === tool.id}
            onSelect={onToolSelect}
          />
        ))}
      </div>

      <button
        ref={shapeButtonRef}
        type="button"
        onClick={() => setShapeMenuOpen((open) => !open)}
        aria-expanded={shapeMenuOpen}
        className={[
          "mt-2 flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition",
          activeTool === "shapes"
            ? "border-cyan-300 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
            : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        title="Elegir forma"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              {SHAPE_SVG[selectedShape]}
            </svg>
          </span>
          <span className="truncate text-xs font-medium">Figuras</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-3 h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${
            shapeMenuOpen ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <ShapeMenu
        open={shapeMenuOpen}
        anchorEl={shapeButtonEl}
        selectedShape={selectedShape}
        onSelect={(shape) => {
          onShapeSelect(shape);
          setShapeMenuOpen(false);
        }}
        onClose={() => setShapeMenuOpen(false)}
      />
    </div>
  );
}
