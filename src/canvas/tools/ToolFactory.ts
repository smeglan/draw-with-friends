import type { DrawingTool } from "@/canvas/types";
import type { ITool } from "@/canvas/tools/ITool";
import { BrushTool } from "@/canvas/tools/BrushTool";
import { EraserTool } from "@/canvas/tools/EraserTool";
import { BucketTool } from "@/canvas/tools/BucketTool";
import { EyedropperTool } from "@/canvas/tools/EyedropperTool";

export class ToolFactory {
  private cache = new Map<DrawingTool, ITool>();

  getTool(type: DrawingTool): ITool {
    const existing = this.cache.get(type);
    if (existing) return existing;

    const tool = this.createTool(type);
    this.cache.set(type, tool);
    return tool;
  }

  private createTool(type: DrawingTool): ITool {
    switch (type) {
      case "brush":
        return new BrushTool();
      case "eraser":
        return new EraserTool();
      case "bucket":
        return new BucketTool();
      case "eyedropper":
        return new EyedropperTool();
    }
  }
}
