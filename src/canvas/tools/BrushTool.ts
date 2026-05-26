import type { DrawingTool, Point, Stroke, StrokeTool } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";

export class BrushTool implements ITool {
  readonly id: DrawingTool = "brush";
  protected strokeTool: StrokeTool = "brush";
  protected isDrawing = false;
  protected currentStroke: Stroke | null = null;
  protected lastPoint: Point | null = null;

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.isDrawing = true;
    this.lastPoint = point;

    const stroke: Stroke = {
      type: "stroke",
      tool: this.strokeTool,
      color: ctx.brushColor,
      size: ctx.brushSize,
      points: [point],
      layerId: ctx.activeLayerId,
      opacity: ctx.brushOpacity,
    };
    this.currentStroke = stroke;

    ctx.renderStrokeDot(point, stroke);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    if (!this.isDrawing || !this.currentStroke || !this.lastPoint) return;

    const threshold = 2;
    const dx = point.x - this.lastPoint.x;
    const dy = point.y - this.lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const steps = Math.max(1, Math.ceil(dist / threshold));
    const start = this.lastPoint;
    let prev: Point = start;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const next: Point = {
        x: start.x + dx * t,
        y: start.y + dy * t,
      };
      this.currentStroke.points.push(next);
      ctx.renderStrokeSegment(prev, next, this.currentStroke);
      prev = next;
    }

    this.lastPoint = prev;
  }

  onPointerUp(ctx: ToolContext): void {
    if (!this.isDrawing) return;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      ctx.actionsRef.current = [...ctx.actionsRef.current, this.currentStroke];
      ctx.redrawCanvas();
    }
    this.isDrawing = false;
    this.currentStroke = null;
    this.lastPoint = null;
  }
}
