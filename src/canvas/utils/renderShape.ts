import type { ShapeAction } from "@/canvas/types";

export function renderShapeOutline(
  ctx: CanvasRenderingContext2D,
  shape: ShapeAction,
  canvasScale: number,
) {
  const s = canvasScale;
  const x1 = shape.startX * s;
  const y1 = shape.startY * s;
  const x2 = shape.endX * s;
  const y2 = shape.endY * s;
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);
  const w = maxX - minX;
  const h = maxY - minY;

  ctx.save();
  ctx.globalAlpha = shape.opacity / 100;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.size * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (shape.shape) {
    case "rectangle":
      ctx.strokeRect(minX, minY, w, h);
      break;

    case "ellipse": {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "triangle":
      ctx.beginPath();
      ctx.moveTo((x1 + x2) / 2, minY);
      ctx.lineTo(minX, maxY);
      ctx.lineTo(maxX, maxY);
      ctx.closePath();
      ctx.stroke();
      break;

    case "line":
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;
  }

  ctx.restore();
}
