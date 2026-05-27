"use client";

import { useState } from "react";
import { Icon } from "@/shared/icons";
import type { Layer } from "@/canvas/types";

type LayerPanelProps = {
  layers: Layer[];
  activeLayerId: string;
  onSetActiveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: "up" | "down") => void;
};

export function LayerPanel({
  layers,
  activeLayerId,
  onSetActiveLayer,
  onToggleVisibility,
  onAddLayer,
  onRemoveLayer,
  onReorderLayer,
}: LayerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Capas"
        className="fixed bottom-3 right-3 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-slate-300 shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
      >
        <Icon name="layers" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 flex w-48 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-slate-300">Capas</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          title="Minimizar"
          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-white"
        >
          <Icon name="chevronUp" className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 py-2">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-all ${
              layer.id === activeLayerId
                ? "bg-white/15 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            onClick={() => onSetActiveLayer(layer.id)}
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

            {layers.length > 1 && (
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, "up");
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
                    onReorderLayer(layer.id, "down");
                  }}
                  title="Bajar capa"
                  className="flex h-4 w-4 items-center justify-center rounded text-slate-500 hover:text-white"
                >
                  <Icon name="chevronDown" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-white/10 px-3 py-1.5">
        <button
          type="button"
          onClick={onAddLayer}
          title="Agregar capa"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="plus" />
        </button>
        <button
          type="button"
          onClick={() => activeLayerId && onRemoveLayer(activeLayerId)}
          title="Eliminar capa"
          disabled={layers.length <= 1}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
