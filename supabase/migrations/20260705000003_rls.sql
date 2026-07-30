-- Row Level Security for every table.
-- Roles: admin (full access), principal (read-only everywhere), teacher (read/write
-- scoped to classes they teach via class_teacher_subjects), student (own data only).

alter table public.schools enable row level security;
alter table public.academic_years enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.class_teacher_subjects enable row level security;
alter table public.announcements enable row level security;
alter table public.materials enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;

-- ── schools ──────────────────────────────────────────────────────────────
create policy schools_select on public.schools for select using (true);
create policy schools_admin_write on public.schools for all
  using (public.is_admin()) with check (public.is_admin());

-- ── academic_years ───────────────────────────────────────────────────────
create policy academic_years_select on public.academic_years for select using (true);
create policy academic_years_admin_write on public.academic_years for all
  using (public.is_admin()) with check (public.is_admin());

-- ── subjects ─────────────────────────────────────────────────────────────
create policy subjects_select on public.subjects for select using (true);
create policy subjects_admin_write on public.subjects for all
  using (public.is_admin()) with check (public.is_admin());

-- ── classes ──────────────────────────────────────────────────────────────
create policy classes_select on public.classes for select using (true);
create policy classes_admin_write on public.classes for all
  using (public.is_admin()) with check (public.is_admin());

-- ── profiles ─────────────────────────────────────────────────────────────
create policy profiles_select_self on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_principal()
    or (public.is_teacher() and public.teaches_class(class_id))
  );
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_insert on public.profiles for insert
  with check (public.is_admin());
create policy profiles_admin_delete on public.profiles for delete
  using (public.is_admin());

-- ── class_teacher_subjects ───────────────────────────────────────────────
create policy cts_select on public.class_teacher_subjects for select using (true);
create policy cts_admin_write on public.class_teacher_subjects for all
  using (public.is_admin()) with check (public.is_admin());

-- ── announcements ────────────────────────────────────────────────────────
create policy announcements_select on public.announcements for select
  using (
    public.is_admin() or public.is_principal()
    or (target_role is null or target_role = public.current_role())
       and (target_class_id is null or target_class_id = public.current_class_id())
  );
create policy announcements_write on public.announcements for insert
  with check (
    public.is_admin()
    or (public.is_teacher() and (target_class_id is null or public.teaches_class(target_class_id)))
  );
create policy announcements_modify on public.announcements for update
  using (public.is_admin() or author_id = auth.uid())
  with check (public.is_admin() or author_id = auth.uid());
create policy announcements_delete on public.announcements for delete
  using (public.is_admin() or author_id = auth.uid());

-- ── materials ────────────────────────────────────────────────────────────
create policy materials_select on public.materials for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or class_id = public.current_class_id()
  );
create policy materials_write on public.materials for insert
  with check (public.is_admin() or public.teaches_class(class_id));
create policy materials_modify on public.materials for update
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or public.teaches_class(class_id));
create policy materials_delete on public.materials for delete
  using (public.is_admin() or public.teaches_class(class_id));

-- ── assignments ──────────────────────────────────────────────────────────
create policy assignments_select on public.assignments for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or class_id = public.current_class_id()
  );
create policy assignments_write on public.assignments for insert
  with check (public.is_admin() or public.teaches_class(class_id));
create policy assignments_modify on public.assignments for update
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or public.teaches_class(class_id));
create policy assignments_delete on public.assignments for delete
  using (public.is_admin() or public.teaches_class(class_id));

-- ── submissions ──────────────────────────────────────────────────────────
create policy submissions_select on public.submissions for select
  using (
    public.is_admin() or public.is_principal()
    or student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  );
create policy submissions_insert on public.submissions for insert
  with check (student_id = auth.uid() or public.is_admin());
create policy submissions_update on public.submissions for update
  using (
    public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  )
  with check (
    public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  );
create policy submissions_delete on public.submissions for delete using (public.is_admin());

-- ── grades ───────────────────────────────────────────────────────────────
create policy grades_select on public.grades for select
  using (
    public.is_admin() or public.is_principal()
    or student_id = auth.uid()
    or public.teaches_class(class_id)
  );
create policy grades_write on public.grades for insert
  with check (public.is_admin() or public.teaches_class(class_id));
create policy grades_modify on public.grades for update
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or public.teaches_class(class_id));
create policy grades_delete on public.grades for delete
  using (public.is_admin() or public.teaches_class(class_id));
