"use client";

import { useRef } from "react";
import type { CanvasAction, Layer } from "@/canvas/types";

export function useFillLayer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  _canvasScaleRef: { current: number },
  _actionsRef: { current: CanvasAction[] },
) {
  const fillLayerRef = useRef<HTMLCanvasElement | null>(null);
  const fillLayerHistoryRef = useRef<ImageData[]>([]);

  const initFillLayer = () => {};

  const processFillToLayer = () => {};

  const clearFillLayer = () => {};

  const rebuildFillLayerFromScratch = (
    _layers: Layer[],
    _allActions: CanvasAction[],
  ) => {};

  return {
    fillLayerRef,
    fillLayerHistoryRef,
    initFillLayer,
    processFillToLayer,
    clearFillLayer,
    rebuildFillLayerFromScratch,
  };
}
