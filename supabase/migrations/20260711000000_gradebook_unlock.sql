alter table public.gradebook_locks
  add column if not exists period_month date not null default current_date;

drop policy if exists gradebook_locks_delete on public.gradebook_locks;
create policy gradebook_locks_delete on public.gradebook_locks for delete
  using (public.is_admin() or public.teaches_class(class_id));
