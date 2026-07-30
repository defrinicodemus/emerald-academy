-- "Tugas & Proyek" tab redesign: multi-select submission methods.

alter table public.assignments
  add column if not exists allowed_methods text[] not null default '{}';
