"use client";

import { BUCKET_LIMITS } from "@/shared/constants/drawing";

type BucketSensitivityBarProps = {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
};

export function BucketSensitivityBar({
  sensitivity,
  onSensitivityChange,
}: BucketSensitivityBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-xs uppercase tracking-[0.12em] text-slate-300">
          Sensibilidad del balde
        </p>
        <p className="truncate text-sm text-white">
          {sensitivity <= 10
            ? "Solo colores muy similares"
            : sensitivity <= 30
              ? "Afinidad media"
              : sensitivity <= 60
                ? "Tolerancia generosa"
                : sensitivity <= 85
                  ? "Alta cobertura"
                  : "Rellena casi todo"}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <input
          type="range"
          min={BUCKET_LIMITS.minSensitivity}
          max={BUCKET_LIMITS.maxSensitivity}
          value={sensitivity}
          onChange={(event) => onSensitivityChange(Number(event.target.value))}
          className="w-36 accent-cyan-300"
        />
        <span className="w-8 text-right text-sm font-medium text-white">
          {sensitivity}
        </span>
        <button
          type="button"
          onClick={() => onSensitivityChange(BUCKET_LIMITS.defaultSensitivity)}
          className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-white/20"
          title="Restaurar valor por defecto"
        >
          Default
        </button>
      </div>
    </div>
  );
}
