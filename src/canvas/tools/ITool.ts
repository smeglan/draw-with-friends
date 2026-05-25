import type { RefObject } from "react";
import type { CanvasAction, DrawingTool, Point } from "@/canvas/types";

export type ToolContext = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  fillLayerRef: RefObject<HTMLCanvasElement | null>;
  scale: number;
  brushColor: string;
  brushSize: number;
  bucketSensitivity: number;
  actionsRef: { current: CanvasAction[] };
  setBrushColor: (color: string) => void;
  setActiveTool: (tool: DrawingTool) => void;
  updateCanvasBackgroundColor: (color: string) => void;
  redrawCanvas: () => void;
};

export interface ITool {
  readonly id: DrawingTool;
  onPointerDown(point: Point, ctx: ToolContext): void;
  onPointerMove(point: Point, ctx: ToolContext): void;
  onPointerUp(ctx: ToolContext): void;
}
