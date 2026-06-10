"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import type { SavedPalette } from "@/canvas/types";

type PaletteManagerProps = {
  savedPalettes: SavedPalette[];
  activePaletteId: string | null;
  onSavePalette: (name: string) => void;
  onCreatePalette: (name: string) => void;
  onSelectPalette: (paletteId: string) => void;
  onDeletePalette: (paletteId: string) => void;
  onExportPalette: (paletteId?: string) => void;
  onImportPaletteJson: (file: File) => void;
};

type PaletteSaveBarProps = {
  name: string;
  onNameChange: (value: string) => void;
  onSave: () => void;
};

type PaletteListProps = {
  palettes: SavedPalette[];
  activePaletteId: string | null;
  onSelect: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
};

function PaletteSaveBar({ name, onNameChange, onSave }: PaletteSaveBarProps) {
  const t = useTranslations();
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500"
        placeholder={t("colors.paletteName")}
      />
      <button
        type="button"
        onClick={onSave}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:border-white/20 hover:bg-white/15"
        aria-label={t("colors.savePalette")}
        title={t("common.save")}
      >
        <Icon name="save" />
      </button>
    </div>
  );
}

function PaletteList({ palettes, activePaletteId, onSelect, onExport, onDelete }: PaletteListProps) {
  const t = useTranslations();
  if (palettes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">{t("colors.noPalettes")}</p>
        <p className="mt-1 text-[11px] text-slate-600">{t("colors.noPalettesDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {palettes.map((palette) => {
        const isActive = palette.id === activePaletteId;
        const colors = palette.colors.filter(Boolean).slice(0, 8) as string[];
        const colorCount = palette.colors.filter(Boolean).length;

        return (
          <div
            key={palette.id}
            className={[
              "rounded-2xl border p-3 transition-colors",
              isActive
                ? "border-cyan-300/40 bg-cyan-300/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => onSelect(palette.id)}
              className="flex w-full flex-col gap-1.5 text-left"
                aria-label={t("colors.selectPalette", { name: palette.name })}
              title={palette.name}
            >
              <p className="truncate text-[15px] font-semibold leading-tight text-white">{palette.name}</p>
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                {t("colors.colorCount", { count: colorCount })}
              </span>
            </button>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
                {colors.length > 0 ? (
                  colors.map((color, index) => (
                    <span
                      key={`${palette.id}-${index}`}
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/10 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))
                ) : (
                  <span className="text-[11px] text-slate-600">{t("colors.noColors")}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onExport(palette.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label={t("colors.exportPalette")}
                title={t("colors.exportPalette")}
              >
                <Icon name="export" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(palette.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                aria-label={t("colors.deletePalette")}
                title={t("colors.deletePalette")}
              >
                <Icon name="delete" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PaletteManager({
  savedPalettes,
  activePaletteId,
  onSavePalette,
  onCreatePalette,
  onSelectPalette,
  onDeletePalette,
  onExportPalette,
  onImportPaletteJson,
}: PaletteManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();
  const [paletteName, setPaletteName] = useState(t("colors.myPalette"));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="save" className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">{t("colors.heading")}</span>
        </div>
      </div>

      <PaletteSaveBar
        name={paletteName}
        onNameChange={setPaletteName}
        onSave={() => onSavePalette(paletteName)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onImportPaletteJson(file);
          event.currentTarget.value = "";
        }}
      />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5">
            <Icon name="save" className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("colors.saved")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCreatePalette(paletteName)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/15"
              aria-label={t("colors.addPalette")}
              title={t("colors.addPalette")}
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label={t("colors.importPalette")}
              title={t("colors.importPalette")}
            >
              <Icon name="import" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <PaletteList
          palettes={savedPalettes}
          activePaletteId={activePaletteId}
          onSelect={onSelectPalette}
          onExport={onExportPalette}
          onDelete={onDeletePalette}
        />
      </div>
    </div>
  );
}
