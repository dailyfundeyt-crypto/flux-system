import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileUp,
  PackageCheck,
  Plus,
  QrCode,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function Index() {
  const [active, setActive] = useState(0);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [sales, setSales] = useState(initialSales);
  const [notice, setNotice] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

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
              <DeliveryTable />
            </div>
          </div>
        </section>

        <Page title="Umsatz" kicker="Finanzen" subtitle="Entwicklung, Marge und Buchungen auf einen Blick.">
          <MetricGrid items={[
            ["Umsatz", "28.640 €", "+12,8 %", <TrendingUp />],
            ["Rohertrag", "9.310 €", "+9,6 %", <CircleDollarSign />],
            ["Marge", "32,5 %", "+1,4 %", <ArrowUpRight />],
          ]} />
          <ContentGrid>
            <RevenueChart />
            <EntryList title="Jüngste Buchungen" entries={sales.slice(0, 3)} icon={<CircleDollarSign />} />
          </ContentGrid>
        </Page>
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

type DeliveryRow = { id: number; box: string; qr: string | null; invoice: string | null };

function DeliveryTable() {
  const [rows, setRows] = useState<DeliveryRow[]>([
    { id: 1, box: "1", qr: null, invoice: null },
    { id: 2, box: "2", qr: null, invoice: null },
  ]);
  const nextId = useRef(3);

  const update = (id: number, patch: Partial<DeliveryRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () => setRows((current) => [...current, { id: nextId.current++, box: String(current.length + 1), qr: null, invoice: null }]);
  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id));

  const pickFile = (id: number, kind: "qr" | "invoice", accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (kind === "qr") {
        const reader = new FileReader();
        reader.onload = () => update(id, { qr: String(reader.result) });
        reader.readAsDataURL(file);
      } else {
        update(id, { invoice: file.name });
      }
    };
    input.click();
  };

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
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50">
              <td className="px-4 py-3">
                <input
                  value={row.box}
                  onChange={(event) => update(row.id, { box: event.target.value })}
                  placeholder="0"
                  aria-label="Karton-Nummer"
                  className="w-14 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none focus:border-neutral-300 focus:bg-white"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => pickFile(row.id, "qr", "image/*")}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
                  aria-label="QR-Code hochladen"
                >
                  {row.qr ? <img src={row.qr} alt="QR-Code" className="h-full w-full object-cover" /> : <QrCode className="h-5 w-5" />}
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => pickFile(row.id, "invoice", ".pdf,image/*")}
                  className="flex max-w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                >
                  <FileUp className="h-4 w-4 shrink-0" />
                  <span className="truncate">{row.invoice ?? "Rechnung hochladen"}</span>
                </button>
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

function RevenueChart() {
  const values = [42, 56, 49, 72, 63, 86, 78];
  return (
    <Panel title="Umsatzentwicklung">
      <div className="flex h-52 items-end gap-3 border-b border-border px-1 pb-2">
        {values.map((value, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t-sm bg-primary/20 transition-colors group-hover:bg-primary" style={{ height: `${value}%` }} /></div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-muted-foreground">{["Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep"].map((month) => <span key={month}>{month}</span>)}</div>
    </Panel>
  );
}