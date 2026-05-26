"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { QUICK_COLORS } from "@/shared/constants/drawing";
import type { SavedPalette } from "@/canvas/types";

const PALETTE_STORAGE_KEY = "los-pibes-que-dibujan:palettes";
const ACTIVE_PALETTE_STORAGE_KEY = "los-pibes-que-dibujan:active-palette-id";
const PALETTE_SLOT_COUNT = QUICK_COLORS.length + 8;

function createDefaultPaletteColors() {
  return [...QUICK_COLORS, ...Array(8).fill(null)] as (string | null)[];
}

function normalizePaletteColors(colors: unknown): (string | null)[] {
  const source = Array.isArray(colors) ? colors : [];
  return Array.from({ length: PALETTE_SLOT_COUNT }, (_, index) => {
    const value = source[index];
    return typeof value === "string" && value.trim() ? value : null;
  });
}

function createPaletteFromColors(name: string, colors: (string | null)[]): SavedPalette {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Paleta",
    colors: normalizePaletteColors(colors),
    createdAt: now,
    updatedAt: now,
  };
}

function findFirstColor(colors: (string | null)[]) {
  return colors.find((color): color is string => Boolean(color)) ?? QUICK_COLORS[0];
}

function readStoredPalettes(): SavedPalette[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const palette = entry as Partial<SavedPalette>;
        if (typeof palette.name !== "string") return null;
        return {
          id: typeof palette.id === "string" && palette.id ? palette.id : crypto.randomUUID(),
          name: palette.name,
          colors: normalizePaletteColors(palette.colors),
          createdAt: typeof palette.createdAt === "string" ? palette.createdAt : new Date().toISOString(),
          updatedAt: typeof palette.updatedAt === "string" ? palette.updatedAt : new Date().toISOString(),
        } satisfies SavedPalette;
      })
      .filter((palette): palette is SavedPalette => palette !== null);
  } catch {
    return [];
  }
}

type PaletteDeps = {
  brushColor: string;
  setBrushColor: (color: string) => void;
};

export function useCanvasPalettes({ brushColor, setBrushColor }: PaletteDeps) {
  const [customColors, setCustomColors] = useState<(string | null)[]>(() => createDefaultPaletteColors());
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const selectedSlotIndexRef = useRef(-1);

  useEffect(() => {
    const palettes = readStoredPalettes();
    setSavedPalettes(palettes);

    if (typeof window === "undefined") return;

    const storedActivePaletteId = window.localStorage.getItem(ACTIVE_PALETTE_STORAGE_KEY);
    if (!storedActivePaletteId) return;

    const activePalette = palettes.find((palette) => palette.id === storedActivePaletteId);
    if (!activePalette) return;

    setActivePaletteId(activePalette.id);
    setCustomColors(activePalette.colors);
    setBrushColor(findFirstColor(activePalette.colors));
  }, [setBrushColor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(savedPalettes));
  }, [savedPalettes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activePaletteId) {
      window.localStorage.setItem(ACTIVE_PALETTE_STORAGE_KEY, activePaletteId);
    } else {
      window.localStorage.removeItem(ACTIVE_PALETTE_STORAGE_KEY);
    }
  }, [activePaletteId]);

  const handleWheelColorChange = (color: string) => {
    setBrushColor(color);
    const idx = selectedSlotIndexRef.current;
    if (idx >= 0) {
      setCustomColors((prev) => {
        const next = [...prev];
        next[idx] = color;
        return next;
      });
    }
  };

  const handleCustomColorClick = (index: number, replace = false) => {
    setSelectedSlotIndex(index);
    selectedSlotIndexRef.current = index;
    const color = customColors[index];
    if (color !== null && !replace) {
      setBrushColor(color);
    } else {
      setCustomColors((prev) => {
        const next = [...prev];
        next[index] = brushColor;
        return next;
      });
    }
  };

  const savePaletteToState = useCallback((name: string, forceCreateNew: boolean) => {
    const now = new Date().toISOString();
    const paletteName = name.trim() || `Paleta ${savedPalettes.length + 1}`;
    const existingId = !forceCreateNew && activePaletteId && savedPalettes.some((p) => p.id === activePaletteId)
      ? activePaletteId
      : null;

    if (existingId) {
      setSavedPalettes((prev) =>
        prev.map((palette) =>
          palette.id === existingId
            ? { ...palette, name: paletteName, colors: [...customColors], updatedAt: now }
            : palette,
        ),
      );
      setActivePaletteId(existingId);
      return;
    }

    const newPalette = createPaletteFromColors(paletteName, customColors);
    setSavedPalettes((prev) => [...prev, newPalette]);
    setActivePaletteId(newPalette.id);
  }, [activePaletteId, customColors, savedPalettes]);

  const handleSavePalette = useCallback((name: string) => {
    savePaletteToState(name, false);
  }, [savePaletteToState]);

  const handleCreatePalette = useCallback((name: string) => {
    savePaletteToState(name, true);
  }, [savePaletteToState]);

  const handleSelectPalette = useCallback((paletteId: string) => {
    const palette = savedPalettes.find((entry) => entry.id === paletteId);
    if (!palette) return;

    setCustomColors([...palette.colors]);
    setBrushColor(findFirstColor(palette.colors));
    setActivePaletteId(palette.id);
  }, [savedPalettes, setBrushColor]);

  const handleDeletePalette = useCallback((paletteId: string) => {
    setSavedPalettes((prev) => prev.filter((palette) => palette.id !== paletteId));

    if (activePaletteId === paletteId) {
      setActivePaletteId(null);
      const fallback = createDefaultPaletteColors();
      setCustomColors(fallback);
      setBrushColor(findFirstColor(fallback));
    }
  }, [activePaletteId, setBrushColor]);

  const handleExportPalette = useCallback((paletteId?: string) => {
    const palette =
      (paletteId ? savedPalettes.find((entry) => entry.id === paletteId) : null) ?? {
        id: "current",
        name: "Paleta actual",
        colors: customColors,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    const payload = { version: 1, palette };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${palette.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [customColors, savedPalettes]);

  const handleImportPaletteJson = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      const imported: SavedPalette[] = [];

      const pushPalette = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        const candidate = value as Partial<SavedPalette>;
        if (!Array.isArray(candidate.colors)) return;
        imported.push({
          id: crypto.randomUUID(),
          name: typeof candidate.name === "string" && candidate.name.trim()
            ? candidate.name.trim()
            : `Paleta importada ${imported.length + 1}`,
          colors: normalizePaletteColors(candidate.colors),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      };

      if (parsed && typeof parsed === "object" && "palette" in parsed) {
        pushPalette((parsed as { palette?: unknown }).palette);
      } else if (parsed && typeof parsed === "object" && "palettes" in parsed && Array.isArray((parsed as { palettes?: unknown }).palettes)) {
        for (const palette of (parsed as { palettes: unknown[] }).palettes) {
          pushPalette(palette);
        }
      } else {
        pushPalette(parsed);
      }

      if (imported.length === 0) return;

      setSavedPalettes((prev) => [...prev, ...imported]);
      setActivePaletteId(imported[imported.length - 1].id);
      setCustomColors([...imported[imported.length - 1].colors]);
      setBrushColor(findFirstColor(imported[imported.length - 1].colors));
    } catch {
      // Ignore malformed JSON to keep the UI forgiving.
    }
  }, [setBrushColor]);

  return {
    customColors,
    savedPalettes,
    activePaletteId,
    selectedSlotIndex,
    setCustomColors,
    setActivePaletteId,
    handleWheelColorChange,
    handleCustomColorClick,
    handleSavePalette,
    handleCreatePalette,
    handleSelectPalette,
    handleDeletePalette,
    handleExportPalette,
    handleImportPaletteJson,
  };
}
