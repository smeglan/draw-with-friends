import type { DrawingTool, Point, Stroke, StrokeTool } from "@/canvas/types";
import {
  renderStrokeDot,
  renderStrokeSegment,
} from "@/canvas/utils/renderStroke";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";

export class BrushTool implements ITool {
  readonly id: DrawingTool = "brush";
  protected strokeTool: StrokeTool = "brush";
  protected isDrawing = false;
  protected currentStroke: Stroke | null = null;
  protected lastPoint: Point | null = null;

  onPointerDown(point: Point, ctx: ToolContext): void {
    const canvas = ctx.canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    this.isDrawing = true;
    this.lastPoint = point;

    const stroke: Stroke = {
      type: "stroke",
      tool: this.strokeTool,
      color: ctx.brushColor,
      size: ctx.brushSize,
      points: [point],
    };
    this.currentStroke = stroke;
    renderStrokeDot(context, point, stroke, ctx.scale);
  }

  onPointerMove(point: Point, ctx: ToolContext): void {
    const canvas = ctx.canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !this.isDrawing || !this.currentStroke || !this.lastPoint) return;

    this.currentStroke.points.push(point);
    renderStrokeSegment(context, this.lastPoint, point, this.currentStroke, ctx.scale);
    this.lastPoint = point;
  }

  onPointerUp(ctx: ToolContext): void {
    if (!this.isDrawing) return;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      ctx.actionsRef.current = [...ctx.actionsRef.current, this.currentStroke];
    }
    this.isDrawing = false;
    this.currentStroke = null;
    this.lastPoint = null;
  }
}
