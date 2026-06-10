"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";

type LayerPanelActionsProps = {
  hasSelection: boolean;
  selectedCount: number;
  layersLength: number;
  isLayerWarning: boolean;
  mergedDisabled: boolean;
  mergeCanDo: boolean;
  onClearLayerSelection: () => void;
  onAddLayer: () => void;
  onDeleteSelected: () => void;
  onRemoveLayer: (id?: string) => void;
  onMergeSelected: () => void;
};

export function LayerPanelActions({
  hasSelection,
  selectedCount,
  layersLength,
  isLayerWarning,
  mergedDisabled,
  mergeCanDo,
  onClearLayerSelection,
  onAddLayer,
  onDeleteSelected,
  onRemoveLayer,
  onMergeSelected,
}: LayerPanelActionsProps) {
  const t = useTranslations();
  return (
    <>
      {hasSelection && (
        <div className="flex items-center justify-between border-t border-white/5 px-3 py-1">
          <span className="text-[9px] text-slate-500">
            {t("layers.selectedCount", { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={onClearLayerSelection}
            className="text-[9px] text-slate-600 transition-colors hover:text-white"
          >
            &times; {t("layers.deselect")}
          </button>
        </div>
      )}

      {isLayerWarning && (
        <p className="border-t border-white/5 px-3 py-1 text-[9px] leading-tight text-amber-400/70">
          {t("layers.performanceWarning")}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 border-t border-white/10 px-3 py-1.5">
        <button
          type="button"
          onClick={onAddLayer}
          title={t("layers.addLayer")}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="plus" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (hasSelection) {
              onDeleteSelected();
            } else {
              onRemoveLayer(undefined);
            }
          }}
          title={
            hasSelection
              ? t("layers.deleteCount", { count: selectedCount })
              : t("layers.deleteLayer")
          }
          disabled={layersLength <= 1 && !hasSelection}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="trash" />
        </button>
        <button
          type="button"
          onClick={onMergeSelected}
          disabled={mergedDisabled || !mergeCanDo}
          title={
            hasSelection
              ? selectedCount >= 2
                ? t("layers.mergeCount", { count: selectedCount })
                : t("layers.mergeSelectHint")
              : t("layers.mergeDown")
          }
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="combine" />
        </button>
      </div>
    </>
  );
}
