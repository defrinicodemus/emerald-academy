import { createClient } from "@/lib/supabase/server";

export interface RosterStudentRow {
  studentId: string;
  fullName: string;
  nisn: string | null;
  avatar: string | null;
  materialsViewed: number;
  materialsTotal: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  quizzesCompleted: number;
  quizzesTotal: number;
}

export async function getClassRoster(
  classId: string,
  subjectId: string,
): Promise<RosterStudentRow[]> {
  const supabase = await createClient();
  const [{ data: students }, { data: materials }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, nisn, avatar_emoji")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
    supabase.from("materials").select("id").eq("class_id", classId).eq("subject_id", subjectId),
    supabase
      .from("assignments")
      .select("id, kind, is_published")
      .eq("class_id", classId)
      .eq("subject_id", subjectId),
  ]);

  const materialIds = (materials ?? []).map((m) => m.id);
  const tugasIds = (assignments ?? []).filter((a) => a.kind !== "quiz").map((a) => a.id);
  const quizIds = (assignments ?? [])
    .filter((a) => a.kind === "quiz" && a.is_published)
    .map((a) => a.id);
  const allAssignmentIds = (assignments ?? []).map((a) => a.id);

  const [{ data: views }, { data: submissions }] = await Promise.all([
    materialIds.length > 0
      ? supabase
          .from("material_views")
          .select("student_id, material_id")
          .in("material_id", materialIds)
      : Promise.resolve({ data: [] as { student_id: string; material_id: string }[] }),
    allAssignmentIds.length > 0
      ? supabase
          .from("submissions")
          .select("student_id, assignment_id, status")
          .in("assignment_id", allAssignmentIds)
      : Promise.resolve({
          data: [] as { student_id: string; assignment_id: string; status: string }[],
        }),
  ]);

  const viewedByStudent = new Map<string, Set<string>>();
  for (const v of views ?? []) {
    const set = viewedByStudent.get(v.student_id) ?? new Set<string>();
    set.add(v.material_id);
    viewedByStudent.set(v.student_id, set);
  }

  const tugasIdSet = new Set(tugasIds);
  const quizIdSet = new Set(quizIds);
  const submittedByStudent = new Map<string, { tugas: Set<string>; quiz: Set<string> }>();
  for (const s of submissions ?? []) {
    if (s.status !== "submitted" && s.status !== "graded") continue;
    const entry = submittedByStudent.get(s.student_id) ?? { tugas: new Set(), quiz: new Set() };
    if (tugasIdSet.has(s.assignment_id)) entry.tugas.add(s.assignment_id);
    if (quizIdSet.has(s.assignment_id)) entry.quiz.add(s.assignment_id);
    submittedByStudent.set(s.student_id, entry);
  }

  return (students ?? []).map((st) => {
    const viewed = viewedByStudent.get(st.id)?.size ?? 0;
    const submitted = submittedByStudent.get(st.id);
    return {
      studentId: st.id,
      fullName: st.full_name,
      nisn: st.nisn,
      avatar: st.avatar_emoji,
      materialsViewed: viewed,
      materialsTotal: materialIds.length,
      assignmentsSubmitted: submitted?.tugas.size ?? 0,
      assignmentsTotal: tugasIds.length,
      quizzesCompleted: submitted?.quiz.size ?? 0,
      quizzesTotal: quizIds.length,
    };
  });
}
