"use client";

import { useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import type { DrawingTool } from "@/canvas/types";

type PanDeps = {
  canvasAreaRef: RefObject<HTMLDivElement | null>;
  setActiveTool: (tool: DrawingTool) => void;
};

export function useCanvasPan({ canvasAreaRef, setActiveTool }: PanDeps) {
  const previousToolRef = useRef<DrawingTool>("brush");
  const isPanningRef = useRef(false);
  const panStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    temporaryHand: false,
  });

  const beginPan = (event: PointerEvent<HTMLCanvasElement>, temporaryHand: boolean, currentTool?: DrawingTool) => {
    const container = canvasAreaRef.current;
    if (!container) return;

    if (temporaryHand && currentTool) {
      previousToolRef.current = currentTool;
      setActiveTool("hand");
    }

    isPanningRef.current = true;
    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      temporaryHand,
    };
  };

  const updatePan = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const container = canvasAreaRef.current;
    if (!container) return;

    const panState = panStateRef.current;
    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;

    container.scrollLeft = panState.scrollLeft - deltaX;
    container.scrollTop = panState.scrollTop - deltaY;
  };

  const endPan = () => {
    if (panStateRef.current.temporaryHand) {
      setActiveTool(previousToolRef.current);
    }

    isPanningRef.current = false;
    panStateRef.current = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      scrollLeft: 0,
      scrollTop: 0,
      temporaryHand: false,
    };
  };

  return {
    isPanningRef,
    panStateRef,
    beginPan,
    updatePan,
    endPan,
  };
}
