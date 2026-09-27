-- Flux · Supabase Schema
-- Paste this file into the Supabase SQL editor (Database → SQL editor → New query).
-- After running, go to Project Settings → API and copy the URL and anon key
-- into the Flux settings panel (bottom-left gear icon).

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Anonymous read/write access (single-tenant demo).
-- For real production use, replace these policies with auth.uid() based ones.
drop policy if exists "settings_anon_read" on public.settings;
create policy "settings_anon_read"
  on public.settings
  for select
  to anon
  using (true);

drop policy if exists "settings_anon_write" on public.settings;
create policy "settings_anon_write"
  on public.settings
  for all
  to anon
  using (true)
  with check (true);

-- Optional: keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch
  before update on public.settings
  for each row
  execute function public.touch_updated_at();

comment on table public.settings is
  'Flux workspace snapshot — key/value store with the entire app state under key=workspace.';