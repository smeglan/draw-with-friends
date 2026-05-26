"use client";

import { DRAWING_LIMITS } from "@/shared/constants/drawing";

type BrushSizeBarProps = {
  size: number;
  opacity: number;
  color: string;
  onSizeChange: (value: number) => void;
  onOpacityChange: (value: number) => void;
};

export function BrushSizeBar({
  size,
  opacity,
  color,
  onSizeChange,
  onOpacityChange,
}: BrushSizeBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-full border border-white/20"
          style={{ backgroundColor: color, opacity: opacity / 100 }}
        />
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Tamaño
          </p>
          <p className="text-xs text-white/70">Grosor del trazo</p>
        </div>
        <input
          type="range"
          min={DRAWING_LIMITS.minBrushSize}
          max={DRAWING_LIMITS.maxBrushSize}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          className="w-28 accent-cyan-300"
        />
        <span className="w-7 text-right text-sm font-medium text-white">{size}</span>
      </div>

      <div className="hidden h-6 w-px bg-white/10 sm:block" />

      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Opacidad
          </p>
          <p className="text-xs text-white/70">Transparencia del pincel</p>
        </div>
        <input
          type="range"
          min={DRAWING_LIMITS.minOpacity}
          max={DRAWING_LIMITS.maxOpacity}
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          className="w-28 accent-cyan-300"
        />
        <span className="w-7 text-right text-sm font-medium text-white">{opacity}%</span>
      </div>
    </div>
  );
}
