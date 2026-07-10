create type public.question_type as enum ('multiple_choice', 'short_answer');

-- ── quiz_questions (bank soal per tugas berjenis kuis) ──────────────────
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null,
  correct_answer_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index quiz_questions_assignment_id_idx on public.quiz_questions(assignment_id);

-- ── quiz_options (pilihan jawaban, khusus soal pilihan ganda) ───────────
create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index quiz_options_question_id_idx on public.quiz_options(question_id);

alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;

create policy quiz_questions_select on public.quiz_questions for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id) or a.class_id = public.current_class_id()
        )
    )
  );
create policy quiz_questions_insert on public.quiz_questions for insert
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_questions_update on public.quiz_questions for update
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  )
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_questions_delete on public.quiz_questions for delete
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );

create policy quiz_options_select on public.quiz_options for select
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(a.class_id) or a.class_id = public.current_class_id()
        )
    )
  );
create policy quiz_options_insert on public.quiz_options for insert
  with check (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
create policy quiz_options_update on public.quiz_options for update
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
create policy quiz_options_delete on public.quiz_options for delete
  using (
    exists (
      select 1 from public.quiz_questions q
      join public.assignments a on a.id = q.assignment_id
      where q.id = question_id and (public.is_admin() or public.teaches_class(a.class_id))
    )
  );
