"use client";

import { useState } from "react";
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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
        className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-slate-300 shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
      >
        <LayersIcon />
      </button>
    );
  }

  return (
    <div className="absolute bottom-3 right-3 z-20 flex w-48 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-slate-300">Capas</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          title="Minimizar"
          className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <polyline points="6 15 12 9 18 15" />
          </svg>
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
              {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
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
                  <ChevronUpIcon />
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
                  <ChevronDownIcon />
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
          <PlusIcon />
        </button>
        <button
          type="button"
          onClick={() => activeLayerId && onRemoveLayer(activeLayerId)}
          title="Eliminar capa"
          disabled={layers.length <= 1}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
