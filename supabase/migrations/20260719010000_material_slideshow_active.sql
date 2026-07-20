-- Add "slideshow" as a material kind (Google Slides embed).
alter type public.material_kind add value if not exists 'slideshow';

-- Let teachers hide a material from students without deleting it
-- (same "draft/published" shape already used by assignments.is_published).
alter table public.materials
  add column if not exists is_active boolean not null default true;

-- Students only see active materials; teachers/admin/principal see everything
-- (so a teacher can still find and re-activate a hidden material).
drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials for select
  using (
    public.is_admin() or public.is_principal()
    or public.teaches_class(class_id)
    or (class_id = public.current_class_id() and is_active)
  );
