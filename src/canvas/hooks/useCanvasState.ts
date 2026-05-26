"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { CanvasAction, CanvasDimensions, Layer } from "@/canvas/types";
import { useFillLayer } from "@/canvas/hooks/useFillLayer";
import { useCanvasRendering } from "@/canvas/hooks/useCanvasRendering";

type StateDeps = {
  actionsRef: { current: CanvasAction[] };
  layersRef: { current: Layer[] };
};

export function useCanvasState({ actionsRef, layersRef }: StateDeps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasScaleRef = useRef(1);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasDimensions>({
    width: 1920,
    height: 1080,
  });
  const canvasSizeRef = useRef(canvasSize);

  const { fillLayerRef, initFillLayer, clearFillLayer } = useFillLayer(
    canvasRef,
    canvasScaleRef,
    actionsRef,
  );

  const { redrawCanvas } = useCanvasRendering(
    canvasRef,
    actionsRef,
    canvasScaleRef,
    layersRef,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasScaleRef.current = scale;
    canvas.width = Math.floor(canvasSize.width * scale);
    canvas.height = Math.floor(canvasSize.height * scale);

    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
    }

    initFillLayer();
    redrawCanvas();
  }, [canvasSize.height, canvasSize.width, initFillLayer, redrawCanvas]);

  return {
    canvasRef,
    previewCanvasRef,
    canvasScaleRef,
    canvasSize,
    canvasSizeRef,
    fillLayerRef,
    initFillLayer,
    clearFillLayer,
    redrawCanvas,
    setCanvasSize,
  };
}
