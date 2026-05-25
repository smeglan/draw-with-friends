"use client";

import { useRef } from "react";
import type { CanvasAction } from "@/canvas/types";
import { isFillAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { applyFillToCanvas } from "@/canvas/utils/floodFill";

export function useFillLayer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  canvasScaleRef: { current: number },
  actionsRef: { current: CanvasAction[] },
) {
  const fillLayerRef = useRef<HTMLCanvasElement | null>(null);
  const fillLayerHistoryRef = useRef<ImageData[]>([]);

  const initFillLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      !fillLayerRef.current ||
      fillLayerRef.current.width !== canvas.width ||
      fillLayerRef.current.height !== canvas.height
    ) {
      fillLayerRef.current = document.createElement("canvas");
      fillLayerRef.current.width = canvas.width;
      fillLayerRef.current.height = canvas.height;
    }
  };

  const processFillToLayer = (action: CanvasAction) => {
    if (!isFillAction(action)) return;

    const canvas = canvasRef.current;
    if (!canvas || !fillLayerRef.current) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = canvasScaleRef.current;

    const fillCtx = fillLayerRef.current.getContext("2d");
    if (!fillCtx) return;

    fillLayerHistoryRef.current.push(
      fillCtx.getImageData(0, 0, w, h),
    );

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(fillLayerRef.current, 0, 0);

    for (const a of actionsRef.current) {
      if (!isFillAction(a)) {
        renderStroke(tempCtx, a, scale);
      }
    }

    const beforeData = tempCtx.getImageData(0, 0, w, h);

    applyFillToCanvas(
      tempCtx,
      tempCanvas,
      action.x,
      action.y,
      action.color,
      scale,
      action.tolerance,
    );

    const afterData = tempCtx.getImageData(0, 0, w, h);

    const fillPixels = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < beforeData.data.length; i += 4) {
      const changed =
        beforeData.data[i] !== afterData.data[i] ||
        beforeData.data[i + 1] !== afterData.data[i + 1] ||
        beforeData.data[i + 2] !== afterData.data[i + 2] ||
        beforeData.data[i + 3] !== afterData.data[i + 3];
      if (changed) {
        fillPixels[i] = afterData.data[i];
        fillPixels[i + 1] = afterData.data[i + 1];
        fillPixels[i + 2] = afterData.data[i + 2];
        fillPixels[i + 3] = afterData.data[i + 3];
      }
    }

    const fillImageData = new ImageData(fillPixels, w, h);
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resultCtx = resultCanvas.getContext("2d");
    if (!resultCtx) return;
    resultCtx.putImageData(fillImageData, 0, 0);

    fillCtx.drawImage(resultCanvas, 0, 0);
  };

  const clearFillLayer = () => {
    fillLayerHistoryRef.current = [];
    if (fillLayerRef.current) {
      const fillCtx = fillLayerRef.current.getContext("2d");
      if (fillCtx) {
        fillCtx.clearRect(
          0,
          0,
          fillLayerRef.current.width,
          fillLayerRef.current.height,
        );
      }
    }
  };

  return {
    fillLayerRef,
    fillLayerHistoryRef,
    initFillLayer,
    processFillToLayer,
    clearFillLayer,
  };
}
