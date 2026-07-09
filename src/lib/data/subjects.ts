import { createClient } from "@/lib/supabase/server";

export interface ContentRow {
  id: string;
  title: string;
  kind: string;
  due_at?: string | null;
}

export function appliesToGrade(
  gradeLevel: number | null,
  minGrade: number | null,
  maxGrade: number | null,
) {
  if (gradeLevel == null) return true;
  if (minGrade != null && gradeLevel < minGrade) return false;
  if (maxGrade != null && gradeLevel > maxGrade) return false;
  return true;
}

export async function getSubjectsExplorerData(classId: string | null) {
  const supabase = await createClient();
  const [{ data: subjects }, { data: klass }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, code, name, emoji, color, min_grade, max_grade")
      .order("name"),
    classId
      ? supabase.from("classes").select("grade_level").eq("id", classId).single()
      : Promise.resolve({ data: null }),
  ]);
  const gradeLevel = klass?.grade_level ?? null;
  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(gradeLevel, s.min_grade, s.max_grade),
  );

  const materialsBySubject: Record<string, ContentRow[]> = {};
  const assignmentsBySubject: Record<string, ContentRow[]> = {};

  if (classId) {
    const [{ data: materials }, { data: assignments }] = await Promise.all([
      supabase.from("materials").select("id, subject_id, title, kind").eq("class_id", classId),
      supabase
        .from("assignments")
        .select("id, subject_id, title, kind, due_at")
        .eq("class_id", classId),
    ]);
    for (const m of materials ?? []) {
      (materialsBySubject[m.subject_id] ??= []).push({ id: m.id, title: m.title, kind: m.kind });
    }
    for (const a of assignments ?? []) {
      (assignmentsBySubject[a.subject_id] ??= []).push({
        id: a.id,
        title: a.title,
        kind: a.kind,
        due_at: a.due_at,
      });
    }
  }

  return { subjects: visibleSubjects, materialsBySubject, assignmentsBySubject };
}
