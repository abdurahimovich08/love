-- Run this in Supabase SQL editor.
-- This keeps the demo simple with public read/write access.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  owner_name text not null,
  config jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text references public.campaigns(slug) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type text not null,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_campaign_slug_idx on public.sessions(campaign_slug);
create index if not exists session_events_session_id_idx on public.session_events(session_id);

alter table public.campaigns enable row level security;
alter table public.sessions enable row level security;
alter table public.session_events enable row level security;

drop policy if exists campaigns_open on public.campaigns;
create policy campaigns_open on public.campaigns
for all
using (true)
with check (true);

drop policy if exists sessions_open on public.sessions;
create policy sessions_open on public.sessions
for all
using (true)
with check (true);

drop policy if exists session_events_open on public.session_events;
create policy session_events_open on public.session_events
for all
using (true)
with check (true);
