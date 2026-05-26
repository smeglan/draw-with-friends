"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/shared/icons";
import { ZOOM_LIMITS } from "@/shared/constants/drawing";
import { BrushSizeBar } from "@/canvas/components/molecules/BrushSizeBar";
import { BucketSensitivityBar } from "@/canvas/components/molecules/BucketSensitivityBar";
import { ExportDrawer } from "@/canvas/components/organisms/ExportDrawer";
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
}: CanvasToolbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iconBtn = "flex h-12 w-12 items-center justify-center rounded-2xl border transition";

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    handler();
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen?.();
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 px-3 pt-14 lg:flex-row lg:items-start lg:px-3 lg:pt-3">
      <ExportDrawer
        canvasRef={canvasRef}
        canvasSize={canvasSize}
        onCanvasSizeChange={onCanvasSizeChange}
        onFitToScreen={onFitToScreen}
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
          <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Zoom</span>
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
          aria-label="Zoom del lienzo"
        />
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-medium text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
        aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        <Icon name={isFullscreen ? "fullscreenExit" : "fullscreen"} />
        <span className="hidden sm:inline">{isFullscreen ? "Salir" : "Fullscreen"}</span>
      </button>

      <div className="flex shrink-0 justify-center gap-2 lg:justify-start">
        <button
          type="button"
          onClick={onUndo}
          disabled={strokesCount === 0}
          className={`${iconBtn} border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35`}
          aria-label="Deshacer"
          title="Deshacer"
        >
          <Icon name="undo" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={redoCount === 0}
          className={`${iconBtn} border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35`}
          aria-label="Rehacer"
          title="Rehacer"
        >
          <Icon name="redo" />
        </button>
      </div>
    </div>
  );
}
