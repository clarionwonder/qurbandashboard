import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { demoClient } from "../demo/db";
import { isDemo } from "../env";

/** Supabase client bound to the signed-in organiser's session (respects RLS). */
export async function createClient() {
  if (isDemo) return demoClient() as ReturnType<typeof createServerClient>;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component; middleware refreshes the session
          }
        },
      },
    },
  );
}
