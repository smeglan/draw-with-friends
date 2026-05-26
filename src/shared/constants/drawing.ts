export const DRAWING_LIMITS = {
  minBrushSize: 2,
  maxBrushSize: 40,
  defaultBrushSize: 10,
  minOpacity: 0,
  maxOpacity: 100,
  defaultOpacity: 100,
} as const;

export const BUCKET_LIMITS = {
  minSensitivity: 1,
  maxSensitivity: 100,
  defaultSensitivity: 50,
} as const;

export const QUICK_COLORS = [
  "#111827",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
] as const;
