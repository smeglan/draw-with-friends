"use client";

import { useState } from "react";
import { Icon } from "@/shared/icons";
import { DrawingCanvas } from "@/canvas/components/canvas/DrawingCanvas";
import { CanvasToolbar } from "@/canvas/components/molecules/CanvasToolbar";
import { ToolSidebar } from "@/canvas/components/organisms/ToolSidebar";
import { LayerPanel } from "@/canvas/components/organisms/LayerPanel";
import { useDrawingBoard } from "@/canvas/hooks/useDrawingBoard";

export default function DrawingBoard() {
  const drawingBoard = useDrawingBoard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    stageRef,
    canvasAreaRef,
    innerContentRef,
    canvasRef,
    previewCanvasRef,
    canvasSize,
    brushSize,
    brushOpacity,
    brushColor,
    activeTool,
    canvasZoom,
    setBrushColor,
    handleCanvasSizeChange,
    fitCanvasToScreen,
    setActiveTool,
    handleBrushSizeChange,
    handleBrushOpacityChange,
    bucketSensitivity,
    handleBucketSensitivityChange,
    customColors,
    handleCustomColorClick,
    selectedSlotIndex,
    handleWheelColorChange,
    selectedShape,
    savedPalettes,
    activePaletteId,
    strokesCount,
    handleShapeSelect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleCanvasWheel,
    handleUndo,
    handleRedo,
    redoCount,
    layers,
    activeLayerId,
    selectedLayerIds,
    isLayerWarning,
    toggleLayerSelection,
    clearLayerSelection,
    mergeSelected,
    deleteSelected,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    reorderLayer,
    setActiveLayer,
  } = drawingBoard;

  return (
    <div ref={stageRef} className="flex min-h-[100dvh] min-w-0 flex-1 flex-col gap-3 overflow-hidden bg-transparent">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/70 text-slate-200 shadow-lg backdrop-blur-md transition hover:border-cyan-300/40 hover:bg-cyan-300/15 hover:text-white lg:hidden"
        aria-label="Abrir menu"
        title="Abrir menu"
      >
        <Icon name="menu" className="h-4 w-4" />
      </button>

      <CanvasToolbar
        stageRef={stageRef}
        canvasRef={canvasRef}
        canvasSize={canvasSize}
        activeTool={activeTool}
        brushSize={brushSize}
        brushOpacity={brushOpacity}
        brushColor={brushColor}
        bucketSensitivity={bucketSensitivity}
        canvasZoom={canvasZoom}
        strokesCount={strokesCount}
        redoCount={redoCount}
        onCanvasSizeChange={handleCanvasSizeChange}
        onFitToScreen={fitCanvasToScreen}
        onBrushSizeChange={handleBrushSizeChange}
        onBrushOpacityChange={handleBrushOpacityChange}
        onBucketSensitivityChange={handleBucketSensitivityChange}
        onCanvasZoomChange={drawingBoard.setCanvasZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent lg:flex-row">
        <div className="flex h-full shrink-0">
          <ToolSidebar
            activeTool={activeTool}
            brushColor={brushColor}
            selectedShape={selectedShape}
            onToolSelect={setActiveTool}
            onColorSelect={setBrushColor}
            customColors={customColors}
            selectedSlotIndex={selectedSlotIndex}
            onCustomColorClick={handleCustomColorClick}
            onWheelColorChange={handleWheelColorChange}
            onShapeSelect={handleShapeSelect}
            savedPalettes={savedPalettes}
            activePaletteId={activePaletteId}
            onSavePalette={drawingBoard.handleSavePalette}
            onCreatePalette={drawingBoard.handleCreatePalette}
            onSelectPalette={drawingBoard.handleSelectPalette}
            onDeletePalette={drawingBoard.handleDeletePalette}
            onExportPalette={drawingBoard.handleExportPalette}
            onImportPaletteJson={drawingBoard.handleImportPaletteJson}
            isMobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </div>

        <DrawingCanvas
          canvasAreaRef={canvasAreaRef}
          canvasRef={canvasRef}
          previewCanvasRef={previewCanvasRef}
          innerContentRef={innerContentRef}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          zoom={canvasZoom}
          activeTool={activeTool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onCanvasWheel={handleCanvasWheel}
        />

        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          selectedLayerIds={selectedLayerIds}
          isLayerWarning={isLayerWarning}
          onSetActiveLayer={setActiveLayer}
          onToggleVisibility={toggleLayerVisibility}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onReorderLayer={reorderLayer}
          onToggleLayerSelection={toggleLayerSelection}
          onClearLayerSelection={clearLayerSelection}
          onMergeSelected={mergeSelected}
          onDeleteSelected={deleteSelected}
        />
      </div>
    </div>
  );
}
