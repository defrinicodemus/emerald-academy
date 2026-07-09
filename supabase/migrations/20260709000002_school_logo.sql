-- Logo URL for the school, shown on the public login page and Settings.
alter table public.schools
  add column logo_url text;
