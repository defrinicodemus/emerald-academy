do $$ begin
  create type public.attendance_status as enum ('hadir', 'sakit', 'izin', 'alfa');
exception
  when duplicate_object then null;
end $$;

-- ── class_meetings (Pertemuan 1..20 per kelas+mapel; juga jurnal mengajar) ──
create table if not exists public.class_meetings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  meeting_number int not null check (meeting_number between 1 and 20),
  meeting_date date not null default current_date,
  material_taught text,
  learning_objective_id uuid references public.learning_objectives(id) on delete set null,
  notes text,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id, meeting_number)
);
create index if not exists class_meetings_class_id_idx on public.class_meetings(class_id);
create index if not exists class_meetings_subject_id_idx on public.class_meetings(subject_id);

drop trigger if exists class_meetings_set_updated_at on public.class_meetings;
create trigger class_meetings_set_updated_at
  before update on public.class_meetings
  for each row execute function public.set_updated_at();

-- ── attendance_records (per siswa, per pertemuan) ───────────────────────
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.class_meetings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.attendance_status not null default 'hadir',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, student_id)
);
create index if not exists attendance_records_meeting_id_idx on public.attendance_records(meeting_id);
create index if not exists attendance_records_student_id_idx on public.attendance_records(student_id);

drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at
  before update on public.attendance_records
  for each row execute function public.set_updated_at();

alter table public.class_meetings enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists class_meetings_select on public.class_meetings;
create policy class_meetings_select on public.class_meetings for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id) or class_id = public.current_class_id()
  );
drop policy if exists class_meetings_insert on public.class_meetings;
create policy class_meetings_insert on public.class_meetings for insert
  with check (public.is_admin() or public.teaches_class(class_id));
drop policy if exists class_meetings_update on public.class_meetings;
create policy class_meetings_update on public.class_meetings for update
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or public.teaches_class(class_id));
drop policy if exists class_meetings_delete on public.class_meetings;
create policy class_meetings_delete on public.class_meetings for delete
  using (public.is_admin() or public.teaches_class(class_id));

drop policy if exists attendance_records_select on public.attendance_records;
create policy attendance_records_select on public.attendance_records for select
  using (
    public.is_admin() or public.is_principal()
    or student_id = auth.uid()
    or exists (
      select 1 from public.class_meetings m
      where m.id = meeting_id and public.teaches_class(m.class_id)
    )
  );
drop policy if exists attendance_records_insert on public.attendance_records;
create policy attendance_records_insert on public.attendance_records for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.class_meetings m
      where m.id = meeting_id and public.teaches_class(m.class_id)
    )
  );
drop policy if exists attendance_records_update on public.attendance_records;
create policy attendance_records_update on public.attendance_records for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.class_meetings m
      where m.id = meeting_id and public.teaches_class(m.class_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.class_meetings m
      where m.id = meeting_id and public.teaches_class(m.class_id)
    )
  );
drop policy if exists attendance_records_delete on public.attendance_records;
create policy attendance_records_delete on public.attendance_records for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.class_meetings m
      where m.id = meeting_id and public.teaches_class(m.class_id)
    )
  );
