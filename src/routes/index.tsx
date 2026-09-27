import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Plus,
  TrendingUp,
  Truck,
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
  const [deliveries, setDeliveries] = useState([
    { name: "Bauprojekt West", detail: "Heute · 14:00–16:00", amount: "Unterwegs", time: "Köln" },
    { name: "Atelier Hansen", detail: "Morgen · 09:00–11:00", amount: "Geplant", time: "Düsseldorf" },
    { name: "Formwerk Studio", detail: "29. Sep. · 12:00–14:00", amount: "Bereit", time: "Bonn" },
  ]);
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
                <p className="truncate text-xs text-muted-foreground">Logistik ohne Umwege</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <CalendarDays className="h-4 w-4" /> Sonntag, 27. September
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

        <Page title="Lieferung" kicker="Logistik" subtitle="Sendungen planen und ihren Status aktualisieren.">
          <MetricGrid items={[
            ["Unterwegs", "4", "aktive Touren", <Truck />],
            ["Heute", "7", "Lieferungen", <Clock3 />],
            ["Pünktlich", "96 %", "+2,1 %", <PackageCheck />],
          ]} />
          <ContentGrid>
            <DeliveryForm onAdd={(entry) => { setDeliveries([entry, ...deliveries]); flash("Lieferung wurde geplant"); }} />
            <EntryList title="Anstehende Lieferungen" entries={deliveries} icon={<Truck />} status />
          </ContentGrid>
        </Page>

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

function DeliveryForm({ onAdd }: { onAdd: (entry: Entry) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const date = new Date(String(data.get("date"))).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
    onAdd({ name: String(data.get("recipient")), detail: `${date} · ${data.get("time")}`, amount: String(data.get("status")), time: String(data.get("city")) });
    event.currentTarget.reset();
  };
  return (
    <Panel title="Lieferung planen">
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Empfänger"><Input name="recipient" placeholder="Name oder Firma" required /></Field>
        <Field label="Lieferort"><Input name="city" placeholder="Stadt" required /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Datum"><Input name="date" type="date" required /></Field><Field label="Uhrzeit"><Input name="time" type="time" required /></Field></div>
        <Field label="Status"><select name="status" className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>Geplant</option><option>Bereit</option><option>Unterwegs</option></select></Field>
        <Button className="mt-1 h-11 w-full"><Plus /> Lieferung planen</Button>
      </form>
    </Panel>
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