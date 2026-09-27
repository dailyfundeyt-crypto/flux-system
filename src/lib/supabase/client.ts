import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseCredentials } from "./types";

const STORAGE_KEY = "flux_supabase_credentials";

export function loadCredentials(): SupabaseCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: SupabaseCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildClient(creds: SupabaseCredentials): SupabaseClient {
  return createClient(creds.url, creds.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function testConnection(creds: SupabaseCredentials): Promise<string> {
  try {
    const client = buildClient(creds);
    const { error } = await client.from("settings").select("key").limit(1).maybeSingle();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return "Verbindung erfolgreich";
  } catch (err) {
    if (err instanceof Error) return `Fehler: ${err.message}`;
    return "Unbekannter Fehler";
  }
}