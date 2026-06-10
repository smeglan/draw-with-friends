"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { CustomColorSlots } from "@/canvas/components/molecules/CustomColorSlots";

type CustomColorBarProps = {
  customColors: (string | null)[];
  selectedSlotIndex: number;
  paletteMenuOpen: boolean;
  onCustomColorClick: (index: number, replace?: boolean) => void;
  onTogglePaletteMenu: () => void;
};

export function CustomColorBar({
  customColors,
  selectedSlotIndex,
  paletteMenuOpen,
  onCustomColorClick,
  onTogglePaletteMenu,
}: CustomColorBarProps) {
  const t = useTranslations();
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-center gap-2">
        <CustomColorSlots
          colors={customColors}
          selectedIndex={selectedSlotIndex}
          onSlotClick={onCustomColorClick}
        />
        <button
          type="button"
          onClick={onTogglePaletteMenu}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
            paletteMenuOpen
              ? "border-cyan-300 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
              : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
          ].join(" ")}
          aria-label={t("colors.openPalettes")}
          aria-expanded={paletteMenuOpen}
          title={t("colors.palettes")}
        >
          <span className="relative flex items-center justify-center">
            <Icon name="palette" className="h-[18px] w-[18px]" />
            <Icon name="chevronDown" className={`absolute -bottom-2 h-3 w-3 transition-transform ${paletteMenuOpen ? "rotate-180" : ""}`} />
          </span>
        </button>
      </div>
    </div>
  );
}
