"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PointerEvent } from "react";

import { useElementSize } from "@/shared/hooks/useElementSize";
import type { CanvasAction, CanvasDimensions, Layer, Point, Stroke } from "@/canvas/types";
import { createLayerId, isFillAction } from "@/canvas/types";
import type { ToolContext } from "@/canvas/tools/ITool";
import { renderStroke, renderStrokeSegment, renderStrokeDot } from "@/canvas/utils/renderStroke";

import { useCanvasState } from "./useCanvasState";
import { useCanvasTools } from "./useCanvasTools";
import { useCanvasHistory } from "./useCanvasHistory";
import { useCanvasZoom } from "./useCanvasZoom";
import { useCanvasPan } from "./useCanvasPan";
import { useCanvasLayers } from "./useCanvasLayers";
import { useCanvasPalettes } from "./useCanvasPalettes";
import { consolidateActions } from "@/canvas/utils/consolidate";

function scaleCanvasActions(
  actions: CanvasAction[],
  scaleX: number,
  scaleY: number,
): CanvasAction[] {
  const scaleSize = Math.sqrt(scaleX * scaleY);
  return actions.map((action) => {
    if (action.type === "stroke") {
      return {
        ...action,
        size: action.size * scaleSize,
        points: action.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY })),
      };
    }
    if (action.type === "fill") {
      return { ...action, x: action.x * scaleX, y: action.y * scaleY };
    }
    if (action.type === "shape") {
      return {
        ...action,
        size: action.size * scaleSize,
        startX: action.startX * scaleX,
        startY: action.startY * scaleY,
        endX: action.endX * scaleX,
        endY: action.endY * scaleY,
      };
    }
    return action;
  });
}

const DEFAULT_LAYERS: Layer[] = [{ id: createLayerId(), name: "Capa 1", visible: true }];

const strokeBaseSnapshotRef = { current: null as HTMLCanvasElement | null };
const currentStrokePointsRef = { current: [] as Point[] };

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const canvasAreaSize = useElementSize(canvasAreaRef);

  const actionsRef = useRef<CanvasAction[]>([]);
  const redoActionsRef = useRef<CanvasAction[]>([]);

  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const layersRef = useRef(DEFAULT_LAYERS);

  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_LAYERS[0].id);
  const activeLayerIdRef = useRef(DEFAULT_LAYERS[0].id);

  const state = useCanvasState({ actionsRef, layersRef });

  const history = useCanvasHistory({
    actionsRef,
    redoActionsRef,
    redrawCanvas: state.redrawCanvas,
    clearFillLayer: state.clearFillLayer,
  });

  const layersManager = useCanvasLayers({
    setLayers,
    layersRef,
    setActiveLayerId,
    activeLayerIdRef,
    actionsRef,
    clearRedoStack: history.clearRedoStack,
    redrawCanvas: state.redrawCanvas,
  });

  const tools = useCanvasTools();

  const pan = useCanvasPan({
    contentRef: innerContentRef,
    setActiveTool: tools.setActiveTool,
  });

  const zoom = useCanvasZoom({
    canvasAreaRef,
    canvasAreaSize,
    canvasSizeRef: state.canvasSizeRef,
    contentRef: innerContentRef,
    panOffsetRef: pan.panOffsetRef,
  });

  const palettes = useCanvasPalettes({
    brushColor: tools.brushColor,
    setBrushColor: tools.setBrushColor,
  });

  const panRef = useRef(pan);
  const toolsRef = useRef(tools);
  const stateRef = useRef(state);
  const historyRef = useRef(history);

  useEffect(() => {
    panRef.current = pan;
    toolsRef.current = tools;
    stateRef.current = state;
    historyRef.current = history;
  });

  const { canvasSizeRef, setCanvasSize } = state;
  const { setStrokesCount: historySetStrokesCount, setRedoCount: historySetRedoCount } = history;

  const handleCanvasSizeChange = useCallback((nextSize: CanvasDimensions) => {
    const prevSize = canvasSizeRef.current;
    if (prevSize.width === nextSize.width && prevSize.height === nextSize.height) return;

    const scaleX = nextSize.width / Math.max(1, prevSize.width);
    const scaleY = nextSize.height / Math.max(1, prevSize.height);

    actionsRef.current = scaleCanvasActions(actionsRef.current, scaleX, scaleY);
    redoActionsRef.current = scaleCanvasActions(redoActionsRef.current, scaleX, scaleY);
    historySetStrokesCount(actionsRef.current.length);
    historySetRedoCount(redoActionsRef.current.length);
    setCanvasSize(nextSize);
    canvasSizeRef.current = nextSize;
  }, [canvasSizeRef, actionsRef, redoActionsRef, historySetStrokesCount, historySetRedoCount, setCanvasSize]);

  const getPointFromEvent = (event: { clientX: number; clientY: number }) => {
    const s = stateRef.current;
    const canvas = s.canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = s.canvasSize.width > 0 ? rect.width / s.canvasSize.width : 1;
    const scaleY = s.canvasSize.height > 0 ? rect.height / s.canvasSize.height : 1;
    return {
      x: (event.clientX - rect.left) / Math.max(0.0001, scaleX),
      y: (event.clientY - rect.top) / Math.max(0.0001, scaleY),
    };
  };

  const renderFullCurrentStroke = (
    strokeProps: Pick<Stroke, "tool" | "color" | "size" | "opacity">,
  ) => {
    const s = stateRef.current;
    const canvas = s.canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = strokeBaseSnapshotRef.current;
    if (!snapshot) return;
    const points = currentStrokePointsRef.current;
    if (points.length === 0) return;

    const scale = s.canvasScaleRef.current;
    const fullStroke: Stroke = {
      type: "stroke",
      tool: strokeProps.tool,
      color: strokeProps.color,
      size: strokeProps.size,
      points,
      layerId: activeLayerIdRef.current,
      opacity: strokeProps.opacity,
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot, 0, 0);
    renderStroke(ctx, fullStroke, scale);
  };

  const getToolContext = (): ToolContext => {
    const s = stateRef.current;
    const t = toolsRef.current;
    const h = historyRef.current;
    return {
      canvasRef: s.canvasRef,
      previewCanvasRef: s.previewCanvasRef,
      fillLayerRef: s.fillLayerRef,
      scale: s.canvasScaleRef.current,
      brushColor: t.brushColor,
      brushSize: t.brushSize,
      brushOpacity: t.brushOpacity,
      bucketSensitivity: t.bucketSensitivity,
      actionsRef: h.actionsRef,
      setBrushColor: t.setBrushColor,
      setActiveTool: t.setActiveTool,
      redrawCanvas: s.redrawCanvas,
      renderStrokeSegment: (from: Point, to: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => {
        if (stroke.tool === "eraser") {
          const canvas = s.canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const guide = { tool: "brush" as const, color: "rgba(100,150,255,0.15)", size: stroke.size, opacity: 100 };
          renderStrokeSegment(ctx, from, to, guide, s.canvasScaleRef.current);
        } else {
          currentStrokePointsRef.current.push(to);
          renderFullCurrentStroke(stroke);
        }
      },
      renderStrokeDot: (point: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => {
        if (stroke.tool === "eraser") {
          const canvas = s.canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const guide = { tool: "brush" as const, color: "rgba(100,150,255,0.15)", size: stroke.size, opacity: 100 };
          renderStrokeDot(ctx, point, guide, s.canvasScaleRef.current);
        } else {
          currentStrokePointsRef.current = [point];
          renderFullCurrentStroke(stroke);
        }
      },
      activeLayerId: activeLayerIdRef.current,
    };
  };

  const rAFRef = useRef<number | null>(null);
  const latestEventDataRef = useRef<{ clientX: number; clientY: number; pointerId: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }
      strokeBaseSnapshotRef.current = null;
      currentStrokePointsRef.current = [];
    };
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    latestEventDataRef.current = null;

    const p = panRef.current;
    const t = toolsRef.current;
    const s = stateRef.current;
    const h = historyRef.current;

    if (event.button === 1) {
      event.preventDefault();
      p.beginPan(event, t.activeTool !== "hand", t.activeTool);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (t.activeTool === "hand") {
      event.preventDefault();
      p.beginPan(event, false);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== 0) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    if (t.activeTool === "brush" || t.activeTool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);

      const cvs = stateRef.current.canvasRef.current;
      if (cvs) {
        const snap = document.createElement("canvas");
        snap.width = cvs.width;
        snap.height = cvs.height;
        const snapCtx = snap.getContext("2d");
        if (snapCtx) {
          snapCtx.drawImage(cvs, 0, 0);
        }
        strokeBaseSnapshotRef.current = snap;
      }
      currentStrokePointsRef.current = [];
    }

    const before = h.actionsRef.current.length;
    const tool = t.toolFactoryRef.current.getTool(t.activeTool);
    tool.onPointerDown(point, getToolContext());

    if (h.actionsRef.current.length !== before) {
      if (h.actionsRef.current.length > before) {
        h.clearRedoStack();
      }
      h.actionsRef.current = consolidateActions(
        h.actionsRef.current,
        layersRef.current,
        s.canvasRef.current?.width || 0,
        s.canvasRef.current?.height || 0,
        s.canvasScaleRef.current
      );
      const lastAction = h.actionsRef.current[h.actionsRef.current.length - 1];
      if (lastAction && isFillAction(lastAction)) {
        s.redrawCanvas();
      }
      h.setStrokesCount(h.actionsRef.current.length);
    }
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    latestEventDataRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
    };

    if (rAFRef.current !== null) return;

    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null;
      const data = latestEventDataRef.current;
      if (!data) return;

      const p = panRef.current;
      const t = toolsRef.current;
      const h = historyRef.current;

      if (p.isPanningRef.current && p.panStateRef.current.pointerId === data.pointerId) {
        p.updatePan({
          clientX: data.clientX,
          clientY: data.clientY,
          preventDefault: () => {},
        });
        return;
      }

      const point = getPointFromEvent(data);
      if (!point) return;

      const before = h.actionsRef.current.length;
      const tool = t.toolFactoryRef.current.getTool(t.activeTool);
      tool.onPointerMove(point, getToolContext());

      if (h.actionsRef.current.length !== before) {
        if (h.actionsRef.current.length > before) {
          h.clearRedoStack();
        }
        h.setStrokesCount(h.actionsRef.current.length);
      }
    });
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    latestEventDataRef.current = null;

    const p = panRef.current;
    const t = toolsRef.current;
    const h = historyRef.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (p.isPanningRef.current && p.panStateRef.current.pointerId === event.pointerId) {
      p.endPan();
      strokeBaseSnapshotRef.current = null;
      currentStrokePointsRef.current = [];
      return;
    }

    const before = h.actionsRef.current.length;
    const tool = t.toolFactoryRef.current.getTool(t.activeTool);
    tool.onPointerUp(getToolContext());

    if (h.actionsRef.current.length !== before) {
      if (h.actionsRef.current.length > before) {
        h.clearRedoStack();
      }
      const s = stateRef.current;
      h.actionsRef.current = consolidateActions(
        h.actionsRef.current,
        layersRef.current,
        s.canvasRef.current?.width || 0,
        s.canvasRef.current?.height || 0,
        s.canvasScaleRef.current
      );
      h.setStrokesCount(h.actionsRef.current.length);
    }

    strokeBaseSnapshotRef.current = null;
    currentStrokePointsRef.current = [];
  }, []);

  return {
    stageRef,
    canvasAreaRef,
    innerContentRef,
    canvasRef: state.canvasRef,
    previewCanvasRef: state.previewCanvasRef,
    canvasAreaSize,
    canvasSize: state.canvasSize,
    handleCanvasWheel: zoom.handleCanvasWheel,
    brushSize: tools.brushSize,
    brushOpacity: tools.brushOpacity,
    brushColor: tools.brushColor,
    activeTool: tools.activeTool,
    strokesCount: history.strokesCount,
    canvasZoom: zoom.canvasZoom,
    setCanvasZoom: zoom.setCanvasZoom,
    handleCanvasSizeChange,
    fitCanvasToScreen: zoom.fitCanvasToScreen,
    setBrushColor: tools.setBrushColor,
    setActiveTool: tools.setActiveTool,
    selectedShape: tools.selectedShape,
    handleShapeSelect: tools.handleShapeSelect,
    savedPalettes: palettes.savedPalettes,
    activePaletteId: palettes.activePaletteId,
    handleBrushSizeChange: tools.handleBrushSizeChange,
    handleBrushOpacityChange: tools.handleBrushOpacityChange,
    bucketSensitivity: tools.bucketSensitivity,
    handleBucketSensitivityChange: tools.handleBucketSensitivityChange,
    customColors: palettes.customColors,
    handleCustomColorClick: palettes.handleCustomColorClick,
    selectedSlotIndex: palettes.selectedSlotIndex,
    handleWheelColorChange: palettes.handleWheelColorChange,
    handleSavePalette: palettes.handleSavePalette,
    handleCreatePalette: palettes.handleCreatePalette,
    handleSelectPalette: palettes.handleSelectPalette,
    handleDeletePalette: palettes.handleDeletePalette,
    handleExportPalette: palettes.handleExportPalette,
    handleImportPaletteJson: palettes.handleImportPaletteJson,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo: history.handleUndo,
    handleRedo: history.handleRedo,
    redoCount: history.redoCount,
    handleClear: history.handleClear,
    layers,
    activeLayerId,
    addLayer: layersManager.addLayer,
    removeLayer: layersManager.removeLayer,
    toggleLayerVisibility: layersManager.toggleLayerVisibility,
    reorderLayer: layersManager.reorderLayer,
    setActiveLayer: layersManager.setActiveLayer,
  };
}
