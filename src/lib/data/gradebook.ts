import { createClient } from "@/lib/supabase/server";
import { appliesToGrade } from "@/lib/data/subjects";

export interface GradebookTpColumn {
  id: string;
  title: string;
  sortOrder: number;
}

export interface GradebookStudentRow {
  studentId: string;
  fullName: string;
  nisn: string | null;
  avatar: string | null;
  tpAverages: Record<string, number | null>;
  finalGrade: number | null;
}

export interface GradebookData {
  tpColumns: GradebookTpColumn[];
  students: GradebookStudentRow[];
  isLocked: boolean;
  lockedAt: string | null;
}

export async function getGradebookData(classId: string, subjectId: string): Promise<GradebookData> {
  const supabase = await createClient();

  const [{ data: plan }, { data: students }, { data: lock }] = await Promise.all([
    supabase
      .from("curriculum_plans")
      .select("id")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, nisn, avatar_emoji")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("gradebook_locks")
      .select("locked_at")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .maybeSingle(),
  ]);

  let tpColumns: GradebookTpColumn[] = [];
  if (plan) {
    const { data: objectives } = await supabase
      .from("learning_objectives")
      .select("id, title, sort_order")
      .eq("curriculum_plan_id", plan.id)
      .order("sort_order");
    tpColumns = (objectives ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      sortOrder: o.sort_order,
    }));
  }

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, learning_objective_id")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .not("learning_objective_id", "is", null);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const tpByAssignment = new Map((assignments ?? []).map((a) => [a.id, a.learning_objective_id]));

  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("student_id, assignment_id, score, status")
          .in("assignment_id", assignmentIds)
      : {
          data: [] as {
            student_id: string;
            assignment_id: string;
            score: number | null;
            status: string;
          }[],
        };

  const scoresByStudentTp = new Map<string, number[]>();
  for (const s of submissions ?? []) {
    if (s.status !== "graded" || s.score == null) continue;
    const tpId = tpByAssignment.get(s.assignment_id);
    if (!tpId) continue;
    const key = `${s.student_id}:${tpId}`;
    const arr = scoresByStudentTp.get(key) ?? [];
    arr.push(s.score);
    scoresByStudentTp.set(key, arr);
  }

  const finalGradesByStudent = new Map<string, number>();
  if (lock) {
    const { data: gradeRows } = await supabase
      .from("grades")
      .select("student_id, score, created_at")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    for (const g of gradeRows ?? []) {
      if (!finalGradesByStudent.has(g.student_id)) finalGradesByStudent.set(g.student_id, g.score);
    }
  }

  const studentRows: GradebookStudentRow[] = (students ?? []).map((st) => {
    const tpAverages: Record<string, number | null> = {};
    for (const tp of tpColumns) {
      const scores = scoresByStudentTp.get(`${st.id}:${tp.id}`);
      tpAverages[tp.id] =
        scores && scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;
    }
    return {
      studentId: st.id,
      fullName: st.full_name,
      nisn: st.nisn,
      avatar: st.avatar_emoji,
      tpAverages,
      finalGrade: finalGradesByStudent.get(st.id) ?? null,
    };
  });

  return {
    tpColumns,
    students: studentRows,
    isLocked: !!lock,
    lockedAt: lock?.locked_at ?? null,
  };
}

export interface HistoryMaterialRow {
  id: string;
  title: string;
  kind: string;
  viewed: boolean;
  viewedAt: string | null;
}

export interface HistoryAssignmentRow {
  id: string;
  title: string;
  submittedAt: string | null;
  score: number | null;
  teacherComment: string | null;
}

export interface StudentHistoryData {
  materials: HistoryMaterialRow[];
  tugas: HistoryAssignmentRow[];
  kuis: HistoryAssignmentRow[];
  materialsViewedPercent: number;
  averageTugas: number | null;
  averageKuis: number | null;
}

export async function getStudentHistory(
  studentId: string,
  classId: string,
  subjectId: string,
): Promise<StudentHistoryData> {
  const supabase = await createClient();

  const [{ data: materials }, { data: views }, { data: assignments }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, title, kind")
      .eq("class_id", classId)
      .eq("subject_id", subjectId),
    supabase.from("material_views").select("material_id, viewed_at").eq("student_id", studentId),
    supabase
      .from("assignments")
      .select("id, title, kind")
      .eq("class_id", classId)
      .eq("subject_id", subjectId),
  ]);

  const viewedByMaterial = new Map((views ?? []).map((v) => [v.material_id, v.viewed_at]));
  const materialRows: HistoryMaterialRow[] = (materials ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    kind: m.kind,
    viewed: viewedByMaterial.has(m.id),
    viewedAt: viewedByMaterial.get(m.id) ?? null,
  }));
  const materialsViewedPercent =
    materialRows.length > 0
      ? Math.round((materialRows.filter((m) => m.viewed).length / materialRows.length) * 100)
      : 0;

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, submitted_at, score, teacher_comment, status")
          .eq("student_id", studentId)
          .in("assignment_id", assignmentIds)
      : {
          data: [] as {
            assignment_id: string;
            submitted_at: string | null;
            score: number | null;
            teacher_comment: string | null;
            status: string;
          }[],
        };

  const submissionByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));

  const tugas: HistoryAssignmentRow[] = [];
  const kuis: HistoryAssignmentRow[] = [];
  for (const a of assignments ?? []) {
    const sub = submissionByAssignment.get(a.id);
    const row: HistoryAssignmentRow = {
      id: a.id,
      title: a.title,
      submittedAt: sub?.submitted_at ?? null,
      score: sub?.score ?? null,
      teacherComment: sub?.teacher_comment ?? null,
    };
    if (a.kind === "quiz") kuis.push(row);
    else tugas.push(row);
  }

  const tugasScores = tugas.map((t) => t.score).filter((s): s is number => s != null);
  const kuisScores = kuis.map((k) => k.score).filter((s): s is number => s != null);

  return {
    materials: materialRows,
    tugas,
    kuis,
    materialsViewedPercent,
    averageTugas:
      tugasScores.length > 0
        ? Math.round(tugasScores.reduce((a, b) => a + b, 0) / tugasScores.length)
        : null,
    averageKuis:
      kuisScores.length > 0
        ? Math.round(kuisScores.reduce((a, b) => a + b, 0) / kuisScores.length)
        : null,
  };
}

export interface StudentTpGrade {
  tpId: string;
  tpTitle: string;
  average: number;
}

export interface StudentSubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectEmoji: string | null;
  subjectColor: string | null;
  overallAverage: number | null;
  tpGrades: StudentTpGrade[];
}

export async function getStudentGrades(
  studentId: string,
  classId: string | null,
): Promise<StudentSubjectGrade[]> {
  if (!classId) return [];
  const supabase = await createClient();

  const [{ data: subjects }, { data: klass }] = await Promise.all([
    supabase.from("subjects").select("id, name, emoji, color, min_grade, max_grade").order("name"),
    supabase.from("classes").select("grade_level").eq("id", classId).single(),
  ]);
  const gradeLevel = klass?.grade_level ?? null;
  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(gradeLevel, s.min_grade, s.max_grade),
  );

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, subject_id, learning_objective_id, learning_objectives(title, sort_order)")
    .eq("class_id", classId);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, score")
          .eq("student_id", studentId)
          .eq("status", "graded")
          .in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; score: number | null }[] };

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));

  const scoresBySubject = new Map<string, number[]>();
  const tpScoresBySubject = new Map<
    string,
    Map<string, { title: string; sortOrder: number; scores: number[] }>
  >();

  for (const sub of submissions ?? []) {
    if (sub.score == null) continue;
    const a = assignmentById.get(sub.assignment_id);
    if (!a) continue;

    const subjectScores = scoresBySubject.get(a.subject_id) ?? [];
    subjectScores.push(sub.score);
    scoresBySubject.set(a.subject_id, subjectScores);

    if (a.learning_objective_id) {
      const lo = a.learning_objectives as unknown as { title: string; sort_order: number } | null;
      const tpMap = tpScoresBySubject.get(a.subject_id) ?? new Map();
      const entry = tpMap.get(a.learning_objective_id) ?? {
        title: lo?.title ?? "TP",
        sortOrder: lo?.sort_order ?? 0,
        scores: [] as number[],
      };
      entry.scores.push(sub.score);
      tpMap.set(a.learning_objective_id, entry);
      tpScoresBySubject.set(a.subject_id, tpMap);
    }
  }

  return visibleSubjects.map((s) => {
    const scores = scoresBySubject.get(s.id) ?? [];
    const tpMap = tpScoresBySubject.get(s.id);
    const tpGrades: StudentTpGrade[] = tpMap
      ? [...tpMap.entries()]
          .map(([tpId, { title, sortOrder, scores: tpScores }]) => ({
            tpId,
            tpTitle: title,
            sortOrder,
            average: Math.round(tpScores.reduce((a, b) => a + b, 0) / tpScores.length),
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(({ tpId, tpTitle, average }) => ({ tpId, tpTitle, average }))
      : [];

    return {
      subjectId: s.id,
      subjectName: s.name,
      subjectEmoji: s.emoji,
      subjectColor: s.color,
      overallAverage:
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      tpGrades,
    };
  });
}
