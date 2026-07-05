# Supabase schema — Emerald Academy LMS

This folder contains the full database schema for the SD Inpres Nggodimeda LMS:
schools, academic years, classes, subjects, profiles (students/teachers/principal/admin),
materials, assignments, submissions, grades, gamification (badges/stars/rewards), and
row-level security for all four roles.

## Files

- `migrations/20260705000001_schema.sql` — tables, enums, indexes
- `migrations/20260705000002_functions.sql` — `handle_new_user` signup trigger, role
  helpers used by RLS, the `email_for_username` login lookup, and two reporting views
- `migrations/20260705000003_rls.sql` — row-level security policies for every table
- `seed.sql` — demo data matching the current mock UI (school, classes, subjects,
  10 demo accounts, announcements, materials, assignments, submissions, grades, badges,
  stars, rewards, and two pending reward requests)

## Applying this to a Supabase project

1. Create a project at supabase.com (or use an existing one).
2. `supabase login`
3. `supabase link --project-ref <your-project-ref>`
4. `supabase db push` — applies the 3 migrations
5. Run the seed manually once (it's not applied by `db push`):
   `psql "$(supabase db remote-url)" -f supabase/seed.sql`
   (or paste `seed.sql` into the SQL Editor in the Supabase dashboard)

### Local development (optional, requires Docker)
```
supabase start        # boots local Postgres + Auth + Studio
supabase db reset     # applies migrations AND seed.sql automatically
```

## Demo accounts (seeded by seed.sql)

Password is always `<username>123`.

| username | role | name |
|---|---|---|
| admin | admin | Admin Sekolah |
| kepsek | principal | Yohanes Bele |
| guru | teacher | Sari Wulandari (Matematika, Kelas 4A) |
| rahmat | teacher | Rahmat Hidayat (IPA, Kelas 4A) |
| linda | teacher | Linda Marbun (Bahasa Indonesia, Kelas 4A) |
| budi | student | Budi Santoso (Kelas 4A) |
| ani, citra, dimas, eka | student | Kelas 4A |

These are demo-only credentials — rotate or remove them before using this in production.

## Environment variables the Next.js app needs

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Find both under Project Settings → API in the Supabase dashboard.
