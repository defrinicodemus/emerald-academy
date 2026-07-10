import { createClient } from "@/lib/supabase/server";

export type { TeacherClassSubject } from "@/lib/data/teaching";
export { getTeacherClassSubjects } from "@/lib/data/teaching";

export interface LearningObjectiveRow {
  id: string;
  title: string;
  sortOrder: number;
}

export interface CurriculumPlanData {
  cpText: string;
  objectives: LearningObjectiveRow[];
}

export async function getCurriculumPlan(
  classId: string,
  subjectId: string,
): Promise<CurriculumPlanData> {
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("curriculum_plans")
    .select("id, cp_text")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .maybeSingle();

  if (!plan) return { cpText: "", objectives: [] };

  const { data: objectives } = await supabase
    .from("learning_objectives")
    .select("id, title, sort_order")
    .eq("curriculum_plan_id", plan.id)
    .order("sort_order");

  return {
    cpText: plan.cp_text ?? "",
    objectives: (objectives ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      sortOrder: o.sort_order,
    })),
  };
}
