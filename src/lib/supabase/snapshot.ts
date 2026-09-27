import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

// In-app shapes (clean nested types used throughout the UI)
export type Purchase = { name: string; detail: string; amount: string; time: string };
export type Sale = Purchase;
export type DeliveryFile = { dataUrl: string; name: string; kind: "image" | "pdf" };
export type DeliveryRow = { id: number; box: string; qr: DeliveryFile | null; invoice: DeliveryFile | null };
export type PurchaseLine = { id: number; label: string; amount: number };
export type ShippingLine = PurchaseLine;
export type RevenueLine = { id: number; store: string; amount: number };
export type PurchaseBatch = { id: number; label: string; purchaseIds: number[]; revenueIds: number[] };

export type WorkspaceState = {
  purchases: Purchase[];
  sales: Sale[];
  purchaseLines: PurchaseLine[];
  shippingLines: ShippingLine[];
  revenueLines: RevenueLine[];
  purchaseBatches: PurchaseBatch[];
  deliveryRows: DeliveryRow[];
};

// DB row types (snake_case as in Supabase)
type PurchaseRow = { id: number; owner_id: string; name: string; detail: string; amount: string; time: string; sort_order: number };
type SaleRow = PurchaseRow;
type BaseLineRow = { id: number; owner_id: string; sort_order: number };
type PurchaseLineRow = BaseLineRow & { label: string; amount: number };
type ShippingLineRow = PurchaseLineRow;
type RevenueLineRow = BaseLineRow & { store: string; amount: number };
type PurchaseBatchRow = BaseLineRow & { label: string; purchase_ids: number[]; revenue_ids: number[] };
type DeliveryRowRow = BaseLineRow & {
  box: string;
  qr_data_url: string | null;
  qr_name: string | null;
  qr_kind: "image" | "pdf" | null;
  invoice_data_url: string | null;
  invoice_name: string | null;
  invoice_kind: "image" | "pdf" | null;
};

function rowToFile(d: { dataUrl: string; name: string; kind: "image" | "pdf" } | null): DeliveryFile | null {
  return d ? { dataUrl: d.dataUrl, name: d.name, kind: d.kind } : null;
}

function fileToRow(d: DeliveryFile | null): Pick<DeliveryRowRow, "qr_data_url" | "qr_name" | "qr_kind"> {
  return d
    ? { qr_data_url: d.dataUrl, qr_name: d.name, qr_kind: d.kind }
    : { qr_data_url: null, qr_name: null, qr_kind: null };
}

function deliveryToRow(row: DeliveryRow, ownerId: string, sortOrder: number): DeliveryRowRow {
  return {
    id: row.id,
    owner_id: ownerId,
    box: row.box,
    sort_order: sortOrder,
    ...fileToRow(row.qr),
    invoice_data_url: row.invoice?.dataUrl ?? null,
    invoice_name: row.invoice?.name ?? null,
    invoice_kind: row.invoice?.kind ?? null,
  };
}

function rowToDelivery(row: DeliveryRowRow): DeliveryRow {
  return {
    id: row.id,
    box: row.box,
    qr: rowToFile(row.qr_data_url ? { dataUrl: row.qr_data_url, name: row.qr_name ?? "", kind: row.qr_kind ?? "image" } : null),
    invoice: rowToFile(
      row.invoice_data_url ? { dataUrl: row.invoice_data_url, name: row.invoice_name ?? "", kind: row.invoice_kind ?? "image" } : null,
    ),
  };
}

export type WorkspaceSnapshot = WorkspaceState;

export async function loadSnapshot(client: SupabaseClient, userId: string): Promise<WorkspaceSnapshot> {
  const [purchases, sales, purchaseLines, shippingLines, revenueLines, purchaseBatches, deliveryRows] = await Promise.all([
    client.from("purchases").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("sales").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("purchase_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("shipping_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("revenue_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("purchase_batches").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("delivery_rows").select("*").eq("owner_id", userId).order("sort_order"),
  ]);
  return {
    purchases: ((purchases.data ?? []) as PurchaseRow[]).map((r) => ({ name: r.name, detail: r.detail, amount: r.amount, time: r.time })),
    sales: ((sales.data ?? []) as SaleRow[]).map((r) => ({ name: r.name, detail: r.detail, amount: r.amount, time: r.time })),
    purchaseLines: ((purchaseLines.data ?? []) as PurchaseLineRow[]).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) })),
    shippingLines: ((shippingLines.data ?? []) as ShippingLineRow[]).map((r) => ({ id: r.id, label: r.label, amount: Number(r.amount) })),
    revenueLines: ((revenueLines.data ?? []) as RevenueLineRow[]).map((r) => ({ id: r.id, store: r.store, amount: Number(r.amount) })),
    purchaseBatches: ((purchaseBatches.data ?? []) as PurchaseBatchRow[]).map((r) => ({
      id: r.id,
      label: r.label,
      purchaseIds: r.purchase_ids,
      revenueIds: r.revenue_ids,
    })),
    deliveryRows: ((deliveryRows.data ?? []) as DeliveryRowRow[]).map(rowToDelivery),
  };
}

async function replaceTable(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  userId: string,
): Promise<void> {
  const { error: delError } = await client.from(table).delete().eq("owner_id", userId);
  if (delError) throw delError;
  if (rows.length === 0) return;
  const { error: insError } = await client.from(table).insert(rows);
  if (insError) throw insError;
}

export async function saveSnapshot(client: SupabaseClient, userId: string, snapshot: WorkspaceSnapshot): Promise<void> {
  const tasks = [
    replaceTable(
      client,
      "purchases",
      snapshot.purchases.map((r, i) => ({ owner_id: userId, sort_order: i, ...r })),
      userId,
    ),
    replaceTable(
      client,
      "sales",
      snapshot.sales.map((r, i) => ({ owner_id: userId, sort_order: i, ...r })),
      userId,
    ),
    replaceTable(
      client,
      "purchase_lines",
      snapshot.purchaseLines.map((r, i) => ({ owner_id: userId, sort_order: i, id: r.id, label: r.label, amount: r.amount })),
      userId,
    ),
    replaceTable(
      client,
      "shipping_lines",
      snapshot.shippingLines.map((r, i) => ({ owner_id: userId, sort_order: i, id: r.id, label: r.label, amount: r.amount })),
      userId,
    ),
    replaceTable(
      client,
      "revenue_lines",
      snapshot.revenueLines.map((r, i) => ({ owner_id: userId, sort_order: i, id: r.id, store: r.store, amount: r.amount })),
      userId,
    ),
    replaceTable(
      client,
      "purchase_batches",
      snapshot.purchaseBatches.map((r, i) => ({
        owner_id: userId,
        sort_order: i,
        id: r.id,
        label: r.label,
        purchase_ids: r.purchaseIds,
        revenue_ids: r.revenueIds,
      })),
      userId,
    ),
    replaceTable(
      client,
      "delivery_rows",
      snapshot.deliveryRows.map((r, i) => deliveryToRow(r, userId, i)),
      userId,
    ),
  ];
  await Promise.all(tasks);
}

export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "avatar_url" | "theme">>,
): Promise<Profile> {
  const payload = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single<Profile>();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(
  client: SupabaseClient,
  userId: string,
  file: Blob,
  fileExt: string,
): Promise<string> {
  const path = `${userId}/avatar-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await client.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/png" });
  if (uploadError) throw uploadError;
  const { data } = client.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
