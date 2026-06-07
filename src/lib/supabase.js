import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function getSupabaseConfig() {
  const env = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
  const win = globalThis;
  return {
    url: env.VITE_SUPABASE_URL || win.__AUTY_SUPABASE_URL__ || "",
    anonKey: env.VITE_SUPABASE_ANON_KEY || win.__AUTY_SUPABASE_ANON_KEY__ || ""
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return cachedClient;
}

