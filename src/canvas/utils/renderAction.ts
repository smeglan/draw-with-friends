import type { CanvasAction } from "@/canvas/types";
import { isFillAction, isShapeAction } from "@/canvas/types";
import { renderShapeOutline } from "@/canvas/utils/renderShape";
import { applyFillToImageData } from "@/canvas/utils/floodFill";
import { renderStroke } from "@/canvas/utils/renderStroke";

type RenderActionOptions = {
  canvasWidth: number;
  canvasHeight: number;
  canvasScale: number;
};

function putRasterImageData(ctx: CanvasRenderingContext2D, action: Extract<CanvasAction, { type: "raster" }>) {
  if (action.imageData instanceof ImageData) {
    ctx.putImageData(action.imageData, 0, 0);
    return;
  }

  const { data, width, height } = action.imageData as unknown as {
    data: number[];
    width: number;
    height: number;
  };

  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
}

export function renderCanvasAction(
  ctx: CanvasRenderingContext2D,
  action: CanvasAction,
  { canvasWidth, canvasHeight, canvasScale }: RenderActionOptions,
) {
  if (action.type === "raster") {
    putRasterImageData(ctx, action);
    return;
  }

  if (isFillAction(action)) {
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    applyFillToImageData(
      imageData,
      canvasWidth,
      canvasHeight,
      action.x,
      action.y,
      action.color,
      canvasScale,
      action.tolerance,
    );
    ctx.putImageData(imageData, 0, 0);
    return;
  }

  if (isShapeAction(action)) {
    renderShapeOutline(ctx, action, canvasScale);
    return;
  }

  renderStroke(ctx, action, canvasScale);
}
