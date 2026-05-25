"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { DRAWING_LIMITS, BUCKET_LIMITS, QUICK_COLORS } from "@/shared/constants/drawing";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { clamp } from "@/shared/utils/clamp";
import type { CanvasAction, DrawingTool } from "@/canvas/types";
import { isFillAction } from "@/canvas/types";
import { renderStroke } from "@/canvas/utils/renderStroke";
import { applyFillToCanvas } from "@/canvas/utils/floodFill";
import { ToolFactory } from "@/canvas/tools/ToolFactory";
import type { ToolContext } from "@/canvas/tools/ITool";

const INITIAL_BACKGROUND_COLOR = "#ffffff";

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionsRef = useRef<CanvasAction[]>([]);
  const canvasScaleRef = useRef(1);
  const canvasBackgroundColorRef = useRef(INITIAL_BACKGROUND_COLOR);
  const toolFactoryRef = useRef(new ToolFactory());
  const fillLayerRef = useRef<HTMLCanvasElement | null>(null);
  const fillLayerHistoryRef = useRef<ImageData[]>([]);
  const size = useElementSize(stageRef);
  const [brushSize, setBrushSize] = useState<number>(
    DRAWING_LIMITS.defaultBrushSize,
  );
  const [bucketSensitivity, setBucketSensitivity] = useState<number>(
    BUCKET_LIMITS.defaultSensitivity,
  );
  const [brushColor, setBrushColor] = useState<string>(QUICK_COLORS[0]);
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush");
  const [strokesCount, setStrokesCount] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const selectedSlotIndexRef = useRef(-1);
  const [customColors, setCustomColors] = useState<(string | null)[]>(() => [
    ...QUICK_COLORS,
    ...Array(8).fill(null),
  ]);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(
    INITIAL_BACKGROUND_COLOR,
  );

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

  const initFillLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      !fillLayerRef.current ||
      fillLayerRef.current.width !== canvas.width ||
      fillLayerRef.current.height !== canvas.height
    ) {
      fillLayerRef.current = document.createElement("canvas");
      fillLayerRef.current.width = canvas.width;
      fillLayerRef.current.height = canvas.height;
    }
  };

  const processFillToLayer = (action: CanvasAction) => {
    if (!isFillAction(action)) return;

    const canvas = canvasRef.current;
    if (!canvas || !fillLayerRef.current) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = canvasScaleRef.current;

    const fillCtx = fillLayerRef.current.getContext("2d");
    if (!fillCtx) return;

    fillLayerHistoryRef.current.push(
      fillCtx.getImageData(0, 0, w, h),
    );

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(fillLayerRef.current, 0, 0);

    for (const a of actionsRef.current) {
      if (!isFillAction(a)) {
        renderStroke(tempCtx, a, scale);
      }
    }

    const beforeData = tempCtx.getImageData(0, 0, w, h);

    applyFillToCanvas(
      tempCtx,
      tempCanvas,
      action.x,
      action.y,
      action.color,
      scale,
      action.tolerance,
    );

    const afterData = tempCtx.getImageData(0, 0, w, h);

    const fillPixels = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < beforeData.data.length; i += 4) {
      const changed =
        beforeData.data[i] !== afterData.data[i] ||
        beforeData.data[i + 1] !== afterData.data[i + 1] ||
        beforeData.data[i + 2] !== afterData.data[i + 2] ||
        beforeData.data[i + 3] !== afterData.data[i + 3];
      if (changed) {
        fillPixels[i] = afterData.data[i];
        fillPixels[i + 1] = afterData.data[i + 1];
        fillPixels[i + 2] = afterData.data[i + 2];
        fillPixels[i + 3] = afterData.data[i + 3];
      }
    }

    const fillImageData = new ImageData(fillPixels, w, h);
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = w;
    resultCanvas.height = h;
    const resultCtx = resultCanvas.getContext("2d");
    if (!resultCtx) return;
    resultCtx.putImageData(fillImageData, 0, 0);

    fillCtx.drawImage(resultCanvas, 0, 0);
  };

  const rebuildFillLayer = () => {
    initFillLayer();
    const fillCtx = fillLayerRef.current?.getContext("2d");
    if (!fillCtx || !fillLayerRef.current) return;
    fillCtx.clearRect(0, 0, fillLayerRef.current.width, fillLayerRef.current.height);

    for (const action of actionsRef.current) {
      if (isFillAction(action)) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        const scale = canvasScaleRef.current;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCtx.drawImage(fillLayerRef.current!, 0, 0);

        const actionIdx = actionsRef.current.indexOf(action);
        for (let i = 0; i < actionIdx; i++) {
          const a = actionsRef.current[i];
          if (!isFillAction(a)) {
            renderStroke(tempCtx, a, scale);
          }
        }

        const beforeData = tempCtx.getImageData(0, 0, w, h);

        applyFillToCanvas(
          tempCtx,
          tempCanvas,
          action.x,
          action.y,
          action.color,
          scale,
          action.tolerance,
        );

        const afterData = tempCtx.getImageData(0, 0, w, h);

        const fillPixels = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < beforeData.data.length; i += 4) {
          const changed =
            beforeData.data[i] !== afterData.data[i] ||
            beforeData.data[i + 1] !== afterData.data[i + 1] ||
            beforeData.data[i + 2] !== afterData.data[i + 2] ||
            beforeData.data[i + 3] !== afterData.data[i + 3];
          if (changed) {
            fillPixels[i] = afterData.data[i];
            fillPixels[i + 1] = afterData.data[i + 1];
            fillPixels[i + 2] = afterData.data[i + 2];
            fillPixels[i + 3] = afterData.data[i + 3];
          }
        }

        const fillImageData = new ImageData(fillPixels, w, h);
        const resultCanvas = document.createElement("canvas");
        resultCanvas.width = w;
        resultCanvas.height = h;
        const resultCtx = resultCanvas.getContext("2d");
        if (!resultCtx) return;
        resultCtx.putImageData(fillImageData, 0, 0);

        fillCtx.drawImage(resultCanvas, 0, 0);
      }
    }
  };

  const updateCanvasBackgroundColor = (color: string) => {
    canvasBackgroundColorRef.current = color;
    setCanvasBackgroundColor(color);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const scale = canvasScaleRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = canvasBackgroundColorRef.current;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (fillLayerRef.current) {
      context.drawImage(fillLayerRef.current, 0, 0);
    }

    for (const action of actionsRef.current) {
      if (!isFillAction(action)) {
        renderStroke(context, action, scale);
      }
    }
  };

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
    fillLayerHistoryRef.current = [];
    if (fillLayerRef.current) {
      const fillCtx = fillLayerRef.current.getContext("2d");
      if (fillCtx) {
        fillCtx.clearRect(
          0,
          0,
          fillLayerRef.current.width,
          fillLayerRef.current.height,
        );
      }
    }
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
