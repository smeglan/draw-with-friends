"use client";

import { useEffect, useState, useCallback } from "react";
import type { CanvasAction } from "@/canvas/types";

type HistoryDeps = {
  actionsRef: { current: CanvasAction[] };
  redoActionsRef: { current: CanvasAction[] };
  redrawCanvas: () => void;
  clearFillLayer: () => void;
};

export function useCanvasHistory({
  actionsRef,
  redoActionsRef,
  redrawCanvas,
  clearFillLayer,
}: HistoryDeps) {
  const [strokesCount, setStrokesCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const clearRedoStack = useCallback(() => {
    redoActionsRef.current = [];
    setRedoCount(0);
  }, [redoActionsRef]);

  const handleUndo = useCallback(() => {
    const lastAction = actionsRef.current[actionsRef.current.length - 1];
    if (!lastAction) return;
    actionsRef.current = actionsRef.current.slice(0, -1);
    redoActionsRef.current = [...redoActionsRef.current, lastAction];
    setStrokesCount(actionsRef.current.length);
    setRedoCount(redoActionsRef.current.length);
    redrawCanvas();
  }, [actionsRef, redoActionsRef, redrawCanvas]);

  const handleRedo = useCallback(() => {
    const redoAction = redoActionsRef.current[redoActionsRef.current.length - 1];
    if (!redoAction) return;

    redoActionsRef.current = redoActionsRef.current.slice(0, -1);
    actionsRef.current = [...actionsRef.current, redoAction];
    setStrokesCount(actionsRef.current.length);
    setRedoCount(redoActionsRef.current.length);
    redrawCanvas();
  }, [actionsRef, redoActionsRef, redrawCanvas]);

  const handleClear = useCallback(() => {
    actionsRef.current = [];
    clearRedoStack();
    clearFillLayer();
    setStrokesCount(0);
    redrawCanvas();
  }, [actionsRef, clearFillLayer, clearRedoStack, redrawCanvas]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if ((isMod && key === "y") || (isMod && key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

  return {
    actionsRef,
    redoActionsRef,
    strokesCount,
    redoCount,
    setStrokesCount,
    setRedoCount,
    handleUndo,
    handleRedo,
    handleClear,
    clearRedoStack,
  };
}
