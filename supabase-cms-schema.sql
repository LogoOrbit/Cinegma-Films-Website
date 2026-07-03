-- ============================================================
-- Cinegma Films CMS - Complete Database Schema
-- Run this in Supabase SQL Editor after existing setup
-- ============================================================

-- ============================================================
-- 1. FILMS & VERSIONS
-- ============================================================

create table if not exists public.films (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        unique not null,
  description     text,
  plot            text,
  genre           text[],
  runtime         integer,
  release_date    date,
  status          text        not null default 'draft',
  featured        boolean     not null default false,
  visibility      text        not null default 'public',
  password_hash   text,
  scheduled_publish_at   timestamptz,
  scheduled_unpublish_at timestamptz,
  director_id     uuid references public.team_members(id) on delete set null,
  creator_id      uuid references public.admins(id) on delete restrict,
  published_version_id uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);

create table if not exists public.film_versions (
  id              uuid        primary key default gen_random_uuid(),
  film_id         uuid        not null references public.films(id) on delete cascade,
  version_type    text        not null,
  title           text,
  description     text,
  thumbnail_url   text,
  poster_url      text,
  trailer_video_id uuid       references public.media(id) on delete set null,
  main_video_id   uuid        references public.media(id) on delete set null,
  duration        integer,
  is_primary      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.film_credits (
  id              uuid        primary key default gen_random_uuid(),
  film_id         uuid        not null references public.films(id) on delete cascade,
  team_member_id  uuid        not null references public.team_members(id) on delete cascade,
  role            text        not null,
  character_name  text,
  "order"         integer,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 2. TEAM MEMBERS
-- ============================================================

create table if not exists public.team_members (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  slug            text        unique not null,
  position        text,
  bio             text,
  photo_url       text,
  social_links    jsonb,
  skills          text[],
  experience      text,
  featured        boolean     not null default false,
  display_order   integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 3. SERVICES
-- ============================================================

create table if not exists public.services (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        unique not null,
  description     text,
  icon_url        text,
  image_url       text,
  pricing         numeric,
  categories      text[],
  display_order   integer,
  featured        boolean     not null default false,
  visible         boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.service_projects (
  id              uuid        primary key default gen_random_uuid(),
  service_id      uuid        not null references public.services(id) on delete cascade,
  film_id         uuid        references public.films(id) on delete set null,
  "order"         integer,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 4. MEDIA & USAGE
-- ============================================================

create table if not exists public.media_usage (
  id              uuid        primary key default gen_random_uuid(),
  media_id        uuid        not null references public.media(id) on delete cascade,
  entity_type     text        not null,
  entity_id       uuid        not null,
  context         text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 5. GALLERY & PORTFOLIO
-- ============================================================

create table if not exists public.gallery_items (
  id              uuid        primary key default gen_random_uuid(),
  title           text,
  description     text,
  media_id        uuid        not null references public.media(id) on delete cascade,
  category        text,
  featured        boolean     not null default false,
  display_order   integer,
  related_film_id uuid        references public.films(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 6. AWARDS & TESTIMONIALS
-- ============================================================

create table if not exists public.awards (
  id              uuid        primary key default gen_random_uuid(),
  film_id         uuid        not null references public.films(id) on delete cascade,
  award_name      text        not null,
  festival_name   text        not null,
  award_category  text,
  year            integer,
  award_date      date,
  award_type      text        not null,
  details         text,
  url             text,
  created_at      timestamptz not null default now()
);

create table if not exists public.testimonials (
  id              uuid        primary key default gen_random_uuid(),
  author_name     text        not null,
  author_role     text,
  text            text        not null,
  featured        boolean     not null default false,
  display_order   integer,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 7. PAGES & SEO
-- ============================================================

create table if not exists public.pages (
  id              uuid        primary key default gen_random_uuid(),
  page_slug       text        unique not null,
  seo_title       text,
  seo_description text,
  keywords        text[],
  og_image_url    text,
  og_type         text,
  canonical_url   text,
  include_in_sitemap boolean   not null default true,
  structured_data jsonb,
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 8. CONTACT MESSAGES
-- ============================================================

create table if not exists public.contact_messages (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  email           text        not null,
  phone           text,
  subject         text,
  message         text        not null,
  status          text        not null default 'new',
  replied_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 9. CONTENT VERSIONS (Approval Workflow)
-- ============================================================

create table if not exists public.content_versions (
  id              uuid        primary key default gen_random_uuid(),
  entity_type     text        not null,
  entity_id       uuid        not null,
  version_number  integer     not null,
  status          text        not null default 'draft',
  content         jsonb       not null,
  changed_by      uuid        not null references public.admins(id) on delete restrict,
  reviewed_by     uuid        references public.admins(id) on delete set null,
  review_notes    text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 10. INDEXES
-- ============================================================

create index if not exists idx_films_status_featured
  on public.films (status, featured, created_at desc);

create index if not exists idx_films_slug
  on public.films (slug);

create index if not exists idx_films_director
  on public.films (director_id);

create index if not exists idx_film_versions_film
  on public.film_versions (film_id);

create index if not exists idx_film_credits_film
  on public.film_credits (film_id);

create index if not exists idx_film_credits_member
  on public.film_credits (team_member_id);

create index if not exists idx_team_members_featured
  on public.team_members (featured, display_order);

create index if not exists idx_services_visible
  on public.services (visible, display_order);

create index if not exists idx_media_usage_entity
  on public.media_usage (entity_type, entity_id);

create index if not exists idx_gallery_items_category
  on public.gallery_items (category, display_order);

create index if not exists idx_awards_film
  on public.awards (film_id, year desc);

create index if not exists idx_testimonials_featured
  on public.testimonials (featured, display_order);

create index if not exists idx_contact_messages_status
  on public.contact_messages (status, created_at desc);

create index if not exists idx_content_versions_entity
  on public.content_versions (entity_type, entity_id, version_number desc);

-- ============================================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_films_updated_at before update on public.films for each row execute function public.set_updated_at();
create trigger trg_film_versions_updated_at before update on public.film_versions for each row execute function public.set_updated_at();
create trigger trg_team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();
create trigger trg_services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger trg_gallery_items_updated_at before update on public.gallery_items for each row execute function public.set_updated_at();

-- ============================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================

alter table public.films enable row level security;
alter table public.film_versions enable row level security;
alter table public.film_credits enable row level security;
alter table public.team_members enable row level security;
alter table public.services enable row level security;
alter table public.service_projects enable row level security;
alter table public.media_usage enable row level security;
alter table public.gallery_items enable row level security;
alter table public.awards enable row level security;
alter table public.testimonials enable row level security;
alter table public.pages enable row level security;
alter table public.contact_messages enable row level security;
alter table public.content_versions enable row level security;

-- Public read for published content
create policy "Public can read published films"
  on public.films for select using (status = 'published' or visibility = 'public');

create policy "Public can read team members"
  on public.team_members for select using (true);

create policy "Public can read services"
  on public.services for select using (visible = true);

create policy "Public can read gallery items"
  on public.gallery_items for select using (true);

create policy "Public can read awards"
  on public.awards for select using (true);

create policy "Public can read testimonials"
  on public.testimonials for select using (true);

create policy "Public can read pages"
  on public.pages for select using (true);

-- Service role full access
create policy "Service role full access"
  on public.films for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on film_versions"
  on public.film_versions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on film_credits"
  on public.film_credits for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on team_members"
  on public.team_members for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on services"
  on public.services for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on service_projects"
  on public.service_projects for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on media_usage"
  on public.media_usage for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on gallery_items"
  on public.gallery_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on awards"
  on public.awards for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on testimonials"
  on public.testimonials for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on pages"
  on public.pages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on contact_messages"
  on public.contact_messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role full access on content_versions"
  on public.content_versions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
