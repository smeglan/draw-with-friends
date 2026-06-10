"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { LayerList } from "@/canvas/components/molecules/LayerList";
import { LayerPanelActions } from "@/canvas/components/molecules/LayerPanelActions";
import type { Layer } from "@/canvas/types";

type LayerPanelProps = {
  layers: Layer[];
  activeLayerId: string;
  selectedLayerIds: string[];
  isLayerWarning: boolean;
  onSetActiveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: "up" | "down") => void;
  onToggleLayerSelection: (id: string) => void;
  onClearLayerSelection: () => void;
  onMergeSelected: () => void;
  onDeleteSelected: () => void;
  mobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function LayerPanel({
  layers,
  activeLayerId,
  selectedLayerIds,
  isLayerWarning,
  onSetActiveLayer,
  onToggleVisibility,
  onAddLayer,
  onRemoveLayer,
  onReorderLayer,
  onToggleLayerSelection,
  onClearLayerSelection,
  onMergeSelected,
  onDeleteSelected,
  mobile,
  isMobileOpen,
  onCloseMobile,
}: LayerPanelProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const hasSelection = selectedLayerIds.length > 0;
  const mergedDisabled = layers.length <= 1;
  const mergeCanDo = hasSelection ? selectedLayerIds.length >= 2 : true;
  const open = mobile ? isMobileOpen : isOpen;

  const close = () => {
    if (mobile && onCloseMobile) onCloseMobile();
    else setIsOpen(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (hasSelection) {
          onDeleteSelected();
        } else if (layers.length > 1) {
          onRemoveLayer(activeLayerId);
        }
      }
    },
    [hasSelection, onDeleteSelected, layers.length, onRemoveLayer, activeLayerId],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) {
    if (mobile) return null;
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={t("layers.heading")}
        className="fixed bottom-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-slate-300 shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
      >
        <Icon name="layers" />
      </button>
    );
  }

  return (
    <div
      className={
        mobile
          ? "fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl"
          : "fixed bottom-3 right-3 z-50 flex w-52 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-xl backdrop-blur-xl"
      }
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-slate-300">
          {t("layers.heading")}
          {layers.length > 0 && (
            <span className="ml-1 text-[10px] text-slate-500">({layers.length})</span>
          )}
        </span>
        <button
          type="button"
          onClick={close}
          title={t("canvas.closeLayers")}
          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-white"
        >
          <Icon name="chevronDown" className="h-3 w-3" />
        </button>
      </div>

      <LayerList
        layers={layers}
        activeLayerId={activeLayerId}
        selectedLayerIds={selectedLayerIds}
        onSetActiveLayer={onSetActiveLayer}
        onToggleVisibility={onToggleVisibility}
        onReorderLayer={onReorderLayer}
        onToggleLayerSelection={onToggleLayerSelection}
      />

      <LayerPanelActions
        hasSelection={hasSelection}
        selectedCount={selectedLayerIds.length}
        layersLength={layers.length}
        isLayerWarning={isLayerWarning}
        mergedDisabled={mergedDisabled}
        mergeCanDo={mergeCanDo}
        onClearLayerSelection={onClearLayerSelection}
        onAddLayer={onAddLayer}
        onDeleteSelected={onDeleteSelected}
        onRemoveLayer={(id) => onRemoveLayer(id ?? activeLayerId)}
        onMergeSelected={onMergeSelected}
      />
    </div>
  );
}
