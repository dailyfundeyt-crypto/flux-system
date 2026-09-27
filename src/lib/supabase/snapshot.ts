import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceSnapshot } from "./types";
import { SNAPSHOT_SCHEMA_VERSION } from "./types";

const SNAPSHOT_KEY = "workspace";

export async function loadSnapshot(
  client: SupabaseClient,
): Promise<WorkspaceSnapshot | null> {
  const { data, error } = await client
    .from("settings")
    .select("value")
    .eq("key", SNAPSHOT_KEY)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const value = data.value as { schemaVersion?: number; snapshot?: WorkspaceSnapshot };
  if (!value?.snapshot) return null;
  if (value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) return null;
  return value.snapshot;
}

export async function saveSnapshot(
  client: SupabaseClient,
  snapshot: WorkspaceSnapshot,
): Promise<void> {
  const payload = {
    key: SNAPSHOT_KEY,
    value: { schemaVersion: SNAPSHOT_SCHEMA_VERSION, snapshot },
    updated_at: new Date().toISOString(),
  };
  const { error } = await client
    .from("settings")
    .upsert(payload, { onConflict: "key" });
  if (error) throw error;
}

export async function resetSnapshot(client: SupabaseClient): Promise<void> {
  const { error } = await client.from("settings").delete().eq("key", SNAPSHOT_KEY);
  if (error) throw error;
}