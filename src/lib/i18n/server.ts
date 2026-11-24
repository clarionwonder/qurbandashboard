import "server-only";
import { cookies } from "next/headers";
import { dictionaries, type Lang } from "./dict";

export type Theme = "light" | "dark" | "system";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "en" ? "en" : "ms";
}

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get("theme")?.value;
  return v === "light" || v === "dark" ? v : "system";
}

/** Dictionary plus locale-aware formatters for the current request. */
export async function getI18n() {
  const lang = await getLang();
  const locale = lang === "ms" ? "ms-MY" : "en-MY";
  return {
    lang,
    t: dictionaries[lang],
    date: (d: string | null | undefined) =>
      d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }) : "-",
    dateTime: (d: string | null | undefined) =>
      d ? new Date(d).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }) : "-",
  };
}
