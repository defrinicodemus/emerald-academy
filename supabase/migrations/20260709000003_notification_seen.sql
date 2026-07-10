alter table public.profiles
  add column last_seen_announcements_at timestamptz not null default now();
