-- Run this in Supabase SQL editor.
-- Uses isolated table names to avoid conflicts with existing project tables.

create extension if not exists pgcrypto;

-- Campaigns
create table if not exists public.love_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  owner_name text not null,
  owner_chat_id bigint,
  owner_username text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.love_campaigns add column if not exists slug text;
alter table public.love_campaigns add column if not exists title text;
alter table public.love_campaigns add column if not exists owner_name text;
alter table public.love_campaigns add column if not exists owner_chat_id bigint;
alter table public.love_campaigns add column if not exists owner_username text;
alter table public.love_campaigns add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.love_campaigns add column if not exists created_at timestamptz not null default now();

-- Sessions
create table if not exists public.love_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text references public.love_campaigns(slug) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.love_sessions add column if not exists campaign_slug text;
alter table public.love_sessions add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.love_sessions add column if not exists summary jsonb not null default '{}'::jsonb;
alter table public.love_sessions add column if not exists started_at timestamptz not null default now();
alter table public.love_sessions add column if not exists completed_at timestamptz;

-- Events
create table if not exists public.love_session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.love_sessions(id) on delete cascade,
  event_type text not null,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.love_session_events add column if not exists session_id uuid;
alter table public.love_session_events add column if not exists event_type text;
alter table public.love_session_events add column if not exists step text;
alter table public.love_session_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.love_session_events add column if not exists created_at timestamptz not null default now();

create index if not exists love_sessions_campaign_slug_idx on public.love_sessions(campaign_slug);
create index if not exists love_session_events_session_id_idx on public.love_session_events(session_id);
create index if not exists love_campaigns_owner_chat_id_idx on public.love_campaigns(owner_chat_id);

alter table public.love_campaigns enable row level security;
alter table public.love_sessions enable row level security;
alter table public.love_session_events enable row level security;

drop policy if exists love_campaigns_open on public.love_campaigns;
create policy love_campaigns_open on public.love_campaigns
for all
using (true)
with check (true);

drop policy if exists love_sessions_open on public.love_sessions;
create policy love_sessions_open on public.love_sessions
for all
using (true)
with check (true);

drop policy if exists love_session_events_open on public.love_session_events;
create policy love_session_events_open on public.love_session_events
for all
using (true)
with check (true);
