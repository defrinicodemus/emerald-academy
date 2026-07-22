-- Persist each student's per-question quiz answer + points earned, so
-- teachers can review "jawaban siswa vs jawaban benar" per question on the
-- Ruang Periksa > Hasil Kuis review modal. Previously submitQuizAnswers
-- computed the aggregate score in-memory and discarded the raw answers.
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option_id uuid references public.quiz_options(id) on delete set null,
  true_false_answer text,
  drag_drop_answer jsonb,
  sequence_answer jsonb,
  points_earned numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index if not exists quiz_answers_submission_id_idx on public.quiz_answers(submission_id);
create index if not exists quiz_answers_question_id_idx on public.quiz_answers(question_id);

alter table public.quiz_answers enable row level security;

create policy quiz_answers_select on public.quiz_answers for select
  using (
    public.is_admin() or public.is_principal()
    or exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
    or exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and public.teaches_class(a.class_id)
    )
  );

create policy quiz_answers_insert on public.quiz_answers for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );
