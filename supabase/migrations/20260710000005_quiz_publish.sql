alter table public.assignments
  add column is_published boolean not null default true;

-- Siswa hanya boleh melihat kuis yang sudah diunggah guru; tugas/materi jenis lain tidak terpengaruh.
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or (class_id = public.current_class_id() and (kind <> 'quiz' or is_published))
  );
