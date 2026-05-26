export type Point = {
  x: number;
  y: number;
};

export type StrokeTool = "brush" | "eraser";
export type DrawingTool = "brush" | "bucket" | "eraser" | "eyedropper" | "shapes" | "hand";
export type ShapeType = "rectangle" | "ellipse" | "triangle" | "line";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
};

export type CanvasDimensions = {
  width: number;
  height: number;
};

export type CanvasSizePreset = CanvasDimensions & {
  id: string;
  label: string;
};

export type Stroke = {
  type: "stroke";
  tool: StrokeTool;
  color: string;
  size: number;
  points: Point[];
  layerId: string;
  opacity: number;
};

export type FillAction = {
  type: "fill";
  x: number;
  y: number;
  color: string;
  tolerance: number;
  layerId: string;
};

export type ShapeAction = {
  type: "shape";
  shape: ShapeType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  opacity: number;
  layerId: string;
};

export type SavedPalette = {
  id: string;
  name: string;
  colors: (string | null)[];
  createdAt: string;
  updatedAt: string;
};

export type CanvasAction = Stroke | FillAction | ShapeAction;

export function isFillAction(action: CanvasAction): action is FillAction {
  return action.type === "fill";
}

export function isShapeAction(action: CanvasAction): action is ShapeAction {
  return action.type === "shape";
}

export function createLayerId(): string {
  return crypto.randomUUID();
}
