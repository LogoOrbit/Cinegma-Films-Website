-- ============================================================
-- Cinegma Films - Contact Messages Table
-- Paste this into the Supabase SQL Editor and run.
-- ============================================================

create table if not exists public.contact_messages (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  inquiry     text,
  message     text        not null,
  ip_address  text,
  user_agent  text,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_contact_messages_created
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "Service role full access on contact_messages"
  on public.contact_messages for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
