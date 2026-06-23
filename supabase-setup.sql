-- ============================================================
-- Cinegma Films CMS - Supabase Setup
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- 1. Tables
-- ------------------------------------------------------------

create table if not exists public.articles (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        unique not null,
  body            text,
  cover_image_url text,
  category        text,
  published       boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.media (
  id          uuid        primary key default gen_random_uuid(),
  url         text        not null,
  name        text,
  type        text,
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);

-- 2. Indexes
-- ------------------------------------------------------------

create index if not exists idx_articles_published_created
  on public.articles (published, created_at desc);

create index if not exists idx_articles_slug
  on public.articles (slug);

-- 3. Updated_at trigger for articles
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_articles_updated_at
  before update on public.articles
  for each row
  execute function public.set_updated_at();

-- 4. Row Level Security
-- ------------------------------------------------------------

alter table public.articles enable row level security;
alter table public.media    enable row level security;

-- Articles: anon can read published rows
create policy "Public can read published articles"
  on public.articles for select
  using (published = true);

-- Articles: service_role has full access
create policy "Service role full access on articles"
  on public.articles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Media: anon can read all rows
create policy "Public can read media"
  on public.media for select
  using (true);

-- Media: service_role has full access
create policy "Service role full access on media"
  on public.media for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 5. Storage bucket
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Allow public reads from the media bucket
create policy "Public read access on media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

-- Allow service_role to manage objects in the media bucket
create policy "Service role manage media bucket"
  on storage.objects for all
  using (bucket_id = 'media' and auth.role() = 'service_role')
  with check (bucket_id = 'media' and auth.role() = 'service_role');
