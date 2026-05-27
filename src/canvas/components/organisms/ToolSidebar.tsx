"use client";

import { ColorSection } from "@/canvas/components/molecules/ColorSection";
import { PaletteSection } from "@/canvas/components/molecules/PaletteSection";
import { ToolsSection } from "@/canvas/components/molecules/ToolsSection";
import { Icon } from "@/shared/icons";
import type { DrawingTool, SavedPalette, ShapeType } from "@/canvas/types";

type ToolSidebarProps = {
  activeTool: DrawingTool;
  brushColor: string;
  customColors: (string | null)[];
  selectedSlotIndex: number;
  selectedShape: ShapeType;
  savedPalettes: SavedPalette[];
  activePaletteId: string | null;
  onToolSelect: (tool: DrawingTool) => void;
  onColorSelect: (color: string) => void;
  onWheelColorChange: (color: string) => void;
  onCustomColorClick: (index: number, replace?: boolean) => void;
  onShapeSelect: (shape: ShapeType) => void;
  onSavePalette: (name: string) => void;
  onCreatePalette: (name: string) => void;
  onSelectPalette: (paletteId: string) => void;
  onDeletePalette: (paletteId: string) => void;
  onExportPalette: (paletteId?: string) => void;
  onImportPaletteJson: (file: File) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

export function ToolSidebar({
  activeTool,
  brushColor,
  customColors,
  selectedSlotIndex,
  onToolSelect,
  onColorSelect,
  onWheelColorChange,
  onCustomColorClick,
  selectedShape,
  savedPalettes,
  activePaletteId,
  onShapeSelect,
  onSavePalette,
  onCreatePalette,
  onSelectPalette,
  onDeletePalette,
  onExportPalette,
  onImportPaletteJson,
  isMobileOpen,
  onCloseMobile,
}: ToolSidebarProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCloseMobile}
        aria-label="Cerrar menu"
        className={[
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] transition-opacity lg:hidden",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[min(84vw,19rem)] flex-col gap-3 border-r border-white/10 bg-black/20 p-2 backdrop-blur-md transition-transform duration-300 sm:p-3 lg:sticky lg:top-0 lg:z-auto lg:h-[100dvh] lg:w-80 lg:overflow-y-auto xl:w-96 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 lg:hidden">
          <div className="flex items-center gap-2">
            <Icon name="menu" className="h-4 w-4 text-slate-300" />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Menu</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar menu"
            title="Cerrar menu"
          >
            <Icon name="chevronDown" className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <ColorSection
            brushColor={brushColor}
            onColorSelect={onColorSelect}
            onWheelColorChange={onWheelColorChange}
          />

          <PaletteSection
            customColors={customColors}
            selectedSlotIndex={selectedSlotIndex}
            onCustomColorClick={onCustomColorClick}
            savedPalettes={savedPalettes}
            activePaletteId={activePaletteId}
            onSavePalette={onSavePalette}
            onCreatePalette={onCreatePalette}
            onSelectPalette={onSelectPalette}
            onDeletePalette={onDeletePalette}
            onExportPalette={onExportPalette}
            onImportPaletteJson={onImportPaletteJson}
          />

          <ToolsSection
            activeTool={activeTool}
            selectedShape={selectedShape}
            onToolSelect={onToolSelect}
            onShapeSelect={onShapeSelect}
          />
        </div>
      </aside>
    </>
  );
}
