"use client";

import { useEffect, useRef } from "react";
import { ColorWheel } from "@/canvas/components/atoms/ColorWheel";

type ColorSectionProps = {
  brushColor: string;
  onColorSelect: (color: string) => void;
  onWheelColorChange: (color: string) => void;
};

export function ColorSection({ brushColor, onColorSelect, onWheelColorChange }: ColorSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = brushColor;
  }, [brushColor]);

  const submitHex = () => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val) && val !== brushColor) {
      onWheelColorChange(val);
      return;
    }
    input.value = brushColor;
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Colores</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {brushColor}
          </span>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/15">
          <div className="min-h-10" style={{ backgroundColor: brushColor }} />
          <button
            type="button"
            className="min-h-10 border-l border-white/15 transition hover:brightness-110"
            style={{ backgroundColor: "#000000" }}
            onClick={() => onColorSelect("#000000")}
            aria-label="Negro"
          />
          <button
            type="button"
            className="min-h-10 border-l border-white/15 transition hover:brightness-110"
            style={{ backgroundColor: "#ffffff" }}
            onClick={() => onColorSelect("#ffffff")}
            aria-label="Blanco"
          />
        </div>

        <input
          ref={inputRef}
          type="text"
          defaultValue={brushColor}
          onBlur={submitHex}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitHex();
            if (e.key === "Escape" && inputRef.current) {
              inputRef.current.value = brushColor;
            }
          }}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-xs text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
          placeholder="#000000"
        />

        <div className="flex w-full justify-center rounded-xl border border-white/10 bg-white/[0.03] py-2">
          <ColorWheel selectedColor={brushColor} onColorChange={onWheelColorChange} />
        </div>
      </div>
    </div>
  );
}
