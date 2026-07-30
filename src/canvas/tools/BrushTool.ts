import type { DrawingTool, Point, Stroke, StrokeTool } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";

export class BrushTool implements ITool {
  readonly id: DrawingTool = "brush";
  protected strokeTool: StrokeTool = "brush";
  protected isDrawing = false;
  protected currentStroke: Stroke | null = null;
  protected lastPoint: Point | null = null;
  protected lastRenderPoint: Point | null = null;

  onPointerDown(point: Point, ctx: ToolContext): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.lastRenderPoint = point;

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

    const threshold = 1;
    const sampleSpacing = Math.max(4, ctx.brushSize * 0.6);
    const dx = point.x - this.lastPoint.x;
    const dy = point.y - this.lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    if (dist < threshold) return;

    const steps = Math.max(1, Math.ceil(dist / sampleSpacing));
    const start = this.lastPoint;
    let prevPoint = start;
    let prevRenderPoint = this.lastRenderPoint ?? start;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const next: Point = {
        x: start.x + dx * t,
        y: start.y + dy * t,
      };

      this.currentStroke.points.push(next);

      const midPoint: Point = {
        x: (prevPoint.x + next.x) / 2,
        y: (prevPoint.y + next.y) / 2,
      };

      if (this.currentStroke.points.length === 2 && i === 1) {
        ctx.renderStrokeSegment(prevRenderPoint, midPoint, this.currentStroke);
      } else {
        ctx.renderStrokeCurveSegment(prevRenderPoint, prevPoint, midPoint, this.currentStroke);
      }

      prevPoint = next;
      prevRenderPoint = midPoint;
    }

    this.lastPoint = prevPoint;
    this.lastRenderPoint = prevRenderPoint;
  }

  onPointerUp(ctx: ToolContext): void {
    if (!this.isDrawing) return;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      const finalPoint = this.lastPoint;
      const finalRenderPoint = this.lastRenderPoint;
      if (finalPoint && finalRenderPoint && (finalRenderPoint.x !== finalPoint.x || finalRenderPoint.y !== finalPoint.y)) {
        ctx.renderStrokeSegment(finalRenderPoint, finalPoint, this.currentStroke);
      }
      ctx.actionsRef.current = [...ctx.actionsRef.current, this.currentStroke];
      ctx.redrawCanvas();
    }
    this.isDrawing = false;
    this.currentStroke = null;
    this.lastPoint = null;
    this.lastRenderPoint = null;
  }
}
