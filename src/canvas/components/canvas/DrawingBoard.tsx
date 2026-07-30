"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { DrawingCanvas } from "@/canvas/components/canvas/DrawingCanvas";
import { CanvasToolbar } from "@/canvas/components/molecules/CanvasToolbar";
import { ToolSidebar } from "@/canvas/components/organisms/ToolSidebar";
import { LayerPanel } from "@/canvas/components/organisms/LayerPanel";
import { MobileBottomBar } from "@/canvas/components/molecules/MobileBottomBar";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useDrawingBoard } from "@/canvas/hooks/useDrawingBoard";

export default function DrawingBoard() {
  const drawingBoard = useDrawingBoard();
  const t = useTranslations();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");
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
    saveToFile,
    openFile,
    hasAutosave,
    restoreAutosave,
    clearAutosave,
  } = drawingBoard;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const restoreBanner = hasAutosave && (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm">
      <span className="text-amber-200">{t("canvas.restoreBanner")}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={restoreAutosave}
          className="rounded-lg bg-amber-600 px-3 py-1 text-white transition hover:bg-amber-500"
        >
          {t("canvas.restore")}
        </button>
        <button
          type="button"
          onClick={clearAutosave}
          className="rounded-lg border border-white/20 px-3 py-1 text-slate-300 transition hover:bg-white/10"
        >
          {t("canvas.discard")}
        </button>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-transparent">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/95 px-3 backdrop-blur-lg" />

        <DrawingCanvas
          canvasAreaRef={canvasAreaRef}
          canvasRef={canvasRef}
          previewCanvasRef={previewCanvasRef}
          innerContentRef={innerContentRef}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          activeTool={activeTool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onCanvasWheel={handleCanvasWheel}
        />

        <div className="flex h-16 shrink-0 border-t border-white/10 bg-slate-950/95 px-3 backdrop-blur-lg" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-transparent">
        {restoreBanner}

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
          mobile
          onOpenLayers={() => setMobileLayersOpen(true)}
          onSaveProject={saveToFile}
          onOpenProject={openFile}
        />

        <DrawingCanvas
          canvasAreaRef={canvasAreaRef}
          canvasRef={canvasRef}
          previewCanvasRef={previewCanvasRef}
          innerContentRef={innerContentRef}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          activeTool={activeTool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onCanvasWheel={handleCanvasWheel}
        />

        <MobileBottomBar
          activeTool={activeTool}
          brushColor={brushColor}
          strokesCount={strokesCount}
          redoCount={redoCount}
          onToolSelect={setActiveTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

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
          mobile
          isMobileOpen={mobileLayersOpen}
          onCloseMobile={() => setMobileLayersOpen(false)}
        />
      </div>
    );
  }

  return (
    <div ref={stageRef} className="flex min-h-[100dvh] min-w-0 flex-1 flex-col gap-3 overflow-hidden bg-transparent">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/70 text-slate-200 shadow-lg backdrop-blur-md transition hover:border-cyan-300/40 hover:bg-cyan-300/15 hover:text-white lg:hidden"
        aria-label={t("canvas.openMenu")}
        title={t("canvas.openMenu")}
      >
        <Icon name="menu" className="h-4 w-4" />
      </button>

      {restoreBanner}

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
        onSaveProject={saveToFile}
        onOpenProject={openFile}
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
