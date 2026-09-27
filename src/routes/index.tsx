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
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { AuthScreen } from "@/components/auth/auth-screen";
import { useAuth } from "@/lib/supabase/auth";
import {
  loadSnapshot,
  saveSnapshot,
  type DeliveryRow,
  type Purchase,
  type PurchaseBatch,
  type PurchaseItem,
  type PurchaseLine,
  type RevenueLine,
  type Sale,
  type ShippingLine,
} from "@/lib/supabase/snapshot";
import type { SyncStatus } from "@/lib/supabase/types";
import { AnkaufDashboard } from "@/components/purchase/ankauf-dashboard";
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

function Index() {
  const auth = useAuth();
  const [active, setActive] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [revenue, setRevenue] = useState<RevenueLine[]>([]);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [purchaseBatches, setPurchaseBatches] = useState<PurchaseBatch[]>([]);
  const [deliveryRows, setDeliveryRows] = useState<DeliveryRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ kind: "idle" });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const prevUserId = useRef<string | null>(null);

  // Hydrate from Supabase whenever a user signs in (per-user scope)
  useEffect(() => {
    if (!auth.client || auth.status.kind !== "signed_in") {
      setHydrated(false);
      return;
    }
    const userId = auth.status.user.id;
    if (prevUserId.current === userId) return;
    prevUserId.current = userId;
    setHydrated(false);
    setSyncStatus({ kind: "loading" });
    void (async () => {
      try {
        const snapshot = await loadSnapshot(auth.client!, userId);
        setPurchases(snapshot.purchases);
        setPurchaseItems(snapshot.purchaseItems);
        setSales(snapshot.sales);
        setRevenue(snapshot.revenueLines);
        setPurchaseLines(snapshot.purchaseLines);
        setShippingLines(snapshot.shippingLines);
        setPurchaseBatches(snapshot.purchaseBatches);
        setDeliveryRows(snapshot.deliveryRows);
        setSyncStatus({ kind: "ready", at: Date.now() });
      } catch (err) {
        setSyncStatus({ kind: "error", message: err instanceof Error ? err.message : "Unbekannter Fehler" });
      } finally {
        setHydrated(true);
      }
    })();
  }, [auth.client, auth.status]);

  // Sign-out: reset to empty so local UI doesn't bleed across users
  useEffect(() => {
    if (auth.status.kind === "signed_out") {
      setPurchases([]);
      setPurchaseItems([]);
      setSales([]);
      setRevenue([]);
      setPurchaseLines([]);
      setShippingLines([]);
      setPurchaseBatches([]);
      setDeliveryRows([]);
      setHydrated(false);
      prevUserId.current = null;
      setSyncStatus({ kind: "idle" });
      setLastSavedAt(null);
    }
  }, [auth.status]);

  // Auto-sync on any state change after hydration
  useEffect(() => {
    if (!auth.client || auth.status.kind !== "signed_in") return;
    if (!hydrated) return;
    const userId = auth.status.user.id;
    setSyncStatus({ kind: "loading" });
    const timer = window.setTimeout(() => {
      void saveSnapshot(auth.client!, userId, {
        purchases,
        purchaseItems,
        purchaseImages: [],
        sales,
        purchaseLines,
        shippingLines,
        revenueLines: revenue,
        purchaseBatches,
        deliveryRows,
      })
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
  }, [purchases, purchaseItems, sales, purchaseLines, shippingLines, revenue, purchaseBatches, deliveryRows, auth.client, auth.status, hydrated]);

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

  const formatTotalRevenue = (rows: Sale[]) => {
    const total = rows.reduce((sum, s) => {
      const n = Number(s.amount.replace(/[^\d,]/g, "").replace(",", "."));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    return total.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  const formatAverageSale = (rows: Sale[]) => {
    if (rows.length === 0) return "0,00 €";
    const total = rows.reduce((sum, s) => {
      const n = Number(s.amount.replace(/[^\d,]/g, "").replace(",", "."));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    return (total / rows.length).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
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

      <SettingsPanel
        open={settingsOpen}
        onOpen={() => setSettingsOpen(true)}
        onClose={() => setSettingsOpen(false)}
        status={syncStatus}
        lastSavedAt={lastSavedAt}
      />

      {auth.status.kind === "signed_out" && auth.credentials && !auth.error && (
        <AuthScreen auth={auth} />
      )}

      <div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Page title="Ankauf" kicker="Beschaffung" subtitle="Einkäufe mit allen Items, Bildern, KI-Beschreibungen und Profit-Tracking.">
          <AnkaufDashboard
            purchases={purchases}
            items={purchaseItems}
            onPurchaseChange={setPurchases}
            onItemChange={setPurchaseItems}
            onSold={(item, salePrice, customerName) => {
              const now = new Date();
              const dateLabel = now.toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
              const sale: Sale = {
                id: Date.now(),
                customerName: customerName || "Unbenannt",
                description: `${item.title || "Item"} · ${item.uniqueCode}`,
                amount: `${salePrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
                time: dateLabel,
                status: "open",
              };
              setSales([sale, ...sales]);
              setPurchaseItems(
                purchaseItems.map((it) =>
                  it.id === item.id
                    ? {
                        ...it,
                        status: "sold",
                        soldAt: now.toISOString(),
                        salePrice,
                        saleOrderId: sale.id,
                      }
                    : it,
                ),
              );
              flash(`Verkauft: ${item.uniqueCode} · ${sale.amount}`);
            }}
          />
        </Page>

        <Page title="Verkauf" kicker="Aufträge" subtitle="Verkäufe, Kunden und Erlöse im Überblick — gefüllt aus dem Ankauf.">
          <MetricGrid items={[
            ["Verkaufserlös", formatTotalRevenue(sales), "aus Verkäufen", <ArrowUpRight />],
            ["Verkäufe", `${sales.length}`, "insgesamt", <PackageCheck />],
            ["Ø Verkauf", formatAverageSale(sales), "pro Auftrag", <CircleDollarSign />],
          ]} />
          <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-baseline justify-between border-b border-neutral-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Verkäufe aus dem Ankauf</h3>
                <p className="mt-0.5 text-xs text-neutral-500">Wenn du im Ankauf ein Item als „verkauft" markierst, erscheint es hier automatisch.</p>
              </div>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                {sales.length} Verkäufe
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3 w-32 text-right">Betrag</th>
                  <th className="px-4 py-3 w-32">Zeit</th>
                  <th className="px-4 py-3 w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-400">
                    Noch keine Verkäufe. Markiere im Ankauf ein Item als verkauft.
                  </td></tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-neutral-800">{s.customerName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{s.description}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{s.amount}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{s.time}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                          {s.status === "open" ? "Offen" : s.status === "paid" ? "Bezahlt" : s.status === "shipped" ? "Versendet" : "Abgeschlossen"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

type RevenueRow =
  | { kind: "purchase"; id: number; label: string; amount: number }
  | { kind: "shipping"; id: number; label: string; amount: number }
  | { kind: "revenue"; id: number; label: string; amount: number }
  | {
      kind: "batch";
      id: number;
      label: string;
      purchaseIds: number[];
      revenueIds: number[];
    }
  | { kind: "pending"; id: number; name: string; detail: string; amount: string };

const revenueBadgeStyles = {
  purchase: { label: "Ankauf", className: "bg-rose-50 text-rose-700" },
  shipping: { label: "Versand", className: "bg-amber-50 text-amber-700" },
  revenue: { label: "Umsatz", className: "bg-emerald-50 text-emerald-700" },
  batch: { label: "Einkauf-Batch", className: "bg-indigo-50 text-indigo-700" },
  pending: { label: "Offen", className: "bg-blue-50 text-blue-700" },
} as const satisfies Record<string, { label: string; className: string }>;

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
  purchaseLines: PurchaseLine[];
  onPurchaseLinesChange: (rows: PurchaseLine[]) => void;
  shippingLines: ShippingLine[];
  onShippingLinesChange: (rows: ShippingLine[]) => void;
  revenue: RevenueLine[];
  onRevenueChange: (rows: RevenueLine[]) => void;
  sales: Sale[];
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

  const pendingRows: RevenueRow[] = sales.map((entry, i) => ({
    kind: "pending" as const,
    id: 50_000 + i,
    name: entry.customerName,
    detail: entry.description,
    amount: entry.amount,
  }));

  const unifiedRows: RevenueRow[] = [
    ...purchaseLines.map<RevenueRow>((line) => ({ kind: "purchase", id: line.id, label: line.label, amount: line.amount })),
    ...shippingLines.map<RevenueRow>((line) => ({ kind: "shipping", id: line.id, label: line.label, amount: line.amount })),
    ...revenue.map<RevenueRow>((line) => ({ kind: "revenue", id: line.id, label: line.store, amount: line.amount })),
    ...batches.map<RevenueRow>((batch) => ({
      kind: "batch",
      id: batch.id,
      label: batch.label,
      purchaseIds: batch.purchaseIds,
      revenueIds: batch.revenueIds,
    })),
    ...pendingRows,
  ];

  const updateRow = (row: RevenueRow, patch: Partial<RevenueRow>) => {
    switch (row.kind) {
      case "purchase":
        onPurchaseLinesChange(
          purchaseLines.map((line) => (line.id === row.id ? { ...line, ...(patch as Partial<PurchaseLine>) } : line)),
        );
        return;
      case "shipping":
        onShippingLinesChange(
          shippingLines.map((line) => (line.id === row.id ? { ...line, ...(patch as Partial<ShippingLine>) } : line)),
        );
        return;
      case "revenue":
        onRevenueChange(
          revenue.map((line) => (line.id === row.id ? { ...line, ...(patch as Partial<RevenueLine>) } : line)),
        );
        return;
      case "batch":
        onBatchesChange(
          batches.map((batch) => (batch.id === row.id ? { ...batch, ...(patch as Partial<PurchaseBatch>) } : batch)),
        );
        return;
    }
  };

  const removeRow = (row: RevenueRow) => {
    switch (row.kind) {
      case "purchase":
        onPurchaseLinesChange(purchaseLines.filter((line) => line.id !== row.id));
        return;
      case "shipping":
        onShippingLinesChange(shippingLines.filter((line) => line.id !== row.id));
        return;
      case "revenue":
        onRevenueChange(revenue.filter((line) => line.id !== row.id));
        return;
      case "batch":
        onBatchesChange(batches.filter((batch) => batch.id !== row.id));
        return;
      case "pending":
        return;
    }
  };

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

  const lookupPurchase = (id: number) => purchaseLines.find((line) => line.id === id);
  const lookupRevenue = (id: number) => revenue.find((line) => line.id === id);

  return (
    <div className="mt-8 space-y-6">
      <RevenueSummaryStrip
        revenue={revenueTotal}
        purchaseTotal={purchaseTotal}
        shippingTotal={shippingTotal}
        profit={profit}
        margin={margin}
      />

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">Umsatz-Tabelle</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Eine flache Tabelle für alle Positionen: Ankäufe, Versand, Umsätze und Einkauf-Batches. Offene Aufträge erscheinen mit Status „Offen".
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AddRowButton onClick={addPurchaseLine} label="Ankauf" />
            <AddRowButton onClick={addShippingLine} label="Versand" />
            <AddRowButton onClick={addRevenueLine} label="Umsatz" />
            <AddRowButton onClick={addBatch} label="Einkauf-Batch" />
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3 w-32">Kategorie</th>
              <th className="px-4 py-3">Bezeichnung</th>
              <th className="px-4 py-3">Zuordnung</th>
              <th className="px-4 py-3 w-36 text-right">Betrag</th>
              <th className="px-4 py-3 w-16"><span className="sr-only">Aktion</span></th>
            </tr>
          </thead>
          <tbody>
            {unifiedRows.map((row) => {
              const badge = revenueBadgeStyles[row.kind];
              const isBatch = row.kind === "batch";
              const isPending = row.kind === "pending";
              const batchCost = isBatch
                ? row.purchaseIds.reduce((sum, id) => sum + (lookupPurchase(id)?.amount ?? 0), 0)
                : 0;
              const batchReturn = isBatch
                ? row.revenueIds.reduce((sum, id) => sum + (lookupRevenue(id)?.amount ?? 0), 0)
                : 0;
              const ratio = isBatch && batchCost > 0 ? batchReturn / batchCost : 0;
              return (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{row.name}</p>
                        <p className="text-xs text-neutral-400">{row.detail}</p>
                      </div>
                    ) : (
                      <input
                        value={row.label}
                        onChange={(event) => updateRow(row, { label: event.target.value } as Partial<RevenueRow>)}
                        placeholder={
                          row.kind === "purchase" ? "Lieferant oder Position" :
                          row.kind === "shipping" ? "Carrier oder Sendung" :
                          row.kind === "revenue" ? "Store oder Kunde" :
                          "Einkauf-Name"
                        }
                        aria-label="Bezeichnung"
                        className={`w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-neutral-300 focus:bg-white ${row.kind === "batch" ? "font-semibold" : ""}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isBatch ? (
                      <BatchAssigner
                        batch={row}
                        purchaseLines={purchaseLines}
                        revenue={revenue}
                        onChange={(patch) => updateRow(row, patch)}
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isBatch ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold tabular-nums">{eur(batchCost)}</span>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ratio >= 1 ? "bg-emerald-50 text-emerald-700" : ratio >= 0.5 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {eur(batchReturn)} · {(ratio * 100).toFixed(0)} % refinanziert
                        </span>
                      </div>
                    ) : isPending ? (
                      <span className="text-sm font-semibold tabular-nums text-neutral-500">{row.amount}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.amount}
                        onChange={(event) => updateRow(row, { amount: Number(event.target.value) || 0 } as Partial<RevenueRow>)}
                        aria-label="Betrag"
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm font-semibold tabular-nums outline-none focus:border-neutral-300 focus:bg-white"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => removeRow(row)}
                        className="rounded-md p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label="Zeile entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {unifiedRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-400">
                  Noch keine Positionen erfasst. Offene Aufträge aus dem Verkauf-Tab erscheinen automatisch hier mit dem Status „Offen".
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 bg-neutral-50">
              <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500" colSpan={3}>Σ Gesamt-Tabelle</td>
              <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">{eur(revenueTotal - cost)}</td>
              <td />
            </tr>
            <tr className="border-t border-neutral-100 bg-neutral-50/60">
              <td className="px-4 py-2 text-xs text-neutral-500" colSpan={2}>
                <div className="flex flex-wrap gap-4">
                  <span>Σ Ankäufe: <strong className="font-semibold tabular-nums text-neutral-900">{eur(purchaseTotal)}</strong></span>
                  <span>Σ Versand: <strong className="font-semibold tabular-nums text-neutral-900">{eur(shippingTotal)}</strong></span>
                  <span>Σ Umsätze: <strong className="font-semibold tabular-nums text-neutral-900">{eur(revenueTotal)}</strong></span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-xs text-neutral-500">Kosten</td>
              <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums text-neutral-900">− {eur(cost)}</td>
              <td />
            </tr>
            <tr className="border-t border-neutral-200 bg-white">
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500" colSpan={3}>
                Gesamt-Verkauf (Umsätze − Ankäufe − Versand)
              </td>
              <td className={`px-4 py-3 text-right text-base font-bold tabular-nums ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{eur(profit)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}

function BatchAssigner({
  batch,
  purchaseLines,
  revenue,
  onChange,
}: {
  batch: Extract<RevenueRow, { kind: "batch" }>;
  purchaseLines: PurchaseLine[];
  revenue: RevenueLine[];
  onChange: (patch: Partial<RevenueRow>) => void;
}) {
  const purchaseOptions = purchaseLines.filter((line) => line.id !== batch.id);
  const revenueOptions = revenue.filter((line) => line.id !== batch.id);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">A</span>
        {batch.purchaseIds.length === 0 && <span className="text-xs text-neutral-400">keine Ankäufe</span>}
        {batch.purchaseIds.map((id) => {
          const line = purchaseOptions.find((option) => option.id === id);
          if (!line) return null;
          return (
            <button
              key={`p-${id}`}
              type="button"
              onClick={() => onChange({ purchaseIds: batch.purchaseIds.filter((current) => current !== id) } as Partial<RevenueRow>)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-2 py-0.5 text-[11px] text-white"
              title="Ankauf entfernen"
            >
              {line.label || `Ankauf ${id}`} <X className="h-3 w-3" />
            </button>
          );
        })}
        <select
          value=""
          onChange={(event) => {
            const id = Number(event.target.value);
            if (id && !batch.purchaseIds.includes(id)) {
              onChange({ purchaseIds: [...batch.purchaseIds, id] } as Partial<RevenueRow>);
            }
            event.target.value = "";
          }}
          className="rounded-full border border-dashed border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] text-neutral-500 outline-none focus:border-neutral-400"
          aria-label="Ankauf zuordnen"
        >
          <option value="">+ Ankauf</option>
          {purchaseOptions.filter((option) => !batch.purchaseIds.includes(option.id)).map((option) => (
            <option key={option.id} value={option.id}>{option.label || `Ankauf ${option.id}`}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">U</span>
        {batch.revenueIds.length === 0 && <span className="text-xs text-neutral-400">keine Umsätze</span>}
        {batch.revenueIds.map((id) => {
          const line = revenueOptions.find((option) => option.id === id);
          if (!line) return null;
          return (
            <button
              key={`r-${id}`}
              type="button"
              onClick={() => onChange({ revenueIds: batch.revenueIds.filter((current) => current !== id) } as Partial<RevenueRow>)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-2 py-0.5 text-[11px] text-white"
              title="Umsatz entfernen"
            >
              {line.store || `Umsatz ${id}`} <X className="h-3 w-3" />
            </button>
          );
        })}
        <select
          value=""
          onChange={(event) => {
            const id = Number(event.target.value);
            if (id && !batch.revenueIds.includes(id)) {
              onChange({ revenueIds: [...batch.revenueIds, id] } as Partial<RevenueRow>);
            }
            event.target.value = "";
          }}
          className="rounded-full border border-dashed border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] text-neutral-500 outline-none focus:border-neutral-400"
          aria-label="Umsatz zuordnen"
        >
          <option value="">+ Umsatz</option>
          {revenueOptions.filter((option) => !batch.revenueIds.includes(option.id)).map((option) => (
            <option key={option.id} value={option.id}>{option.store || `Umsatz ${option.id}`}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function RevenueSummaryStrip({
  revenue,
  purchaseTotal,
  shippingTotal,
  profit,
  margin,
}: {
  revenue: number;
  purchaseTotal: number;
  shippingTotal: number;
  profit: number;
  margin: number;
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
        </div>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          <BreakdownRow label="Σ Umsätze (Brutto)" value={revenue} accent="positive" />
          <BreakdownRow label="− Σ Ankäufe" value={-purchaseTotal} accent="negative" />
          <BreakdownRow label="− Σ Versand" value={-shippingTotal} accent="negative" />
          <tr className="border-t border-neutral-200 bg-neutral-50">
            <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">= Gesamt-Verkauf (nach Kosten)</td>
            <td className={`px-5 py-3 text-right text-base font-bold tabular-nums ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
              {eur(profit)}
            </td>
          </tr>
        </tbody>
      </table>
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