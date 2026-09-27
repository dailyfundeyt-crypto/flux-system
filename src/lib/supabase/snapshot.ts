import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

// In-app shapes (clean nested types used throughout the UI)
export type Purchase = {
  id: number;
  supplierName: string;
  description: string;
  totalPrice: number;
  shippingPrice: number;
  status: "draft" | "active" | "sold" | "archived";
  itemCounter: number;
  createdAt: string;
};

export type PurchaseItem = {
  id: number;
  purchaseId: number;
  uniqueCode: string;
  title: string;
  description: string;
  conditionNotes: string;
  pricePaid: number;
  shippingShare: number;
  status: "in_stock" | "listed" | "reserved" | "sold";
  imageUrl: string | null;
  extraImages: string[];
  aiTitle: string | null;
  aiDescription: string | null;
  aiGeneratedAt: string | null;
  soldAt: string | null;
  salePrice: number | null;
  saleOrderId: number | null;
};

export type PurchaseImage = {
  id: number;
  purchaseId: number;
  imageUrl: string;
  caption: string;
  sortOrder: number;
};

export type Sale = {
  id: number;
  customerName: string;
  description: string;
  amount: string;
  time: string;
  status: "open" | "paid" | "shipped" | "completed";
};

export type DeliveryFile = { dataUrl: string; name: string; kind: "image" | "pdf" };
export type DeliveryRow = { id: number; box: string; qr: DeliveryFile | null; invoice: DeliveryFile | null };
export type PurchaseLine = { id: number; label: string; amount: number };
export type ShippingLine = PurchaseLine;
export type RevenueLine = { id: number; store: string; amount: number };
export type PurchaseBatch = { id: number; label: string; purchaseIds: number[]; revenueIds: number[] };

export type WorkspaceState = {
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  purchaseImages: PurchaseImage[];
  sales: Sale[];
  purchaseLines: PurchaseLine[];
  shippingLines: ShippingLine[];
  revenueLines: RevenueLine[];
  purchaseBatches: PurchaseBatch[];
  deliveryRows: DeliveryRow[];
};

// DB row types (snake_case as in Supabase)
type PurchaseRow = {
  id: number;
  owner_id: string;
  supplier_name: string;
  description: string;
  total_price: number;
  shipping_price: number;
  status: "draft" | "active" | "sold" | "archived";
  item_counter: number;
  created_at: string;
  updated_at: string;
};

type PurchaseItemRow = {
  id: number;
  owner_id: string;
  purchase_id: number | null;
  unique_code: string;
  title: string;
  description: string;
  condition_notes: string;
  price_paid: number;
  shipping_share: number;
  status: "in_stock" | "listed" | "reserved" | "sold";
  image_url: string | null;
  extra_images: string[];
  ai_title: string | null;
  ai_description: string | null;
  ai_generated_at: string | null;
  sold_at: string | null;
  sale_price: number | null;
  sale_order_id: number | null;
  created_at: string;
  updated_at: string;
};

type PurchaseImageRow = {
  id: number;
  owner_id: string;
  purchase_id: number;
  image_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
};

type SaleRow = {
  id: number;
  owner_id: string;
  customer_name: string;
  description: string;
  amount: string;
  time: string;
  status: "open" | "paid" | "shipped" | "completed";
  created_at: string;
};

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

function purchaseRowToModel(r: PurchaseRow): Purchase {
  return {
    id: r.id,
    supplierName: r.supplier_name,
    description: r.description,
    totalPrice: Number(r.total_price),
    shippingPrice: Number(r.shipping_price),
    status: r.status,
    itemCounter: r.item_counter,
    createdAt: r.created_at,
  };
}

function purchaseModelToRow(p: Purchase, ownerId: string): PurchaseRow {
  return {
    id: p.id,
    owner_id: ownerId,
    supplier_name: p.supplierName,
    description: p.description,
    total_price: p.totalPrice,
    shipping_price: p.shippingPrice,
    status: p.status,
    item_counter: p.itemCounter,
    created_at: p.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function purchaseItemRowToModel(r: PurchaseItemRow): PurchaseItem {
  return {
    id: r.id,
    purchaseId: r.purchase_id ?? 0,
    uniqueCode: r.unique_code,
    title: r.title,
    description: r.description,
    conditionNotes: r.condition_notes,
    pricePaid: Number(r.price_paid),
    shippingShare: Number(r.shipping_share),
    status: r.status,
    imageUrl: r.image_url,
    extraImages: r.extra_images ?? [],
    aiTitle: r.ai_title,
    aiDescription: r.ai_description,
    aiGeneratedAt: r.ai_generated_at,
    soldAt: r.sold_at,
    salePrice: r.sale_price !== null ? Number(r.sale_price) : null,
    saleOrderId: r.sale_order_id,
  };
}

function purchaseItemModelToRow(i: PurchaseItem, ownerId: string): PurchaseItemRow {
  return {
    id: i.id,
    owner_id: ownerId,
    purchase_id: i.purchaseId || null,
    unique_code: i.uniqueCode,
    title: i.title,
    description: i.description,
    condition_notes: i.conditionNotes,
    price_paid: i.pricePaid,
    shipping_share: i.shippingShare,
    status: i.status,
    image_url: i.imageUrl,
    extra_images: i.extraImages,
    ai_title: i.aiTitle,
    ai_description: i.aiDescription,
    ai_generated_at: i.aiGeneratedAt,
    sold_at: i.soldAt,
    sale_price: i.salePrice,
    sale_order_id: i.saleOrderId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function purchaseImageRowToModel(r: PurchaseImageRow): PurchaseImage {
  return {
    id: r.id,
    purchaseId: r.purchase_id,
    imageUrl: r.image_url,
    caption: r.caption,
    sortOrder: r.sort_order,
  };
}

function purchaseImageModelToRow(i: PurchaseImage, ownerId: string): PurchaseImageRow {
  return {
    id: i.id,
    owner_id: ownerId,
    purchase_id: i.purchaseId,
    image_url: i.imageUrl,
    caption: i.caption,
    sort_order: i.sortOrder,
    created_at: new Date().toISOString(),
  };
}

function saleRowToModel(r: SaleRow): Sale {
  return {
    id: r.id,
    customerName: r.customer_name,
    description: r.description,
    amount: r.amount,
    time: r.time,
    status: r.status,
  };
}

function saleModelToRow(s: Sale, ownerId: string): SaleRow {
  return {
    id: s.id,
    owner_id: ownerId,
    customer_name: s.customerName,
    description: s.description,
    amount: s.amount,
    time: s.time,
    status: s.status,
    created_at: new Date().toISOString(),
  };
}

export type WorkspaceSnapshot = WorkspaceState;

export async function loadSnapshot(client: SupabaseClient, userId: string): Promise<WorkspaceSnapshot> {
  const [
    purchases,
    purchaseItems,
    purchaseImages,
    sales,
    purchaseLines,
    shippingLines,
    revenueLines,
    purchaseBatches,
    deliveryRows,
  ] = await Promise.all([
    client.from("purchases").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
    client.from("purchase_items").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
    client.from("purchase_images").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("sales").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
    client.from("purchase_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("shipping_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("revenue_lines").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("purchase_batches").select("*").eq("owner_id", userId).order("sort_order"),
    client.from("delivery_rows").select("*").eq("owner_id", userId).order("sort_order"),
  ]);
  return {
    purchases: ((purchases.data ?? []) as PurchaseRow[]).map(purchaseRowToModel),
    purchaseItems: ((purchaseItems.data ?? []) as PurchaseItemRow[]).map(purchaseItemRowToModel),
    purchaseImages: ((purchaseImages.data ?? []) as PurchaseImageRow[]).map(purchaseImageRowToModel),
    sales: ((sales.data ?? []) as SaleRow[]).map(saleRowToModel),
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
    replaceTable(client, "purchases", snapshot.purchases.map((p) => purchaseModelToRow(p, userId)), userId),
    replaceTable(client, "purchase_items", snapshot.purchaseItems.map((i) => purchaseItemModelToRow(i, userId)), userId),
    replaceTable(client, "purchase_images", snapshot.purchaseImages.map((i) => purchaseImageModelToRow(i, userId)), userId),
    replaceTable(client, "sales", snapshot.sales.map((s) => saleModelToRow(s, userId)), userId),
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
    replaceTable(client, "delivery_rows", snapshot.deliveryRows.map((r, i) => deliveryToRow(r, userId, i)), userId),
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

export async function uploadItemImage(
  client: SupabaseClient,
  userId: string,
  purchaseId: number,
  itemUniqueCode: string,
  file: Blob,
  fileExt: string,
): Promise<string> {
  const path = `${userId}/p${purchaseId}/${itemUniqueCode}-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await client.storage
    .from("items")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;
  const { data } = client.storage.from("items").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPurchaseImage(
  client: SupabaseClient,
  userId: string,
  purchaseId: number,
  file: Blob,
  fileExt: string,
): Promise<string> {
  const path = `${userId}/p${purchaseId}/cover-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await client.storage
    .from("purchases")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;
  const { data } = client.storage.from("purchases").getPublicUrl(path);
  return data.publicUrl;
}

export function nextPurchaseUniqueCode(currentCounter: number): string {
  return `A-${String(currentCounter + 1).padStart(5, "0")}`;
}

export function nextPurchaseId(purchases: Purchase[]): number {
  return purchases.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

export function nextItemId(items: PurchaseItem[]): number {
  return items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
}

