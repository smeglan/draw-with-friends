"use client";

import { useRef, useEffect } from "react";
import type { CanvasAction, FillAction, Layer, Stroke } from "@/canvas/types";
import { isFillAction, isShapeAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { renderShapeOutline } from "@/canvas/utils/renderShape";
import { applyFillToImageData, getTargetColor, hexToRgba } from "@/canvas/utils/floodFill";

type LayerCache = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  renderedActions: CanvasAction[];
};

const areActionsEqual = (a: CanvasAction[], b: CanvasAction[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export function useCanvasRendering(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  actionsRef: { current: CanvasAction[] },
  canvasScaleRef: { current: number },
  layersRef: { current: Layer[] },
) {
  const layerCachesRef = useRef<Record<string, LayerCache>>({});
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const lastScaleRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Instantiate Web Worker for flood fill
    workerRef.current = new Worker(new URL('../utils/floodFill.worker.ts', import.meta.url));
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const getOrCreateLayerCache = (layerId: string, width: number, height: number): LayerCache => {
    let cache = layerCachesRef.current[layerId];
    if (!cache) {
      const auxCanvas = document.createElement("canvas");
      auxCanvas.width = width;
      auxCanvas.height = height;
      const auxContext = auxCanvas.getContext("2d")!;
      cache = {
        canvas: auxCanvas,
        context: auxContext,
        renderedActions: [],
      };
      layerCachesRef.current[layerId] = cache;
    }
    return cache;
  };

  const compositeLayers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const visibleLayers = layersRef.current.filter((l) => l.visible);
    for (const layer of visibleLayers) {
      const cache = getOrCreateLayerCache(layer.id, canvas.width, canvas.height);
      context.drawImage(cache.canvas, 0, 0);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentWidth = canvas.width;
    const currentHeight = canvas.height;
    const currentScale = canvasScaleRef.current;

    const sizeChanged =
      lastSizeRef.current.width !== currentWidth ||
      lastSizeRef.current.height !== currentHeight ||
      lastScaleRef.current !== currentScale;

    if (sizeChanged) {
      lastSizeRef.current = { width: currentWidth, height: currentHeight };
      lastScaleRef.current = currentScale;
      layerCachesRef.current = {};
    }

    const visibleLayers = layersRef.current.filter((l) => l.visible);

    // Clean up caches for layers that no longer exist
    const layerIds = new Set(layersRef.current.map((l) => l.id));
    for (const cachedId of Object.keys(layerCachesRef.current)) {
      if (!layerIds.has(cachedId)) {
        delete layerCachesRef.current[cachedId];
      }
    }

    for (const layer of visibleLayers) {
      const cache = getOrCreateLayerCache(layer.id, currentWidth, currentHeight);
      const layerActions = actionsRef.current.filter((action) => action.layerId === layer.id);

      if (areActionsEqual(layerActions, cache.renderedActions)) {
        continue;
      }

      // Check if this is a single new fill action appended to the previous state
      const isSingleNewFill =
        layerActions.length === cache.renderedActions.length + 1 &&
        isFillAction(layerActions[layerActions.length - 1]) &&
        areActionsEqual(layerActions.slice(0, -1), cache.renderedActions);

      if (isSingleNewFill && workerRef.current) {
        const fillAction = layerActions[layerActions.length - 1] as FillAction;
        const ctx = cache.context;
        const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight);
        const px = Math.round(fillAction.x * currentScale);
        const py = Math.round(fillAction.y * currentScale);
        const targetColor = getTargetColor(imageData, px, py, currentWidth);

        if (targetColor) {
          const fillColor = hexToRgba(fillAction.color);
          const colorsMatchDirect =
            targetColor[0] === fillColor[0] &&
            targetColor[1] === fillColor[1] &&
            targetColor[2] === fillColor[2] &&
            targetColor[3] === fillColor[3];

          if (!colorsMatchDirect) {
            // Execute on Web Worker
            const worker = workerRef.current;
            worker.onmessage = (e) => {
              const { data } = e.data;
              const newImgData = new ImageData(data, currentWidth, currentHeight);
              ctx.putImageData(newImgData, 0, 0);
              cache.renderedActions = layerActions;
              compositeLayers();
            };

            worker.postMessage(
              {
                data: imageData.data,
                width: currentWidth,
                height: currentHeight,
                startX: px,
                startY: py,
                targetColor,
                fillColor,
                tolerance: fillAction.tolerance,
              },
              [imageData.data.buffer]
            );
            
            // Skip the normal synchronous rebuild and wait for the worker response
            continue;
          }
        }
      }

      // Fallback: Synchronous rebuild of layer cache in chronological order
      const ctx = cache.context;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      for (const action of layerActions) {
        if (action.type === "raster") {
          if (action.imageData instanceof ImageData) {
            ctx.putImageData(action.imageData, 0, 0);
          } else {
            const { data, width, height } = action.imageData as unknown as {
              data: number[];
              width: number;
              height: number;
            };
            ctx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
          }
        } else if (action.type === "fill") {
          const imageData = ctx.getImageData(0, 0, currentWidth, currentHeight);
          applyFillToImageData(
            imageData,
            currentWidth,
            currentHeight,
            action.x,
            action.y,
            action.color,
            currentScale,
            action.tolerance
          );
          ctx.putImageData(imageData, 0, 0);
        } else if (isShapeAction(action)) {
          renderShapeOutline(ctx, action, currentScale);
        } else {
          renderStroke(ctx, action as Stroke, currentScale);
        }
      }

      cache.renderedActions = layerActions;
    }

    compositeLayers();
  };

  return { redrawCanvas };
}
