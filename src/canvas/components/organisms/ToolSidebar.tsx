"use client";

import { useEffect, useState } from "react";
import { ColorWheel } from "@/canvas/components/atoms/ColorWheel";
import { CustomColorSlots } from "@/canvas/components/molecules/CustomColorSlots";
import { ToolButton } from "@/canvas/components/molecules/ToolButton";
import type { DrawingTool } from "@/canvas/types";

type ToolSidebarProps = {
  activeTool: DrawingTool;
  brushColor: string;
  canvasBackgroundColor: string;
  customColors: (string | null)[];
  selectedSlotIndex: number;
  onToolSelect: (tool: DrawingTool) => void;
  onColorSelect: (color: string) => void;
  onWheelColorChange: (color: string) => void;
  onToggleBackground: () => void;
  onCustomColorClick: (index: number, replace?: boolean) => void;
};

export function ToolSidebar({
  activeTool,
  brushColor,
  canvasBackgroundColor,
  customColors,
  selectedSlotIndex,
  onToolSelect,
  onColorSelect,
  onWheelColorChange,
  onToggleBackground,
  onCustomColorClick,
}: ToolSidebarProps) {
  const [hexInput, setHexInput] = useState(brushColor);

  useEffect(() => {
    setHexInput(brushColor);
  }, [brushColor]);

  const submitHex = () => {
    const val = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val) && val !== brushColor) {
      onWheelColorChange(val);
    } else {
      setHexInput(brushColor);
    }
  };

  return (
    <aside className="flex h-full w-52 flex-col gap-3 border-r border-white/10 bg-black/20 p-3 backdrop-blur-md">
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="w-full truncate text-[10px] uppercase tracking-[0.08em] text-slate-300">
          Colores
        </p>

        <div className="flex h-10 w-full overflow-hidden rounded-lg border border-white/15">
          <div className="flex-1" style={{ backgroundColor: brushColor }} />
          <button
            type="button"
            className="w-10 border-l border-white/15 transition hover:scale-105"
            style={{ backgroundColor: "#000000" }}
            onClick={() => onColorSelect("#000000")}
            aria-label="Negro"
          />
          <button
            type="button"
            className="w-10 border-l border-white/15 transition hover:scale-105"
            style={{ backgroundColor: "#ffffff" }}
            onClick={() => onColorSelect("#ffffff")}
            aria-label="Blanco"
          />
        </div>

        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={submitHex}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitHex();
            if (e.key === "Escape") setHexInput(brushColor);
          }}
          className="w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-center text-xs text-white placeholder-slate-500"
          placeholder="#000000"
        />

        <ColorWheel selectedColor={brushColor} onColorChange={onWheelColorChange} />

        <div className="w-full border-t border-white/10 pt-2">
          <p className="mb-1.5 w-full truncate text-[10px] uppercase tracking-[0.08em] text-slate-400">
            Paleta
          </p>
          <CustomColorSlots
            colors={customColors}
            selectedIndex={selectedSlotIndex}
            onSlotClick={onCustomColorClick}
          />
        </div>
      </div>

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

      <button
        type="button"
        onClick={onToggleBackground}
        className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition hover:bg-white/15"
        title="Cambiar color del canvas"
      >
        {canvasBackgroundColor === "#ffffff" ? "Blanco" : "Negro"}
      </button>
    </aside>
  );
}
