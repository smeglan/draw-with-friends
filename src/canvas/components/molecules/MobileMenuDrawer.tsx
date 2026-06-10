"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/icons";
import { ConfirmLeaveModal } from "@/shared/components/ConfirmLeaveModal";
import type { CanvasDimensions } from "@/canvas/types";

type ExportFormatId = "png" | "jpeg" | "webp";

type ExportFormat = {
  id: ExportFormatId;
  label: string;
  mime: string;
  extension: string;
  quality?: number;
};

const EXPORT_FORMATS: ExportFormat[] = [
  { id: "png", label: "PNG", mime: "image/png", extension: "png" },
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", extension: "jpg", quality: 0.95 },
  { id: "webp", label: "WEBP", mime: "image/webp", extension: "webp", quality: 0.95 },
];

const CANVAS_PRESETS: { id: string; label: string; width: number; height: number }[] = [
  { id: "vga", label: "VGA", width: 640, height: 480 },
  { id: "svga", label: "SVGA", width: 800, height: 600 },
  { id: "wide", label: "Wide", width: 960, height: 540 },
  { id: "mobile", label: "Mobile", width: 720, height: 1280 },
  { id: "post", label: "Post", width: 1080, height: 1350 },
  { id: "story1", label: "Story", width: 1080, height: 1920 },
  { id: "reels", label: "Reels", width: 1080, height: 2400 },
  { id: "phonexl", label: "Phone XL", width: 1440, height: 3200 },
  { id: "hd", label: "HD", width: 1280, height: 720 },
  { id: "fhd", label: "Full HD", width: 1920, height: 1080 },
  { id: "qhd", label: "2K", width: 2560, height: 1440 },
  { id: "square", label: "Cuadrado", width: 1080, height: 1080 },
  { id: "vertical", label: "Vertical", width: 1440, height: 2560 },
];

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasSize: CanvasDimensions;
  onCanvasSizeChange: (size: CanvasDimensions) => void;
  onFitToScreen: () => void;
};

async function blobFromCanvas(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

export function MobileMenuDrawer({
  open,
  onClose,
  canvasRef,
  canvasSize,
  onCanvasSizeChange,
  onFitToScreen,
}: MobileMenuDrawerProps) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [draftWidth, setDraftWidth] = useState(canvasSize.width.toString());
  const [draftHeight, setDraftHeight] = useState(canvasSize.height.toString());
  const router = useRouter();

  if (!open) return null;

  const handleExport = async (format: ExportFormat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `drawing-${timestamp}.${format.extension}`;

    const blob = await blobFromCanvas(canvas, format.mime, format.quality);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      onClose();
      return;
    }

    const dataUrl = canvas.toDataURL(format.mime, format.quality);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    onClose();
  };

  const applyCustomSize = () => {
    const width = Number.parseInt(draftWidth, 10);
    const height = Number.parseInt(draftHeight, 10);

    if (!Number.isFinite(width) || !Number.isFinite(height)) return;

    onCanvasSizeChange({
      width: Math.max(256, Math.min(4096, width)),
      height: Math.max(256, Math.min(4096, height)),
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="absolute left-0 top-0 flex h-full w-[85vw] max-w-sm flex-col border-r border-white/10 bg-[#0f172a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="menu" className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-medium text-white">Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Cerrar menu"
          >
            <Icon name="chevronDown" className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/10"
          >
            <Icon name="home" className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">Volver al inicio</p>
              <p className="text-xs text-slate-400">Salir del dibujo actual</p>
            </div>
          </button>

          {showLeaveModal && (
            <ConfirmLeaveModal
              onConfirm={() => router.push("/")}
              onCancel={() => setShowLeaveModal(false)}
            />
          )}

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                    Tamano
                  </p>
                  <p className="text-xs text-slate-500">Presets o tamano propio</p>
                </div>
                <button
                  type="button"
                  onClick={onFitToScreen}
                  className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
                >
                  Fit
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CANVAS_PRESETS.map((preset) => {
                  const isActive =
                    canvasSize.width === preset.width && canvasSize.height === preset.height;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onCanvasSizeChange({ width: preset.width, height: preset.height })}
                      className={`rounded-2xl border px-2.5 py-2 text-left transition ${
                        isActive
                          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <p className="text-[13px] font-medium leading-tight">{preset.label}</p>
                      <p className="text-[10px] text-slate-400">
                        {preset.width} x {preset.height}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    Ancho
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="256"
                    max="4096"
                    value={draftWidth}
                    onChange={(event) => setDraftWidth(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>

                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    Alto
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="256"
                    max="4096"
                    value={draftHeight}
                    onChange={(event) => setDraftHeight(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/40"
                  />
                </label>

                <button
                  type="button"
                  onClick={applyCustomSize}
                  className="h-10 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/15"
                >
                  Aplicar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                  Exportar
                </p>
                <p className="text-xs text-slate-500">PNG, JPEG y WEBP</p>
              </div>

              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => handleExport(format)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{format.label}</p>
                    <p className="text-xs text-slate-400">
                      {format.id === "png" && "Ideal para transparencia y calidad"}
                      {format.id === "jpeg" && "Ligero para compartir"}
                      {format.id === "webp" && "Buen balance entre peso y calidad"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                    .{format.extension}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
