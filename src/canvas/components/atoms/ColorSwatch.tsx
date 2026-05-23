"use client";

type ColorSwatchProps = {
  color: string;
  isActive: boolean;
  onSelect: (color: string) => void;
};

export function ColorSwatch({ color, isActive, onSelect }: ColorSwatchProps) {
  return (
    <button
      type="button"
      aria-label={`Seleccionar color ${color}`}
      onClick={() => onSelect(color)}
      className="h-7 w-7 rounded-full border transition-transform hover:scale-105"
      style={{
        backgroundColor: color,
        borderColor: isActive ? "rgba(255,255,255,0.95)" : color,
        boxShadow: isActive ? "0 0 0 3px rgba(34, 211, 238, 0.25)" : "none",
      }}
    />
  );
}
