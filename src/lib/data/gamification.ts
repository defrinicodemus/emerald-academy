import { createClient } from "@/lib/supabase/server";

export async function getStudentGamification(studentId: string) {
  const supabase = await createClient();

  const [{ data: badgesCatalog }, { data: earned }, { data: rewards }, { data: starTotal }] =
    await Promise.all([
      supabase.from("badges").select("id, code, name, emoji").order("code"),
      supabase.from("student_badges").select("badge_id").eq("student_id", studentId),
      supabase
        .from("rewards")
        .select("id, name, emoji, cost")
        .eq("is_active", true)
        .order("cost"),
      supabase
        .from("student_star_totals")
        .select("total_stars")
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id));
  const badges = (badgesCatalog ?? []).map((b) => ({ ...b, earned: earnedIds.has(b.id) }));

  return {
    badges,
    rewards: rewards ?? [],
    stars: starTotal?.total_stars ?? 0,
  };
}
