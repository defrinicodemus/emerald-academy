-- ── curriculum_plans (CP per kelas+mapel) ───────────────────────────────
create table public.curriculum_plans (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  cp_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id)
);
create index curriculum_plans_class_id_idx on public.curriculum_plans(class_id);
create index curriculum_plans_subject_id_idx on public.curriculum_plans(subject_id);

create trigger curriculum_plans_set_updated_at
  before update on public.curriculum_plans
  for each row execute function public.set_updated_at();

-- ── learning_objectives (TP, berurutan, menyusun ATP) ───────────────────
create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  curriculum_plan_id uuid not null references public.curriculum_plans(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index learning_objectives_plan_id_idx on public.learning_objectives(curriculum_plan_id);

alter table public.curriculum_plans enable row level security;
alter table public.learning_objectives enable row level security;

create policy curriculum_plans_select on public.curriculum_plans for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id) or class_id = public.current_class_id()
  );
create policy curriculum_plans_insert on public.curriculum_plans for insert
  with check (public.is_admin() or public.teaches_class(class_id));
create policy curriculum_plans_update on public.curriculum_plans for update
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or public.teaches_class(class_id));
create policy curriculum_plans_delete on public.curriculum_plans for delete
  using (public.is_admin() or public.teaches_class(class_id));

create policy learning_objectives_select on public.learning_objectives for select
  using (
    exists (
      select 1 from public.curriculum_plans cp
      where cp.id = curriculum_plan_id
        and (
          public.is_admin() or public.is_principal()
          or public.teaches_class(cp.class_id) or cp.class_id = public.current_class_id()
        )
    )
  );
create policy learning_objectives_insert on public.learning_objectives for insert
  with check (
    exists (
      select 1 from public.curriculum_plans cp
      where cp.id = curriculum_plan_id
        and (public.is_admin() or public.teaches_class(cp.class_id))
    )
  );
create policy learning_objectives_update on public.learning_objectives for update
  using (
    exists (
      select 1 from public.curriculum_plans cp
      where cp.id = curriculum_plan_id
        and (public.is_admin() or public.teaches_class(cp.class_id))
    )
  )
  with check (
    exists (
      select 1 from public.curriculum_plans cp
      where cp.id = curriculum_plan_id
        and (public.is_admin() or public.teaches_class(cp.class_id))
    )
  );
create policy learning_objectives_delete on public.learning_objectives for delete
  using (
    exists (
      select 1 from public.curriculum_plans cp
      where cp.id = curriculum_plan_id
        and (public.is_admin() or public.teaches_class(cp.class_id))
    )
  );
