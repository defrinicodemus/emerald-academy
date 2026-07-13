alter table public.announcements
  add column if not exists category text not null default 'Umum';
