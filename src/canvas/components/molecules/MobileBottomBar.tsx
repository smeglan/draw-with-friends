"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import type { DrawingTool } from "@/canvas/types";

type MobileBottomBarProps = {
  activeTool: DrawingTool;
  brushColor: string;
  strokesCount: number;
  redoCount: number;
  onToolSelect: (tool: DrawingTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSidebar: () => void;
};

const TOOLS: { tool: DrawingTool; icon: "brush" | "bucket" | "eraser" | "eyedropper" | "hand" }[] = [
  { tool: "brush", icon: "brush" },
  { tool: "bucket", icon: "bucket" },
  { tool: "eraser", icon: "eraser" },
  { tool: "eyedropper", icon: "eyedropper" },
  { tool: "hand", icon: "hand" },
];

export function MobileBottomBar({
  activeTool,
  brushColor,
  strokesCount,
  redoCount,
  onToolSelect,
  onUndo,
  onRedo,
  onOpenSidebar,
}: MobileBottomBarProps) {
  const t = useTranslations();
  const isFullscreen = useSyncExternalStore(
    (cb) => {
      document.addEventListener("fullscreenchange", cb);
      return () => document.removeEventListener("fullscreenchange", cb);
    },
    () => Boolean(document.fullscreenElement),
    () => false,
  );

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen?.();
    }
  };

  const iconBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 bg-slate-950/95 px-3 backdrop-blur-lg scrollbar-thin">
      {TOOLS.map(({ tool, icon }) => (
        <button
          key={tool}
          type="button"
          onClick={() => onToolSelect(tool)}
          className={`${iconBtn} ${
            activeTool === tool
              ? "border-cyan-400/50 bg-cyan-400/12 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
          }`}
          aria-label={tool}
        >
          <Icon name={icon} className="h-5 w-5" />
        </button>
      ))}

      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 transition hover:border-white/20"
        style={{ backgroundColor: brushColor }}
        aria-label={t("colors.heading")}
      />

      <button
        type="button"
        onClick={onUndo}
        disabled={strokesCount === 0}
        className={`${iconBtn} border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white`}
        aria-label={t("common.undo")}
      >
        <Icon name="undo" className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={redoCount === 0}
        className={`${iconBtn} border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white`}
        aria-label={t("common.redo")}
      >
        <Icon name="redo" className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`${iconBtn} border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white`}
        aria-label={isFullscreen ? t("common.exitFullscreen") : t("common.fullscreen")}
      >
        <Icon name={isFullscreen ? "fullscreenExit" : "fullscreen"} className="h-5 w-5" />
      </button>
    </div>
  );
}
