"use client";

import type { CanvasAction, FillAction, Layer, Stroke } from "@/canvas/types";
import { isFillAction, isShapeAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { renderShapeOutline } from "@/canvas/utils/renderShape";
import { applyFillToImageData } from "@/canvas/utils/floodFill";

export function useCanvasRendering(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  actionsRef: { current: CanvasAction[] },
  canvasScaleRef: { current: number },
  layersRef: { current: Layer[] },
) {
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const scale = canvasScaleRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const visibleLayers = layersRef.current.filter((l) => l.visible);
    if (visibleLayers.length === 0) return;

    for (const layer of visibleLayers) {
      const layerActions: (Stroke | CanvasAction)[] = [];
      const layerFills: FillAction[] = [];

      for (const action of actionsRef.current) {
        if (action.layerId !== layer.id) continue;
        if (isFillAction(action)) {
          layerFills.push(action);
        } else {
          layerActions.push(action);
        }
      }

      for (const action of layerActions) {
        if (isShapeAction(action)) {
          renderShapeOutline(context, action, scale);
        } else {
          renderStroke(context, action as Stroke, scale);
        }
      }

      if (layerFills.length > 0) {
        if (layerActions.length === 0) {
          const lastFill = layerFills[layerFills.length - 1];
          context.fillStyle = lastFill.color;
          context.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          for (const action of layerFills) {
            applyFillToImageData(
              imageData,
              canvas.width,
              canvas.height,
              action.x,
              action.y,
              action.color,
              scale,
              action.tolerance,
            );
          }
          context.putImageData(imageData, 0, 0);
        }
      }
    }
  };

  return { redrawCanvas };
}
