-- Run this in Supabase SQL editor.
-- This keeps the demo simple with public read/write access.

create extension if not exists pgcrypto;

-- Campaigns table (create if missing, then patch columns for existing tables)
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  owner_name text not null,
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.campaigns add column if not exists slug text;
alter table public.campaigns add column if not exists title text;
alter table public.campaigns add column if not exists owner_name text;
alter table public.campaigns add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.campaigns add column if not exists created_at timestamptz not null default now();

-- Sessions table (create if missing, then patch columns for existing tables)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text references public.campaigns(slug) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.sessions add column if not exists campaign_slug text;
alter table public.sessions add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.sessions add column if not exists summary jsonb not null default '{}'::jsonb;
alter table public.sessions add column if not exists started_at timestamptz not null default now();
alter table public.sessions add column if not exists completed_at timestamptz;

-- Session events table (create if missing, then patch columns for existing tables)
create table if not exists public.session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type text not null,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.session_events add column if not exists session_id uuid;
alter table public.session_events add column if not exists event_type text;
alter table public.session_events add column if not exists step text;
alter table public.session_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.session_events add column if not exists created_at timestamptz not null default now();

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
