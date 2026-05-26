"use client";

import type { PointerEventHandler, RefObject } from "react";
import type { DrawingTool } from "@/canvas/types";

type DrawingCanvasProps = {
  canvasAreaRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  activeTool: DrawingTool;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
};

export function DrawingCanvas({
  canvasAreaRef,
  canvasRef,
  canvasWidth,
  canvasHeight,
  zoom,
  activeTool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: DrawingCanvasProps) {
  const scale = Math.max(0.25, Math.min(2, zoom));
  const cursorClass = activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair";
  return (
    <div
      ref={canvasAreaRef}
      className={[
        "relative flex-1 overscroll-contain overflow-auto bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]",
        cursorClass,
      ].join(" ")}
    >
      <div
        className="relative min-h-full min-w-full"
        style={{
          width: `${canvasWidth * scale}px`,
          height: `${canvasHeight * scale}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  );
}
