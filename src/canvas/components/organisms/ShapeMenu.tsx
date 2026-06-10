"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ShapeType } from "@/canvas/types";

type ShapeMenuProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  selectedShape: ShapeType;
  onSelect: (shape: ShapeType) => void;
  onClose: () => void;
};

function ShapeIcon({ shape }: { shape: ShapeType }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {shape === "rectangle" && <rect x="3" y="5" width="18" height="14" rx="1" />}
      {shape === "ellipse" && <ellipse cx="12" cy="12" rx="9" ry="7" />}
      {shape === "triangle" && <polygon points="12 3 3 21 21 21" />}
      {shape === "line" && <line x1="4" y1="20" x2="20" y2="4" />}
    </svg>
  );
}

export function ShapeMenu({ open, anchorEl, selectedShape, onSelect, onClose }: ShapeMenuProps) {
  const t = useTranslations();
  const menuRef = useRef<HTMLDivElement>(null);

  const SHAPES: { id: ShapeType; label: string }[] = [
    { id: "rectangle", label: t("tools.rectangle") },
    { id: "ellipse", label: t("tools.ellipse") },
    { id: "triangle", label: t("tools.triangle") },
    { id: "line", label: t("tools.line") },
  ];

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (anchorEl && anchorEl.contains(target)) return;
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorEl, open, onClose]);

  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/80 p-2 shadow-xl backdrop-blur-xl"
      style={{
        left: rect.left,
        top: rect.bottom + 6,
        minWidth: rect.width,
      }}
    >
      {SHAPES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
            s.id === selectedShape
              ? "bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.18)]"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ShapeIcon shape={s.id} />
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
