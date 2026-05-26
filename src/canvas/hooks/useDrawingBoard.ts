"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PointerEvent } from "react";

import { DRAWING_LIMITS, BUCKET_LIMITS, QUICK_COLORS } from "@/shared/constants/drawing";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { clamp } from "@/shared/utils/clamp";
import type {
  CanvasAction,
  CanvasDimensions,
  DrawingTool,
  Layer,
  SavedPalette,
  Stroke,
  ShapeType,
} from "@/canvas/types";
import { isFillAction, createLayerId } from "@/canvas/types";
import { ToolFactory } from "@/canvas/tools/ToolFactory";
import type { ToolContext } from "@/canvas/tools/ITool";
import { ShapesTool } from "@/canvas/tools/ShapesTool";
import { useFillLayer } from "@/canvas/hooks/useFillLayer";
import { useCanvasRendering } from "@/canvas/hooks/useCanvasRendering";
import { renderStroke } from "@/canvas/utils/renderStroke";

const PALETTE_STORAGE_KEY = "los-pibes-que-dibujan:palettes";
const ACTIVE_PALETTE_STORAGE_KEY = "los-pibes-que-dibujan:active-palette-id";
const PALETTE_SLOT_COUNT = QUICK_COLORS.length + 8;

function createDefaultPaletteColors() {
  return [...QUICK_COLORS, ...Array(8).fill(null)] as (string | null)[];
}

function normalizePaletteColors(colors: unknown): (string | null)[] {
  const source = Array.isArray(colors) ? colors : [];
  return Array.from({ length: PALETTE_SLOT_COUNT }, (_, index) => {
    const value = source[index];
    return typeof value === "string" && value.trim() ? value : null;
  });
}

function createPaletteFromColors(name: string, colors: (string | null)[]): SavedPalette {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "Paleta",
    colors: normalizePaletteColors(colors),
    createdAt: now,
    updatedAt: now,
  };
}

function findFirstColor(colors: (string | null)[]) {
  return colors.find((color): color is string => Boolean(color)) ?? QUICK_COLORS[0];
}

function scaleCanvasActions(actions: CanvasAction[], scaleX: number, scaleY: number): CanvasAction[] {
  const scaleSize = Math.sqrt(scaleX * scaleY);

  return actions.map((action) => {
    if (action.type === "stroke") {
      return {
        ...action,
        size: action.size * scaleSize,
        points: action.points.map((point) => ({
          x: point.x * scaleX,
          y: point.y * scaleY,
        })),
      };
    }

    if (action.type === "fill") {
      return {
        ...action,
        x: action.x * scaleX,
        y: action.y * scaleY,
      };
    }

    return {
      ...action,
      size: action.size * scaleSize,
      startX: action.startX * scaleX,
      startY: action.startY * scaleY,
      endX: action.endX * scaleX,
      endY: action.endY * scaleY,
    };
  });
}

function readStoredPalettes(): SavedPalette[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const palette = entry as Partial<SavedPalette>;
        if (typeof palette.name !== "string") return null;
        return {
          id: typeof palette.id === "string" && palette.id ? palette.id : crypto.randomUUID(),
          name: palette.name,
          colors: normalizePaletteColors(palette.colors),
          createdAt: typeof palette.createdAt === "string" ? palette.createdAt : new Date().toISOString(),
          updatedAt: typeof palette.updatedAt === "string" ? palette.updatedAt : new Date().toISOString(),
        } satisfies SavedPalette;
      })
      .filter((palette): palette is SavedPalette => palette !== null);
  } catch {
    return [];
  }
}

export function useDrawingBoard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasAreaSize = useElementSize(canvasAreaRef);
  const canvasScaleRef = useRef(1);
  const actionsRef = useRef<CanvasAction[]>([]);
  const redoActionsRef = useRef<CanvasAction[]>([]);
  const toolFactoryRef = useRef(new ToolFactory());
  const [layers, setLayers] = useState<Layer[]>([
    { id: createLayerId(), name: "Capa 1", visible: true },
  ]);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const [activeLayerId, setActiveLayerId] = useState(layers[0].id);
  const activeLayerIdRef = useRef(activeLayerId);
  activeLayerIdRef.current = activeLayerId;

  const {
    fillLayerRef,
    initFillLayer,
    clearFillLayer,
  } = useFillLayer(canvasRef, canvasScaleRef, actionsRef);

  const { redrawCanvas } = useCanvasRendering(
    canvasRef,
    actionsRef,
    canvasScaleRef,
    layersRef,
  );

  const renderPreviewStroke = (stroke: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    redrawCanvas();
    renderStroke(context, stroke, canvasScaleRef.current);
  };

  const clearRedoStack = useCallback(() => {
    redoActionsRef.current = [];
    setRedoCount(0);
  }, []);

  const [brushSize, setBrushSize] = useState<number>(DRAWING_LIMITS.defaultBrushSize);
  const [brushOpacity, setBrushOpacity] = useState<number>(DRAWING_LIMITS.defaultOpacity);
  const [bucketSensitivity, setBucketSensitivity] = useState<number>(BUCKET_LIMITS.defaultSensitivity);
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [canvasSize, setCanvasSize] = useState<CanvasDimensions>({
    width: 1920,
    height: 1080,
  });
  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;
  const [brushColor, setBrushColor] = useState<string>(QUICK_COLORS[0]);
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush");
  const previousToolRef = useRef<DrawingTool>("brush");
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [strokesCount, setStrokesCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const selectedSlotIndexRef = useRef(-1);
  const [customColors, setCustomColors] = useState<(string | null)[]>(() => createDefaultPaletteColors());
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const isPanningRef = useRef(false);
  const panStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    temporaryHand: false,
  });
  const getToolContext = (): ToolContext => ({
    canvasRef,
    fillLayerRef,
    scale: canvasScaleRef.current,
    brushColor,
    brushSize,
    brushOpacity,
    bucketSensitivity,
    actionsRef,
    setBrushColor,
    setActiveTool,
    redrawCanvas,
    renderPreviewStroke,
    activeLayerId: activeLayerIdRef.current,
  });

  useEffect(() => {
    const palettes = readStoredPalettes();
    setSavedPalettes(palettes);

    if (typeof window === "undefined") return;

    const storedActivePaletteId = window.localStorage.getItem(ACTIVE_PALETTE_STORAGE_KEY);
    if (!storedActivePaletteId) return;

    const activePalette = palettes.find((palette) => palette.id === storedActivePaletteId);
    if (!activePalette) return;

    setActivePaletteId(activePalette.id);
    setCustomColors(activePalette.colors);
    setBrushColor(findFirstColor(activePalette.colors));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(savedPalettes));
  }, [savedPalettes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activePaletteId) {
      window.localStorage.setItem(ACTIVE_PALETTE_STORAGE_KEY, activePaletteId);
    } else {
      window.localStorage.removeItem(ACTIVE_PALETTE_STORAGE_KEY);
    }
  }, [activePaletteId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = window.devicePixelRatio || 1;
    canvasScaleRef.current = scale;
    canvas.width = Math.floor(canvasSize.width * scale);
    canvas.height = Math.floor(canvasSize.height * scale);

    initFillLayer();
    redrawCanvas();
  }, [canvasSize.height, canvasSize.width, initFillLayer, redrawCanvas]);

  const getPointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width > 0 ? rect.width / canvasSize.width : 1;
    const scaleY = canvasSize.height > 0 ? rect.height / canvasSize.height : 1;
    return {
      x: (event.clientX - rect.left) / Math.max(0.0001, scaleX),
      y: (event.clientY - rect.top) / Math.max(0.0001, scaleY),
    };
  };

  const beginPan = (event: PointerEvent<HTMLCanvasElement>, temporaryHand: boolean) => {
    const container = canvasAreaRef.current;
    if (!container) return;

    if (temporaryHand) {
      previousToolRef.current = activeTool;
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

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button === 1) {
      event.preventDefault();
      beginPan(event, activeTool !== "hand");
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeTool === "hand") {
      event.preventDefault();
      beginPan(event, false);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

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
      if (actionsRef.current.length > before) {
        clearRedoStack();
      }
      const lastAction = actionsRef.current[actionsRef.current.length - 1];
      if (lastAction && isFillAction(lastAction)) {
        redrawCanvas();
      }
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current && panStateRef.current.pointerId === event.pointerId) {
      updatePan(event);
      return;
    }

    const point = getPointFromEvent(event);
    if (!point) return;

    const before = actionsRef.current.length;
    const tool = toolFactoryRef.current.getTool(activeTool);
    tool.onPointerMove(point, getToolContext());

    if (actionsRef.current.length !== before) {
      if (actionsRef.current.length > before) {
        clearRedoStack();
      }
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (isPanningRef.current && panStateRef.current.pointerId === event.pointerId) {
      endPan();
      return;
    }

    const before = actionsRef.current.length;
    const tool = toolFactoryRef.current.getTool(activeTool);
    tool.onPointerUp(getToolContext());

    if (actionsRef.current.length !== before) {
      if (actionsRef.current.length > before) {
        clearRedoStack();
      }
      setStrokesCount(actionsRef.current.length);
    }
  };

  const handleUndo = useCallback(() => {
    const lastAction = actionsRef.current[actionsRef.current.length - 1];
    if (!lastAction) return;
    actionsRef.current = actionsRef.current.slice(0, -1);
    redoActionsRef.current = [...redoActionsRef.current, lastAction];
    setStrokesCount(actionsRef.current.length);
    setRedoCount(redoActionsRef.current.length);
    redrawCanvas();
  }, [redrawCanvas]);

  const handleRedo = useCallback(() => {
    const redoAction = redoActionsRef.current[redoActionsRef.current.length - 1];
    if (!redoAction) return;

    redoActionsRef.current = redoActionsRef.current.slice(0, -1);
    actionsRef.current = [...actionsRef.current, redoAction];
    setStrokesCount(actionsRef.current.length);
    setRedoCount(redoActionsRef.current.length);
    redrawCanvas();
  }, [redrawCanvas]);

  const handleClear = useCallback(() => {
    actionsRef.current = [];
    clearRedoStack();
    clearFillLayer();
    setStrokesCount(0);
    redrawCanvas();
  }, [clearFillLayer, clearRedoStack, redrawCanvas]);

  const handleBrushSizeChange = (value: number) => {
    setBrushSize(
      clamp(value, DRAWING_LIMITS.minBrushSize, DRAWING_LIMITS.maxBrushSize),
    );
  };

  const handleBrushOpacityChange = (value: number) => {
    setBrushOpacity(
      clamp(value, DRAWING_LIMITS.minOpacity, DRAWING_LIMITS.maxOpacity),
    );
  };

  const handleCanvasSizeChange = useCallback((nextSize: CanvasDimensions) => {
    const prevSize = canvasSizeRef.current;
    if (prevSize.width === nextSize.width && prevSize.height === nextSize.height) return;

    const scaleX = nextSize.width / Math.max(1, prevSize.width);
    const scaleY = nextSize.height / Math.max(1, prevSize.height);

    actionsRef.current = scaleCanvasActions(actionsRef.current, scaleX, scaleY);
    redoActionsRef.current = scaleCanvasActions(redoActionsRef.current, scaleX, scaleY);
    setStrokesCount(actionsRef.current.length);
    setRedoCount(redoActionsRef.current.length);
    setCanvasSize(nextSize);
    canvasSizeRef.current = nextSize;
  }, []);

  const handleBucketSensitivityChange = (value: number) => {
    setBucketSensitivity(
      clamp(value, BUCKET_LIMITS.minSensitivity, BUCKET_LIMITS.maxSensitivity),
    );
  };

  const fitCanvasToScreen = useCallback(() => {
    const width = canvasAreaSize.width;
    const height = canvasAreaSize.height;
    if (width === 0 || height === 0) return;

    const availableWidth = Math.max(1, width - 32);
    const availableHeight = Math.max(1, height - 32);
    const zoom = clamp(
      Math.min(availableWidth / canvasSizeRef.current.width, availableHeight / canvasSizeRef.current.height),
      0.25,
      2,
    );
    setCanvasZoom(Number(zoom.toFixed(2)));

    const container = canvasAreaRef.current;
    if (!container) return;

    window.requestAnimationFrame(() => {
      container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
      container.scrollTop = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);
    });
  }, [canvasAreaSize.height, canvasAreaSize.width]);

  const handleShapeSelect = (shape: ShapeType) => {
    setSelectedShape(shape);
    const tool = toolFactoryRef.current.getTool("shapes");
    if (tool instanceof ShapesTool) {
      tool.setShapeType(shape);
    }
    setActiveTool("shapes");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if ((isMod && key === "y") || (isMod && key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo]);

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

  const savePaletteToState = useCallback((name: string, forceCreateNew: boolean) => {
    const now = new Date().toISOString();
    const paletteName = name.trim() || `Paleta ${savedPalettes.length + 1}`;
    const existingId = !forceCreateNew && activePaletteId && savedPalettes.some((palette) => palette.id === activePaletteId)
      ? activePaletteId
      : null;

    if (existingId) {
      setSavedPalettes((prev) =>
        prev.map((palette) =>
          palette.id === existingId
            ? {
                ...palette,
                name: paletteName,
                colors: [...customColors],
                updatedAt: now,
              }
            : palette,
        ),
      );
      setActivePaletteId(existingId);
      return;
    }

    const newPalette = createPaletteFromColors(paletteName, customColors);
    setSavedPalettes((prev) => [...prev, newPalette]);
    setActivePaletteId(newPalette.id);
  }, [activePaletteId, customColors, savedPalettes]);

  const handleSavePalette = useCallback((name: string) => {
    savePaletteToState(name, false);
  }, [savePaletteToState]);

  const handleCreatePalette = useCallback((name: string) => {
    savePaletteToState(name, true);
  }, [savePaletteToState]);

  const handleSelectPalette = useCallback((paletteId: string) => {
    const palette = savedPalettes.find((entry) => entry.id === paletteId);
    if (!palette) return;

    setCustomColors([...palette.colors]);
    setBrushColor(findFirstColor(palette.colors));
    setActivePaletteId(palette.id);
  }, [savedPalettes]);

  const handleDeletePalette = useCallback((paletteId: string) => {
    setSavedPalettes((prev) => prev.filter((palette) => palette.id !== paletteId));

    if (activePaletteId === paletteId) {
      setActivePaletteId(null);
      const fallback = createDefaultPaletteColors();
      setCustomColors(fallback);
      setBrushColor(findFirstColor(fallback));
    }
  }, [activePaletteId]);

  const handleExportPalette = useCallback((paletteId?: string) => {
    const palette =
      (paletteId ? savedPalettes.find((entry) => entry.id === paletteId) : null) ?? {
        id: "current",
        name: "Paleta actual",
        colors: customColors,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

    const payload = {
      version: 1,
      palette,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${palette.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [customColors, savedPalettes]);

  const handleImportPaletteJson = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      const imported: SavedPalette[] = [];

      const pushPalette = (value: unknown) => {
        if (!value || typeof value !== "object") return;
        const candidate = value as Partial<SavedPalette>;
        if (!Array.isArray(candidate.colors)) return;

        imported.push({
          id: crypto.randomUUID(),
          name: typeof candidate.name === "string" && candidate.name.trim()
            ? candidate.name.trim()
            : `Paleta importada ${imported.length + 1}`,
          colors: normalizePaletteColors(candidate.colors),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      };

      if (parsed && typeof parsed === "object" && "palette" in parsed) {
        pushPalette((parsed as { palette?: unknown }).palette);
      } else if (parsed && typeof parsed === "object" && "palettes" in parsed && Array.isArray((parsed as { palettes?: unknown }).palettes)) {
        for (const palette of (parsed as { palettes: unknown[] }).palettes) {
          pushPalette(palette);
        }
      } else {
        pushPalette(parsed);
      }

      if (imported.length === 0) return;

      setSavedPalettes((prev) => [...prev, ...imported]);
      setActivePaletteId(imported[imported.length - 1].id);
      setCustomColors([...imported[imported.length - 1].colors]);
      setBrushColor(findFirstColor(imported[imported.length - 1].colors));
    } catch {
      // Ignore malformed JSON to keep the UI forgiving.
    }
  }, []);

  const addLayer = useCallback(() => {
    const id = createLayerId();
    const newLayer: Layer = { id, name: `Capa ${layersRef.current.length + 1}`, visible: true };
    const newLayers = [...layersRef.current, newLayer];
    setLayers(newLayers);
    layersRef.current = newLayers;
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
    redrawCanvas();
  }, [redrawCanvas]);

  const removeLayer = useCallback((id: string) => {
    if (layersRef.current.length <= 1) return;
    const newLayers = layersRef.current.filter((l) => l.id !== id);
    actionsRef.current = actionsRef.current.filter((a) => a.layerId !== id);
    clearRedoStack();
    setLayers(newLayers);
    layersRef.current = newLayers;
    if (activeLayerIdRef.current === id) {
      const newId = newLayers.length > 0 ? newLayers[newLayers.length - 1].id : "";
      setActiveLayerId(newId);
      activeLayerIdRef.current = newId;
    }
    setStrokesCount(actionsRef.current.length);
    redrawCanvas();
  }, [clearRedoStack, redrawCanvas]);

  const toggleLayerVisibility = useCallback((id: string) => {
    const newLayers = layersRef.current.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l,
    );
    setLayers(newLayers);
    layersRef.current = newLayers;
    redrawCanvas();
  }, [redrawCanvas]);

  const reorderLayer = useCallback((id: string, direction: "up" | "down") => {
    const idx = layersRef.current.findIndex((l) => l.id === id);
    if (direction === "up" && idx >= layersRef.current.length - 1) return;
    if (direction === "down" && idx <= 0) return;

    const newLayers = [...layersRef.current];
    const swapIdx = direction === "up" ? idx + 1 : idx - 1;
    [newLayers[idx], newLayers[swapIdx]] = [newLayers[swapIdx], newLayers[idx]];
    setLayers(newLayers);
    layersRef.current = newLayers;
    redrawCanvas();
  }, [redrawCanvas]);

  const setActiveLayer = useCallback((id: string) => {
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
  }, []);

  return {
    stageRef,
    canvasAreaRef,
    canvasRef,
    canvasSize,
    brushSize,
    brushOpacity,
    brushColor,
    activeTool,
    strokesCount,
    canvasZoom,
    setCanvasZoom,
    handleCanvasSizeChange,
    fitCanvasToScreen,
    setBrushColor,
    setActiveTool,
    selectedShape,
    handleShapeSelect,
    savedPalettes,
    activePaletteId,
    handleBrushSizeChange,
    handleBrushOpacityChange,
    bucketSensitivity,
    handleBucketSensitivityChange,
    customColors,
    handleCustomColorClick,
    selectedSlotIndex,
    handleWheelColorChange,
    handleSavePalette,
    handleCreatePalette,
    handleSelectPalette,
    handleDeletePalette,
    handleExportPalette,
    handleImportPaletteJson,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleUndo,
    handleRedo,
    redoCount,
    handleClear,
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    reorderLayer,
    setActiveLayer,
  };
}
