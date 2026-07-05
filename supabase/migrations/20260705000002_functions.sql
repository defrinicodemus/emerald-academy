-- Helper functions, the auth.users → profiles trigger, and reporting views.

-- ── Role/context helpers (SECURITY DEFINER so RLS on profiles can't self-recurse) ──
create function public.current_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_class_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select class_id from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'admin';
$$;

create function public.is_principal()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'principal';
$$;

create function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'teacher';
$$;

create function public.is_student()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'student';
$$;

-- Whether the signed-in teacher teaches the given class (any subject).
create function public.teaches_class(p_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.class_teacher_subjects
    where class_id = p_class_id and teacher_id = auth.uid()
  );
$$;

-- ── Signup trigger: create the matching profiles row ────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, school_id, role, full_name, username, avatar_emoji, nisn, nip, class_id
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'student')::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_emoji',
    new.raw_user_meta_data->>'nisn',
    new.raw_user_meta_data->>'nip',
    nullif(new.raw_user_meta_data->>'class_id', '')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Login lookup: resolve a username to its email (called pre-auth) ────
create function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = p_username;
$$;

grant execute on function public.email_for_username(text) to anon, authenticated;

-- ── Reporting views ──────────────────────────────────────────────────────
create view public.student_star_totals
with (security_invoker = true) as
  select student_id, coalesce(sum(delta), 0)::int as total_stars
  from public.stars_ledger
  group by student_id;

create view public.class_leaderboard
with (security_invoker = true) as
  select
    p.id as student_id,
    p.full_name,
    p.class_id,
    coalesce(sum(sl.delta), 0)::int as total_stars
  from public.profiles p
  left join public.stars_ledger sl on sl.student_id = p.id
  where p.role = 'student'
  group by p.id, p.full_name, p.class_id;

grant select on public.student_star_totals to authenticated;
grant select on public.class_leaderboard to authenticated;
