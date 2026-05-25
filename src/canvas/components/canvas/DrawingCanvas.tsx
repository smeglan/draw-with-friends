"use client";

import type { PointerEventHandler, RefObject } from "react";

type DrawingCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
};

export function DrawingCanvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: DrawingCanvasProps) {
  return (
    <div className="relative flex-1 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 right-24 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="truncate rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
          Click y arrastra para dibujar
        </span>
        <span className="truncate rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
          Ctrl/Cmd + Z para deshacer
        </span>
      </div>
    </div>
  );
}
