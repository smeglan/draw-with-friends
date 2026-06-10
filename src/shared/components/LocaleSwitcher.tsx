"use client";

import { useLocale } from "next-intl";

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();

  const toggle = () => {
    const next = locale === "es" ? "en" : "es";
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition hover:border-white/20 hover:text-white"
      title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      {LOCALES.find((l) => l.code !== locale)?.label}
    </button>
  );
}
