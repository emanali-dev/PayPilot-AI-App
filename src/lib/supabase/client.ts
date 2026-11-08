import { createClient } from "@supabase/supabase-js";

/** Browser client (anon key, subject to RLS). */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. See .env.example.");
  return createClient(url, key);
}
