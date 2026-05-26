"use client";

import type { CanvasAction, Layer } from "@/canvas/types";
import { isFillAction, isShapeAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { renderShapeOutline } from "@/canvas/utils/renderShape";
import { applyFillToCanvas } from "@/canvas/utils/floodFill";

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

    const orderedLayerIds = layersRef.current
      .filter((l) => l.visible)
      .map((l) => l.id);

    for (const layerId of orderedLayerIds) {
      for (const action of actionsRef.current) {
        if (action.layerId !== layerId) continue;

        if (isFillAction(action)) {
          applyFillToCanvas(
            context,
            canvas,
            action.x,
            action.y,
            action.color,
            scale,
            action.tolerance,
          );
        } else if (isShapeAction(action)) {
          renderShapeOutline(context, action, scale);
        } else {
          renderStroke(context, action, scale);
        }
      }
    }
  };

  return { redrawCanvas };
}
