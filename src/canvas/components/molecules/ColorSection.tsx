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
    <div className="flex flex-col items-center gap-2">
      <p className="w-full text-center text-[10px] uppercase tracking-[0.08em] text-slate-400">Colores</p>
      <div className="flex h-10 w-full overflow-hidden rounded-lg border border-white/15">
        <div className="flex-1" style={{ backgroundColor: brushColor }} />
        <button
          type="button"
          className="w-10 border-l border-white/15 transition hover:scale-105"
          style={{ backgroundColor: "#000000" }}
          onClick={() => onColorSelect("#000000")}
          aria-label="Negro"
        />
        <button
          type="button"
          className="w-10 border-l border-white/15 transition hover:scale-105"
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
        className="mt-2 w-full rounded border border-white/20 bg-white/5 px-2 py-1 text-center text-xs text-white placeholder-slate-500"
        placeholder="#000000"
        />

      <div className="mt-2 flex w-full justify-center">
        <ColorWheel selectedColor={brushColor} onColorChange={onWheelColorChange} />
      </div>
    </div>
  );
}
