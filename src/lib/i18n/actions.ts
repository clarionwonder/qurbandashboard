"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const YEAR = 60 * 60 * 24 * 365;

export async function setLang(lang: "ms" | "en") {
  (await cookies()).set("lang", lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function setTheme(theme: "light" | "dark" | "system") {
  (await cookies()).set("theme", theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}
