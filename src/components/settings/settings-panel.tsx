import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Database,
  ExternalLink,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  Moon,
  Settings as SettingsIcon,
  Share2,
  Sun,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  buildClient,
  clearCredentials,
  loadCredentials,
  saveCredentials,
  testConnection,
} from "@/lib/supabase/client";
import type { SupabaseCredentials, SyncStatus } from "@/lib/supabase/types";

type SettingsPanelProps = {
  open: boolean;
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

const shortcutHint = "Ctrl+Shift+M";

export function SettingsPanel({ open, onClose, status, onSaved, onCleared, lastSavedAt }: SettingsPanelProps) {
  const [view, setView] = useState<View>("menu");
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    if (!open) {
      setView("menu");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const initial = (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) ? "dark" : "light";
      setTheme(initial as Theme);
    }
  }, [open]);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else if (next === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition-opacity duration-150 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/30"
        aria-label="Einstellungen schließen"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Einstellungen"
        className={`absolute bottom-4 left-4 top-4 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 transition-transform duration-200 sm:bottom-6 sm:left-6 ${open ? "translate-x-0" : "-translate-x-[calc(100%+2rem)]"}`}
      >
        {view === "menu" && (
          <SettingsMenu onNavigate={setView} onClose={onClose} user={user} />
        )}
        {view === "account" && (
          <AccountView onBack={() => setView("menu")} user={user} />
        )}
        {view === "appearance" && (
          <AppearanceView onBack={() => setView("menu")} theme={theme} onThemeChange={applyTheme} />
        )}
        {view === "connections" && (
          <ConnectionsView
            onBack={() => setView("menu")}
            status={status}
            onSaved={onSaved}
            onCleared={onCleared}
            lastSavedAt={lastSavedAt}
          />
        )}
      </aside>
    </div>
  );
}

type SettingsMenuProps = {
  onNavigate: (view: View) => void;
  onClose: () => void;
  user: { name: string; email: string };
};

function SettingsMenu({ onNavigate, user, onClose }: SettingsMenuProps) {
  const initials = user.name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "FX";
  return (
    <>
      <header className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-base font-semibold">Einstellungen</h2>
        <DialogClose onClose={onClose} />
      </header>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 rounded-md p-2 hover:bg-neutral-50">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <Share2 className="h-3.5 w-3.5" /> Connect your social media
        </button>
      </div>

      <div className="border-t border-neutral-200" />

      <div className="flex-1 overflow-y-auto py-1">
        <MenuGroup>
          <MenuItem icon={<UserIcon className="h-4 w-4" />} label="Profil" hasSubmenu onClick={() => onNavigate("account")} />
          <MenuItem icon={<Bell className="h-4 w-4" />} label="Posteingang" />
          <MenuItem icon={<SettingsIcon className="h-4 w-4" />} label="Kontoeinstellungen" shortcut={shortcutHint} onClick={() => onNavigate("account")} />
          <MenuItem icon={<Moon className="h-4 w-4" />} label="Erscheinungsbild" hasSubmenu onClick={() => onNavigate("appearance")} />
          <MenuItem icon={<Database className="h-4 w-4" />} label="Verbindungen" hasSubmenu onClick={() => onNavigate("connections")} />
          <MenuItem icon={<Keyboard className="h-4 w-4" />} label="Tastenkürzel" />
          <MenuItem icon={<LifeBuoy className="h-4 w-4" />} label="Support" hasSubmenu />
        </MenuGroup>

        <div className="my-1 border-t border-neutral-200" />

        <MenuGroup>
          <MenuItem icon={<ExternalLink className="h-4 w-4" />} label="Dokumentation" hasSubmenu />
          <MenuItem icon={<Mail className="h-4 w-4" />} label="Community" hasSubmenu />
        </MenuGroup>
      </div>

      <div className="border-t border-neutral-200" />

      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4" /> Abmelden
      </button>
    </>
  );
}

function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      aria-label="Schließen"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function MenuGroup({ children }: { children: ReactNode }) {
  return <div className="py-1">{children}</div>;
}

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  hasSubmenu?: boolean;
  shortcut?: string;
  onClick?: () => void;
};

function MenuItem({ icon, label, hasSubmenu, shortcut, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-800 transition-colors hover:bg-neutral-100"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center text-neutral-500 group-hover:text-neutral-700">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-500 group-hover:bg-white">
          {shortcut}
        </span>
      )}
      {hasSubmenu && <span className="shrink-0 text-neutral-400 group-hover:text-neutral-600">›</span>}
    </button>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-2 px-4 pb-3 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
        aria-label="Zurück"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h2 className="text-base font-semibold">{title}</h2>
    </header>
  );
}

function AccountView({ onBack, user }: { onBack: () => void; user: { name: string; email: string } }) {
  const initials = user.name.slice(0, 2).toUpperCase();
  return (
    <>
      <BackHeader title="Konto" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-semibold text-white">
            {initials}
          </span>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <FormRow label="Name">
            <Input value={user.name} readOnly />
          </FormRow>
          <FormRow label="E-Mail">
            <Input value={user.email} readOnly />
          </FormRow>
          <FormRow label="Passwort">
            <Input type="password" value="••••••••" readOnly />
          </FormRow>
        </div>
      </div>
    </>
  );
}

function AppearanceView({ onBack, theme, onThemeChange }: { onBack: () => void; theme: Theme; onThemeChange: (theme: Theme) => void }) {
  return (
    <>
      <BackHeader title="Erscheinungsbild" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-xs font-medium text-neutral-500">Theme</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <ThemeOption active={theme === "light"} onClick={() => onThemeChange("light")} icon={<Sun className="h-4 w-4" />} label="Hell" />
          <ThemeOption active={theme === "dark"} onClick={() => onThemeChange("dark")} icon={<Moon className="h-4 w-4" />} label="Dunkel" />
          <ThemeOption active={theme === "system"} onClick={() => onThemeChange("system")} icon={<SettingsIcon className="h-4 w-4" />} label="System" />
        </div>

        <p className="mt-5 text-xs font-medium text-neutral-500">Schnittstelle</p>
        <div className="mt-2 grid gap-1">
          <FormRow label="Schriftgröße">
            <Input defaultValue="Standard" readOnly />
          </FormRow>
          <FormRow label="Tab-Breite">
            <Input defaultValue="4 Leerzeichen" readOnly />
          </FormRow>
        </div>
      </div>
    </>
  );
}

function ThemeOption({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-xs font-medium transition-colors ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md border border-current/20">{icon}</span>
      {label}
    </button>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function ConnectionsView({
  onBack,
  status,
  onSaved,
  onCleared,
  lastSavedAt,
}: {
  onBack: () => void;
  status: SyncStatus;
  onSaved: (creds: SupabaseCredentials) => void;
  onCleared: () => void;
  lastSavedAt: number | null;
}) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = loadCredentials();
    if (stored) {
      setUrl(stored.url);
      setAnonKey(stored.anonKey);
      setAutoSync(stored.autoSync);
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
      const message = await testConnection({ url: trimmedUrl, anonKey: trimmedKey, autoSync });
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
      const creds: SupabaseCredentials = { url: trimmedUrl, anonKey: trimmedKey, autoSync };
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
    setAutoSync(true);
    setTestResult("");
    setTestOk(null);
    onCleared();
  };

  return (
    <>
      <BackHeader title="Verbindungen" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ConnectionRow
          icon={<Database className="h-4 w-4" />}
          title="Supabase"
          description="Workspace-Daten persistent speichern."
          status={status}
          lastSavedAt={lastSavedAt}
          connected={Boolean(trimmedUrl)}
        />
        <div className="mt-4 grid gap-3">
          <FormRow label="Projekt-URL">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://dein-projekt.supabase.co"
              autoComplete="off"
            />
          </FormRow>
          <FormRow label="Anon / Public Key">
            <Input
              value={anonKey}
              onChange={(event) => setAnonKey(event.target.value)}
              placeholder="eyJhbGciOi..."
              type="password"
              autoComplete="off"
            />
          </FormRow>
          <label className="flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(event) => setAutoSync(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span>Änderungen automatisch synchronisieren</span>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={!canSave || testing}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {testing ? "Teste…" : "Verbindung testen"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? <LoaderDot /> : <Check className="h-3.5 w-3.5" />} Speichern
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={!url && !anonKey}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Trennen
          </button>
        </div>

        {testResult && (
          <p
            className={`mt-3 rounded-md px-3 py-2 text-xs ${testOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            role="status"
          >
            {testResult}
          </p>
        )}

        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-700">Einmalig einzurichten</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5">
            <li>Projekt auf <strong>supabase.com</strong> anlegen.</li>
            <li>SQL aus <code className="rounded bg-white px-1 font-mono text-[11px]">supabase/schema.sql</code> im SQL-Editor ausführen.</li>
            <li>URL und anon key aus <strong>Project Settings → API</strong> oben eintragen.</li>
          </ol>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-medium text-neutral-800 hover:text-neutral-900"
          >
            Supabase Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </>
  );
}

function LoaderDot() {
  return (
    <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
      <span className="absolute h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
    </span>
  );
}

function ConnectionRow({
  icon,
  title,
  description,
  status,
  lastSavedAt,
  connected,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: SyncStatus;
  lastSavedAt: number | null;
  connected: boolean;
}) {
  const badge = renderStatusBadge(status, lastSavedAt, connected);
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-neutral-100 text-neutral-700">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
            {badge}
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function renderStatusBadge(status: SyncStatus, lastSavedAt: number | null, connected: boolean) {
  if (!connected) {
    return <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">Nicht verbunden</span>;
  }
  if (status.kind === "loading") {
    return <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">Synchronisiere</span>;
  }
  if (status.kind === "error") {
    return <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">Fehler</span>;
  }
  const stamp = status.kind === "ready" ? status.at : lastSavedAt;
  if (!stamp) {
    return <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Bereit</span>;
  }
  return <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Gespeichert {new Date(stamp).toLocaleTimeString("de-DE")}</span>;
}