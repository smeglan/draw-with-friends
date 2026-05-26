"use client";

import { useState } from "react";
import { CustomColorBar } from "@/canvas/components/molecules/CustomColorBar";
import { PaletteManager } from "@/canvas/components/molecules/PaletteManager";
import type { SavedPalette } from "@/canvas/types";

type PaletteSectionProps = {
  customColors: (string | null)[];
  selectedSlotIndex: number;
  savedPalettes: SavedPalette[];
  activePaletteId: string | null;
  onCustomColorClick: (index: number, replace?: boolean) => void;
  onSavePalette: (name: string) => void;
  onCreatePalette: (name: string) => void;
  onSelectPalette: (paletteId: string) => void;
  onDeletePalette: (paletteId: string) => void;
  onExportPalette: (paletteId?: string) => void;
  onImportPaletteJson: (file: File) => void;
};

export function PaletteSection({
  customColors,
  selectedSlotIndex,
  savedPalettes,
  activePaletteId,
  onCustomColorClick,
  onSavePalette,
  onCreatePalette,
  onSelectPalette,
  onDeletePalette,
  onExportPalette,
  onImportPaletteJson,
}: PaletteSectionProps) {
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

  return (
    <>
      <CustomColorBar
        customColors={customColors}
        selectedSlotIndex={selectedSlotIndex}
        paletteMenuOpen={paletteMenuOpen}
        onCustomColorClick={onCustomColorClick}
        onTogglePaletteMenu={() => setPaletteMenuOpen((open) => !open)}
      />

      <div
        className={`w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition-all duration-200 ${
          paletteMenuOpen ? "max-h-[28rem] p-3 opacity-100" : "max-h-0 p-0 opacity-0"
        }`}
      >
        <PaletteManager
          savedPalettes={savedPalettes}
          activePaletteId={activePaletteId}
          onSavePalette={onSavePalette}
          onCreatePalette={onCreatePalette}
          onSelectPalette={onSelectPalette}
          onDeletePalette={onDeletePalette}
          onExportPalette={onExportPalette}
          onImportPaletteJson={onImportPaletteJson}
        />
      </div>
    </>
  );
}
