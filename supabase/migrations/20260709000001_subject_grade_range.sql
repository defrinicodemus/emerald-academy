-- Restrict which grade levels a subject applies to (e.g. IPAS and Bahasa
-- Inggris only start at grade 3 under Kurikulum Merdeka for SD). Null means
-- "applies to all grades" — most subjects (Matematika, Bahasa Indonesia, ...)
-- stay unrestricted.

alter table public.subjects
  add column min_grade int,
  add column max_grade int;

alter table public.subjects
  add constraint subjects_grade_range_check
  check (
    (min_grade is null or min_grade between 1 and 6)
    and (max_grade is null or max_grade between 1 and 6)
    and (min_grade is null or max_grade is null or min_grade <= max_grade)
  );
