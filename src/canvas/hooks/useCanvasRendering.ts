"use client";

import type { CanvasAction } from "@/canvas/types";
import { isFillAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";

export function useCanvasRendering(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  fillLayerRef: React.RefObject<HTMLCanvasElement | null>,
  actionsRef: { current: CanvasAction[] },
  canvasBackgroundColorRef: { current: string },
  canvasScaleRef: { current: number },
) {
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const scale = canvasScaleRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = canvasBackgroundColorRef.current;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (fillLayerRef.current) {
      context.drawImage(fillLayerRef.current, 0, 0);
    }

    for (const action of actionsRef.current) {
      if (!isFillAction(action)) {
        renderStroke(context, action, scale);
      }
    }
  };

  return { redrawCanvas };
}
