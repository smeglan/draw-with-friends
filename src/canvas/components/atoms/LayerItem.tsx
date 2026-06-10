"use client";

import { Icon } from "@/shared/icons";
import type { Layer } from "@/canvas/types";

type LayerItemProps = {
  layer: Layer;
  isActive: boolean;
  isSelected: boolean;
  showReorder: boolean;
  onSelect: (id: string, ctrl: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
};

export function LayerItem({
  layer,
  isActive,
  isSelected,
  showReorder,
  onSelect,
  onToggleVisibility,
  onReorder,
}: LayerItemProps) {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-all ${
        isActive
          ? "bg-white/15 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
          : isSelected
            ? "bg-cyan-500/8 text-slate-200 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
      onClick={(e) => onSelect(layer.id, e.ctrlKey || e.metaKey)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(layer.id);
        }}
        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
          layer.visible
            ? "text-slate-400 hover:text-white"
            : "text-slate-600 hover:text-slate-400"
        }`}
        title={layer.visible ? "Ocultar capa" : "Mostrar capa"}
      >
        {layer.visible ? <Icon name="eye" /> : <Icon name="eyeOff" />}
      </button>

      <span className={`flex-1 truncate ${!layer.visible ? "italic text-slate-500" : ""}`}>
        {layer.name}
      </span>

      {showReorder && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReorder(layer.id, "up");
            }}
            title="Subir capa"
            className="flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-white"
          >
            <Icon name="chevronUp" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReorder(layer.id, "down");
            }}
            title="Bajar capa"
            className="flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-white"
          >
            <Icon name="chevronDown" />
          </button>
        </div>
      )}

      {isSelected && (
        <span className="flex h-4 w-4 items-center justify-center text-cyan-400">
          <Icon name="check" />
        </span>
      )}
    </div>
  );
}
