"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { StrokeData, Point } from "@/network/events";
import { DRAWING_LIMITS } from "@/shared/constants/drawing";
import { renderStroke, renderStrokeSegment, renderStrokeDot } from "@/canvas/utils/renderStroke";
import type { Stroke } from "@/canvas/types";
import { ColorSection } from "@/canvas/components/molecules/ColorSection";
import { Icon } from "@/shared/icons";

type Props = {
  prompt: string;
  promptLabel: string;
  onSubmit: (strokes: StrokeData[]) => void;
  disabled?: boolean;
};

export function TelephoneDrawing({ prompt, promptLabel, onSubmit, disabled }: Props) {
  const t = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [brushColor, setBrushColor] = useState("#111827");
  const [brushSize, setBrushSize] = useState<number>(DRAWING_LIMITS.defaultBrushSize);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  const strokesRef = useRef<Stroke[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);
  const submittedRef = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) {
      renderStroke(ctx, s, 1);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height) * 0.85);
    const clamped = Math.max(200, Math.min(size, 1000));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(clamped * dpr);
    canvas.height = Math.floor(clamped * dpr);
    canvas.style.width = `${clamped}px`;
    canvas.style.height = `${clamped}px`;
    setCanvasSize({ width: clamped, height: clamped });
    redraw();

    const onResize = () => {
      const r = container.getBoundingClientRect();
      const s2 = Math.floor(Math.min(r.width, r.height) * 0.85);
      const c2 = Math.max(200, Math.min(s2, 1000));
      const dpr2 = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(c2 * dpr2);
      canvas.height = Math.floor(c2 * dpr2);
      canvas.style.width = `${c2}px`;
      canvas.style.height = `${c2}px`;
      setCanvasSize({ width: c2, height: c2 });
      redraw();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redraw]);

  const getPoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);

      const point = getPoint(e.clientX, e.clientY);
      if (!point) return;

      const canvas = canvasRef.current;
      if (canvas) {
        const snap = document.createElement("canvas");
        snap.width = canvas.width;
        snap.height = canvas.height;
        const ctx = snap.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, 0);
        snapshotRef.current = snap;
      }

      currentStrokeRef.current = {
        type: "stroke",
        tool: "brush",
        color: brushColor,
        size: brushSize,
        points: [point],
        layerId: "telephone",
        opacity: DRAWING_LIMITS.defaultOpacity,
      };
      lastPointRef.current = point;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) renderStrokeDot(ctx, point, currentStrokeRef.current, 1);
    },
    [brushColor, brushSize, disabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!currentStrokeRef.current || !lastPointRef.current) return;
      const point = getPoint(e.clientX, e.clientY);
      if (!point) return;

      const stroke = currentStrokeRef.current;
      const lastPos = lastPointRef.current;
      const dx = point.x - lastPos.x;
      const dy = point.y - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;

      const threshold = 2;
      const steps = Math.max(1, Math.ceil(dist / threshold));
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      let prev = lastPos;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const next = { x: lastPos.x + dx * t, y: lastPos.y + dy * t };
        stroke.points.push(next);
        renderStrokeSegment(ctx, prev, next, stroke, 1);
        prev = next;
      }
      lastPointRef.current = prev;
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!currentStrokeRef.current) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        strokesRef.current = [...strokesRef.current, stroke];
        setStrokeCount(strokesRef.current.length);
      }
      currentStrokeRef.current = null;
      lastPointRef.current = null;
      snapshotRef.current = null;
    },
    [],
  );

  const handleUndo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redraw();
  }, [redraw]);

  const handleClear = useCallback(() => {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
  }, [redraw]);

  const handleSubmit = useCallback(() => {
    if (submittedRef.current || strokesRef.current.length === 0) return;
    submittedRef.current = true;
    const converted: StrokeData[] = strokesRef.current.map((s) => ({
      playerId: "",
      points: s.points,
      color: s.color,
      size: s.size,
      opacity: s.opacity,
    }));
    onSubmit(converted);
  }, [onSubmit]);

  useEffect(() => {
    submittedRef.current = false;
  }, [prompt]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-slate-400">
          {promptLabel}
        </p>
        <p className="text-sm font-medium text-cyan-300">{prompt}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex flex-col gap-3 border-white/10 bg-white/[0.02] p-3 lg:w-64 lg:border-r">
          <ColorSection
            brushColor={brushColor}
            onColorSelect={setBrushColor}
            onWheelColorChange={setBrushColor}
          />
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 shrink-0 rounded-full border border-white/20"
                style={{ backgroundColor: brushColor }}
              />
              <span className="text-xs text-slate-400">{t("canvas.size")}</span>
              <span className="ml-auto text-xs text-white/70">{brushSize}</span>
            </div>
            <input
              type="range"
              min={2}
              max={40}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-cyan-300"
            />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokeCount === 0 || disabled}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon name="undo" className="h-3.5 w-3.5" />
              {t("canvas.undo")}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokeCount === 0 || disabled}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              {t("canvas.clear")}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={strokeCount === 0 || disabled}
            className="mt-auto rounded-lg bg-cyan-500 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {t("telephone.submitDrawing")}
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative flex min-h-[50vh] flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.62),rgba(2,6,23,0.96))]"
        >
          <div
            className="relative"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 touch-none rounded-2xl shadow-[0_24px_120px_rgba(15,23,42,0.5)]"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            {t("canvas.strokeCount", { count: strokeCount })}
          </div>
        </div>
      </div>
    </div>
  );
}
