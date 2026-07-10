create table public.material_views (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (material_id, student_id)
);
create index material_views_material_id_idx on public.material_views(material_id);
create index material_views_student_id_idx on public.material_views(student_id);

alter table public.material_views enable row level security;

create policy material_views_select on public.material_views for select
  using (
    public.is_admin() or public.is_principal()
    or student_id = auth.uid()
    or exists (
      select 1 from public.materials m
      where m.id = material_id and public.teaches_class(m.class_id)
    )
  );

create policy material_views_insert on public.material_views for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.materials m
      where m.id = material_id and m.class_id = public.current_class_id()
    )
  );
