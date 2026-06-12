create extension if not exists pgcrypto;

create table if not exists public.workspace_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  client_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  quote_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  room_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  photo_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  invoice_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_entries (
  calendar_entry_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists rooms_user_id_idx on public.rooms (user_id);
create index if not exists photos_user_id_idx on public.photos (user_id);
create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists calendar_entries_user_id_idx on public.calendar_entries (user_id);

alter table public.workspace_settings enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.rooms enable row level security;
alter table public.photos enable row level security;
alter table public.invoices enable row level security;
alter table public.calendar_entries enable row level security;

revoke all on public.workspace_settings, public.clients, public.quotes, public.rooms, public.photos, public.invoices, public.calendar_entries from anon;
grant select, insert, update, delete on public.workspace_settings, public.clients, public.quotes, public.rooms, public.photos, public.invoices, public.calendar_entries to authenticated;

drop policy if exists "workspace settings own rows" on public.workspace_settings;
create policy "workspace settings own rows" on public.workspace_settings for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "clients own rows" on public.clients;
create policy "clients own rows" on public.clients for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "quotes own rows" on public.quotes;
create policy "quotes own rows" on public.quotes for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "rooms own rows" on public.rooms;
create policy "rooms own rows" on public.rooms for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "photos own rows" on public.photos;
create policy "photos own rows" on public.photos for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "invoices own rows" on public.invoices;
create policy "invoices own rows" on public.invoices for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "calendar entries own rows" on public.calendar_entries;
create policy "calendar entries own rows" on public.calendar_entries for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('auty-media', 'auty-media', false)
on conflict (id) do update set public = false;

drop policy if exists "auty media upload own folders" on storage.objects;
create policy "auty media upload own folders" on storage.objects for insert to authenticated with check (
  bucket_id = 'auty-media' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "auty media read own folders" on storage.objects;
create policy "auty media read own folders" on storage.objects for select to authenticated using (
  bucket_id = 'auty-media' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "auty media update own folders" on storage.objects;
create policy "auty media update own folders" on storage.objects for update to authenticated using (
  bucket_id = 'auty-media' and (select auth.uid())::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'auty-media' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "auty media delete own folders" on storage.objects;
create policy "auty media delete own folders" on storage.objects for delete to authenticated using (
  bucket_id = 'auty-media' and (select auth.uid())::text = (storage.foldername(name))[1]
);
