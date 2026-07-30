alter table public.assignments
  add column is_published boolean not null default true;

-- Draft/publish ("Simpan Draft" / "Publikasikan Tugas") gates every
-- assignment kind the same way, not just quizzes. Existing rows already
-- default is_published=true, so nothing currently visible disappears.
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or (class_id = public.current_class_id() and is_published)
  );
