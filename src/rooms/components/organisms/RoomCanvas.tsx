"use client";

import { useEffect, useCallback, useState } from "react";
import type { StrokeData } from "@/network/events";
import { Icon } from "@/shared/icons";
import { ColorSection } from "@/canvas/components/molecules/ColorSection";
import { useMiniCanvas } from "@/rooms/hooks/useMiniCanvas";

type Props = {
  onStrokeComplete: (stroke: StrokeData) => void;
  onStrokeReceived: (cb: (stroke: StrokeData) => void) => () => void;
  myId: string | null;
};

export function RoomCanvas({ onStrokeComplete, onStrokeReceived, myId }: Props) {
  const [toolsOpen, setToolsOpen] = useState(true);

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
    initCanvas,
    addRemoteStroke,
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
    return onStrokeReceived((stroke) => {
      addRemoteStroke(stroke);
    });
  }, [onStrokeReceived, addRemoteStroke]);

  const handleWheelColorChange = useCallback((color: string) => {
    setBrushColor(color);
  }, [setBrushColor]);

  return (
    <div className="flex min-w-0 flex-1">
      <div
        className={[
          "flex flex-col gap-3 overflow-hidden border-r border-white/10 bg-white/[0.02] p-3 transition-all duration-200",
          toolsOpen ? "w-72" : "w-0 border-transparent p-0",
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
              Tamaño
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
            aria-label="Tamaño del pincel"
          />
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokesCount === 0}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Deshacer"
            title="Deshacer"
          >
            <Icon name="undo" className="h-3.5 w-3.5" />
            Deshacer
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokesCount === 0}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:border-red-400/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Limpiar"
            title="Limpiar lienzo"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setToolsOpen((o) => !o)}
        className="flex w-7 shrink-0 items-center justify-center border-r border-white/10 bg-white/[0.02] text-slate-500 transition hover:bg-white/5 hover:text-cyan-400"
        title={toolsOpen ? "Ocultar herramientas" : "Mostrar herramientas"}
      >
        <Icon name="brush" className="h-4 w-4" />
      </button>

      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6),rgba(2,6,23,0.95))]"
      >
        <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <canvas
            ref={previewCanvasRef}
            className="pointer-events-none absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
