"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { useTranslations } from "next-intl";

import type { CanvasDimensions, CanvasSizePreset } from "@/canvas/types";
import { Icon } from "@/shared/icons";

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

const CANVAS_PRESETS: CanvasSizePreset[] = [
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

type ExportDrawerProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasSize: CanvasDimensions;
  onCanvasSizeChange: (size: CanvasDimensions) => void;
  onFitToScreen: () => void;
  projectName?: string;
  onSaveProject?: () => void;
  onOpenProject?: () => void;
};

async function blobFromCanvas(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

export function ExportDrawer({
  canvasRef,
  canvasSize,
  onCanvasSizeChange,
  onFitToScreen,
  projectName = "drawing",
  onSaveProject,
  onOpenProject,
}: ExportDrawerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [draftWidth, setDraftWidth] = useState(canvasSize.width.toString());
  const [draftHeight, setDraftHeight] = useState(canvasSize.height.toString());

  const handleExport = async (format: ExportFormat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${projectName}-${timestamp}.${format.extension}`;

    const blob = await blobFromCanvas(canvas, format.mime, format.quality);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
      return;
    }

    const dataUrl = canvas.toDataURL(format.mime, format.quality);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    setOpen(false);
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={[
          "flex h-12 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition",
          open
            ? "border-cyan-300 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
            : "border-white/10 bg-white/10 text-slate-200 hover:border-white/20 hover:bg-white/15 hover:text-white",
        ].join(" ")}
        aria-expanded={open}
        aria-label={t("canvas.openMenu")}
        title={t("canvas.canvasTitle")}
      >
        <Icon name="menu" className="h-4 w-4" />
      </button>

      <div
        className={`absolute left-0 top-[calc(100%+0.5rem)] z-20 w-[min(92vw,28rem)] overflow-hidden rounded-3xl border border-white/10 bg-black/85 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-2 pointer-events-none opacity-0"
        }`}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-white">{t("canvas.canvasTitle")}</p>
          <p className="text-xs text-slate-400">{t("canvas.canvasDescription")}</p>
        </div>

        <div className="flex flex-col gap-4 p-3">
          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">{t("canvas.size")}</p>
                <p className="text-xs text-slate-500">{t("canvas.sizePresetsDesktop")}</p>
              </div>
              <button
                type="button"
                onClick={onFitToScreen}
                className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
              >
                {t("common.fit")}
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
                    className={[
                      "rounded-2xl border px-2.5 py-2 text-left transition",
                      isActive
                        ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <p className="text-[13px] font-medium leading-tight">{preset.label}</p>
                    <p className="text-[10px] text-slate-400">
                      {preset.width} x {preset.height}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{t("canvas.width")}</span>
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
                <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{t("canvas.height")}</span>
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
                {t("common.apply")}
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">{t("canvas.exportSection")}</p>
              <p className="text-xs text-slate-500">{t("canvas.exportDescriptionDesktop")}</p>
            </div>

            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => handleExport(format)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
              >
                <div>
                  <p className="text-sm font-medium text-white">{format.label}</p>
                  <p className="text-xs text-slate-400">
                    {format.id === "png" && t("export.pngDescription")}
                    {format.id === "jpeg" && t("export.jpegDescription")}
                    {format.id === "webp" && t("export.webpDescription")}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  .{format.extension}
                </span>
              </button>
            ))}
          </section>

          {(onSaveProject || onOpenProject) && (
            <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">{t("canvas.projectSection")}</p>
                <p className="text-xs text-slate-500">{t("canvas.projectDescription")}</p>
              </div>

              {onSaveProject && (
                <button
                  type="button"
                  onClick={() => { onSaveProject(); setOpen(false); }}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{t("canvas.projectSave")}</p>
                    <p className="text-xs text-slate-400">{t("canvas.projectSaveDescription")}</p>
                  </div>
                    <Icon name="save" className="h-4 w-4 text-slate-400" />
                </button>
              )}

              {onOpenProject && (
                <button
                  type="button"
                  onClick={() => { onOpenProject(); setOpen(false); }}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{t("canvas.projectOpen")}</p>
                    <p className="text-xs text-slate-400">{t("canvas.projectOpenDescription")}</p>
                  </div>
                  <Icon name="import" className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
