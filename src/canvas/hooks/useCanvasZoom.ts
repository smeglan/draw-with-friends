"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import { ZOOM_LIMITS } from "@/shared/constants/drawing";
import { clamp } from "@/shared/utils/clamp";
import type { CanvasDimensions } from "@/canvas/types";

type ZoomDeps = {
  canvasAreaRef: RefObject<HTMLDivElement | null>;
  canvasAreaSize: { width: number; height: number };
  canvasSizeRef: { current: CanvasDimensions };
};

export function useCanvasZoom({ canvasAreaRef, canvasAreaSize, canvasSizeRef }: ZoomDeps) {
  const [canvasZoom, setCanvasZoom] = useState(1);
  const canvasZoomRef = useRef(1);

  const handleCanvasWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    const container = canvasAreaRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    const delta = -Math.sign(event.deltaY);
    const step = 0.1;
    const oldZoom = canvasZoomRef.current;
    const newZoom = clamp(
      Math.round((oldZoom + delta * step) * 100) / 100,
      ZOOM_LIMITS.min,
      ZOOM_LIMITS.max,
    );
    if (newZoom === oldZoom) return;

    const areaW = canvasAreaSize.width || canvasSizeRef.current.width;
    const areaH = canvasAreaSize.height || canvasSizeRef.current.height;

    const contentX = clientX + container.scrollLeft;
    const contentY = clientY + container.scrollTop;
    const fracX = contentX / Math.max(1, areaW * oldZoom);
    const fracY = contentY / Math.max(1, areaH * oldZoom);

    setCanvasZoom(newZoom);
    canvasZoomRef.current = newZoom;

    window.requestAnimationFrame(() => {
      container.scrollLeft = fracX * (areaW * newZoom) - clientX;
      container.scrollTop = fracY * (areaH * newZoom) - clientY;
    });
  }, [canvasAreaSize.width, canvasAreaSize.height, canvasAreaRef, canvasSizeRef]);

  const fitCanvasToScreen = useCallback(() => {
    const width = canvasAreaSize.width;
    const height = canvasAreaSize.height;
    const cw = canvasSizeRef.current.width;
    const ch = canvasSizeRef.current.height;
    if (width === 0 || height === 0 || cw === 0 || ch === 0) return;

    const zoom = clamp(
      Math.min(
        Math.max(1, width - 32) / cw,
        Math.max(1, height - 32) / ch,
      ),
      ZOOM_LIMITS.min,
      ZOOM_LIMITS.max,
    );
    const newZoom = Number(zoom.toFixed(2));
    setCanvasZoom(newZoom);
    canvasZoomRef.current = newZoom;

    const container = canvasAreaRef.current;
    if (!container) return;

    window.requestAnimationFrame(() => {
      container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
      container.scrollTop = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);
    });
  }, [canvasAreaSize.height, canvasAreaSize.width, canvasAreaRef, canvasSizeRef]);

  const didFitRef = useRef(false);

  useEffect(() => {
    if (canvasAreaSize.width === 0 || canvasAreaSize.height === 0) return;
    if (didFitRef.current) return;
    didFitRef.current = true;
    fitCanvasToScreen();
  }, [canvasAreaSize.width, canvasAreaSize.height, fitCanvasToScreen]);

  return {
    canvasZoom,
    canvasZoomRef,
    setCanvasZoom,
    handleCanvasWheel,
    fitCanvasToScreen,
  };
}
