-- ============================================================
-- Cinegma Studio - User profiles ("My Profile")
-- Run this in the Supabase SQL Editor (after supabase-admins.sql).
--
-- Holds basic profile info for EVERY member (owner, admin, user).
-- Keyed by username so it works for the env-based owner account too,
-- independently of the `admins` table.
-- ============================================================

create table if not exists public.profiles (
  username    text        primary key,
  full_name   text,
  email       text,
  phone       text,
  location    text,
  title       text,
  bio         text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Only the service_role (our serverless functions) may touch this table.
-- Profiles are read/written through /api/auth, which enforces that a user
-- can only see and edit their own profile.
create policy "Service role full access on profiles"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
