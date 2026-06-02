"use client";

type Props = {
  username: string;
  onEdit?: () => void;
};

export function UsernameBadge({ username, onEdit }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-400">
        {username.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm text-slate-200">{username}</span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:text-white"
          aria-label="Cambiar nombre"
          title="Cambiar nombre"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
