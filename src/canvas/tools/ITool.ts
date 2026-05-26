import type { RefObject } from "react";
import type { CanvasAction, DrawingTool, Point, Stroke } from "@/canvas/types";

export type ToolContext = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  fillLayerRef: RefObject<HTMLCanvasElement | null>;
  scale: number;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  bucketSensitivity: number;
  actionsRef: { current: CanvasAction[] };
  setBrushColor: (color: string) => void;
  setActiveTool: (tool: DrawingTool) => void;
  redrawCanvas: () => void;
  renderStrokeSegment: (from: Point, to: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => void;
  renderStrokeDot: (point: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => void;
  activeLayerId: string;
};

export interface ITool {
  readonly id: DrawingTool;
  onPointerDown(point: Point, ctx: ToolContext): void;
  onPointerMove(point: Point, ctx: ToolContext): void;
  onPointerUp(ctx: ToolContext): void;
}
