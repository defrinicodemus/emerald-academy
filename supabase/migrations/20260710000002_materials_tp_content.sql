alter table public.materials
  add column content text,
  add column learning_objective_id uuid references public.learning_objectives(id) on delete set null;

create index materials_learning_objective_id_idx on public.materials(learning_objective_id);
