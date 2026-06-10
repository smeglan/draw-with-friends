"use client";

import { useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { StrokeData } from "@/network/events";
import { Icon } from "@/shared/icons";
import { ColorSection } from "@/canvas/components/molecules/ColorSection";
import { useMiniCanvas } from "@/rooms/hooks/useMiniCanvas";
import type { PeerStatus } from "@/network/client/PeerManager";

type Props = {
  strokes: StrokeData[];
  onStrokeComplete: (stroke: StrokeData) => void;
  onUndo: () => void;
  onClear: () => void;
  myId: string | null;
  hostId: string | null;
  peerStatus: PeerStatus;
};

export function RoomCanvas({
  strokes,
  onStrokeComplete,
  onUndo,
  onClear,
  myId,
  hostId,
  peerStatus,
}: Props) {
  const t = useTranslations();
  const [toolsOpen, setToolsOpen] = useState(true);
  const isHost = myId !== null && hostId !== null && myId === hostId;
  const syncLabel =
    peerStatus === "connected"
      ? isHost
        ? t("canvas.statusHostSync")
        : t("canvas.statusLiveSync")
      : peerStatus === "connecting"
        ? t("canvas.statusSyncing")
        : t("canvas.statusWaiting");

  const {
    canvasRef,
    previewCanvasRef,
    containerRef,
    canvasSize,
    brushColor,
    brushSize,
    strokesCount,
    setBrushColor,
    setBrushSize,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo,
    handleClear,
    syncStrokeActions,
    initCanvas,
  } = useMiniCanvas({
    onStrokeComplete: (stroke) => {
      onStrokeComplete({ ...stroke, playerId: myId ?? "local" });
    },
  });

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initCanvas]);

  useEffect(() => {
    syncStrokeActions(strokes);
  }, [strokes, syncStrokeActions]);

  const handleWheelColorChange = useCallback((color: string) => {
    setBrushColor(color);
  }, [setBrushColor]);

  const handleUndoClick = useCallback(() => {
    handleUndo();
    onUndo();
  }, [handleUndo, onUndo]);

  const handleClearClick = useCallback(() => {
    handleClear();
    onClear();
  }, [handleClear, onClear]);

  return (
    <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
      <div
        className={[
          "flex flex-col gap-3 overflow-hidden border-white/10 bg-white/[0.02] p-3 transition-all duration-200",
          "border-b xl:border-b-0 xl:border-r",
          toolsOpen ? "w-full xl:w-72" : "h-0 border-transparent p-0 xl:h-auto xl:w-0",
        ].join(" ")}
      >
        <ColorSection
          brushColor={brushColor}
          onColorSelect={setBrushColor}
          onWheelColorChange={handleWheelColorChange}
        />

        <div className="flex flex-col items-stretch gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 shrink-0 rounded-full border border-white/20"
              style={{ backgroundColor: brushColor }}
            />
            <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
              {t("canvas.size")}
            </span>
            <span className="ml-auto text-xs text-white/70">{brushSize}</span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-cyan-300"
            aria-label={t("canvas.brushSizeLabel")}
          />
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleUndoClick}
            disabled={strokesCount === 0}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={t("canvas.undo")}
            title={t("canvas.undo")}
          >
            <Icon name="undo" className="h-3.5 w-3.5" />
            {t("canvas.undo")}
          </button>
          <button
            type="button"
            onClick={handleClearClick}
            disabled={strokesCount === 0}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={t("canvas.clear")}
            title={t("canvas.clearCanvas")}
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            {t("canvas.clear")}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setToolsOpen((o) => !o)}
        className="flex h-9 w-full shrink-0 items-center justify-center border-b border-white/10 bg-white/[0.02] text-slate-500 transition hover:bg-white/5 hover:text-cyan-400 xl:h-auto xl:w-7 xl:border-b-0 xl:border-r"
        title={toolsOpen ? t("canvas.hideTools") : t("canvas.showTools")}
      >
        <span className="flex items-center gap-2">
          <Icon name="brush" className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.08em] xl:hidden">
            {toolsOpen ? t("canvas.hide") : t("canvas.tools")}
          </span>
        </span>
      </button>

      <div
        ref={containerRef}
        className="relative flex min-h-[60vh] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.62),rgba(2,6,23,0.96))] xl:min-h-0"
      >
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            {syncLabel}
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            {t("canvas.strokeCount", { count: strokesCount })}
          </div>
        </div>

        <div
          className="relative"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none rounded-2xl shadow-[0_24px_120px_rgba(15,23,42,0.5)]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <canvas
            ref={previewCanvasRef}
            className="pointer-events-none absolute inset-0 rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
