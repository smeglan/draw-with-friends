import type { Point, Stroke } from "@/canvas/types";

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasScale: number,
) {
  const points = stroke.points;
  if (points.length === 0) return;

  const s = canvasScale;

  ctx.save();
  ctx.globalAlpha = stroke.opacity / 100;
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x * s, p.y * s, Math.max(stroke.size * s * 0.5, 1.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x * s, points[0].y * s);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2 * s;
    const midY = (points[i].y + points[i + 1].y) / 2 * s;
    ctx.quadraticCurveTo(points[i].x * s, points[i].y * s, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x * s, last.y * s);
  ctx.stroke();
  ctx.restore();
}

export function renderStrokeSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">,
  canvasScale: number,
) {
  ctx.save();
  ctx.globalAlpha = (stroke.opacity ?? 100) / 100;
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size * canvasScale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x * canvasScale, from.y * canvasScale);
  ctx.lineTo(to.x * canvasScale, to.y * canvasScale);
  ctx.stroke();
  ctx.restore();
}

export function renderStrokeCurveSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  control: Point,
  to: Point,
  stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">,
  canvasScale: number,
) {
  ctx.save();
  ctx.globalAlpha = (stroke.opacity ?? 100) / 100;
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size * canvasScale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x * canvasScale, from.y * canvasScale);
  ctx.quadraticCurveTo(
    control.x * canvasScale,
    control.y * canvasScale,
    to.x * canvasScale,
    to.y * canvasScale,
  );
  ctx.stroke();
  ctx.restore();
}

export function renderStrokeDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">,
  canvasScale: number,
) {
  ctx.save();
  ctx.globalAlpha = (stroke.opacity ?? 100) / 100;
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.fillStyle = stroke.color;
  ctx.beginPath();
  ctx.arc(
    point.x * canvasScale,
    point.y * canvasScale,
    Math.max(stroke.size * canvasScale * 0.5, 1.5),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}
