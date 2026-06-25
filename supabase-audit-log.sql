-- ============================================================
-- Cinegma Films CMS - Audit Log Table
-- Paste this into the Supabase SQL Editor and run.
-- ============================================================

create table if not exists public.audit_log (
  id          uuid        primary key default gen_random_uuid(),
  action      text        not null,
  category    text        not null,
  username    text        not null,
  role        text,
  details     jsonb,
  ip_address  text,
  user_agent  text,
  browser     text,
  os          text,
  device      text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_log_created
  on public.audit_log (created_at desc);

create index if not exists idx_audit_log_username
  on public.audit_log (username, created_at desc);

create index if not exists idx_audit_log_category
  on public.audit_log (category, created_at desc);

alter table public.audit_log enable row level security;

create policy "Service role full access on audit_log"
  on public.audit_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
