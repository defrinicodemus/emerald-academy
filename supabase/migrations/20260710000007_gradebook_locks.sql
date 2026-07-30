create table public.gradebook_locks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  period_month date not null default current_date,
  locked_at timestamptz not null default now(),
  locked_by uuid references public.profiles(id) on delete set null,
  unique (class_id, subject_id)
);
create index gradebook_locks_class_id_idx on public.gradebook_locks(class_id);
create index gradebook_locks_subject_id_idx on public.gradebook_locks(subject_id);

alter table public.gradebook_locks enable row level security;

create policy gradebook_locks_select on public.gradebook_locks for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id) or class_id = public.current_class_id()
  );
create policy gradebook_locks_insert on public.gradebook_locks for insert
  with check (public.is_admin() or public.teaches_class(class_id));
create policy gradebook_locks_delete on public.gradebook_locks for delete
  using (public.is_admin() or public.teaches_class(class_id));
