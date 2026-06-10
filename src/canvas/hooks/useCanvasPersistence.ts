"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasAction, CanvasDimensions, Layer } from "@/canvas/types";
import {
  exportToFile,
  importFromFile,
  autosaveSave,
  autosaveLoad,
  autosaveClear,
  type ProjectFile,
} from "@/canvas/utils/projectFile";

type Deps = {
  actionsRef: { current: CanvasAction[] };
  layersRef: { current: Layer[] };
  activeLayerIdRef: { current: string };
  canvasSizeRef: { current: CanvasDimensions };
  onRestore: (data: ProjectFile) => void;
};

export function useCanvasPersistence({
  actionsRef,
  layersRef,
  activeLayerIdRef,
  canvasSizeRef,
  onRestore,
}: Deps) {
  const [hasAutosave, setHasAutosave] = useState(() => autosaveLoad() !== null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const gatherData = useCallback(
    (): ProjectFile => ({
      format: "los-pibes-que-dibujan",
      version: 1,
      canvasSize: { ...canvasSizeRef.current },
      layers: layersRef.current.map((l) => ({ ...l })),
      activeLayerId: activeLayerIdRef.current,
      actions: actionsRef.current.map((a) => ({ ...a })),
    }),
    [actionsRef, layersRef, activeLayerIdRef, canvasSizeRef],
  );

  const saveToFile = useCallback(() => {
    exportToFile(gatherData());
  }, [gatherData]);

  const openFile = useCallback(async () => {
    try {
      const data = await importFromFile();
      onRestore(data);
      autosaveClear();
      setHasAutosave(false);
    } catch {
      /* usuario canceló o archivo inválido */
    }
  }, [onRestore]);

  const restoreAutosave = useCallback(() => {
    const data = autosaveLoad();
    if (!data) return;
    onRestore(data);
    autosaveClear();
    setHasAutosave(false);
  }, [onRestore]);

  const clearAutosave = useCallback(() => {
    autosaveClear();
    setHasAutosave(false);
  }, []);

  const triggerAutosave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autosaveSave(gatherData());
    }, 500);
  }, [gatherData]);

  return {
    saveToFile,
    openFile,
    hasAutosave,
    restoreAutosave,
    clearAutosave,
    triggerAutosave,
  };
}
