-- ============================================================
-- Cinegma Films - Site Activity Tracking Table
-- Paste this into the Supabase SQL Editor and run.
-- ============================================================

create table if not exists public.site_activity (
  id          uuid        primary key default gen_random_uuid(),
  event       text        not null,
  page        text        not null,
  referrer    text,
  session_id  text,
  details     jsonb,
  ip_address  text,
  country     text,
  user_agent  text,
  browser     text,
  os          text,
  device      text,
  screen_w    int,
  screen_h    int,
  created_at  timestamptz not null default now()
);

create index if not exists idx_site_activity_created
  on public.site_activity (created_at desc);

create index if not exists idx_site_activity_event
  on public.site_activity (event, created_at desc);

create index if not exists idx_site_activity_page
  on public.site_activity (page, created_at desc);

create index if not exists idx_site_activity_session
  on public.site_activity (session_id, created_at desc);

alter table public.site_activity enable row level security;

create policy "Service role full access on site_activity"
  on public.site_activity for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
