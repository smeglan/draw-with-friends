import type { Point, ShapeAction, DrawingTool, ShapeType } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";
import { renderShapeOutline } from "@/canvas/utils/renderShape";

export class ShapesTool implements ITool {
  readonly id: DrawingTool = "shapes";
  private isDrawing = false;
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  private shapeType: ShapeType = "rectangle";

  setShapeType(type: ShapeType) {
    this.shapeType = type;
  }

  onPointerDown(point: Point, _ctx: ToolContext): void {
    this.isDrawing = true;
    this.startPoint = point;
    this.endPoint = point;
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return;

    this.endPoint = point;

    const previewCanvas = ctx.previewCanvasRef?.current;
    if (!previewCanvas) return;
    const previewCtx = previewCanvas.getContext("2d");
    if (!previewCtx) return;

    // Clear the preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    const preview: ShapeAction = {
      type: "shape",
      shape: this.shapeType,
      startX: this.startPoint.x,
      startY: this.startPoint.y,
      endX: point.x,
      endY: point.y,
      color: ctx.brushColor,
      size: ctx.brushSize,
      opacity: ctx.brushOpacity,
      layerId: ctx.activeLayerId,
    };

    renderShapeOutline(previewCtx, preview, ctx.scale);
  }

  onPointerUp(ctx: ToolContext): void {
    if (!this.isDrawing || !this.startPoint || !this.endPoint) {
      this.isDrawing = false;
      this.startPoint = null;
      this.endPoint = null;
      return;
    }

    const action: ShapeAction = {
      type: "shape",
      shape: this.shapeType,
      startX: this.startPoint.x,
      startY: this.startPoint.y,
      endX: this.endPoint.x,
      endY: this.endPoint.y,
      color: ctx.brushColor,
      size: ctx.brushSize,
      opacity: ctx.brushOpacity,
      layerId: ctx.activeLayerId,
    };

    // Clear the preview canvas
    const previewCanvas = ctx.previewCanvasRef?.current;
    if (previewCanvas) {
      const previewCtx = previewCanvas.getContext("2d");
      previewCtx?.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }

    ctx.actionsRef.current = [...ctx.actionsRef.current, action];
    ctx.redrawCanvas();

    this.isDrawing = false;
    this.startPoint = null;
    this.endPoint = null;
  }
}
