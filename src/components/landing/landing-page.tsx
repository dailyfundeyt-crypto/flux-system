import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle2,
  ChevronDown,
  Layers,
  ShoppingCart,
  TrendingUp,
  Zap,
} from "lucide-react";

const FeatureCard = ({
  icon,
  title,
  description,
  accent,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
}) => (
  <div
    className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
  >
    <div
      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}
    >
      {icon}
    </div>
    <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm leading-relaxed text-white/60">{description}</p>
    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/40 transition-colors group-hover:text-white/70">
      <span>Mehr erfahren</span>
      <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
    </div>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-5xl font-bold text-transparent">{value}</p>
    <p className="mt-1 text-sm font-medium text-white/50">{label}</p>
  </div>
);

const Step = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
      {number}
    </div>
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="mt-1 text-sm text-white/50">{description}</p>
    </div>
  </div>
);

export function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setVisible(true);
  }, []);

  const features = [
    {
      icon: <Layers className="h-6 w-6 text-indigo-300" />,
      title: "Ankauf",
      description:
        "Sammle Schallplatten, Bücher, Uhren und mehr. Scanne, fotografiere und erfasse jeden Artikel mit eindeutiger ID.",
      accent: "bg-indigo-500/20",
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-emerald-300" />,
      title: "Verkauf",
      description:
        "Liste Artikel automatisch auf eBay, Kleinanzeigen oder Discogs. Verfolge den Status und die Marge in Echtzeit.",
      accent: "bg-emerald-500/20",
    },
    {
      icon: <Box className="h-6 w-6 text-amber-300" />,
      title: "Lieferung",
      description:
        "Verwalte Kartons, QR-Codes und Rechnungen. Weise Items einem Paket zu und behalte den Überblick.",
      accent: "bg-amber-500/20",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-cyan-300" />,
      title: "Umsatz",
      description:
        "Sieh auf einen Blick Einkäufe, Versandkosten, Erlöse und Deckungsbeitrag pro Einkauf.",
      accent: "bg-cyan-500/20",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-violet-300" />,
      title: "Stores",
      description:
        "Verwalte mehrere Verkaufskanäle. Jeder Store bekommt sein eigenes Profil, Logo und AI-Zuordnung.",
      accent: "bg-violet-500/20",
    },
    {
      icon: <Zap className="h-6 w-6 text-rose-300" />,
      title: "KI-Assistent",
      description:
        "Automatische Preisschätzungen, Texte und Store-Zuordnung per AI. Weniger manuelle Arbeit, mehr Gewinn.",
      accent: "bg-rose-500/20",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070710] text-white selection:bg-indigo-500/30">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#070710]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold shadow-lg shadow-indigo-500/30">
              F
            </div>
            <span className="text-lg font-bold tracking-tight">Flux</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#features"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white sm:block"
            >
              Features
            </a>
            <a
              href="#process"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white sm:block"
            >
              So funktioniert's
            </a>
            <a
              href="/"
              className="ml-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              App öffnen
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <div
          className={`mx-auto max-w-4xl text-center transition-all duration-1000 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            Alles in einer App — Ankauf, Verkauf, Lieferung, Umsatz
          </div>
          <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            Dein Warenhandel
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              im Fluss.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
            Flux ist das Warenhandel-Backoffice für Einzelhändler, Sammler und Flippers.
            Erfasse Artikel, verkaufe überall, behalte den Überblick — ohne Tabellen-Chaos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/"
              className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/50"
            >
              Kostenlos starten
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-white/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              Mehr erfahren
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-3 text-xs text-white/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/50" />
            <span>Keine Kreditkarte nötig</span>
            <span className="text-white/20">·</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400/50" />
            <span>Supabase-powered</span>
            <span className="text-white/20">·</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400/50" />
            <span>Google-Anmeldung</span>
          </div>
        </div>

        {/* Floating dashboard preview */}
        <div
          className={`relative mt-16 w-full max-w-5xl transition-all delay-500 duration-1000 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 text-center text-xs text-white/30">flux.app</div>
            </div>
            {/* Mock dashboard UI */}
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Offene Items", value: "24", sub: "+3 diese Woche", color: "text-indigo-400" },
                { label: "Verkäufe", value: "€ 847", sub: "+12% zum Vormonat", color: "text-emerald-400" },
                { label: "Offene Lieferungen", value: "6", sub: "3 Kartons gepackt", color: "text-amber-400" },
                { label: "Deckungsbeitrag", value: "€ 312", sub: "Ø 34% Marge", color: "text-cyan-400" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-medium text-white/40">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="mt-0.5 text-[10px] text-white/30">{card.sub}</p>
                </div>
              ))}
            </div>
            <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-4 py-2 font-medium text-white/40">Code</th>
                    <th className="px-4 py-2 font-medium text-white/40">Titel</th>
                    <th className="px-4 py-2 font-medium text-white/40">Preis</th>
                    <th className="px-4 py-2 font-medium text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: "A-00042", title: "Dark Side of the Moon", price: "€ 28", status: "listed", statusColor: "bg-blue-500/20 text-blue-400" },
                    { code: "A-00041", title: "Abbey Road Original", price: "€ 65", status: "sold", statusColor: "bg-emerald-500/20 text-emerald-400" },
                    { code: "A-00040", title: "Kind of Blue 1st Press", price: "€ 42", status: "in_stock", statusColor: "bg-amber-500/20 text-amber-400" },
                  ].map((row) => (
                    <tr key={row.code} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-white/60">{row.code}</td>
                      <td className="px-4 py-2.5 font-medium text-white/80">{row.title}</td>
                      <td className="px-4 py-2.5 font-semibold text-white/80">{row.price}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.statusColor}`}>
                          {row.status === "listed" ? "Listing" : row.status === "sold" ? "Verkauft" : "Bestand"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/30 transition-colors hover:text-white/60"
          aria-label="Mehr erfahren"
        >
          <ChevronDown className="h-6 w-6" />
        </a>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Features
            </p>
            <h2 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              Alles, was du brauchst.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Vom Ankauf bis zum Umsatz — Flux begleitet jeden Schritt deines Warenhandels.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <FeatureCard {...f} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <StatCard value="100%" label="Cloud-basiert" />
            <StatCard value="< 3 Min." label="Pro Artikel erfassen" />
            <StatCard value="0 €" label="Startkosten" />
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="relative px-6 py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Ablauf
            </p>
            <h2 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              So startest du.
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                number: "01",
                title: "Google-Konto verbinden",
                description:
                  "Registriere dich in 10 Sekunden mit deinem Google-Konto. Kein Passwort, keine E-Mail-Verifizierung.",
              },
              {
                number: "02",
                title: "Einkauf erfassen",
                description:
                  "Gib Lieferant, Gesamtpreis und Versand ein. Lade Cover-Foto und Einzelbilder hoch. Die AI generiert Titel und Beschreibungen.",
              },
              {
                number: "03",
                title: "Items einzelnen Stores zuordnen",
                description:
                  "Wähle den passenden Store (eBay, Kleinanzeigen, Discogs …) und lass dir den besten Preis vorschlagen.",
              },
              {
                number: "04",
                title: "Verkaufen und abrechnen",
                description:
                  "Markiere den Verkauf, lade QR-Code und Rechnung hoch. Flux berechnet automatisch deine Marge und den Deckungsbeitrag.",
              },
            ].map((step) => (
              <Step key={step.number} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-12 backdrop-blur-xl">
            <h2 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Bereit, deinen Warenhandel zu ordnen?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/50">
              Starte jetzt kostenlos. Keine Kreditkarte, keine Verpflichtung.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/50"
              >
                Jetzt starten — kostenlos
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
              F
            </div>
            <span className="font-semibold text-white/60">Flux</span>
          </div>
          <p className="text-xs text-white/30">
            © 2026 Flux. Alle Rechte vorbehalten. Powered by Supabase.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Datenschutz</a>
            <a href="#" className="hover:text-white/60 transition-colors">AGB</a>
            <a href="https://github.com/dailyfundeyt-crypto/flux-system" target="_blank" rel="noreferrer" className="hover:text-white/60 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      <style>{`
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.6;
          will-change: transform;
        }
        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          animation: float1 20s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
          top: 30%;
          right: -150px;
          animation: float2 25s ease-in-out infinite;
        }
        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
          bottom: 0;
          left: 30%;
          animation: float3 18s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, 80px) scale(1.1); }
          66% { transform: translate(-40px, 40px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 60px) scale(1.05); }
          66% { transform: translate(40px, -40px) scale(0.9); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -60px) scale(1.08); }
          66% { transform: translate(-30px, 30px) scale(0.92); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}
