"use client";

import { LayerItem } from "@/canvas/components/atoms/LayerItem";
import type { Layer } from "@/canvas/types";

type LayerListProps = {
  layers: Layer[];
  activeLayerId: string;
  selectedLayerIds: string[];
  onSetActiveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorderLayer: (id: string, direction: "up" | "down") => void;
  onToggleLayerSelection: (id: string) => void;
};

export function LayerList({
  layers,
  activeLayerId,
  selectedLayerIds,
  onSetActiveLayer,
  onToggleVisibility,
  onReorderLayer,
  onToggleLayerSelection,
}: LayerListProps) {
  const showReorder = layers.length > 1;

  return (
    <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
      {[...layers].reverse().map((layer) => (
        <LayerItem
          key={layer.id}
          layer={layer}
          isActive={layer.id === activeLayerId}
          isSelected={selectedLayerIds.includes(layer.id)}
          showReorder={showReorder}
          onSelect={(id, ctrl) => {
            if (ctrl) {
              onToggleLayerSelection(id);
            } else {
              onSetActiveLayer(id);
            }
          }}
          onToggleVisibility={onToggleVisibility}
          onReorder={onReorderLayer}
        />
      ))}
    </div>
  );
}
