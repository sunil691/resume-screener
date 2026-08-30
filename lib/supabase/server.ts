import "server-only";
import { createClient } from "@supabase/supabase-js";
function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return { url, anonKey };
}
export function createSupabaseServerClient() {
  const { url, anonKey } = getServerSupabaseConfig();
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
