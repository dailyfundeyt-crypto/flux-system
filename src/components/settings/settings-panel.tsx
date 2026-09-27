import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Database,
  ExternalLink,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  Sun,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
  testConnection,
} from "@/lib/supabase/client";
import type { SupabaseCredentials, SyncStatus } from "@/lib/supabase/types";

type SettingsPanelProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  status: SyncStatus;
  onSaved: (creds: SupabaseCredentials) => void;
  onCleared: () => void;
  lastSavedAt: number | null;
};

type View = "menu" | "account" | "appearance" | "connections";

type Theme = "light" | "dark" | "system";

const user = {
  name: "flux_system",
  email: "hallo@flux-system.app",
};

export function SettingsPanel({ open, onOpen, onClose, status, onSaved, onCleared, lastSavedAt }: SettingsPanelProps) {
  const [view, setView] = useState<View>("menu");
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    if (!open) setView("menu");
  }, [open]);

  useEffect(() => {
    if (open) {
      const initial = typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";
      setTheme(initial as Theme);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else if (next === "light") root.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  };

  const goBack = () => setView("menu");

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Einstellungen öffnen"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-700 shadow ring-1 ring-neutral-200 transition-colors hover:bg-neutral-900 hover:text-white hover:ring-neutral-900"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Einstellungen"
          className="flex w-[260px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-xl ring-1 ring-black/5"
        >
          <Header title={view === "menu" ? "Einstellungen" : titleFor(view)} showBack={view !== "menu"} onBack={goBack} onClose={onClose} />

          {view === "menu" && (
            <SettingsMenu
              onNavigate={setView}
              user={user}
              onClose={onClose}
              status={status}
              lastSavedAt={lastSavedAt}
            />
          )}
          {view === "account" && <AccountView user={user} />}
          {view === "appearance" && <AppearanceView theme={theme} onThemeChange={applyTheme} />}
          {view === "connections" && (
            <ConnectionsView onSaved={onSaved} onCleared={onCleared} />
          )}
        </div>
      )}
    </div>
  );
}

function titleFor(view: Exclude<View, "menu">) {
  switch (view) {
    case "account": return "Konto";
    case "appearance": return "Theme";
    case "connections": return "Verbindungen";
  }
}

function Header({ title, showBack, onBack, onClose }: { title: string; showBack: boolean; onBack: () => void; onClose: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span />
      )}
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Schließen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </header>
  );
}

function SettingsMenu({
  onNavigate,
  user,
  onClose,
  status,
  lastSavedAt,
}: {
  onNavigate: (view: View) => void;
  user: { name: string; email: string };
  onClose: () => void;
  status: SyncStatus;
  lastSavedAt: number | null;
}) {
  const initials = user.name.slice(0, 2).toUpperCase();
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-neutral-900">{user.name}</p>
          <p className="truncate text-[10px] text-neutral-500">{user.email}</p>
        </div>
        <StatusDot status={status} lastSavedAt={lastSavedAt} />
      </div>

      <div className="grid gap-0.5 px-1 pb-2">
        <Item icon={<UserIcon className="h-3.5 w-3.5" />} label="Konto" onClick={() => onNavigate("account")} />
        <Item icon={<Moon className="h-3.5 w-3.5" />} label="Theme" onClick={() => onNavigate("appearance")} />
        <Item icon={<Database className="h-3.5 w-3.5" />} label="Verbindungen" onClick={() => onNavigate("connections")} />
        <Item icon={<LogOut className="h-3.5 w-3.5" />} label="Abmelden" danger onClick={onClose} />
      </div>
    </>
  );
}

function StatusDot({ status, lastSavedAt }: { status: SyncStatus; lastSavedAt: number | null }) {
  const readyStamp = status.kind === "ready" ? status.at : lastSavedAt;
  if (status.kind === "loading") {
    return <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" title="Synchronisiere" />;
  }
  if (status.kind === "error") {
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" title="Fehler" />;
  }
  if (readyStamp) {
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" title={`Gespeichert ${new Date(readyStamp).toLocaleTimeString("de-DE")}`} />;
  }
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" title="Nicht verbunden" />;
}

type ItemProps = { icon: ReactNode; label: string; onClick?: () => void; danger?: boolean };
function Item({ icon, label, onClick, danger }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <span className={`grid h-5 w-5 shrink-0 place-items-center ${danger ? "text-rose-500" : "text-neutral-500 group-hover:text-neutral-700"}`}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function AccountView({ user }: { user: { name: string; email: string } }) {
  const initials = user.name.slice(0, 2).toUpperCase();
  return (
    <div className="space-y-3 px-3 py-3">
      <div className="flex flex-col items-center gap-2 rounded-md border border-neutral-200 bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <p className="text-xs font-semibold text-neutral-900">{user.name}</p>
        <p className="text-[10px] text-neutral-500">{user.email}</p>
      </div>
      <FormRow label="E-Mail">
        <Input value={user.email} readOnly />
      </FormRow>
      <FormRow label="Passwort">
        <Input type="password" value="••••••••" readOnly />
      </FormRow>
    </div>
  );
}

function AppearanceView({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  return (
    <div className="px-3 py-3">
      <div className="grid grid-cols-3 gap-1">
        <ThemeOption active={theme === "light"} onClick={() => onThemeChange("light")} icon={<Sun className="h-3 w-3" />} />
        <ThemeOption active={theme === "dark"} onClick={() => onThemeChange("dark")} icon={<Moon className="h-3 w-3" />} />
        <ThemeOption active={theme === "system"} onClick={() => onThemeChange("system")} icon={<SettingsIcon className="h-3 w-3" />} />
      </div>
    </div>
  );
}

function ThemeOption({ active, icon, onClick }: { active: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-md border p-2 transition-colors ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      }`}
      aria-label="Theme umschalten"
    >
      {icon}
    </button>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ConnectionsView({
  onSaved,
  onCleared,
}: {
  onSaved: (creds: SupabaseCredentials) => void;
  onCleared: () => void;
}) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = loadCredentials();
    if (stored) {
      setUrl(stored.url);
      setAnonKey(stored.anonKey);
    }
    setTestResult("");
    setTestOk(null);
  }, []);

  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();
  const canSave = trimmedUrl.startsWith("https://") && trimmedKey.length > 20;

  const handleTest = async () => {
    if (!canSave) return;
    setTesting(true);
    setTestResult("");
    setTestOk(null);
    try {
      const message = await testConnection({ url: trimmedUrl, anonKey: trimmedKey, autoSync: true });
      setTestResult(message);
      setTestOk(!message.startsWith("Fehler"));
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Unbekannter Fehler");
      setTestOk(false);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const creds: SupabaseCredentials = { url: trimmedUrl, anonKey: trimmedKey, autoSync: true };
      saveCredentials(creds);
      onSaved(creds);
      setTestResult("Verbindung gespeichert.");
      setTestOk(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = () => {
    clearCredentials();
    setUrl("");
    setAnonKey("");
    setTestResult("");
    setTestOk(null);
    onCleared();
  };

  return (
    <div className="space-y-2 px-3 py-3">
      <FormRow label="Projekt-URL">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…supabase.co"
          autoComplete="off"
        />
      </FormRow>
      <FormRow label="Anon-Key">
        <Input
          value={anonKey}
          onChange={(event) => setAnonKey(event.target.value)}
          placeholder="eyJhbGciOi…"
          type="password"
          autoComplete="off"
        />
      </FormRow>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={!canSave || testing}
          className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          {testing ? "Teste…" : "Testen"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex-1 rounded bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
        >
          {saving ? "…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={!url && !anonKey}
          className="rounded px-2 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40"
          aria-label="Trennen"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {testResult && (
        <p
          className={`rounded px-2 py-1.5 text-[10px] ${testOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
          role="status"
        >
          {testResult}
        </p>
      )}
      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 hover:text-neutral-800"
      >
        Supabase Dashboard <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}