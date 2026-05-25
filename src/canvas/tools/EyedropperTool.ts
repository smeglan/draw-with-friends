import type { Point } from "@/canvas/types";
import type { ITool, ToolContext } from "@/canvas/tools/ITool";

export class EyedropperTool implements ITool {
  readonly id = "eyedropper" as const;

  onPointerDown(point: Point, ctx: ToolContext): void {
    const canvas = ctx.canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const x = Math.floor(point.x * ctx.scale);
    const y = Math.floor(point.y * ctx.scale);
    const { data } = context.getImageData(x, y, 1, 1);
    const [red, green, blue, alpha] = data;
    if (alpha === 0) return;

    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    ctx.setBrushColor(`#${toHex(red)}${toHex(green)}${toHex(blue)}`);
    ctx.setActiveTool("brush");
  }

  onPointerMove(_point: unknown, _ctx: ToolContext): void {
    void _point;
    void _ctx;
  }

  onPointerUp(_ctx: ToolContext): void {
    void _ctx;
  }
}
