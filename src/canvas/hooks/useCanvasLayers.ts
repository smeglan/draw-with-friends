"use client";

import { useCallback } from "react";
import type { CanvasAction, Layer } from "@/canvas/types";
import { createLayerId } from "@/canvas/types";

type LayerDeps = {
  setLayers: (layers: Layer[] | ((prev: Layer[]) => Layer[])) => void;
  layersRef: { current: Layer[] };
  setActiveLayerId: (id: string) => void;
  activeLayerIdRef: { current: string };
  actionsRef: { current: CanvasAction[] };
  clearRedoStack: () => void;
  redrawCanvas: () => void;
};

export function useCanvasLayers({
  setLayers,
  layersRef,
  setActiveLayerId,
  activeLayerIdRef,
  actionsRef,
  clearRedoStack,
  redrawCanvas,
}: LayerDeps) {
  const addLayer = useCallback(() => {
    const id = createLayerId();
    const current = layersRef.current;
    const newLayer: Layer = { id, name: `Capa ${current.length + 1}`, visible: true };
    const newLayers = [...current, newLayer];
    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
    redrawCanvas();
  }, [layersRef, setLayers, setActiveLayerId, activeLayerIdRef, redrawCanvas]);

  const removeLayer = useCallback((id: string) => {
    const current = layersRef.current;
    if (current.length <= 1) return;
    const newLayers = current.filter((l) => l.id !== id);
    actionsRef.current = actionsRef.current.filter((a) => a.layerId !== id);
    clearRedoStack();
    setLayers(newLayers);
    layersRef.current = newLayers;
    if (activeLayerIdRef.current === id) {
      const newId = newLayers.length > 0 ? newLayers[newLayers.length - 1].id : "";
      setActiveLayerId(newId);
      activeLayerIdRef.current = newId;
    }
    redrawCanvas();
  }, [layersRef, actionsRef, clearRedoStack, setLayers, setActiveLayerId, activeLayerIdRef, redrawCanvas]);

  const toggleLayerVisibility = useCallback((id: string) => {
    const newLayers = layersRef.current.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l,
    );
    setLayers(newLayers);
    layersRef.current = newLayers;
    redrawCanvas();
  }, [layersRef, setLayers, redrawCanvas]);

  const reorderLayer = useCallback((id: string, direction: "up" | "down") => {
    const current = layersRef.current;
    const idx = current.findIndex((l) => l.id === id);
    if (direction === "up" && idx >= current.length - 1) return;
    if (direction === "down" && idx <= 0) return;

    const newLayers = [...current];
    const swapIdx = direction === "up" ? idx + 1 : idx - 1;
    [newLayers[idx], newLayers[swapIdx]] = [newLayers[swapIdx], newLayers[idx]];
    setLayers(newLayers);
    layersRef.current = newLayers;
    redrawCanvas();
  }, [layersRef, setLayers, redrawCanvas]);

  const setActiveLayerHandler = useCallback((id: string) => {
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
  }, [setActiveLayerId, activeLayerIdRef]);

  return {
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    reorderLayer,
    setActiveLayer: setActiveLayerHandler,
  };
}
