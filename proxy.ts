import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["es", "en"];
const defaultLocale = "es";

function getLocale(request: NextRequest): string {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && locales.includes(cookie)) return cookie;

  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const langs = acceptLanguage
      .split(",")
      .map((l) => {
        const [lang, q = "q=1"] = l.trim().split(";");
        return {
          lang: lang.split("-")[0],
          quality: parseFloat(q.split("=")[1] || "1"),
        };
      })
      .sort((a, b) => b.quality - a.quality);
    const match = langs.find((l) => locales.includes(l.lang));
    if (match) return match.lang;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const locale = getLocale(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-NEXT-INTL-LOCALE", locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
