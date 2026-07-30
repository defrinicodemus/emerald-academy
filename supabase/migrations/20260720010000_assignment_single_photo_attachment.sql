-- Simplify "Tugas & Proyek" attachments: teachers may attach at most one
-- supporting image (no PDFs, no multi-file table, no per-assignment size
-- column — the photo submission size limit is a fixed app constant).

alter table public.assignments
  add column if not exists attachment_image_url text,
  add column if not exists attachment_image_name text;
