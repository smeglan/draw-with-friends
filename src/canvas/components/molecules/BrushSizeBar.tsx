"use client";

import { DRAWING_LIMITS } from "@/shared/constants/drawing";

type BrushSizeBarProps = {
  size: number;
  onSizeChange: (value: number) => void;
};

export function BrushSizeBar({ size, onSizeChange }: BrushSizeBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-xs uppercase tracking-[0.12em] text-slate-300">
          Tamano del trazo
        </p>
        <p className="truncate text-sm text-white">Ajusta el grosor del pincel</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <input
          type="range"
          min={DRAWING_LIMITS.minBrushSize}
          max={DRAWING_LIMITS.maxBrushSize}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          className="w-40 accent-cyan-300"
        />
        <span className="w-8 text-right text-sm font-medium text-white">
          {size}
        </span>
      </div>
    </div>
  );
}
