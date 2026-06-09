"use client";

import { useCallback, useState } from "react";
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
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  const toggleLayerSelection = useCallback((id: string) => {
    setSelectedLayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clearLayerSelection = useCallback(() => {
    setSelectedLayerIds([]);
  }, []);

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

  const deleteSelected = useCallback(() => {
    const current = layersRef.current;
    const remaining = current.filter((l) => !selectedLayerIds.includes(l.id));
    if (remaining.length < 1) return;

    for (const id of selectedLayerIds) {
      actionsRef.current = actionsRef.current.filter((a) => a.layerId !== id);
    }
    clearRedoStack();
    setLayers(remaining);
    layersRef.current = remaining;

    if (selectedLayerIds.includes(activeLayerIdRef.current)) {
      const newId = remaining[remaining.length - 1].id;
      setActiveLayerId(newId);
      activeLayerIdRef.current = newId;
    }
    setSelectedLayerIds([]);
    redrawCanvas();
  }, [layersRef, actionsRef, clearRedoStack, setLayers, setActiveLayerId, activeLayerIdRef, selectedLayerIds, redrawCanvas]);

  const mergeLayerDown = useCallback((id: string) => {
    const current = layersRef.current;
    const idx = current.findIndex((l) => l.id === id);
    if (idx <= 0) return;

    const targetId = current[idx - 1].id;

    actionsRef.current = actionsRef.current.map((action) =>
      action.layerId === id ? { ...action, layerId: targetId } : action,
    );

    const newLayers = current.filter((l) => l.id !== id);
    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId(targetId);
    activeLayerIdRef.current = targetId;
    setSelectedLayerIds([]);
    clearRedoStack();
    redrawCanvas();
  }, [layersRef, actionsRef, setLayers, setActiveLayerId, activeLayerIdRef, clearRedoStack, redrawCanvas]);

  const mergeSelected = useCallback(() => {
    const current = layersRef.current;
    const selected = current.filter((l) => selectedLayerIds.includes(l.id));
    if (selected.length < 2) {
      mergeLayerDown(selected.length === 1 ? selected[0].id : activeLayerIdRef.current);
      return;
    }

    const sorted = [...selected].sort(
      (a, b) => current.indexOf(a) - current.indexOf(b),
    );
    const bottomId = sorted[0].id;
    const removeIds = new Set(sorted.slice(1).map((l) => l.id));

    actionsRef.current = actionsRef.current.map((action) =>
      removeIds.has(action.layerId) ? { ...action, layerId: bottomId } : action,
    );

    const newLayers = current.filter((l) => !removeIds.has(l.id));
    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId(bottomId);
    activeLayerIdRef.current = bottomId;
    setSelectedLayerIds([]);
    clearRedoStack();
    redrawCanvas();
  }, [layersRef, actionsRef, setLayers, setActiveLayerId, activeLayerIdRef, clearRedoStack, redrawCanvas, selectedLayerIds, mergeLayerDown]);

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
    selectedLayerIds,
    toggleLayerSelection,
    clearLayerSelection,
    mergeSelected,
    deleteSelected,
  };
}
