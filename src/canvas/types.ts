export type Point = {
  x: number;
  y: number;
};

export type StrokeTool = "brush" | "eraser";
export type DrawingTool = "brush" | "bucket" | "eraser" | "eyedropper";

export type Stroke = {
  type: "stroke";
  tool: StrokeTool;
  color: string;
  size: number;
  points: Point[];
};

export type FillAction = {
  type: "fill";
  x: number;
  y: number;
  color: string;
  tolerance: number;
};

export type CanvasAction = Stroke | FillAction;

export function isFillAction(action: CanvasAction): action is FillAction {
  return action.type === "fill";
}
