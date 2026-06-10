"use client";

import { useTranslations } from "next-intl";

export function HeroTitle() {
  const t = useTranslations();
  return (
    <div className="max-w-2xl text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Los Pibes Que Dibujan
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
        {t("landing.hero.subtitle")}
      </p>
    </div>
  );
}
