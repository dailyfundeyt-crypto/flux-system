export type SupabaseCredentials = {
  url: string;
  anonKey: string;
  autoSync: boolean;
};

export type SyncStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; at: number }
  | { kind: "error"; message: string };

export type WorkspaceSnapshot = {
  schemaVersion: number;
  purchases: Array<{ name: string; detail: string; amount: string; time: string }>;
  sales: Array<{ name: string; detail: string; amount: string; time: string }>;
  revenue: Array<{ id: number; store: string; amount: number }>;
  purchaseLines: Array<{ id: number; label: string; amount: number }>;
  shippingLines: Array<{ id: number; label: string; amount: number }>;
  purchaseBatches: Array<{
    id: number;
    label: string;
    purchaseIds: number[];
    revenueIds: number[];
  }>;
  deliveryRows: Array<{
    id: number;
    box: string;
    qr: { dataUrl: string; name: string; kind: "image" | "pdf" } | null;
    invoice: { dataUrl: string; name: string; kind: "image" | "pdf" } | null;
  }>;
};

export const SNAPSHOT_SCHEMA_VERSION = 1;