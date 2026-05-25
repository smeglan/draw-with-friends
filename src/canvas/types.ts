export type Point = {
  x: number;
  y: number;
};

export type StrokeTool = "brush" | "eraser";
export type DrawingTool = "brush" | "bucket" | "eraser" | "eyedropper";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
};

export type Stroke = {
  type: "stroke";
  tool: StrokeTool;
  color: string;
  size: number;
  points: Point[];
  layerId: string;
};

export type FillAction = {
  type: "fill";
  x: number;
  y: number;
  color: string;
  tolerance: number;
  layerId: string;
};

export type CanvasAction = Stroke | FillAction;

export function isFillAction(action: CanvasAction): action is FillAction {
  return action.type === "fill";
}

export function createLayerId(): string {
  return crypto.randomUUID();
}
