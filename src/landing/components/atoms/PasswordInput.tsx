"use client";

import { useState } from "react";
import { Icon } from "@/shared/icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
};

export function PasswordInput({ value, onChange, placeholder, disabled, onKeyDown }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Contraseña"}
        disabled={disabled}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
      >
        <Icon name={show ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}
