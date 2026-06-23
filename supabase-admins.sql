-- ============================================================
-- Cinegma Studio - Admins + media captions
-- Run this in the Supabase SQL Editor (after supabase-setup.sql).
-- ============================================================

-- Caption column for media
alter table public.media add column if not exists caption text;

-- Admin accounts (managed by the owner from the dashboard)
create table if not exists public.admins (
  id            uuid        primary key default gen_random_uuid(),
  username      text        unique not null,
  password_hash text        not null,
  role          text        not null default 'admin',
  created_at    timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Only the service_role (our serverless functions) may touch this table.
-- No anon policy = password hashes are never exposed to the public key.
create policy "Service role full access on admins"
  on public.admins for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
