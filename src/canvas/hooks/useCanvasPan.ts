"use client";

import { useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import type { DrawingTool } from "@/canvas/types";

type PanDeps = {
  contentRef: RefObject<HTMLDivElement | null>;
  setActiveTool: (tool: DrawingTool) => void;
};

export function useCanvasPan({ contentRef, setActiveTool }: PanDeps) {
  const previousToolRef = useRef<DrawingTool>("brush");
  const isPanningRef = useRef(false);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const panStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    temporaryHand: false,
  });

  const beginPan = (event: PointerEvent<HTMLCanvasElement>, temporaryHand: boolean, currentTool?: DrawingTool) => {
    if (temporaryHand && currentTool) {
      previousToolRef.current = currentTool;
      setActiveTool("hand");
    }

    isPanningRef.current = true;
    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: panOffsetRef.current.x,
      baseY: panOffsetRef.current.y,
      temporaryHand,
    };
  };

  const updatePan = (event: { clientX: number; clientY: number; preventDefault: () => void }) => {
    event.preventDefault();

    const content = contentRef.current;
    if (!content) return;

    const panState = panStateRef.current;
    const newX = panState.baseX + (event.clientX - panState.startX);
    const newY = panState.baseY + (event.clientY - panState.startY);

    panOffsetRef.current = { x: newX, y: newY };
    content.style.transform = `translate(${newX}px, ${newY}px)`;
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
      baseX: 0,
      baseY: 0,
      temporaryHand: false,
    };
  };

  return {
    isPanningRef,
    panStateRef,
    panOffsetRef,
    beginPan,
    updatePan,
    endPan,
  };
}
