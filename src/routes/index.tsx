import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileUp,
  Maximize2,
  PackageCheck,
  Plus,
  QrCode,
  Settings,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { buildClient, loadCredentials } from "@/lib/supabase/client";
import { loadSnapshot, saveSnapshot } from "@/lib/supabase/snapshot";
import type { SupabaseCredentials, SyncStatus, WorkspaceSnapshot } from "@/lib/supabase/types";
import logoAsset from "@/assets/flux-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flux — Warenhandel im Fluss" },
      { name: "description", content: "Ankauf, Verkauf, Lieferungen und Umsatz zentral verwalten." },
      { property: "og:title", content: "Flux — Warenhandel im Fluss" },
      { property: "og:description", content: "Ankauf, Verkauf, Lieferungen und Umsatz zentral verwalten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const sections = ["Ankauf", "Verkauf", "Lieferung", "Umsatz"] as const;
type Section = (typeof sections)[number];
type Entry = { name: string; detail: string; amount: string; time: string };

const initialPurchases: Entry[] = [
  { name: "Nordwerk GmbH", detail: "24 × Aluminiumprofil", amount: "1.824,00 €", time: "Heute, 09:42" },
  { name: "Meyer Großhandel", detail: "60 × Verpackungseinheit", amount: "846,00 €", time: "Gestern, 16:18" },
  { name: "Kern & Sohn", detail: "12 × Werkzeugset Pro", amount: "1.140,00 €", time: "25. Sep., 11:05" },
];

const initialSales: Entry[] = [
  { name: "Atelier Hansen", detail: "8 × Werkzeugset Pro", amount: "1.272,00 €", time: "Heute, 11:24" },
  { name: "Bauprojekt West", detail: "18 × Aluminiumprofil", amount: "2.322,00 €", time: "Heute, 08:10" },
  { name: "Formwerk Studio", detail: "32 × Verpackungseinheit", amount: "768,00 €", time: "Gestern, 14:47" },
];

type MoneyLine = { id: number; label: string; amount: number };
type RevenueLine = { id: number; store: string; amount: number };
type PurchaseBatch = { id: number; label: string; purchaseIds: number[]; revenueIds: number[] };

const initialRevenue: RevenueLine[] = [
  { id: 1, store: "Atelier Hansen", amount: 1272 },
  { id: 2, store: "Bauprojekt West", amount: 2322 },
  { id: 3, store: "Formwerk Studio", amount: 768 },
  { id: 4, store: "Nordwerk Online", amount: 1840 },
  { id: 5, store: "Studio Lindqvist", amount: 945 },
  { id: 6, store: "Werkraum Süd", amount: 612 },
];

const initialPurchaseLines: MoneyLine[] = [
  { id: 1, label: "Nordwerk GmbH", amount: 1824 },
  { id: 2, label: "Meyer Großhandel", amount: 846 },
  { id: 3, label: "Kern & Sohn", amount: 1140 },
];

const initialShippingLines: MoneyLine[] = [
  { id: 1, label: "DHL Express", amount: 48.9 },
  { id: 2, label: "Hermes Sperrgut", amount: 32.5 },
  { id: 3, label: "DPD Paletten", amount: 89.0 },
];

const initialPurchaseBatches: PurchaseBatch[] = [
  { id: 1, label: "Einkauf 1", purchaseIds: [1], revenueIds: [1, 4] },
  { id: 2, label: "Einkauf 2", purchaseIds: [2], revenueIds: [2, 6] },
  { id: 3, label: "Einkauf 3", purchaseIds: [3], revenueIds: [3, 5] },
];

const initialDeliveryRows: DeliveryRow[] = [
  { id: 1, box: "1", qr: null, invoice: null },
  { id: 2, box: "2", qr: null, invoice: null },
];

function Index() {
  const [active, setActive] = useState(0);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [sales, setSales] = useState(initialSales);
  const [revenue, setRevenue] = useState(initialRevenue);
  const [purchaseLines, setPurchaseLines] = useState(initialPurchaseLines);
  const [shippingLines, setShippingLines] = useState(initialShippingLines);
  const [purchaseBatches, setPurchaseBatches] = useState(initialPurchaseBatches);
  const [deliveryRows, setDeliveryRows] = useState(initialDeliveryRows);
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: "idle" });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [supabaseCreds, setSupabaseCreds] = useState<SupabaseCredentials | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  // Initial Supabase hydration + connection (only once on mount)
  useEffect(() => {
    const creds = loadCredentials();
    if (!creds) return;
    setSupabaseCreds(creds);
    setSyncStatus({ kind: "loading" });
    const client = buildClient(creds);
    void (async () => {
      try {
        const snapshot = await loadSnapshot(client);
        if (snapshot) {
          setPurchases(snapshot.purchases);
          setSales(snapshot.sales);
          setRevenue(snapshot.revenue);
          setPurchaseLines(snapshot.purchaseLines);
          setShippingLines(snapshot.shippingLines);
          setPurchaseBatches(snapshot.purchaseBatches);
          if (snapshot.deliveryRows.length > 0) setDeliveryRows(snapshot.deliveryRows);
        }
        setSyncStatus({ kind: "ready", at: Date.now() });
      } catch (err) {
        setSyncStatus({ kind: "error", message: err instanceof Error ? err.message : "Unbekannter Fehler" });
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, []);

  // Debounced auto-sync on state changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!supabaseCreds) return;
    if (!supabaseCreds.autoSync) return;
    setSyncStatus({ kind: "loading" });
    const timer = window.setTimeout(() => {
      const snapshot: WorkspaceSnapshot = {
        schemaVersion: 1,
        purchases,
        sales,
        revenue,
        purchaseLines,
        shippingLines,
        purchaseBatches,
        deliveryRows,
      };
      const client = buildClient(supabaseCreds);
      void saveSnapshot(client, snapshot)
        .then(() => {
          const at = Date.now();
          setLastSavedAt(at);
          setSyncStatus({ kind: "ready", at });
        })
        .catch((err: unknown) => {
          setSyncStatus({ kind: "error", message: err instanceof Error ? err.message : "Unbekannter Fehler" });
        });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [
    purchases,
    sales,
    revenue,
    purchaseLines,
    shippingLines,
    purchaseBatches,
    deliveryRows,
    supabaseCreds,
  ]);

  const goTo = (index: number) => {
    setActive(index);
    scroller.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next >= 0 && next < sections.length) setActive(next);
  };

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 sm:pt-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src={logoAsset.url} alt="Flux" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm" />
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">Flux</p>
                <p className="truncate text-xs text-muted-foreground">Logistik ohne Interface</p>
              </div>
            </div>
          </div>
          <nav aria-label="Bereiche" className="relative mt-5 grid grid-cols-4">
            <div
              className="absolute bottom-0 h-0.5 w-1/4 bg-primary transition-transform duration-300"
              style={{ transform: `translateX(${active * 100}%)` }}
            />
            {sections.map((section, index) => (
              <Button
                key={section}
                type="button"
                variant="ghost"
                onClick={() => goTo(index)}
                className={`h-11 rounded-none px-1 text-xs shadow-none sm:text-sm ${active === index ? "text-foreground" : "text-muted-foreground"}`}
                aria-current={active === index ? "page" : undefined}
              >
                {section}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      {notice && (
        <div className="fixed right-4 top-24 z-40 flex items-center gap-2 rounded-md bg-success px-4 py-3 text-sm font-medium text-success-foreground shadow-lg">
          <Check className="h-4 w-4" /> {notice}
        </div>
      )}

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Einstellungen öffnen"
        className="fixed bottom-4 left-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-white text-neutral-700 shadow-lg ring-1 ring-neutral-200 transition-colors hover:bg-neutral-900 hover:text-white hover:ring-neutral-900 sm:bottom-6 sm:left-6"
      >
        <Settings className="h-4 w-4" />
      </button>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        status={syncStatus}
        onSaved={(creds) => {
          setSupabaseCreds(creds);
          setSyncStatus({ kind: "ready", at: Date.now() });
        }}
        onCleared={() => {
          setSupabaseCreds(null);
          setSyncStatus({ kind: "idle" });
          setLastSavedAt(null);
        }}
        lastSavedAt={lastSavedAt}
      />

      <div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Page title="Ankauf" kicker="Beschaffung" subtitle="Einkäufe erfassen und Lieferanten im Blick behalten.">
          <MetricGrid items={[
            ["Einkaufswert", "3.810,00 €", "+8,4 %", <ArrowDownLeft />],
            ["Bestellungen", "17", "diesen Monat", <Box />],
            ["Ø Einkauf", "224,12 €", "pro Bestellung", <CircleDollarSign />],
          ]} />
          <ContentGrid>
            <TradeForm mode="Ankauf" onAdd={(entry) => { setPurchases([entry, ...purchases]); flash("Ankauf wurde erfasst"); }} />
            <EntryList title="Letzte Einkäufe" entries={purchases} icon={<ArrowDownLeft />} />
          </ContentGrid>
        </Page>

        <Page title="Verkauf" kicker="Aufträge" subtitle="Verkäufe schnell erfassen und Erträge verfolgen.">
          <MetricGrid items={[
            ["Verkaufswert", "6.482,00 €", "+14,2 %", <ArrowUpRight />],
            ["Aufträge", "23", "diesen Monat", <PackageCheck />],
            ["Ø Verkauf", "281,83 €", "pro Auftrag", <CircleDollarSign />],
          ]} />
          <ContentGrid>
            <TradeForm mode="Verkauf" onAdd={(entry) => { setSales([entry, ...sales]); flash("Verkauf wurde erfasst"); }} />
            <EntryList title="Letzte Verkäufe" entries={sales} icon={<ArrowUpRight />} />
          </ContentGrid>
        </Page>

        <section className="w-full shrink-0 snap-start bg-white px-4 py-8 text-neutral-900 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase text-neutral-400">Logistik</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Lieferung</h1>
            <p className="mt-2 text-sm text-neutral-500">Kartons, QR-Codes und Rechnungen in einer Tabelle.</p>
            <div className="mt-8">
              <DeliveryTable rows={deliveryRows} onRowsChange={setDeliveryRows} />
            </div>
          </div>
        </section>

        <section className="w-full shrink-0 snap-start bg-white px-4 py-8 text-neutral-900 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase text-neutral-400">Finanzen</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Umsatz</h1>
            <p className="mt-2 text-sm text-neutral-500">Ankäufe, Versand, Erlöse und Rentabilität pro Einkauf im Überblick.</p>
            <RevenueWorkspace
              purchaseLines={purchaseLines}
              onPurchaseLinesChange={setPurchaseLines}
              shippingLines={shippingLines}
              onShippingLinesChange={setShippingLines}
              revenue={revenue}
              onRevenueChange={setRevenue}
              sales={sales}
              batches={purchaseBatches}
              onBatchesChange={setPurchaseBatches}
            />
            <RevenueDonutChart revenue={revenue} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Page({ title, kicker, subtitle, children }: { title: Section; kicker: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="w-full shrink-0 snap-start px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase text-primary">{kicker}</p>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">Zum Wechseln wischen</span>
        </div>
        <div className="mt-8 space-y-5">{children}</div>
      </div>
    </section>
  );
}

function MetricGrid({ items }: { items: [string, string, string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(([label, value, sub, icon]) => (
        <article key={label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span><span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span></div>
          <p className="mt-3 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </article>
      ))}
    </div>
  );
}

function ContentGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.35fr)]">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-5">{children}</div></div>;
}

function TradeForm({ mode, onAdd }: { mode: "Ankauf" | "Verkauf"; onAdd: (entry: Entry) => void }) {
  const party = mode === "Ankauf" ? "Lieferant" : "Kunde";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quantity = Number(data.get("quantity")) || 1;
    const price = Number(data.get("price")) || 0;
    onAdd({ name: String(data.get("party")), detail: `${quantity} × ${data.get("item")}`, amount: `${(quantity * price).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`, time: "Gerade eben" });
    event.currentTarget.reset();
  };
  return (
    <Panel title={`${mode} erfassen`}>
      <form onSubmit={submit} className="grid gap-4">
        <Field label={party}><Input name="party" placeholder={`${party} auswählen`} required /></Field>
        <Field label="Artikel"><Input name="item" placeholder="Artikelbezeichnung" required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Menge"><Input name="quantity" type="number" min="1" placeholder="1" required /></Field>
          <Field label={mode === "Ankauf" ? "Einkaufspreis" : "Verkaufspreis"}><Input name="price" type="number" min="0" step="0.01" placeholder="0,00 €" required /></Field>
        </div>
        <Button className="mt-1 h-11 w-full"><Plus /> {mode} hinzufügen</Button>
      </form>
    </Panel>
  );
}

type DeliveryFile = { dataUrl: string; name: string; kind: "image" | "pdf" };
type DeliveryRow = { id: number; box: string; qr: DeliveryFile | null; invoice: DeliveryFile | null };

function readFile(file: File): Promise<DeliveryFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () =>
      resolve({
        dataUrl: String(reader.result),
        name: file.name,
        kind: file.type === "application/pdf" ? "pdf" : "image",
      });
    reader.readAsDataURL(file);
  });
}

function DeliveryTable({ rows, onRowsChange }: { rows: DeliveryRow[]; onRowsChange: (next: DeliveryRow[]) => void }) {
  const nextId = useRef(rows.length + 100);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const update = (id: number, patch: Partial<DeliveryRow>) =>
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    onRowsChange([...rows, { id: nextId.current++, box: String(rows.length + 1), qr: null, invoice: null }]);
  const removeRow = (id: number) =>
    onRowsChange(rows.filter((row) => row.id !== id));

  const pickFile = async (id: number, kind: "qr" | "invoice") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = await readFile(file);
        update(id, { [kind]: data } as Partial<DeliveryRow>);
      } catch (error) {
        console.error("Datei konnte nicht gelesen werden", error);
      }
    };
    input.click();
  };

  const clearFile = (id: number, kind: "qr" | "invoice") =>
    update(id, { [kind]: null } as Partial<DeliveryRow>);

  const openPreview = (index: number) => {
    if (!rows[index]?.qr) return;
    setPreviewIndex(index);
  };

  const closePreview = useCallback(() => setPreviewIndex(null), []);

  const stepPreview = useCallback(
    (direction: 1 | -1) => {
      setPreviewIndex((current) => {
        if (current === null) return null;
        const total = rows.length;
        let next = current;
        for (let i = 0; i < total; i += 1) {
          next = (next + direction + total) % total;
          if (rows[next]?.qr) return next;
        }
        return current;
      });
    },
    [rows],
  );

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
      if (event.key === "ArrowDown" || event.key === "ArrowRight") stepPreview(1);
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") stepPreview(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [previewIndex, closePreview, stepPreview]);

  const previewRow = previewIndex !== null ? rows[previewIndex] : null;
  const previewBoxNumber = previewRow?.box ?? "";
  const previewTitle = previewRow ? `Paket ${previewRow.box} · QR-Code` : "";

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3 w-20">Nr.</th>
            <th className="px-4 py-3">QR-Code</th>
            <th className="px-4 py-3">Rechnung</th>
            <th className="px-4 py-3 w-16"><span className="sr-only">Aktion</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    value={row.box}
                    onChange={(event) => update(row.id, { box: event.target.value })}
                    placeholder="0"
                    aria-label="Paket-Nummer"
                    className="w-14 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold outline-none focus:border-neutral-300 focus:bg-white"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => openPreview(index)}
                      disabled={!row.qr}
                      className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={row.qr ? `QR-Code von Paket ${row.box} in Vollbild anzeigen` : `QR-Code für Paket ${row.box} hochladen`}
                    >
                      {row.qr ? (
                        row.qr.kind === "image" ? (
                          <img src={row.qr.dataUrl} alt={`QR-Code Paket ${row.box}`} className="h-full w-full object-cover" />
                        ) : (
                          <FileUp className="h-5 w-5 text-rose-500" />
                        )
                      ) : (
                        <QrCode className="h-5 w-5" />
                      )}
                      {row.qr && (
                        <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                    <span
                      className="pointer-events-none absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
                      aria-hidden="true"
                    >
                      {row.box || "·"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => pickFile(row.id, "qr")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <QrCode className="h-3.5 w-3.5" /> {row.qr ? "Ersetzen" : "Hochladen"}
                  </button>
                  {row.qr && (
                    <button
                      type="button"
                      onClick={() => clearFile(row.id, "qr")}
                      className="rounded-md p-1 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                      aria-label="QR-Code entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => pickFile(row.id, "invoice")}
                    className="flex max-w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                  >
                    <FileUp className="h-4 w-4 shrink-0" />
                    <span className="truncate">{row.invoice ? row.invoice.name : "Rechnung hochladen"}</span>
                    {row.invoice?.kind === "pdf" && (
                      <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                        PDF
                      </span>
                    )}
                  </button>
                  {row.invoice && (
                    <button
                      type="button"
                      onClick={() => clearFile(row.id, "invoice")}
                      className="rounded-md p-1 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                      aria-label="Rechnung entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  aria-label="Zeile entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
      >
        <Plus className="h-4 w-4" /> Neue Zeile
      </button>

      {previewRow?.qr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewTitle}
          onClick={closePreview}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Vollbild-Vorschau</p>
                <h2 className="truncate text-base font-semibold text-neutral-900">
                  Paket {previewBoxNumber} · QR-Code
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepPreview(-1)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  <ChevronDown className="h-4 w-4 rotate-180" /> Vorheriges
                </button>
                <button
                  type="button"
                  onClick={() => stepPreview(1)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Nächstes Paket <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="ml-2 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Vorschau schließen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid flex-1 place-items-center overflow-auto bg-neutral-50 p-6">
              {previewRow.qr.kind === "pdf" ? (
                <iframe
                  src={previewRow.qr.dataUrl}
                  title={`QR-Code Paket ${previewBoxNumber}`}
                  className="h-[70vh] w-full rounded-md border border-neutral-200 bg-white"
                />
              ) : (
                <img
                  src={previewRow.qr.dataUrl}
                  alt={`QR-Code Paket ${previewBoxNumber}`}
                  className="max-h-[78vh] max-w-full rounded-md object-contain shadow-md"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-5 py-3 text-xs text-neutral-500">
              <span className="truncate">{previewRow.qr.name}</span>
              <span className="shrink-0">
                Paket {previewBoxNumber} · {previewIndex !== null ? previewIndex + 1 : 0} / {rows.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryList({ title, entries, icon, status = false }: { title: string; entries: Entry[]; icon: ReactNode; status?: boolean }) {
  return (
    <Panel title={title}>
      <div className="divide-y divide-border">
        {entries.slice(0, 5).map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4 first:pt-0 last:pb-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{entry.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.detail} · {entry.time}</p></div>
            <div className="flex shrink-0 items-center gap-2"><span className={status ? "rounded-full bg-success-muted px-2 py-1 text-xs font-medium text-success" : "text-sm font-semibold"}>{entry.amount}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const eur = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

function RevenueWorkspace({
  purchaseLines,
  onPurchaseLinesChange,
  shippingLines,
  onShippingLinesChange,
  revenue,
  onRevenueChange,
  sales,
  batches,
  onBatchesChange,
}: {
  purchaseLines: MoneyLine[];
  onPurchaseLinesChange: (rows: MoneyLine[]) => void;
  shippingLines: MoneyLine[];
  onShippingLinesChange: (rows: MoneyLine[]) => void;
  revenue: RevenueLine[];
  onRevenueChange: (rows: RevenueLine[]) => void;
  sales: Entry[];
  batches: PurchaseBatch[];
  onBatchesChange: (rows: PurchaseBatch[]) => void;
}) {
  const nextPurchaseId = useRef(purchaseLines.length + 100);
  const nextShippingId = useRef(shippingLines.length + 200);
  const nextRevenueId = useRef(revenue.length + 300);
  const nextBatchId = useRef(batches.length + 400);

  const purchaseTotal = purchaseLines.reduce((sum, line) => sum + line.amount, 0);
  const shippingTotal = shippingLines.reduce((sum, line) => sum + line.amount, 0);
  const revenueTotal = revenue.reduce((sum, line) => sum + line.amount, 0);
  const cost = purchaseTotal + shippingTotal;
  const profit = revenueTotal - cost;
  const margin = revenueTotal > 0 ? (profit / revenueTotal) * 100 : 0;
  const pendingSalesCount = sales.length;
  const unassignedRevenue = revenue.filter((line) => !batches.some((batch) => batch.revenueIds.includes(line.id)));
  const unassignedPurchases = purchaseLines.filter((line) => !batches.some((batch) => batch.purchaseIds.includes(line.id)));
  const unassignedRevenueTotal = unassignedRevenue.reduce((sum, line) => sum + line.amount, 0);
  const unassignedPurchaseTotal = unassignedPurchases.reduce((sum, line) => sum + line.amount, 0);
  const assignedRevenueTotal = revenueTotal - unassignedRevenueTotal;
  const assignedPurchaseTotal = purchaseTotal - unassignedPurchaseTotal;

  const updateLine = <T extends MoneyLine>(
    rows: T[],
    setter: (next: T[]) => void,
    id: number,
    patch: Partial<T>,
  ) => setter(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeLine = <T extends { id: number }>(rows: T[], setter: (next: T[]) => void, id: number) =>
    setter(rows.filter((row) => row.id !== id));

  const addPurchaseLine = () => {
    const id = nextPurchaseId.current++;
    onPurchaseLinesChange([...purchaseLines, { id, label: "", amount: 0 }]);
  };
  const addShippingLine = () => {
    const id = nextShippingId.current++;
    onShippingLinesChange([...shippingLines, { id, label: "", amount: 0 }]);
  };
  const addRevenueLine = () => {
    const id = nextRevenueId.current++;
    onRevenueChange([...revenue, { id, store: "", amount: 0 }]);
  };
  const addBatch = () => {
    const id = nextBatchId.current++;
    onBatchesChange([...batches, { id, label: `Einkauf ${batches.length + 1}`, purchaseIds: [], revenueIds: [] }]);
  };

  const updateBatch = (id: number, patch: Partial<PurchaseBatch>) =>
    onBatchesChange(batches.map((batch) => (batch.id === id ? { ...batch, ...patch } : batch)));

  const lookupPurchase = (id: number) => purchaseLines.find((line) => line.id === id);
  const lookupRevenue = (id: number) => revenue.find((line) => line.id === id);

  return (
    <div className="mt-8 space-y-6">
      <RevenueBreakdown
        revenue={revenueTotal}
        cost={cost}
        purchaseTotal={purchaseTotal}
        shippingTotal={shippingTotal}
        profit={profit}
        margin={margin}
        pendingSales={pendingSalesCount}
        assignedRevenueTotal={assignedRevenueTotal}
        unassignedRevenueTotal={unassignedRevenueTotal}
        assignedPurchaseTotal={assignedPurchaseTotal}
        unassignedPurchaseTotal={unassignedPurchaseTotal}
      />

      <RevenueTableCard
        title="Alle Ankäufe"
        rows={purchaseLines}
        onChange={onPurchaseLinesChange}
        onAdd={addPurchaseLine}
        addLabel="Neuer Ankauf"
        sumLabel="Summe Ankäufe"
        total={purchaseTotal}
        update={(id, patch) => updateLine(purchaseLines, onPurchaseLinesChange, id, patch as Partial<MoneyLine>)}
        remove={(id) => removeLine(purchaseLines, onPurchaseLinesChange, id)}
        getLabel={(row) => (row as MoneyLine).label}
        setLabel={(_row, value) => ({ label: value } as Partial<MoneyLine>)}
      />

      <RevenueTableCard
        title="Versandkosten"
        rows={shippingLines}
        onChange={onShippingLinesChange}
        onAdd={addShippingLine}
        addLabel="Neue Versandposition"
        sumLabel="Summe Versand"
        total={shippingTotal}
        update={(id, patch) => updateLine(shippingLines, onShippingLinesChange, id, patch as Partial<MoneyLine>)}
        remove={(id) => removeLine(shippingLines, onShippingLinesChange, id)}
        getLabel={(row) => (row as MoneyLine).label}
        setLabel={(_row, value) => ({ label: value } as Partial<MoneyLine>)}
      />

      <RevenueTableCard
        title="Umsätze"
        rows={revenue}
        onChange={onRevenueChange as (rows: RevenueLine[]) => void}
        onAdd={addRevenueLine}
        addLabel="Neuer Umsatz"
        sumLabel="Summe Umsätze"
        total={revenueTotal}
        update={(id, patch) => onRevenueChange(revenue.map((row) => (row.id === id ? { ...row, ...(patch as Partial<RevenueLine>) } : row)))}
        remove={(id) => removeLine(revenue, onRevenueChange as (rows: RevenueLine[]) => void, id)}
        getLabel={(row) => (row as RevenueLine).store}
        setLabel={(_row, value) => ({ store: value } as Partial<RevenueLine>)}
      />

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">Einkauf-Rentabilität</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Ordne Ankäufe und Umsätze zu, um zu sehen, wie viel vom eingesetzten Geld bereits zurückgeflossen ist.
            </p>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 w-32">Einkauf</th>
              <th className="px-4 py-3">Zugeordnete Ankäufe</th>
              <th className="px-4 py-3">Zugeordnete Umsätze</th>
              <th className="px-4 py-3 w-32 text-right">Einsatz</th>
              <th className="px-4 py-3 w-36 text-right">Davon zurück</th>
              <th className="px-4 py-3 w-16"><span className="sr-only">Aktion</span></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const batchCost = batch.purchaseIds.reduce((sum, id) => sum + (lookupPurchase(id)?.amount ?? 0), 0);
              const batchReturn = batch.revenueIds.reduce((sum, id) => sum + (lookupRevenue(id)?.amount ?? 0), 0);
              const ratio = batchCost > 0 ? batchReturn / batchCost : 0;
              const remaining = batchReturn - batchCost;
              return (
                <tr key={batch.id} className="border-b border-neutral-100 align-top transition-colors last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <input
                      value={batch.label}
                      onChange={(event) => updateBatch(batch.id, { label: event.target.value })}
                      aria-label="Einkauf-Name"
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold outline-none focus:border-neutral-300 focus:bg-white"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <BatchSelector
                      options={purchaseLines}
                      selected={batch.purchaseIds}
                      placeholder="Ankauf hinzufügen"
                      onChange={(next) => updateBatch(batch.id, { purchaseIds: next })}
                      emptyLabel="Keine Ankäufe vorhanden"
                      getLabel={(option) => option.label}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <BatchSelector
                      options={revenue}
                      selected={batch.revenueIds}
                      placeholder="Umsatz hinzufügen"
                      onChange={(next) => updateBatch(batch.id, { revenueIds: next })}
                      emptyLabel="Keine Umsätze vorhanden"
                      getLabel={(option) => option.store}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">{eur(batchCost)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-semibold tabular-nums ${remaining >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{eur(batchReturn)}</span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ratio >= 1 ? "bg-emerald-50 text-emerald-700" : ratio >= 0.5 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {(ratio * 100).toFixed(0)} % refinanziert
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onBatchesChange(batches.filter((row) => row.id !== batch.id))}
                      className="rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                      aria-label="Einkauf-Batch entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {batches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">Noch keine Einkäufe zusammengefasst.</td>
              </tr>
            )}
            {batches.length > 0 && (
              <tr className="border-t border-neutral-200 bg-neutral-50">
                <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500" colSpan={3}>Zugeordnet gesamt</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">{eur(assignedPurchaseTotal)}</td>
                <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums text-emerald-700">{eur(assignedRevenueTotal)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
        <button
          type="button"
          onClick={addBatch}
          className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
        >
          <Plus className="h-4 w-4" /> Neuer Einkauf-Batch
        </button>
      </div>

      {sales.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-900">Verkäufe aus dem Verkauf-Tab</h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Diese Aufträge sind im Verkauf-Tab erfasst. Übertrage sie hier in die Umsatz-Tabelle, um sie in den Gesamt-Verkauf einzurechnen.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
              {pendingSalesCount} offen
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3 w-32 text-right">Betrag</th>
                <th className="px-4 py-3 w-40 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((entry, index) => {
                const amountNumber = Number(entry.amount.replace(/[^\d,]/g, "").replace(",", "."));
                return (
                  <tr key={`${entry.name}-${index}`} className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2.5 text-sm font-medium text-neutral-800">{entry.name}</td>
                    <td className="px-4 py-2.5 text-sm text-neutral-500">{entry.detail}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">{entry.amount}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (Number.isFinite(amountNumber) && amountNumber > 0) {
                            const id = nextRevenueId.current++;
                            onRevenueChange([...revenue, { id, store: entry.name, amount: amountNumber }]);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-900 hover:text-white hover:border-neutral-900"
                      >
                        <Plus className="h-3.5 w-3.5" /> Als Umsatz übernehmen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RevenueTableCard<T extends { id: number; amount: number }>({
  title,
  rows,
  total,
  sumLabel,
  addLabel,
  onAdd,
  onChange: _onChange,
  update,
  remove,
  getLabel,
  setLabel,
}: {
  title: string;
  rows: T[];
  total: number;
  sumLabel: string;
  addLabel: string;
  onAdd: () => void;
  onChange: (rows: T[]) => void;
  update: (id: number, patch: Partial<T>) => void;
  remove: (id: number) => void;
  getLabel: (row: T) => string;
  setLabel: (row: T, value: string) => Partial<T>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50"
            >
              <td className="px-4 py-2.5">
                <input
                  value={getLabel(row)}
                  onChange={(event) => update(row.id, setLabel(row, event.target.value) as Partial<T>)}
                  placeholder={title.includes("Versand") ? "Carrier oder Sendung" : title.includes("Umsatz") ? "Store oder Kunde" : "Lieferant oder Position"}
                  aria-label={`${title}-Bezeichnung`}
                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-neutral-300 focus:bg-white"
                />
              </td>
              <td className="px-4 py-2.5 w-40">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(event) => update(row.id, { amount: Number(event.target.value) || 0 } as Partial<T>)}
                  aria-label={`${title}-Betrag`}
                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm font-semibold tabular-nums outline-none focus:border-neutral-300 focus:bg-white"
                />
              </td>
              <td className="px-4 py-2.5 w-16 text-right">
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  aria-label={`${title}-Zeile entfernen`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          <tr className="border-t border-neutral-200 bg-neutral-50">
            <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">{sumLabel}</td>
            <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">{eur(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

function RevenueBreakdown({
  revenue,
  purchaseTotal,
  shippingTotal,
  cost,
  profit,
  margin,
  pendingSales,
  assignedRevenueTotal,
  unassignedRevenueTotal,
  assignedPurchaseTotal,
  unassignedPurchaseTotal,
}: {
  revenue: number;
  purchaseTotal: number;
  shippingTotal: number;
  cost: number;
  profit: number;
  margin: number;
  pendingSales: number;
  assignedRevenueTotal: number;
  unassignedRevenueTotal: number;
  assignedPurchaseTotal: number;
  unassignedPurchaseTotal: number;
}) {
  const isPositive = profit >= 0;
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Gesamt-Verkauf</p>
          <h3 className="mt-0.5 text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">{eur(revenue)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
          >
            {isPositive ? "Gewinn" : "Verlust"} {eur(Math.abs(profit))} · {margin.toFixed(1)} % Marge
          </span>
          {pendingSales > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              {pendingSales} Verkäufe noch nicht in Umsätze übernommen
            </span>
          )}
        </div>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          <BreakdownRow label="Summe Umsätze (Brutto)" value={revenue} accent="positive" />
          <BreakdownRow label="− Summe Ankäufe" value={-purchaseTotal} accent="negative" />
          <BreakdownRow label="− Summe Versand" value={-shippingTotal} accent="negative" />
          <tr className="border-t border-neutral-200 bg-neutral-50">
            <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">= Gesamt-Verkauf (nach Kosten)</td>
            <td className={`px-5 py-3 text-right text-base font-bold tabular-nums ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
              {eur(profit)}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="grid grid-cols-1 gap-px border-t border-neutral-200 bg-neutral-200 sm:grid-cols-2">
        <CoverageCell label="Zugeordnete Umsätze" value={assignedRevenueTotal} ratio={revenue > 0 ? assignedRevenueTotal / revenue : 0} />
        <CoverageCell label="Zugeordnete Ankäufe" value={assignedPurchaseTotal} ratio={purchaseTotal > 0 ? assignedPurchaseTotal / purchaseTotal : 0} />
      </div>
      {(unassignedRevenueTotal > 0 || unassignedPurchaseTotal > 0) && (
        <p className="border-t border-neutral-100 bg-white px-5 py-3 text-xs text-neutral-500">
          Hinweis: <strong className="font-semibold tabular-nums">{eur(unassignedRevenueTotal)}</strong> Umsätze und <strong className="font-semibold tabular-nums">{eur(unassignedPurchaseTotal)}</strong> Ankäufe sind noch keinem Einkauf-Batch zugeordnet.
        </p>
      )}
    </div>
  );
}

function BreakdownRow({ label, value, accent }: { label: string; value: number; accent: "positive" | "negative" }) {
  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-5 py-2.5 text-sm text-neutral-700">{label}</td>
      <td className={`px-5 py-2.5 text-right text-sm font-semibold tabular-nums ${accent === "positive" ? "text-emerald-700" : "text-neutral-700"}`}>
        {value === 0 ? "0,00 €" : `${value < 0 ? "−" : ""}${eur(Math.abs(value))}`}
      </td>
    </tr>
  );
}

function CoverageCell({ label, value, ratio, accent = "neutral" }: { label: string; value: number; ratio: number; accent?: "neutral" | "positive" | "negative" }) {
  const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  const valueColor = accent === "positive" ? "text-emerald-700" : accent === "negative" ? "text-rose-700" : "text-neutral-900";
  return (
    <div className="bg-white px-5 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${valueColor}`}>{eur(value)}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-900" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">{pct} % zugeordnet</p>
    </div>
  );
}

function BatchSelector<T extends { id: number }>({
  options,
  selected,
  placeholder,
  onChange,
  emptyLabel,
  getLabel,
}: {
  options: T[];
  selected: number[];
  placeholder: string;
  onChange: (next: number[]) => void;
  emptyLabel: string;
  getLabel: (option: T) => string;
}) {
  const labelOf = (option: T) => getLabel(option) || `Position ${option.id}`;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.length === 0 && <span className="text-xs text-neutral-400">{emptyLabel}</span>}
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(active ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"}`}
            aria-pressed={active}
          >
            {labelOf(option)}
          </button>
        );
      })}
      <select
        value=""
        onChange={(event) => {
          const id = Number(event.target.value);
          if (id && !selected.includes(id)) onChange([...selected, id]);
          event.target.value = "";
        }}
        className="rounded-full border border-dashed border-neutral-300 bg-white px-2 py-0.5 text-xs text-neutral-500 outline-none focus:border-neutral-400"
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {options.filter((option) => !selected.includes(option.id)).map((option) => (
          <option key={option.id} value={option.id}>{labelOf(option)}</option>
        ))}
      </select>
    </div>
  );
}

const donutPalette = [
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#84cc16",
  "#a855f7",
];

function RevenueDonutChart({ revenue }: { revenue: RevenueLine[] }) {
  const total = revenue.reduce((sum, line) => sum + line.amount, 0);
  const top = [...revenue]
    .filter((line) => line.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (total <= 0) {
    return (
      <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400 shadow-sm">
        Sobald Umsätze erfasst sind, erscheint hier die Store-Verteilung.
      </div>
    );
  }

  const radius = 70;
  const inner = 46;
  const stroke = radius - inner;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * (radius - stroke / 2);

  let offset = 0;
  const segments = top.map((line, index) => {
    const fraction = line.amount / total;
    const dash = circumference * fraction;
    const segment = { ...line, color: donutPalette[index % donutPalette.length], fraction, dash, offset };
    offset += dash;
    return segment;
  });

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 overflow-hidden rounded-lg border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
      <div className="grid place-items-center">
        <svg viewBox="0 0 200 200" className="h-52 w-52" role="img" aria-label="Umsatzverteilung nach Store">
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={radius - stroke / 2} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            {segments.map((segment) => (
              <circle
                key={segment.id}
                cx={cx}
                cy={cy}
                r={radius - stroke / 2}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </g>
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-neutral-400" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Gesamt</text>
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-neutral-900" style={{ fontSize: 18, fontWeight: 700 }}>{eur(total)}</text>
        </svg>
      </div>
      <ul className="min-w-0 space-y-2">
        {segments.map((segment, index) => (
          <li key={segment.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} aria-hidden="true" />
            <span className="min-w-0 truncate font-medium text-neutral-800">{segment.store || `Store ${index + 1}`}</span>
            <span className="text-right tabular-nums text-neutral-600">{eur(segment.amount)} <span className="ml-1 text-neutral-400">({(segment.fraction * 100).toFixed(1)} %)</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}