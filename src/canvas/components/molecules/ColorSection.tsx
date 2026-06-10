"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ColorWheel } from "@/canvas/components/atoms/ColorWheel";
import { ColorSlider } from "@/canvas/components/atoms/ColorSlider";
import { hsvToHex, hexToHsv } from "@/shared/utils/color";

type ColorSectionProps = {
  brushColor: string;
  onColorSelect: (color: string) => void;
  onWheelColorChange: (color: string) => void;
};

export function ColorSection({ brushColor, onColorSelect, onWheelColorChange }: ColorSectionProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const firstWheelClick = useRef(true);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = brushColor;
  }, [brushColor]);

  const hsv = hexToHsv(brushColor);

  const handleWheelChange = (hex: string) => {
    if (firstWheelClick.current) {
      firstWheelClick.current = false;
      const { h, s } = hexToHsv(hex);
      onWheelColorChange(hsvToHex(h, s, 100));
      return;
    }
    onWheelColorChange(hex);
  };

  const handleSatChange = (s: number) => {
    onWheelColorChange(hsvToHex(hsv.h, s, hsv.v));
  };

  const handleValChange = (v: number) => {
    onWheelColorChange(hsvToHex(hsv.h, hsv.s, v));
  };

  const submitHex = () => {
    const input = inputRef.current;
    if (!input) return;
    const raw = input.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw) && raw !== brushColor) {
      onWheelColorChange(raw);
      return;
    }
    input.value = brushColor;
  };

  const satFrom = hsvToHex(hsv.h, 0, hsv.v);
  const satTo = hsvToHex(hsv.h, 100, hsv.v);
  const valFrom = "#000000";
  const valTo = hsvToHex(hsv.h, hsv.s, 100);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{t("colors.heading")}</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {brushColor}
          </span>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/15">
          <div className="min-h-9" style={{ backgroundColor: brushColor }} />
          <button
            type="button"
            className="min-h-9 border-l border-white/15 transition hover:brightness-110"
            style={{ backgroundColor: "#000000" }}
            onClick={() => onColorSelect("#000000")}
            aria-label={t("colors.black")}
          />
          <button
            type="button"
            className="min-h-9 border-l border-white/15 transition hover:brightness-110"
            style={{ backgroundColor: "#ffffff" }}
            onClick={() => onColorSelect("#ffffff")}
            aria-label={t("colors.white")}
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

        <div className="flex w-full justify-center">
          <ColorWheel
            selectedColor={brushColor}
            onColorChange={handleWheelChange}
            v={hsv.v}
            size={180}
          />
        </div>

        <ColorSlider
          label="S"
          labelTooltip={t("colors.saturation")}
          value={hsv.s}
          gradientFrom={satFrom}
          gradientTo={satTo}
          onChange={handleSatChange}
        />

        <ColorSlider
          label="V"
          labelTooltip={t("colors.brightness")}
          value={hsv.v}
          gradientFrom={valFrom}
          gradientTo={valTo}
          onChange={handleValChange}
        />
      </div>
    </div>
  );
}
