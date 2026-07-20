-- Remove the gamification subsystem (badges, stars, rewards) — dead feature,
-- never reachable from the UI. Confirmed via full codebase dependency audit:
-- no other table/view/query depends on these objects except each other.
-- Drop order respects dependencies: views before their source tables,
-- child tables (FK-holding) before parent tables.

drop view if exists public.class_leaderboard;
drop view if exists public.student_star_totals;

drop table if exists public.reward_redemptions;
drop table if exists public.stars_ledger;
drop table if exists public.student_badges;
drop table if exists public.rewards;
drop table if exists public.badges;

drop type if exists public.redemption_status;
