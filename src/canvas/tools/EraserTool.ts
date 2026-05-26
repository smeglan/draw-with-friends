import { BrushTool } from "@/canvas/tools/BrushTool";
import type { DrawingTool, StrokeTool } from "@/canvas/types";

export class EraserTool extends BrushTool {
  readonly id: DrawingTool = "eraser";
  protected strokeTool: StrokeTool = "eraser";
}
