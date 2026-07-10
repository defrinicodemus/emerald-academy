import { createClient } from "@/lib/supabase/server";

export async function getAcademicStructure() {
  const supabase = await createClient();
  const [{ data: classes }, { data: subjects }, { data: years }] = await Promise.all([
    supabase.from("classes").select("id, name, grade_level, academic_year_id").order("grade_level"),
    supabase.from("subjects").select("id, code, name, emoji, min_grade, max_grade").order("name"),
    supabase
      .from("academic_years")
      .select("id, year_label, semester, is_active")
      .order("year_label", { ascending: false }),
  ]);
  return { classes: classes ?? [], subjects: subjects ?? [], years: years ?? [] };
}
