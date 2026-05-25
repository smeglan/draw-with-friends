"use client";

type CustomColorSlotsProps = {
  colors: (string | null)[];
  selectedIndex: number;
  onSlotClick: (index: number, replace?: boolean) => void;
};

export function CustomColorSlots({
  colors,
  selectedIndex,
  onSlotClick,
}: CustomColorSlotsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {colors.map((color, i) => {
        const isSelected = i === selectedIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => onSlotClick(i, e.altKey || e.button === 2)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (color) onSlotClick(i, true);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-slate-400 transition hover:scale-105"
            style={{
              backgroundColor: color ?? "transparent",
              border: isSelected
                ? "2px solid #38bdf8"
                : "1px solid rgba(255,255,255,0.2)",
              boxShadow: isSelected
                ? "0 0 8px rgba(56, 189, 248, 0.5)"
                : "none",
            }}
          >
            {color ? "" : "+"}
          </button>
        );
      })}
    </div>
  );
}
