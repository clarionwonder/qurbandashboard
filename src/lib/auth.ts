import "server-only";
import { redirect } from "next/navigation";
import { createServiceClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

const allowList = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Returns the signed-in organiser, or redirects. Emails in ADMIN_EMAILS are enrolled on first visit. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/admin/login");

  const db = createServiceClient();
  const { data: row } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!row) {
    if (user.email && allowList().includes(user.email.toLowerCase())) {
      await db.from("admins").insert({ user_id: user.id, email: user.email });
    } else {
      redirect("/admin/login?err=notadmin");
    }
  }
  return { user, supabase, db };
}
