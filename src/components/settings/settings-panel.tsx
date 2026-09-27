import { useEffect, useState } from "react";
import { Check, Database, ExternalLink, Loader2, Settings as SettingsIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function SettingsPanel({ open, onClose, status, onSaved, onCleared, lastSavedAt }: SettingsPanelProps) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>("");
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const stored = loadCredentials();
    if (stored) {
      setUrl(stored.url);
      setAnonKey(stored.anonKey);
      setAutoSync(stored.autoSync);
    }
    setTestResult("");
    setTestOk(null);
  }, [open]);

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
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        aria-label="Einstellungen schließen"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Einstellungen"
        className={`absolute bottom-0 left-0 top-0 flex w-full max-w-md flex-col border-r border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-white">
              <SettingsIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Einstellungen</h2>
              <p className="text-xs text-neutral-500">Verbindungen, Sync und Daten</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Supabase-Datenbank</h3>
              <SyncBadge status={status} lastSavedAt={lastSavedAt} />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Fülle die Felder aus, um den kompletten Workspace (Ankäufe, Verkäufe, Lieferungen, Umsatz) automatisch in deiner Supabase-Datenbank zu sichern.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
                Projekt-URL
                <Input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://dein-projekt.supabase.co"
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-neutral-700">
                Anon / Public Key
                <Input
                  value={anonKey}
                  onChange={(event) => setAnonKey(event.target.value)}
                  placeholder="eyJhbGciOi..."
                  type="password"
                  autoComplete="off"
                />
              </label>
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

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!canSave || testing}
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                Verbindung testen
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Speichern & verbinden
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={!url && !anonKey}
              >
                <Trash2 className="h-3.5 w-3.5" /> Trennen
              </Button>
            </div>

            {testResult && (
              <p
                className={`mt-3 rounded-md px-3 py-2 text-xs ${testOk ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                role="status"
              >
                {testResult}
              </p>
            )}

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900"
            >
              Supabase Dashboard öffnen <ExternalLink className="h-3 w-3" />
            </a>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">Einmalig einzurichten</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-neutral-600">
              <li>Erstelle ein kostenloses Projekt auf <strong>supabase.com</strong>.</li>
              <li>Öffne <strong>SQL Editor → New query</strong>, füge die Datei <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">supabase/schema.sql</code> ein und führe sie aus.</li>
              <li>Gehe zu <strong>Project Settings → API</strong> und kopiere URL und anon key.</li>
              <li>Trage sie oben ein, klicke <em>Verbindung testen</em>, dann <em>Speichern</em>.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-900">Über Flux</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Flux ist eine minimalistische Logistik-App. Ohne Supabase bleiben alle Daten lokal in deinem Browser.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

function SyncBadge({ status, lastSavedAt }: { status: SyncStatus; lastSavedAt: number | null }) {
  if (status.kind === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
        <Loader2 className="h-3 w-3 animate-spin" /> Synchronisiere
      </span>
    );
  }
  if (status.kind === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        Sync-Fehler
      </span>
    );
  }
  if (status.kind === "ready" || lastSavedAt !== null) {
    const stamp = new Date(status.kind === "ready" ? status.at : lastSavedAt ?? Date.now());
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        <Check className="h-3 w-3" /> Gespeichert {stamp.toLocaleTimeString("de-DE")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
      Nicht verbunden
    </span>
  );
}