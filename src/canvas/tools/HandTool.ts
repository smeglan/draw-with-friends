import type { DrawingTool, Point } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";

export class HandTool implements ITool {
  readonly id: DrawingTool = "hand";

  onPointerDown(_point: Point, _ctx: ToolContext): void {}

  onPointerMove(_point: Point, _ctx: ToolContext): void {}

  onPointerUp(_ctx: ToolContext): void {}
}
