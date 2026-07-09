import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Uses the service role key — bypasses RLS entirely. Never import this from
// a "use client" component; only call it from server actions/route handlers.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
