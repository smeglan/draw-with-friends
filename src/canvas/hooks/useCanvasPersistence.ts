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
  interactionRef: { current: "idle" | "drawing" | "panning" | "pinching" };
  onRestore: (data: ProjectFile) => void;
};

export function useCanvasPersistence({
  actionsRef,
  layersRef,
  activeLayerIdRef,
  canvasSizeRef,
  interactionRef,
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
      // localStorage and JSON.stringify are synchronous. Never run them
      // while the user is dragging, zooming, or drawing.
      if (interactionRef.current !== "idle") {
        triggerAutosave();
        return;
      }

      const save = () => autosaveSave(gatherData());
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      };

      if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(save, { timeout: 2000 });
      } else {
        window.setTimeout(save, 0);
      }
    }, 500);
  }, [gatherData, interactionRef]);

  return {
    saveToFile,
    openFile,
    hasAutosave,
    restoreAutosave,
    clearAutosave,
    triggerAutosave,
  };
}
