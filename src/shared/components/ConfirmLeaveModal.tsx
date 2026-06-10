"use client";

import { useTranslations } from "next-intl";

type ConfirmLeaveModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmLeaveModal({ onConfirm, onCancel }: ConfirmLeaveModalProps) {
  const t = useTranslations();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-center text-lg font-semibold text-white">
          {t("canvas.leaveTitle")}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          {t("canvas.leaveWarning")}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-400"
          >
            {t("common.exit")}
          </button>
        </div>
      </div>
    </div>
  );
}
