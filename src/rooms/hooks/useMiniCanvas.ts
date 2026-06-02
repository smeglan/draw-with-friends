"use client";

import { useRef, useState, useCallback } from "react";
import type { PointerEvent } from "react";
import type { Stroke } from "@/canvas/types";
import type { StrokeData, Point } from "@/network/events";
import { DRAWING_LIMITS } from "@/shared/constants/drawing";
import { renderStroke, renderStrokeSegment, renderStrokeDot } from "@/canvas/utils/renderStroke";

type UseMiniCanvasOptions = {
  onStrokeComplete?: (stroke: StrokeData) => void;
};

export function useMiniCanvas({ onStrokeComplete }: UseMiniCanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [brushColor, setBrushColor] = useState("#111827");
  const [brushSize, setBrushSize] = useState<number>(DRAWING_LIMITS.defaultBrushSize);
  const [brushOpacity] = useState(DRAWING_LIMITS.defaultOpacity);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  const actionsRef = useRef<Stroke[]>([]);
  const [strokesCount, setStrokesCount] = useState(0);

  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const action of actionsRef.current) {
      renderStroke(ctx, action, 1);
    }
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height) * 0.85);
    const clamped = Math.max(200, Math.min(size, 1000));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = Math.floor(clamped * dpr);
    canvas.height = Math.floor(clamped * dpr);
    canvas.style.width = `${clamped}px`;
    canvas.style.height = `${clamped}px`;

    const preview = previewCanvasRef.current;
    if (preview) {
      preview.width = canvas.width;
      preview.height = canvas.height;
      preview.style.width = canvas.style.width;
      preview.style.height = canvas.style.height;
    }

    setCanvasSize({ width: clamped, height: clamped });
    redrawCanvas();
  }, [redrawCanvas]);

  const getPointFromEvent = (event: { clientX: number; clientY: number }): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = getPointFromEvent(event);
    if (!point) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const snap = document.createElement("canvas");
      snap.width = canvas.width;
      snap.height = canvas.height;
      const snapCtx = snap.getContext("2d");
      if (snapCtx) snapCtx.drawImage(canvas, 0, 0);
      snapshotRef.current = snap;
    }

    const stroke: Stroke = {
      type: "stroke",
      tool: "brush",
      color: brushColor,
      size: brushSize,
      points: [point],
      layerId: "room",
      opacity: brushOpacity,
    };
    currentStrokeRef.current = stroke;
    lastPointRef.current = point;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) renderStrokeDot(ctx, point, stroke, 1);
  }, [brushColor, brushSize, brushOpacity]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current || !lastPointRef.current) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    const stroke = currentStrokeRef.current;
    const lastPoint = lastPointRef.current;

    const threshold = 2;
    const dx = point.x - lastPoint.x;
    const dy = point.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const steps = Math.max(1, Math.ceil(dist / threshold));
    const start = lastPoint;
    let prev: Point = start;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const next = { x: start.x + dx * t, y: start.y + dy * t };
      stroke.points.push(next);
      renderStrokeSegment(ctx, prev, next, stroke, 1);
      prev = next;
    }

    lastPointRef.current = prev;
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const stroke = currentStrokeRef.current;
    if (stroke.points.length > 0) {
      actionsRef.current = [...actionsRef.current, stroke];
      setStrokesCount(actionsRef.current.length);

      onStrokeComplete?.({
        playerId: "local",
        points: stroke.points,
        color: stroke.color,
        size: stroke.size,
        opacity: stroke.opacity,
      });
    }

    currentStrokeRef.current = null;
    lastPointRef.current = null;
    snapshotRef.current = null;
  }, [onStrokeComplete]);

  const handleUndo = useCallback(() => {
    if (actionsRef.current.length === 0) return;
    actionsRef.current = actionsRef.current.slice(0, -1);
    setStrokesCount(actionsRef.current.length);
    redrawCanvas();
  }, [redrawCanvas]);

  const handleClear = useCallback(() => {
    actionsRef.current = [];
    setStrokesCount(0);
    redrawCanvas();
  }, [redrawCanvas]);

  const addRemoteStroke = useCallback((data: StrokeData) => {
    const stroke: Stroke = {
      type: "stroke",
      tool: "brush",
      color: data.color,
      size: data.size,
      points: data.points,
      layerId: "room",
      opacity: data.opacity,
    };
    actionsRef.current = [...actionsRef.current, stroke];
    setStrokesCount(actionsRef.current.length);
    redrawCanvas();
  }, [redrawCanvas]);

  return {
    canvasRef,
    previewCanvasRef,
    containerRef,
    canvasSize,
    brushColor,
    brushSize,
    strokesCount,
    setBrushColor,
    setBrushSize,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo,
    handleClear,
    initCanvas,
    addRemoteStroke,
  };
}
