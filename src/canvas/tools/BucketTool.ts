import type { Point, FillAction, DrawingTool } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";
import { applyFillToCanvas } from "@/canvas/utils/floodFill";

export class BucketTool implements ITool {
  readonly id: DrawingTool = "bucket";

  onPointerDown(point: Point, ctx: ToolContext): void {
    const canvas = ctx.canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const fillAction: FillAction = {
      type: "fill",
      x: point.x,
      y: point.y,
      color: ctx.brushColor,
      tolerance: ctx.bucketSensitivity,
    };

    ctx.actionsRef.current = [...ctx.actionsRef.current, fillAction];
  }

  onPointerMove(_point: Point, _ctx: ToolContext): void {}

  onPointerUp(_ctx: ToolContext): void {}
}
