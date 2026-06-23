-- ============================================================
-- Cinegma Studio - Authorship + role-scoped visibility
-- Run this in the Supabase SQL Editor (after supabase-setup.sql
-- and supabase-admins.sql).
--
-- Adds an author (and the author's role at creation time) to every
-- article and media asset so the dashboard can scope who sees whose
-- work, and so the public blog can show a byline.
--
-- Visibility model enforced by the serverless API:
--   owner  -> sees everything
--   admin  -> sees all admin/user content, but NOT the owner's
--   user   -> sees only their own work
-- Rows created before this migration have a null author_role and are
-- treated as owner-owned (visible to the owner only inside the dashboard).
-- ============================================================

-- Articles: who wrote it + what role they had at the time.
alter table public.articles add column if not exists author      text;
alter table public.articles add column if not exists author_role text;

-- Media: same attribution so the library can be scoped too.
alter table public.media add column if not exists author      text;
alter table public.media add column if not exists author_role text;

-- Helpful indexes for the scoped dashboard queries.
create index if not exists idx_articles_author      on public.articles (author);
create index if not exists idx_articles_author_role on public.articles (author_role);
create index if not exists idx_media_author          on public.media (author);
create index if not exists idx_media_author_role     on public.media (author_role);

-- The 'admins' table now also stores plain 'user' accounts. No schema
-- change is required (role is free text), but for clarity the roles in
-- use are: 'owner', 'admin', 'user'.
