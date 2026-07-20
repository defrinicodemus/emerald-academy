-- Simplify "Tugas & Proyek" attachments: teachers may attach at most one
-- supporting image (no PDFs, no multi-file table). Photo submission size
-- limit is now a fixed app constant instead of a per-assignment column.

drop table if exists public.assignment_attachments;

alter table public.assignments
  drop column if exists max_photo_size_mb,
  add column if not exists attachment_image_url text,
  add column if not exists attachment_image_name text;
