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
  contentRef: RefObject<HTMLDivElement | null>;
  panOffsetRef: { current: { x: number; y: number } };
  zoomRef: { current: number };
};

export function useCanvasZoom({ canvasAreaRef, canvasAreaSize, canvasSizeRef, contentRef, panOffsetRef, zoomRef }: ZoomDeps) {
  const [canvasZoom, setCanvasZoomState] = useState(1);
  const canvasZoomRef = zoomRef;

  const applyContentTransform = useCallback((x: number, y: number, zoom: number) => {
    const content = contentRef.current;
    if (content) {
      content.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
    }
  }, [contentRef]);

  const applyPanOffset = useCallback((x: number, y: number) => {
    panOffsetRef.current = { x, y };
    applyContentTransform(x, y, canvasZoomRef.current);
  }, [applyContentTransform, panOffsetRef]);

  const setCanvasZoom = useCallback((nextZoom: number) => {
    const newZoom = clamp(nextZoom, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
    canvasZoomRef.current = newZoom;
    setCanvasZoomState(newZoom);
    const pan = panOffsetRef.current;
    window.requestAnimationFrame(() => {
      applyContentTransform(pan.x, pan.y, newZoom);
    });
  }, [applyContentTransform, panOffsetRef]);

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

    const oldPan = panOffsetRef.current;
    const ratio = newZoom / oldZoom;
    const newPanX = oldPan.x * ratio + clientX * (1 - ratio);
    const newPanY = oldPan.y * ratio + clientY * (1 - ratio);

    setCanvasZoomState(newZoom);
    canvasZoomRef.current = newZoom;

    window.requestAnimationFrame(() => {
      panOffsetRef.current = { x: newPanX, y: newPanY };
      applyContentTransform(newPanX, newPanY, newZoom);
    });
  }, [applyContentTransform, canvasAreaRef, panOffsetRef]);

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
    setCanvasZoomState(newZoom);
    canvasZoomRef.current = newZoom;

    const newPanX = (width - cw * newZoom) / 2;
    const newPanY = (height - ch * newZoom) / 2;

    window.requestAnimationFrame(() => {
      applyPanOffset(newPanX, newPanY);
    });
  }, [canvasAreaSize.height, canvasAreaSize.width, canvasSizeRef, applyPanOffset]);

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
