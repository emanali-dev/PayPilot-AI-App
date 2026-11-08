import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Server-only client with the service role key. Bypasses RLS: always filter by user_id. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin client is not configured. See .env.example.");
  return createClient(url, key, { auth: { persistSession: false } });
}
