"use client";

import { useTranslations } from "next-intl";
import type { DrawingTool } from "@/canvas/types";
import { BrushSizeBar } from "@/canvas/components/molecules/BrushSizeBar";
import { BucketSensitivityBar } from "@/canvas/components/molecules/BucketSensitivityBar";

type MobileToolDrawerProps = {
  open: boolean;
  onClose: () => void;
  activeTool: DrawingTool;
  brushSize: number;
  brushOpacity: number;
  brushColor: string;
  bucketSensitivity: number;
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onBucketSensitivityChange: (sensitivity: number) => void;
};

export function MobileToolDrawer({
  open,
  onClose,
  activeTool,
  brushSize,
  brushOpacity,
  brushColor,
  bucketSensitivity,
  onBrushSizeChange,
  onBrushOpacityChange,
  onBucketSensitivityChange,
}: MobileToolDrawerProps) {
  const t = useTranslations();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-white/10 bg-[#0f172a] px-4 pb-6 pt-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <p className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
          {activeTool === "bucket" ? t("canvas.bucketSensitivity") : t("canvas.sizeAndOpacity")}
        </p>

        {activeTool === "bucket" ? (
          <BucketSensitivityBar
            sensitivity={bucketSensitivity}
            onSensitivityChange={onBucketSensitivityChange}
          />
        ) : (
          <BrushSizeBar
            size={brushSize}
            opacity={brushOpacity}
            color={brushColor}
            onSizeChange={onBrushSizeChange}
            onOpacityChange={onBrushOpacityChange}
          />
        )}
      </div>
    </div>
  );
}
