"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { DRAWING_LIMITS, BUCKET_LIMITS, QUICK_COLORS } from "@/shared/constants/drawing";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { clamp } from "@/shared/utils/clamp";
import type { CanvasAction, DrawingTool } from "@/canvas/types";
import { isFillAction } from "@/canvas/types";
import { ToolFactory } from "@/canvas/tools/ToolFactory";
import type { ToolContext } from "@/canvas/tools/ITool";
import { useFillLayer } from "@/canvas/hooks/useFillLayer";
import { useCanvasRendering } from "@/canvas/hooks/useCanvasRendering";

const INITIAL_BACKGROUND_COLOR = "#ffffff";

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasScaleRef = useRef(1);
  const canvasBackgroundColorRef = useRef(INITIAL_BACKGROUND_COLOR);
  const actionsRef = useRef<CanvasAction[]>([]);
  const toolFactoryRef = useRef(new ToolFactory());
  const size = useElementSize(stageRef);

  const {
    fillLayerRef,
    fillLayerHistoryRef,
    initFillLayer,
    processFillToLayer,
    clearFillLayer,
  } = useFillLayer(canvasRef, canvasScaleRef, actionsRef);

  const { redrawCanvas } = useCanvasRendering(
    canvasRef,
    fillLayerRef,
    actionsRef,
    canvasBackgroundColorRef,
    canvasScaleRef,
  );

  const [brushSize, setBrushSize] = useState<number>(DRAWING_LIMITS.defaultBrushSize);
  const [bucketSensitivity, setBucketSensitivity] = useState<number>(BUCKET_LIMITS.defaultSensitivity);
  const [brushColor, setBrushColor] = useState<string>(QUICK_COLORS[0]);
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush");
  const [strokesCount, setStrokesCount] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const selectedSlotIndexRef = useRef(-1);
  const [customColors, setCustomColors] = useState<(string | null)[]>(() => [
    ...QUICK_COLORS,
    ...Array(8).fill(null),
  ]);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(INITIAL_BACKGROUND_COLOR);

  const updateCanvasBackgroundColor = (color: string) => {
    canvasBackgroundColorRef.current = color;
    setCanvasBackgroundColor(color);
    redrawCanvas();
  };

  const getToolContext = (): ToolContext => ({
    canvasRef,
    fillLayerRef,
    scale: canvasScaleRef.current,
    brushColor,
    brushSize,
    bucketSensitivity,
    actionsRef,
    setBrushColor,
    setActiveTool,
    updateCanvasBackgroundColor,
    redrawCanvas,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!canvas || !stage || size.width === 0 || size.height === 0) return;

    const scale = window.devicePixelRatio || 1;
    canvasScaleRef.current = scale;
    canvas.width = Math.floor(size.width * scale);
    canvas.height = Math.floor(size.height * scale);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    initFillLayer();
    redrawCanvas();
  }, [size.height, size.width]);

  const getPointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    if (activeTool === "brush" || activeTool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const before = actionsRef.current.length;
    const tool = toolFactoryRef.current.getTool(activeTool);
    tool.onPointerDown(point, getToolContext());

    if (actionsRef.current.length !== before) {
      const lastAction = actionsRef.current[actionsRef.current.length - 1];
      if (lastAction && isFillAction(lastAction)) {
        processFillToLayer(lastAction);
        redrawCanvas();
      }
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(event);
    if (!point) return;

    const before = actionsRef.current.length;
    const tool = toolFactoryRef.current.getTool(activeTool);
    tool.onPointerMove(point, getToolContext());

    if (actionsRef.current.length !== before) {
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const before = actionsRef.current.length;
    const tool = toolFactoryRef.current.getTool(activeTool);
    tool.onPointerUp(getToolContext());

    if (actionsRef.current.length !== before) {
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handleUndo = () => {
    const lastAction = actionsRef.current[actionsRef.current.length - 1];
    actionsRef.current = actionsRef.current.slice(0, -1);

    if (lastAction && isFillAction(lastAction)) {
      const prevState = fillLayerHistoryRef.current.pop();
      if (prevState && fillLayerRef.current) {
        const fillCtx = fillLayerRef.current.getContext("2d");
        if (fillCtx) {
          fillCtx.putImageData(prevState, 0, 0);
        }
      }
    }

    setStrokesCount(actionsRef.current.length);
    redrawCanvas();
  };

  const handleClear = () => {
    actionsRef.current = [];
    clearFillLayer();
    updateCanvasBackgroundColor(INITIAL_BACKGROUND_COLOR);
    setStrokesCount(0);
  };

  const handleBrushSizeChange = (value: number) => {
    setBrushSize(
      clamp(value, DRAWING_LIMITS.minBrushSize, DRAWING_LIMITS.maxBrushSize),
    );
  };

  const handleBucketSensitivityChange = (value: number) => {
    setBucketSensitivity(
      clamp(value, BUCKET_LIMITS.minSensitivity, BUCKET_LIMITS.maxSensitivity),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleWheelColorChange = (color: string) => {
    setBrushColor(color);
    const idx = selectedSlotIndexRef.current;
    if (idx >= 0) {
      setCustomColors((prev) => {
        const next = [...prev];
        next[idx] = color;
        return next;
      });
    }
  };

  const handleCustomColorClick = (index: number, replace = false) => {
    setSelectedSlotIndex(index);
    selectedSlotIndexRef.current = index;
    const color = customColors[index];
    if (color !== null && !replace) {
      setBrushColor(color);
    } else {
      setCustomColors((prev) => {
        const next = [...prev];
        next[index] = brushColor;
        return next;
      });
    }
  };

  return {
    stageRef,
    canvasRef,
    brushSize,
    brushColor,
    activeTool,
    strokesCount,
    canvasBackgroundColor,
    setBrushColor,
    setActiveTool,
    setCanvasBackgroundColor: updateCanvasBackgroundColor,
    handleBrushSizeChange,
    bucketSensitivity,
    handleBucketSensitivityChange,
    customColors,
    handleCustomColorClick,
    selectedSlotIndex,
    handleWheelColorChange,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo,
    handleClear,
  };
}
