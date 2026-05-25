"use client";

import { DrawingCanvas } from "@/canvas/components/canvas/DrawingCanvas";
import { BrushSizeBar } from "@/canvas/components/molecules/BrushSizeBar";
import { BucketSensitivityBar } from "@/canvas/components/molecules/BucketSensitivityBar";
import { ToolSidebar } from "@/canvas/components/organisms/ToolSidebar";
import { useDrawingBoard } from "@/canvas/hooks/useDrawingBoard";

export default function DrawingBoard() {
  const drawingBoard = useDrawingBoard();
  const {
    stageRef,
    canvasRef,
    brushSize,
    brushColor,
    activeTool,
    canvasBackgroundColor,
    setBrushColor,
    setActiveTool,
    setCanvasBackgroundColor,
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
  } = drawingBoard;

  return (
    <div ref={stageRef} className="flex min-h-[32rem] min-w-0 flex-1 flex-col gap-3">
      {activeTool === "bucket" ? (
        <BucketSensitivityBar
          sensitivity={bucketSensitivity}
          onSensitivityChange={handleBucketSensitivityChange}
        />
      ) : (
        <BrushSizeBar size={brushSize} onSizeChange={handleBrushSizeChange} />
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <ToolSidebar
          activeTool={activeTool}
          brushColor={brushColor}
          canvasBackgroundColor={canvasBackgroundColor}
          onToolSelect={setActiveTool}
          onColorSelect={setBrushColor}
          onToggleBackground={() =>
            setCanvasBackgroundColor(
              canvasBackgroundColor === "#ffffff" ? "#000000" : "#ffffff",
            )
          }
          customColors={customColors}
          selectedSlotIndex={selectedSlotIndex}
          onCustomColorClick={handleCustomColorClick}
          onWheelColorChange={handleWheelColorChange}
        />

        <DrawingCanvas
          canvasRef={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
