"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import type { CanvasAction, CanvasDimensions, Layer, Stroke } from "@/canvas/types";
import { useFillLayer } from "@/canvas/hooks/useFillLayer";
import { useCanvasRendering } from "@/canvas/hooks/useCanvasRendering";
import { renderStroke } from "@/canvas/utils/renderStroke";

type StateDeps = {
  actionsRef: { current: CanvasAction[] };
  layersRef: { current: Layer[] };
};

export function useCanvasState({ actionsRef, layersRef }: StateDeps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasScaleRef = useRef(1);
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

  const renderPreviewStroke = useCallback((stroke: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    redrawCanvas();
    renderStroke(context, stroke, canvasScaleRef.current);
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = window.devicePixelRatio || 1;
    canvasScaleRef.current = scale;
    canvas.width = Math.floor(canvasSize.width * scale);
    canvas.height = Math.floor(canvasSize.height * scale);

    initFillLayer();
    redrawCanvas();
  }, [canvasSize.height, canvasSize.width, initFillLayer, redrawCanvas]);

  return {
    canvasRef,
    canvasScaleRef,
    canvasSize,
    canvasSizeRef,
    fillLayerRef,
    initFillLayer,
    clearFillLayer,
    redrawCanvas,
    renderPreviewStroke,
    setCanvasSize,
  };
}
