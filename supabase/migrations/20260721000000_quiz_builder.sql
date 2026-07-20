-- "Kuis & Ujian" full builder redesign: quiz type, timer estimate, due
-- date/time, KKM, manual activate/deactivate, per-question point weights
-- (budget of 100 per quiz), and two new question types (drag-and-drop
-- matching pairs, ordering sequence/steps).

-- ── Quiz-level fields on assignments ────────────────────────────────────
alter table public.assignments
  add column if not exists quiz_type text,
  add column if not exists timer_minutes integer,
  add column if not exists passing_grade integer,
  add column if not exists is_active boolean not null default true;

alter table public.assignments
  drop constraint if exists assignments_quiz_type_check;
alter table public.assignments
  add constraint assignments_quiz_type_check
    check (quiz_type is null or quiz_type in ('latihan', 'ulangan_harian', 'uts', 'uas'));

alter table public.assignments
  drop constraint if exists assignments_passing_grade_check;
alter table public.assignments
  add constraint assignments_passing_grade_check
    check (passing_grade is null or (passing_grade between 0 and 100));

alter table public.assignments
  drop constraint if exists assignments_timer_minutes_check;
alter table public.assignments
  add constraint assignments_timer_minutes_check
    check (timer_minutes is null or timer_minutes > 0);

-- ── quiz_questions: enum -> text+check (adds true_false/drag_and_drop/
-- sequence without the multi-step ALTER TYPE ADD VALUE dance), plus
-- points (bobot), is_active (soft-hide), explanation (optional) ─────────
alter table public.quiz_questions
  alter column question_type type text using question_type::text;
drop type if exists public.question_type;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_question_type_check;
alter table public.quiz_questions
  add constraint quiz_questions_question_type_check
    check (question_type in
      ('multiple_choice', 'true_false', 'drag_and_drop', 'sequence', 'short_answer'));

alter table public.quiz_questions
  add column if not exists points integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists explanation text;

alter table public.quiz_questions
  drop constraint if exists quiz_questions_points_check;
alter table public.quiz_questions
  add constraint quiz_questions_points_check check (points between 0 and 100);

-- ── quiz_pairs (drag-and-drop matching pairs) ───────────────────────────
create table if not exists public.quiz_pairs (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  drag_text text not null,
  target_text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_pairs_question_id_idx on public.quiz_pairs(question_id);

-- ── quiz_steps (ordering / sequence answers) ────────────────────────────
create table if not exists public.quiz_steps (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  step_text text not null,
  correct_order int not null,
  created_at timestamptz not null default now()
);
create index if not exists quiz_steps_question_id_idx on public.quiz_steps(question_id);

alter table public.quiz_pairs enable row level security;
alter table public.quiz_steps enable row level security;

-- ── Tighten quiz_questions/quiz_options select RLS: previously any
-- student in the class could select bank-soal rows for a still-DRAFT or
-- NONAKTIF quiz directly (only the parent assignments_select policy
-- gated visibility, not these tables). Now gate the student branch by
-- is_published and is_active, matching assignment_attachments_select.
drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id)
          or (a.class_id = public.current_class_id() and a.is_published and a.is_active)
        )
    )
  );

drop policy if exists quiz_options_select on public.quiz_options;
create policy quiz_options_select on public.quiz_options for select
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id)
          or (a.class_id = public.current_class_id() and a.is_published and a.is_active)
        )
    )
  );

create policy quiz_pairs_select on public.quiz_pairs for select
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id)
          or (a.class_id = public.current_class_id() and a.is_published and a.is_active)
        )
    )
  );
create policy quiz_pairs_insert on public.quiz_pairs for insert
  with check (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_pairs_update on public.quiz_pairs for update
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  )
  with check (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_pairs_delete on public.quiz_pairs for delete
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );

create policy quiz_steps_select on public.quiz_steps for select
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id)
          or (a.class_id = public.current_class_id() and a.is_published and a.is_active)
        )
    )
  );
create policy quiz_steps_insert on public.quiz_steps for insert
  with check (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_steps_update on public.quiz_steps for update
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  )
  with check (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_steps_delete on public.quiz_steps for delete
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
