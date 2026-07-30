-- Emerald Academy LMS — core schema
-- Mirrors the entities currently mocked in src/lib/mock-data.ts and src/lib/auth.tsx

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.user_role as enum ('student', 'teacher', 'principal', 'admin');
create type public.semester_type as enum ('ganjil', 'genap');
create type public.material_kind as enum ('pdf', 'video', 'text', 'image');
create type public.assignment_kind as enum ('quiz', 'essay', 'photo', 'audio', 'text');
create type public.submission_status as enum ('belum', 'dikerjakan', 'submitted', 'graded');

-- ── Helper: updated_at trigger ──────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── schools ──────────────────────────────────────────────────────────────
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- ── academic_years ───────────────────────────────────────────────────────
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  year_label text not null,
  semester public.semester_type not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, year_label, semester)
);
create index academic_years_school_id_idx on public.academic_years(school_id);

-- ── subjects ─────────────────────────────────────────────────────────────
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text not null,
  name text not null,
  emoji text,
  color text,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);
create index subjects_school_id_idx on public.subjects(school_id);

-- ── classes (homeroom_teacher_id FK added after profiles exists) ────────
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  grade_level int not null,
  homeroom_teacher_id uuid,
  created_at timestamptz not null default now(),
  unique (school_id, academic_year_id, name)
);
create index classes_school_id_idx on public.classes(school_id);
create index classes_academic_year_id_idx on public.classes(academic_year_id);

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  role public.user_role not null default 'student',
  full_name text not null,
  username text unique,
  avatar_emoji text,
  nisn text unique,
  nip text unique,
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create index profiles_class_id_idx on public.profiles(class_id);
create index profiles_school_id_idx on public.profiles(school_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.classes
  add constraint classes_homeroom_teacher_fk
  foreign key (homeroom_teacher_id) references public.profiles(id) on delete set null;
create index classes_homeroom_teacher_id_idx on public.classes(homeroom_teacher_id);

-- ── class_teacher_subjects (who teaches what, where) ────────────────────
create table public.class_teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, subject_id)
);
create index cts_class_id_idx on public.class_teacher_subjects(class_id);
create index cts_teacher_id_idx on public.class_teacher_subjects(teacher_id);
create index cts_subject_id_idx on public.class_teacher_subjects(subject_id);

-- ── announcements ────────────────────────────────────────────────────────
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  target_role public.user_role,
  target_class_id uuid references public.classes(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index announcements_school_id_idx on public.announcements(school_id);
create index announcements_target_class_id_idx on public.announcements(target_class_id);

-- ── materials ────────────────────────────────────────────────────────────
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  title text not null,
  kind public.material_kind not null,
  url text,
  created_at timestamptz not null default now()
);
create index materials_class_id_idx on public.materials(class_id);
create index materials_subject_id_idx on public.materials(subject_id);
create index materials_teacher_id_idx on public.materials(teacher_id);

-- ── assignments ──────────────────────────────────────────────────────────
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  title text not null,
  kind public.assignment_kind not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index assignments_class_id_idx on public.assignments(class_id);
create index assignments_subject_id_idx on public.assignments(subject_id);

-- ── submissions ──────────────────────────────────────────────────────────
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content_url text,
  status public.submission_status not null default 'belum',
  score numeric(5,2),
  teacher_comment text,
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index submissions_assignment_id_idx on public.submissions(assignment_id);
create index submissions_student_id_idx on public.submissions(student_id);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- ── grades (per-subject, per-period report cards) ───────────────────────
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  period_month date not null,
  score numeric(5,2) not null,
  teacher_comment text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index grades_student_id_idx on public.grades(student_id);
create index grades_class_id_idx on public.grades(class_id);
create index grades_subject_id_idx on public.grades(subject_id);
