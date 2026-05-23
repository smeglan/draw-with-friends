export type Point = {
  x: number;
  y: number;
};

export type StrokeTool = "brush" | "eraser";

export type Stroke = {
  tool: StrokeTool;
  color: string;
  size: number;
  points: Point[];
};
