"use client";

type ConfirmLeaveModalProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmLeaveModal({ onConfirm, onCancel }: ConfirmLeaveModalProps) {
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
          ¿Volver al inicio?
        </h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          El dibujo actual se perderá si no lo guardaste antes.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-400"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
