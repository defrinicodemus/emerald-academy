-- "Tugas & Proyek" tab redesign: multi-select submission methods, max photo
-- upload size, and teacher-supplied downloadable attachments.

alter table public.assignments
  add column if not exists allowed_methods text[] not null default '{}',
  add column if not exists max_photo_size_mb integer;

create table if not exists public.assignment_attachments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null,
  url text not null,
  kind text not null check (kind in ('pdf', 'image')),
  created_at timestamptz not null default now()
);
create index if not exists assignment_attachments_assignment_id_idx
  on public.assignment_attachments(assignment_id);

alter table public.assignment_attachments enable row level security;

drop policy if exists assignment_attachments_select on public.assignment_attachments;
create policy assignment_attachments_select on public.assignment_attachments for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id)
          or (a.class_id = public.current_class_id() and a.is_published)
        )
    )
  );

drop policy if exists assignment_attachments_insert on public.assignment_attachments;
create policy assignment_attachments_insert on public.assignment_attachments for insert
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );

drop policy if exists assignment_attachments_delete on public.assignment_attachments;
create policy assignment_attachments_delete on public.assignment_attachments for delete
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );

-- Draft/publish ("Simpan Draft" / "Publikasikan Tugas") should gate every
-- assignment kind the same way, not just quizzes. Existing rows already
-- default is_published=true, so nothing currently visible disappears.
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or (class_id = public.current_class_id() and is_published)
  );
