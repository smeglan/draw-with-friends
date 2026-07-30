"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PointerEvent } from "react";

import { useElementSize } from "@/shared/hooks/useElementSize";
import type { CanvasAction, CanvasDimensions, Layer, Point, Stroke } from "@/canvas/types";
import { createLayerId, isFillAction } from "@/canvas/types";
import type { ToolContext } from "@/canvas/tools/ITool";
import { renderStrokeSegment, renderStrokeCurveSegment, renderStrokeDot } from "@/canvas/utils/renderStroke";
import { ZOOM_LIMITS } from "@/shared/constants/drawing";
import { clamp } from "@/shared/utils/clamp";

import { useCanvasState } from "./useCanvasState";
import { useCanvasTools } from "./useCanvasTools";
import { useCanvasHistory } from "./useCanvasHistory";
import { useCanvasZoom } from "./useCanvasZoom";
import { useCanvasPan } from "./useCanvasPan";
import { useCanvasLayers } from "./useCanvasLayers";
import { useCanvasPalettes } from "./useCanvasPalettes";
import { useCanvasPersistence } from "./useCanvasPersistence";
import type { ProjectFile } from "@/canvas/utils/projectFile";
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

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const canvasAreaSize = useElementSize(canvasAreaRef);

  const actionsRef = useRef<CanvasAction[]>([]);
  const redoActionsRef = useRef<CanvasAction[]>([]);
  const canvasZoomRef = useRef(1);
  const interactionRef = useRef<"idle" | "drawing" | "panning" | "pinching">("idle");

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
    activeToolRef: tools.activeToolRef,
    zoomRef: canvasZoomRef,
  });

  const zoom = useCanvasZoom({
    canvasAreaRef,
    canvasAreaSize,
    canvasSizeRef: state.canvasSizeRef,
    contentRef: innerContentRef,
    panOffsetRef: pan.panOffsetRef,
    zoomRef: canvasZoomRef,
  });

  const palettes = useCanvasPalettes({
    brushColor: tools.brushColor,
    setBrushColor: tools.setBrushColor,
  });

  const { canvasSizeRef, setCanvasSize } = state;
  const { setStrokesCount: historySetStrokesCount, setRedoCount: historySetRedoCount } = history;

  const onRestore = useCallback((data: ProjectFile) => {
    actionsRef.current = data.actions;
    redoActionsRef.current = [];
    layersRef.current = data.layers;
    setLayers(data.layers);
    activeLayerIdRef.current = data.activeLayerId;
    setActiveLayerId(data.activeLayerId);
    canvasSizeRef.current = data.canvasSize;
    setCanvasSize(data.canvasSize);
    historySetStrokesCount(data.actions.length);
    historySetRedoCount(0);
    state.redrawCanvas();
  }, [setLayers, setActiveLayerId, setCanvasSize, historySetStrokesCount, historySetRedoCount, state, canvasSizeRef]);

  const persistence = useCanvasPersistence({
    actionsRef,
    layersRef,
    activeLayerIdRef,
    canvasSizeRef,
    interactionRef,
    onRestore,
  });

  const panRef = useRef(pan);
  const toolsRef = useRef(tools);
  const stateRef = useRef(state);
  const historyRef = useRef(history);
  const persistenceRef = useRef(persistence);
  const consolidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    panRef.current = pan;
    toolsRef.current = tools;
    stateRef.current = state;
    historyRef.current = history;
    persistenceRef.current = persistence;
  });

  useEffect(() => {
    return () => {
      if (consolidationTimerRef.current) {
        clearTimeout(consolidationTimerRef.current);
      }
    };
  }, []);

  const scheduleActionConsolidation = useCallback(() => {
    if (consolidationTimerRef.current) {
      clearTimeout(consolidationTimerRef.current);
    }

    consolidationTimerRef.current = setTimeout(() => {
      // Rasterizing a layer can touch the entire bitmap. Defer it until the
      // canvas is idle so it cannot interrupt a pan or pinch gesture.
      if (interactionRef.current !== "idle") return;

      const s = stateRef.current;
      const h = historyRef.current;
      const canvas = s.canvasRef.current;
      if (!canvas) return;

      const currentActions = h.actionsRef.current;
      const consolidatedActions = consolidateActions(
        currentActions,
        layersRef.current,
        canvas.width,
        canvas.height,
        s.canvasScaleRef.current,
      );
      if (consolidatedActions === currentActions) return;

      h.actionsRef.current = consolidatedActions;
      h.setStrokesCount(h.actionsRef.current.length);
      s.redrawCanvas();
      persistenceRef.current.triggerAutosave();
    }, 1200);
  }, [layersRef]);

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
        const canvas = s.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const p = stroke.tool === "eraser"
          ? { tool: "brush" as const, color: "rgba(100,150,255,0.15)", size: stroke.size, opacity: 100 }
          : stroke;
        renderStrokeSegment(ctx, from, to, p, s.canvasScaleRef.current);
      },
      renderStrokeCurveSegment: (from: Point, control: Point, to: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => {
        const canvas = s.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const p = stroke.tool === "eraser"
          ? { tool: "brush" as const, color: "rgba(100,150,255,0.15)", size: stroke.size, opacity: 100 }
          : stroke;
        renderStrokeCurveSegment(ctx, from, control, to, p, s.canvasScaleRef.current);
      },
      renderStrokeDot: (point: Point, stroke: Pick<Stroke, "tool" | "color" | "size" | "opacity">) => {
        const canvas = s.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const p = stroke.tool === "eraser"
          ? { tool: "brush" as const, color: "rgba(100,150,255,0.15)", size: stroke.size, opacity: 100 }
          : stroke;
        renderStrokeDot(ctx, point, p, s.canvasScaleRef.current);
      },
      activeLayerId: activeLayerIdRef.current,
    };
  };

  const rAFRef = useRef<number | null>(null);
  const latestEventDataRef = useRef<{ clientX: number; clientY: number; pointerId: number } | null>(null);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const isPinchingRef = useRef(false);
  const previousPinchDistanceRef = useRef(0);
  useEffect(() => {
    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }
    };
  }, []);

  const applyPinchZoom = useCallback(() => {
    const pointers = Array.from(activePointersRef.current.values());
    if (pointers.length < 2) return;

    const dx = pointers[0].x - pointers[1].x;
    const dy = pointers[0].y - pointers[1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const oldZoom = zoom.canvasZoomRef.current;
    const zoomFactor = dist / previousPinchDistanceRef.current;
    let newZoom = oldZoom * zoomFactor;
    newZoom = clamp(Math.round(newZoom * 100) / 100, ZOOM_LIMITS.min, ZOOM_LIMITS.max);
    if (newZoom === oldZoom) return;

    const midX = (pointers[0].x + pointers[1].x) / 2;
    const midY = (pointers[0].y + pointers[1].y) / 2;
    const container = canvasAreaRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const originX = midX - rect.left;
    const originY = midY - rect.top;

    const ratio = newZoom / oldZoom;
    const oldPan = pan.panOffsetRef.current;
    const newPanX = oldPan.x * ratio + originX * (1 - ratio);
    const newPanY = oldPan.y * ratio + originY * (1 - ratio);

    // Update pan before the public zoom setter so it can apply one combined
    // transform instead of scheduling a second competing frame.
    pan.panOffsetRef.current = { x: newPanX, y: newPanY };
    zoom.setCanvasZoom(newZoom);

    previousPinchDistanceRef.current = dist;
  }, [canvasAreaRef, innerContentRef, zoom, pan]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    latestEventDataRef.current = null;

    // Track pointer for pinch detection
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointersRef.current.size > 1) {
      // A second pointer changes the interaction to pinch-zoom. From this
      // point on pointer moves must not reach a drawing tool.
      interactionRef.current = "pinching";
      event.currentTarget.setPointerCapture(event.pointerId);
      const pointers = Array.from(activePointersRef.current.values());
      const dx = pointers[0].x - pointers[1].x;
      const dy = pointers[0].y - pointers[1].y;
      previousPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      isPinchingRef.current = true;
      return;
    }

    const p = panRef.current;
    const t = toolsRef.current;
    const s = stateRef.current;
    const h = historyRef.current;

    if (event.button === 1) {
      event.preventDefault();
      interactionRef.current = "panning";
      p.beginPan(event, t.activeTool !== "hand", t.activeTool);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (t.activeTool === "hand") {
      event.preventDefault();
      interactionRef.current = "panning";
      p.beginPan(event, false);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== 0) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    interactionRef.current = "drawing";

    if (t.activeTool === "brush" || t.activeTool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const before = h.actionsRef.current.length;
    const tool = t.toolFactoryRef.current.getTool(t.activeTool);
    tool.onPointerDown(point, getToolContext());

    if (h.actionsRef.current.length !== before) {
      if (h.actionsRef.current.length > before) {
        h.clearRedoStack();
      }
      const lastAction = h.actionsRef.current[h.actionsRef.current.length - 1];
      if (lastAction && isFillAction(lastAction)) {
        s.redrawCanvas();
      }
      h.setStrokesCount(h.actionsRef.current.length);
      scheduleActionConsolidation();
    }
  }, [scheduleActionConsolidation]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    // Only pressed pointers participate in drawing or pinch detection.
    // Hover moves must not populate the active-pointer map.
    if (!activePointersRef.current.has(event.pointerId)) return;

    // Track pointer position for pinch detection
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

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

      if (isPinchingRef.current && activePointersRef.current.size >= 2) {
        applyPinchZoom();
        return;
      }

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

      if (interactionRef.current !== "drawing") return;

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
        scheduleActionConsolidation();
      }
    });
  }, [applyPinchZoom, scheduleActionConsolidation]);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    latestEventDataRef.current = null;

    activePointersRef.current.delete(event.pointerId);

    if (isPinchingRef.current && activePointersRef.current.size < 2) {
      isPinchingRef.current = false;
    }

    if (activePointersRef.current.size > 0 && isPinchingRef.current) {
      interactionRef.current = "pinching";
    } else {
      interactionRef.current = "idle";
    }

    const p = panRef.current;
    const t = toolsRef.current;
    const h = historyRef.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (p.isPanningRef.current && p.panStateRef.current.pointerId === event.pointerId) {
      p.endPan();
      return;
    }

    const before = h.actionsRef.current.length;
    const tool = t.toolFactoryRef.current.getTool(t.activeTool);
    tool.onPointerUp(getToolContext());

    if (h.actionsRef.current.length !== before) {
      if (h.actionsRef.current.length > before) {
        h.clearRedoStack();
      }
      h.setStrokesCount(h.actionsRef.current.length);
      persistenceRef.current.triggerAutosave();
      scheduleActionConsolidation();
    }
  }, [scheduleActionConsolidation]);

  const handleCanvasWheel = useCallback((event: WheelEvent) => {
    // Do not let a wheel gesture zoom while a pointer interaction is active.
    // This prevents the canvas transform and brush rendering from competing
    // in the same frame.
    if (interactionRef.current !== "idle") {
      event.preventDefault();
      return;
    }
    zoom.handleCanvasWheel(event);
  }, [zoom.handleCanvasWheel]);

  return {
    stageRef,
    canvasAreaRef,
    innerContentRef,
    canvasRef: state.canvasRef,
    previewCanvasRef: state.previewCanvasRef,
    canvasAreaSize,
    canvasSize: state.canvasSize,
    handleCanvasWheel,
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
    handleUndo: () => { history.handleUndo(); persistence.triggerAutosave(); scheduleActionConsolidation(); },
    handleRedo: () => { history.handleRedo(); persistence.triggerAutosave(); scheduleActionConsolidation(); },
    redoCount: history.redoCount,
    handleClear: () => { history.handleClear(); persistence.triggerAutosave(); scheduleActionConsolidation(); },
    layers,
    activeLayerId,
    selectedLayerIds: layersManager.selectedLayerIds,
    isLayerWarning: layers.length >= 15,
    toggleLayerSelection: layersManager.toggleLayerSelection,
    clearLayerSelection: layersManager.clearLayerSelection,
    mergeSelected: () => { layersManager.mergeSelected(); persistence.triggerAutosave(); },
    deleteSelected: () => { layersManager.deleteSelected(); persistence.triggerAutosave(); },
    addLayer: () => { layersManager.addLayer(); persistence.triggerAutosave(); },
    removeLayer: (id: string) => { layersManager.removeLayer(id); persistence.triggerAutosave(); },
    toggleLayerVisibility: layersManager.toggleLayerVisibility,
    reorderLayer: (id: string, direction: "up" | "down") => { layersManager.reorderLayer(id, direction); persistence.triggerAutosave(); },
    setActiveLayer: layersManager.setActiveLayer,
    saveToFile: persistence.saveToFile,
    openFile: persistence.openFile,
    hasAutosave: persistence.hasAutosave,
    restoreAutosave: persistence.restoreAutosave,
    clearAutosave: persistence.clearAutosave,
  };
}
