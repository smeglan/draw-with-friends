"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/shared/icons";
import { DrawingCanvas } from "@/canvas/components/canvas/DrawingCanvas";
import { BrushSizeBar } from "@/canvas/components/molecules/BrushSizeBar";
import { BucketSensitivityBar } from "@/canvas/components/molecules/BucketSensitivityBar";
import { ToolSidebar } from "@/canvas/components/organisms/ToolSidebar";
import { ExportDrawer } from "@/canvas/components/organisms/ExportDrawer";
import { LayerPanel } from "@/canvas/components/organisms/LayerPanel";
import { useDrawingBoard } from "@/canvas/hooks/useDrawingBoard";

export default function DrawingBoard() {
  const drawingBoard = useDrawingBoard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    stageRef,
    canvasAreaRef,
    canvasRef,
    canvasSize,
    brushSize,
    brushOpacity,
    brushColor,
    activeTool,
    canvasZoom,
    setBrushColor,
    handleCanvasSizeChange,
    fitCanvasToScreen,
    setCanvasZoom,
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
    handleUndo,
    handleRedo,
    redoCount,
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    reorderLayer,
    setActiveLayer,
  } = drawingBoard;

  const iconButtonClass =
    "flex h-12 w-12 items-center justify-center rounded-2xl border transition";

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const element = stageRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen?.();
  };

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

      <div className="flex flex-col items-stretch gap-3 px-3 pt-14 lg:flex-row lg:items-start lg:px-3 lg:pt-3">
        <ExportDrawer
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          onCanvasSizeChange={handleCanvasSizeChange}
          onFitToScreen={fitCanvasToScreen}
        />

        <div className="min-w-0 flex-1">
          {activeTool === "bucket" ? (
            <BucketSensitivityBar
              sensitivity={bucketSensitivity}
              onSensitivityChange={handleBucketSensitivityChange}
            />
          ) : (
            <BrushSizeBar
              size={brushSize}
              opacity={brushOpacity}
              color={brushColor}
              onSizeChange={handleBrushSizeChange}
              onOpacityChange={handleBrushOpacityChange}
            />
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Zoom</span>
            <span className="text-xs text-white/80">{Math.round(canvasZoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={canvasZoom}
            onChange={(event) => setCanvasZoom(Number(event.target.value))}
            className="h-2 w-40 accent-cyan-300"
            aria-label="Zoom del lienzo"
          />
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-medium text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          <Icon name={isFullscreen ? "fullscreenExit" : "fullscreen"} />
          <span className="hidden sm:inline">{isFullscreen ? "Salir" : "Fullscreen"}</span>
        </button>

        <div className="flex shrink-0 justify-center gap-2 lg:justify-start">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokesCount === 0}
            className={[
              iconButtonClass,
              "border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35",
            ].join(" ")}
            aria-label="Deshacer"
            title="Deshacer"
          >
            <Icon name="undo" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoCount === 0}
            className={[
              iconButtonClass,
              "border-white/10 bg-white/10 text-slate-300 hover:border-white/20 hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35",
            ].join(" ")}
            aria-label="Rehacer"
            title="Rehacer"
          >
            <Icon name="redo" />
          </button>
        </div>
      </div>

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
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          zoom={canvasZoom}
          activeTool={activeTool}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onSetActiveLayer={setActiveLayer}
          onToggleVisibility={toggleLayerVisibility}
          onAddLayer={addLayer}
          onRemoveLayer={removeLayer}
          onReorderLayer={reorderLayer}
        />
      </div>
    </div>
  );
}
