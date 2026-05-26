import type { CanvasAction, Layer, Stroke } from "@/canvas/types";
import { isShapeAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { renderShapeOutline } from "@/canvas/utils/renderShape";
import { applyFillToImageData } from "@/canvas/utils/floodFill";

export function consolidateActions(
  actions: CanvasAction[],
  layers: Layer[],
  width: number,
  height: number,
  scale: number
): CanvasAction[] {
  let updatedActions = [...actions];

  for (const layer of layers) {
    const layerActions = updatedActions.filter((a) => a.layerId === layer.id);
    if (layerActions.length > 8) {
      const toConsolidateCount = layerActions.length - 8;
      const toConsolidate = layerActions.slice(0, toConsolidateCount);

      // Create an offscreen canvas to render the consolidated actions
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      // Draw the consolidated actions onto this canvas
      for (const action of toConsolidate) {
        if (action.type === "raster") {
          ctx.putImageData(action.imageData, 0, 0);
        } else if (action.type === "fill") {
          const imageData = ctx.getImageData(0, 0, width, height);
          applyFillToImageData(
            imageData,
            width,
            height,
            action.x,
            action.y,
            action.color,
            scale,
            action.tolerance
          );
          ctx.putImageData(imageData, 0, 0);
        } else if (isShapeAction(action)) {
          renderShapeOutline(ctx, action, scale);
        } else {
          renderStroke(ctx, action as Stroke, scale);
        }
      }

      const consolidatedImageData = ctx.getImageData(0, 0, width, height);
      const rasterAction: CanvasAction = {
        type: "raster",
        imageData: consolidatedImageData,
        layerId: layer.id,
      };

      // Replace consolidated actions with the raster action
      const firstIndex = updatedActions.indexOf(toConsolidate[0]);
      if (firstIndex !== -1) {
        const toConsolidateSet = new Set(toConsolidate);
        updatedActions = updatedActions.filter((a) => !toConsolidateSet.has(a));
        updatedActions.splice(firstIndex, 0, rasterAction);
      }
    }
  }

  return updatedActions;
}
