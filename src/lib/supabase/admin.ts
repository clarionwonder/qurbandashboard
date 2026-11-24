import "server-only";
import { createClient } from "@supabase/supabase-js";
import { demoClient } from "../demo/db";
import { isDemo } from "../env";

/**
 * Service-role client. Server-only: used for public booking, payment callbacks
 * and receipts, where the visitor is not signed in. Never import in client code.
 */
export function createServiceClient() {
  if (isDemo) return demoClient() as ReturnType<typeof createClient>;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
