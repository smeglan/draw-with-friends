"use client";

import { useRef, useState, useCallback } from "react";

type ColorSliderProps = {
  label: string;
  labelTooltip: string;
  value: number;
  gradientFrom: string;
  gradientTo: string;
  onChange: (value: number) => void;
};

export function ColorSlider({
  label,
  labelTooltip,
  value,
  gradientFrom,
  gradientTo,
  onChange,
}: ColorSliderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      onChange(clamp(ratio * 100));
    },
    [onChange],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const commit = (raw: string) => {
    const num = clamp(Number(raw.replace(/[^0-9.-]/g, "")));
    onChange(num);
  };

  const handleFocus = () => {
    setFocused(true);
    setDraft(String(value));
  };

  const handleBlur = () => {
    setFocused(false);
    commit(draft);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 text-center text-[10px] font-medium uppercase text-slate-400"
        title={labelTooltip}
      >
        {label}
      </span>
      <div
        ref={barRef}
        className="relative h-5 flex-1 cursor-pointer rounded-md"
        style={{
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        title={`${labelTooltip}: ${value}%`}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
          style={{ left: `${value}%` }}
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={focused ? draft : `${value}%`}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleInputKeyDown}
        className="h-6 w-12 rounded border border-white/10 bg-white/5 px-1 text-center text-[10px] text-white outline-none transition focus:border-cyan-400/50"
      />
    </div>
  );
}
