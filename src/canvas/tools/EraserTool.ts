import { BrushTool } from "@/canvas/tools/BrushTool";
import type { Point, DrawingTool, Stroke, StrokeTool, CanvasAction } from "@/canvas/types";
import { isFillAction } from "@/canvas/types";
import type { ToolContext } from "@/canvas/tools/ITool";

export class EraserTool extends BrushTool {
  readonly id: DrawingTool = "eraser";
  protected strokeTool: StrokeTool = "eraser";

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.eraseInRect(point, point, ctx);
    ctx.redrawCanvas();
    this.drawEraserSquare(point, ctx);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    if (!this.isDrawing || !this.lastPoint) return;
    this.eraseInRect(this.lastPoint, point, ctx);
    ctx.redrawCanvas();
    this.drawEraserSquare(point, ctx);
    this.lastPoint = point;
  }

  onPointerUp(ctx: ToolContext): void {
    ctx.redrawCanvas();
    this.isDrawing = false;
    this.currentStroke = null;
    this.lastPoint = null;
  }

  private eraseInRect(from: Point, to: Point, ctx: ToolContext): void {
    const halfSize = ctx.brushSize / 2;
    const minX = Math.min(from.x, to.x) - halfSize;
    const minY = Math.min(from.y, to.y) - halfSize;
    const maxX = Math.max(from.x, to.x) + halfSize;
    const maxY = Math.max(from.y, to.y) + halfSize;

    let changed = false;
    const remaining: CanvasAction[] = ctx.actionsRef.current.flatMap(
      (action): CanvasAction[] => {
        if (isFillAction(action)) return [action];
        if (action.tool === "eraser") return [action];
        const parts = this.cutStrokeInRect(action, minX, minY, maxX, maxY);
        if (parts.length !== 1 || parts[0] !== action) changed = true;
        return parts;
      },
    );

    if (changed) {
      ctx.actionsRef.current = remaining;
    }

    const fillCanvas = ctx.fillLayerRef?.current;
    if (fillCanvas) {
      const fillCtx = fillCanvas.getContext("2d");
      if (fillCtx) {
        const s = ctx.scale;
        fillCtx.clearRect(
          Math.round(minX * s),
          Math.round(minY * s),
          Math.round((maxX - minX) * s),
          Math.round((maxY - minY) * s),
        );
      }
    }
  }

  private cutStrokeInRect(
    stroke: Stroke,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): Stroke[] {
    const strokeBounds = this.strokeBounds(stroke);
    if (!this.boundsOverlap(strokeBounds, { minX, minY, maxX, maxY })) {
      return [stroke];
    }

    const pointCount = stroke.points.length;
    const erased = new Array<boolean>(pointCount).fill(false);

    for (let i = 0; i < pointCount; i++) {
      const p = stroke.points[i];
      if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) {
        erased[i] = true;
      }
    }

    if (!erased.some(Boolean)) return [stroke];

    const result: Stroke[] = [];
    let start = -1;

    for (let i = 0; i <= pointCount; i++) {
      if (i < pointCount && !erased[i]) {
        if (start === -1) start = i;
      } else if (start !== -1) {
        result.push({
          type: "stroke",
          tool: stroke.tool,
          color: stroke.color,
          size: stroke.size,
          points: stroke.points.slice(start, i),
        });
        start = -1;
      }
    }

    return result;
  }

  private drawEraserSquare(point: Point, ctx: ToolContext): void {
    const canvas = ctx.canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const halfSize = ctx.brushSize / 2;
    const s = ctx.scale;

    context.save();
    context.strokeStyle = "#94a3b8";
    context.lineWidth = 1.5 * s;
    context.setLineDash([5 * s, 4 * s]);
    context.strokeRect(
      (point.x - halfSize) * s,
      (point.y - halfSize) * s,
      ctx.brushSize * s,
      ctx.brushSize * s,
    );
    context.restore();
  }

  private strokeBounds(stroke: Stroke) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY };
  }

  private boundsOverlap(
    a: { minX: number; minY: number; maxX: number; maxY: number },
    b: { minX: number; minY: number; maxX: number; maxY: number },
  ): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
  }
}
