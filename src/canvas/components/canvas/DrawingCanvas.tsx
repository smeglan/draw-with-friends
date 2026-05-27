"use client";

import { memo, useEffect, useRef } from "react";
import type { PointerEventHandler, RefObject } from "react";
import { ZOOM_LIMITS } from "@/shared/constants/drawing";
import type { DrawingTool } from "@/canvas/types";

type DrawingCanvasProps = {
  canvasAreaRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  previewCanvasRef: RefObject<HTMLCanvasElement | null>;
  innerContentRef: RefObject<HTMLDivElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  activeTool: DrawingTool;
  onPointerDown: PointerEventHandler<HTMLCanvasElement>;
  onPointerMove: PointerEventHandler<HTMLCanvasElement>;
  onPointerUp: PointerEventHandler<HTMLCanvasElement>;
  onCanvasWheel: (event: WheelEvent) => void;
};

function DrawingCanvasImpl({
  canvasAreaRef,
  canvasRef,
  previewCanvasRef,
  innerContentRef,
  canvasWidth,
  canvasHeight,
  zoom,
  activeTool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCanvasWheel,
}: DrawingCanvasProps) {
  const wheelHandlerRef = useRef(onCanvasWheel);

  useEffect(() => {
    wheelHandlerRef.current = onCanvasWheel;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (event: WheelEvent) => {
      wheelHandlerRef.current(event);
    };

    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [canvasRef]);

  const scale = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom));
  const cursorClass = activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair";

  return (
    <div
      ref={canvasAreaRef}
      className={[
        "relative flex-1 overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]",
        cursorClass,
      ].join(" ")}
      style={{ touchAction: "none" } as React.CSSProperties}
    >
      <div
        ref={innerContentRef}
        className="relative"
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
        <canvas
          ref={previewCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}

export const DrawingCanvas = memo(DrawingCanvasImpl);
