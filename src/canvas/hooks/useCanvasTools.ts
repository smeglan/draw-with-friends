"use client";

import { useCallback, useRef, useState } from "react";
import { DRAWING_LIMITS, BUCKET_LIMITS, QUICK_COLORS } from "@/shared/constants/drawing";
import { clamp } from "@/shared/utils/clamp";
import type { DrawingTool, ShapeType } from "@/canvas/types";
import { ShapesTool } from "@/canvas/tools/ShapesTool";
import { ToolFactory } from "@/canvas/tools/ToolFactory";

export function useCanvasTools() {
  const toolFactoryRef = useRef(new ToolFactory());
  const [brushSize, setBrushSizeRaw] = useState<number>(DRAWING_LIMITS.defaultBrushSize);
  const [brushOpacity, setBrushOpacityRaw] = useState<number>(DRAWING_LIMITS.defaultOpacity);
  const [brushColor, setBrushColor] = useState<string>(QUICK_COLORS[0]);
  const [bucketSensitivity, setBucketSensitivityRaw] = useState<number>(BUCKET_LIMITS.defaultSensitivity);
  const [activeTool, setActiveToolState] = useState<DrawingTool>("brush");
  const activeToolRef = useRef<DrawingTool>("brush");
  const [selectedShape, setSelectedShapeRaw] = useState<ShapeType>("rectangle");

  const setActiveTool = useCallback((tool: DrawingTool) => {
    activeToolRef.current = tool;
    setActiveToolState(tool);
  }, []);

  const handleBrushSizeChange = useCallback((value: number) => {
    setBrushSizeRaw(clamp(value, DRAWING_LIMITS.minBrushSize, DRAWING_LIMITS.maxBrushSize));
  }, []);

  const handleBrushOpacityChange = useCallback((value: number) => {
    setBrushOpacityRaw(clamp(value, DRAWING_LIMITS.minOpacity, DRAWING_LIMITS.maxOpacity));
  }, []);

  const handleBucketSensitivityChange = useCallback((value: number) => {
    setBucketSensitivityRaw(clamp(value, BUCKET_LIMITS.minSensitivity, BUCKET_LIMITS.maxSensitivity));
  }, []);

  const handleShapeSelect = useCallback((shape: ShapeType) => {
    setSelectedShapeRaw(shape);
    const tool = toolFactoryRef.current.getTool("shapes");
    if (tool instanceof ShapesTool) {
      tool.setShapeType(shape);
    }
    setActiveTool("shapes");
  }, []);

  return {
    toolFactoryRef,
    brushSize,
    brushOpacity,
    brushColor,
    bucketSensitivity,
    activeTool,
    selectedShape,
    activeToolRef,
    setBrushColor,
    setActiveTool,
    handleBrushSizeChange,
    handleBrushOpacityChange,
    handleBucketSensitivityChange,
    handleShapeSelect,
  };
}
