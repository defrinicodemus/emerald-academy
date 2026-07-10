alter table public.assignments
  add column learning_objective_id uuid references public.learning_objectives(id) on delete set null;

create index assignments_learning_objective_id_idx on public.assignments(learning_objective_id);
