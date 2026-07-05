import { createClient } from "@/lib/supabase/server";

export async function getSchool() {
  const supabase = await createClient();
  const { data } = await supabase.from("schools").select("id, name, tagline, address, phone").limit(1).single();
  return data;
}

export async function listClasses() {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("id, name, grade_level").order("grade_level");
  return data ?? [];
}

export async function listSubjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, code, name, emoji, color")
    .order("name");
  return data ?? [];
}

export async function listAcademicYears() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, year_label, semester, is_active")
    .order("year_label", { ascending: false });
  return data ?? [];
}
