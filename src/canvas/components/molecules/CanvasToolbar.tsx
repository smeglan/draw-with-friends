"use client";

import { useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { ConfirmLeaveModal } from "@/shared/components/ConfirmLeaveModal";
import { ZOOM_LIMITS } from "@/shared/constants/drawing";
import { BrushSizeBar } from "@/canvas/components/molecules/BrushSizeBar";
import { BucketSensitivityBar } from "@/canvas/components/molecules/BucketSensitivityBar";
import { ExportDrawer } from "@/canvas/components/organisms/ExportDrawer";
import { MobileMenuDrawer } from "@/canvas/components/molecules/MobileMenuDrawer";
import { MobileToolDrawer } from "@/canvas/components/molecules/MobileToolDrawer";
import type { DrawingTool } from "@/canvas/types";

type CanvasToolbarProps = {
  stageRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasSize: { width: number; height: number };
  activeTool: DrawingTool;
  brushSize: number;
  brushOpacity: number;
  brushColor: string;
  bucketSensitivity: number;
  canvasZoom: number;
  strokesCount: number;
  redoCount: number;
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  onFitToScreen: () => void;
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onBucketSensitivityChange: (sensitivity: number) => void;
  onCanvasZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  mobile?: boolean;
  onOpenLayers?: () => void;
  onSaveProject?: () => void;
  onOpenProject?: () => void;
};

export function CanvasToolbar({
  stageRef,
  canvasRef,
  canvasSize,
  activeTool,
  brushSize,
  brushOpacity,
  brushColor,
  bucketSensitivity,
  canvasZoom,
  strokesCount,
  redoCount,
  onCanvasSizeChange,
  onFitToScreen,
  onBrushSizeChange,
  onBrushOpacityChange,
  onBucketSensitivityChange,
  onCanvasZoomChange,
  onUndo,
  onRedo,
  mobile,
  onOpenLayers,
  onSaveProject,
  onOpenProject,
}: CanvasToolbarProps) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showToolSettings, setShowToolSettings] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const isFullscreen = useSyncExternalStore(
    (cb) => {
      document.addEventListener("fullscreenchange", cb);
      return () => document.removeEventListener("fullscreenchange", cb);
    },
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const iconBtn = "flex h-12 w-12 items-center justify-center rounded-2xl border transition";

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen?.();
    }
  };

  if (mobile) {
    const showToolButton = activeTool === "brush" || activeTool === "eraser" || activeTool === "bucket";

    return (
      <>
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/95 px-3 backdrop-blur-lg">
          <button
            type="button"
            onClick={() => setShowLeftMenu(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-white"
            aria-label={t("canvas.menu")}
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>

          <span className="text-[11px] font-medium text-slate-500">
            {Math.round(canvasZoom * 100)}%
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenLayers}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-white"
              aria-label={t("canvas.layers")}
            >
              <Icon name="layers" className="h-4 w-4" />
            </button>
            {showToolButton && (
              <button
                type="button"
                onClick={() => setShowToolSettings(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-white"
                aria-label={t("canvas.toolSettings", { tool: t("tools." + activeTool) })}
              >
                <Icon name={activeTool as "brush" | "bucket" | "eraser"} className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <MobileMenuDrawer
          open={showLeftMenu}
          onClose={() => setShowLeftMenu(false)}
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          onCanvasSizeChange={onCanvasSizeChange}
          onFitToScreen={onFitToScreen}
          onSaveProject={onSaveProject}
          onOpenProject={onOpenProject}
        />

        <MobileToolDrawer
          open={showToolSettings}
          onClose={() => setShowToolSettings(false)}
          activeTool={activeTool}
          brushSize={brushSize}
          brushOpacity={brushOpacity}
          brushColor={brushColor}
          bucketSensitivity={bucketSensitivity}
          onBrushSizeChange={onBrushSizeChange}
          onBrushOpacityChange={onBrushOpacityChange}
          onBucketSensitivityChange={onBucketSensitivityChange}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-3 px-3 pt-14 lg:flex-row lg:items-start lg:px-3 lg:pt-3">
        <button
          type="button"
          onClick={() => setShowLeaveModal(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-200 transition hover:border-white/20 hover:bg-white/15 hover:text-white"
          aria-label={t("common.backToHome")}
          title={t("common.backToHome")}
        >
          <Icon name="home" />
        </button>

        {showLeaveModal && (
          <ConfirmLeaveModal
            onConfirm={() => router.push("/")}
            onCancel={() => setShowLeaveModal(false)}
          />
        )}

      <ExportDrawer
        canvasRef={canvasRef}
        canvasSize={canvasSize}
        onCanvasSizeChange={onCanvasSizeChange}
        onFitToScreen={onFitToScreen}
        onSaveProject={onSaveProject}
        onOpenProject={onOpenProject}
      />

      <div className="min-w-0 flex-1">
        {activeTool === "bucket" ? (
          <BucketSensitivityBar
            sensitivity={bucketSensitivity}
            onSensitivityChange={onBucketSensitivityChange}
          />
        ) : (
          <BrushSizeBar
            size={brushSize}
            opacity={brushOpacity}
            color={brushColor}
            onSizeChange={onBrushSizeChange}
            onOpacityChange={onBrushOpacityChange}
          />
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">{t("canvas.zoom")}</span>
          <span className="text-xs text-white/80">{Math.round(canvasZoom * 100)}%</span>
        </div>
        <input
          type="range"
          min={ZOOM_LIMITS.min}
          max={ZOOM_LIMITS.max}
          step="0.05"
          value={canvasZoom}
          onChange={(e) => onCanvasZoomChange(Number(e.target.value))}
          className="h-2 w-40 accent-cyan-300"
          aria-label={t("canvas.zoomLabel")}
        />
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-medium text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
        aria-label={isFullscreen ? t("common.exitFullscreen") : t("common.fullscreen")}
        title={isFullscreen ? t("common.exitFullscreen") : t("common.fullscreen")}
      >
        <Icon name={isFullscreen ? "fullscreenExit" : "fullscreen"} />
        <span className="hidden sm:inline">{isFullscreen ? t("common.exit") : t("common.fullscreen")}</span>
      </button>

      <div className="flex shrink-0 justify-center gap-2 lg:justify-start">
        <button
          type="button"
          onClick={onUndo}
          suppressHydrationWarning disabled={strokesCount === 0}
          className={`${iconBtn} border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35`}
          aria-label={t("common.undo")}
          title={t("common.undo")}
        >
          <Icon name="undo" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          suppressHydrationWarning disabled={redoCount === 0}
          className={`${iconBtn} border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35`}
          aria-label={t("common.redo")}
          title={t("common.redo")}
        >
          <Icon name="redo" />
        </button>
      </div>
    </div>
    </>
  );
}
