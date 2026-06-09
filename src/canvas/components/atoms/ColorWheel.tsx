"use client";

import { useRef, useEffect, useCallback } from "react";
import { hsvToHex, hexToHsv } from "@/shared/utils/color";

type ColorWheelProps = {
  selectedColor?: string;
  onColorChange: (color: string) => void;
  v?: number;
  size?: number;
};

export function ColorWheel({
  selectedColor,
  onColorChange,
  v = 100,
  size = 180,
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const indicator = indicatorRef.current;
    if (!canvas || !indicator) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    indicator.width = size * dpr;
    indicator.height = size * dpr;
    indicator.style.width = `${size}px`;
    indicator.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;

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
  }, [size]);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = indicator.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, indicator.width, indicator.height);
    ctx.scale(dpr, dpr);

    if (!selectedColor) return;

    const hsv = hexToHsv(selectedColor);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;
    const angle = ((hsv.h - 90) * Math.PI) / 180;
    const dist = (hsv.s / 100) * r;
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
  }, [selectedColor, size]);

  const colorAt = useCallback(
    (clientX: number, clientY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - size / 2;
      const y = clientY - rect.top - size / 2;
      const dist = Math.sqrt(x * x + y * y);
      const r = size / 2 - 2;

      if (dist > r) return null;

      let angle = Math.atan2(y, x);
      angle = ((angle * 180) / Math.PI + 90 + 360) % 360;
      const hue = Math.round(angle);
      const saturation = Math.round((dist / r) * 100);

      return hsvToHex(hue, saturation, v);
    },
    [v, size],
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
    <div className="relative" style={{ width: size, height: size }}>
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
