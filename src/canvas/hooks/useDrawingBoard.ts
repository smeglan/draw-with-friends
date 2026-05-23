"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { DRAWING_LIMITS, QUICK_COLORS } from "@/shared/constants/drawing";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { clamp } from "@/shared/utils/clamp";
import type { Point, Stroke } from "@/canvas/types";
import {
  renderStroke,
  renderStrokeDot,
  renderStrokeSegment,
} from "@/canvas/utils/renderStroke";

export type DrawingTool = "brush" | "bucket" | "eraser" | "eyedropper";

const INITIAL_BACKGROUND_COLOR = "#ffffff";

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionsRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const canvasScaleRef = useRef(1);
  const canvasBackgroundColorRef = useRef(INITIAL_BACKGROUND_COLOR);
  const size = useElementSize(stageRef);
  const [brushSize, setBrushSize] = useState<number>(
    DRAWING_LIMITS.defaultBrushSize,
  );
  const [brushColor, setBrushColor] = useState<string>(QUICK_COLORS[0]);
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush");
  const [strokesCount, setStrokesCount] = useState(0);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(
    INITIAL_BACKGROUND_COLOR,
  );

  const getStrokeCount = () =>
    actionsRef.current.length;

  const updateCanvasBackgroundColor = (color: string) => {
    canvasBackgroundColorRef.current = color;
    setCanvasBackgroundColor(color);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const scale = canvasScaleRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = canvasBackgroundColorRef.current;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const action of actionsRef.current) {
      renderStroke(context, action, scale);
    }

    if (currentStrokeRef.current) {
      renderStroke(context, currentStrokeRef.current, scale);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!canvas || !stage || size.width === 0 || size.height === 0) {
      return;
    }

    const scale = window.devicePixelRatio || 1;
    canvasScaleRef.current = scale;
    canvas.width = Math.floor(size.width * scale);
    canvas.height = Math.floor(size.height * scale);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    redrawCanvas();
  }, [size.height, size.width]);

  const beginStroke = (point: Point) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    isDrawingRef.current = true;
    lastPointRef.current = point;

    const stroke: Stroke = {
      tool: activeTool === "eraser" ? "eraser" : "brush",
      color: brushColor,
      size: brushSize,
      points: [point],
    };

    currentStrokeRef.current = stroke;
    renderStrokeDot(context, point, stroke, canvasScaleRef.current);
  };

  const extendStroke = (point: Point) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const currentStroke = currentStrokeRef.current;
    const previousPoint = lastPointRef.current;

    if (
      !canvas ||
      !context ||
      !isDrawingRef.current ||
      !currentStroke ||
      !previousPoint
    ) {
      return;
    }

    currentStroke.points.push(point);
    renderStrokeSegment(
      context,
      previousPoint,
      point,
      currentStroke,
      canvasScaleRef.current,
    );
    lastPointRef.current = point;
  };

  const endStroke = () => {
    if (!isDrawingRef.current) {
      return;
    }

    const currentStroke = currentStrokeRef.current;

    if (currentStroke && currentStroke.points.length > 0) {
      actionsRef.current = [...actionsRef.current, currentStroke];
      setStrokesCount(getStrokeCount());
    }

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  };

  const getPointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const pointToCanvasCoordinates = (point: Point) => {
    const scale = canvasScaleRef.current;

    return {
      x: Math.floor(point.x * scale),
      y: Math.floor(point.y * scale),
    };
  };

  const pickColorAtPoint = (point: Point) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const coordinates = pointToCanvasCoordinates(point);

    if (!canvas || !context) {
      return;
    }

    const { data } = context.getImageData(coordinates.x, coordinates.y, 1, 1);
    const [red, green, blue, alpha] = data;

    if (alpha === 0) {
      return;
    }

    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    setBrushColor(`#${toHex(red)}${toHex(green)}${toHex(blue)}`);
    setActiveTool("brush");
  };

  const fillCanvasWithColor = (color: string) => {
    updateCanvasBackgroundColor(color);
    setActiveTool("brush");
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return;
    }

    const point = getPointFromEvent(event);

    if (!point) {
      return;
    }

    if (activeTool === "bucket") {
      fillCanvasWithColor(brushColor);
      return;
    }

    if (activeTool === "eyedropper") {
      pickColorAtPoint(point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    beginStroke(point);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(event);

    if (!point || !isDrawingRef.current) {
      return;
    }

    extendStroke(point);
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    endStroke();
  };

  const handleUndo = () => {
    actionsRef.current = actionsRef.current.slice(0, -1);
    setStrokesCount(getStrokeCount());
    redrawCanvas();
  };

  const handleClear = () => {
    actionsRef.current = [];
    currentStrokeRef.current = null;
    lastPointRef.current = null;
    isDrawingRef.current = false;
    updateCanvasBackgroundColor(INITIAL_BACKGROUND_COLOR);
    setStrokesCount(0);
  };

  const handleBrushSizeChange = (value: number) => {
    setBrushSize(
      clamp(value, DRAWING_LIMITS.minBrushSize, DRAWING_LIMITS.maxBrushSize),
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo,
    handleClear,
  };
}
