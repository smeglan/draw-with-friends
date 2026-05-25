"use client";

import { useRef, useEffect, useCallback } from "react";

const WHEEL_SIZE = 130;

type ColorWheelProps = {
  selectedColor?: string;
  onColorChange: (color: string) => void;
};

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, l: 0 };
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = 0;
  switch (mx) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return { h: h * 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ColorWheel({ selectedColor, onColorChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const indicator = indicatorRef.current;
    if (!canvas || !indicator) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = WHEEL_SIZE * dpr;
    canvas.height = WHEEL_SIZE * dpr;
    canvas.style.width = `${WHEEL_SIZE}px`;
    canvas.style.height = `${WHEEL_SIZE}px`;

    indicator.width = WHEEL_SIZE * dpr;
    indicator.height = WHEEL_SIZE * dpr;
    indicator.style.width = `${WHEEL_SIZE}px`;
    indicator.style.height = `${WHEEL_SIZE}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const r = WHEEL_SIZE / 2 - 2;

    for (let i = 0; i < 360; i++) {
      const a1 = ((i - 90) * Math.PI) / 180;
      const a2 = ((i + 1 - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a1, a2);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = indicator.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, indicator.width, indicator.height);
    ctx.scale(dpr, dpr);

    if (!selectedColor) return;

    const hsl = hexToHsl(selectedColor);
    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const r = WHEEL_SIZE / 2 - 2;
    const angle = ((hsl.h - 90) * Math.PI) / 180;
    const dist = (hsl.s / 100) * r;
    const x = cx + dist * Math.cos(angle);
    const y = cy + dist * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [selectedColor]);

  const colorAt = useCallback(
    (clientX: number, clientY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - WHEEL_SIZE / 2;
      const y = clientY - rect.top - WHEEL_SIZE / 2;
      const dist = Math.sqrt(x * x + y * y);
      const r = WHEEL_SIZE / 2 - 2;

      if (dist > r) return null;

      let angle = Math.atan2(y, x);
      angle = ((angle * 180) / Math.PI + 90 + 360) % 360;
      const hue = Math.round(angle);
      const saturation = Math.round((dist / r) * 100);

      return hslToHex(hue, saturation, 50);
    },
    [],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    const color = colorAt(e.clientX, e.clientY);
    if (color) onColorChange(color);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const color = colorAt(e.clientX, e.clientY);
    if (color) onColorChange(color);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <canvas
        ref={indicatorRef}
        className="pointer-events-none absolute inset-0"
      />
    </div>
  );
}
