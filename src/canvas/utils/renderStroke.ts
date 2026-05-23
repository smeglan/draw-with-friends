import type { Point, Stroke } from "@/canvas/types";

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasScale: number,
) {
  const [firstPoint, ...rest] = stroke.points;

  if (!firstPoint) {
    return;
  }

  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size * canvasScale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (rest.length === 0) {
    ctx.beginPath();
    ctx.arc(
      firstPoint.x * canvasScale,
      firstPoint.y * canvasScale,
      Math.max(stroke.size * canvasScale * 0.5, 1.5),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(firstPoint.x * canvasScale, firstPoint.y * canvasScale);

  for (const point of rest) {
    ctx.lineTo(point.x * canvasScale, point.y * canvasScale);
  }

  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
}

export function renderStrokeSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  stroke: Pick<Stroke, "tool" | "color" | "size">,
  canvasScale: number,
) {
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
  ctx.globalCompositeOperation = "source-over";
}

export function renderStrokeDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  stroke: Pick<Stroke, "tool" | "color" | "size">,
  canvasScale: number,
) {
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
  ctx.globalCompositeOperation = "source-over";
}
