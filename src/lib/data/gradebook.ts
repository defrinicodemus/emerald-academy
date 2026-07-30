import { createClient } from "@/lib/supabase/server";
import { appliesToGrade } from "@/lib/data/subjects";

// Grade averages are rounded to 2 decimal places (not whole numbers) so that
// multi-step averaging (per-TP, then average-of-TP-averages, etc.) doesn't
// compound rounding error — rounding to a whole number at each step can drift
// the final grade by a couple of points versus the true average.
export function round2(value: number): number {
  return Number(value.toFixed(2));
}

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
          ? round2(scores.reduce((a, b) => a + b, 0) / scores.length)
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
}

export interface HistoryTpGroup<T> {
  tpId: string;
  tpTitle: string;
  items: T[];
}

export interface StudentHistoryData {
  materialsByTp: HistoryTpGroup<HistoryMaterialRow>[];
  tugasByTp: HistoryTpGroup<HistoryAssignmentRow>[];
  kuisByTp: HistoryTpGroup<HistoryAssignmentRow>[];
  materialsViewedPercent: number;
  averageTugas: number | null;
  averageKuis: number | null;
}

const NO_TP_GROUP_ID = "tanpa-tp";

function groupByTp<T>(
  entries: {
    learningObjectiveId: string | null;
    tpTitle: string | null;
    tpSortOrder: number | null;
    item: T;
  }[],
): HistoryTpGroup<T>[] {
  const groups = new Map<string, { title: string; sortOrder: number; items: T[] }>();
  for (const e of entries) {
    const key = e.learningObjectiveId ?? NO_TP_GROUP_ID;
    const entry = groups.get(key) ?? {
      title: e.learningObjectiveId ? (e.tpTitle ?? "TP") : "Tanpa TP",
      sortOrder: e.learningObjectiveId ? (e.tpSortOrder ?? 0) : Number.MAX_SAFE_INTEGER,
      items: [] as T[],
    };
    entry.items.push(e.item);
    groups.set(key, entry);
  }
  return [...groups.entries()]
    .map(([tpId, { title, sortOrder, items }]) => ({ tpId, tpTitle: title, sortOrder, items }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ tpId, tpTitle, items }) => ({ tpId, tpTitle, items }));
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
      .select("id, title, kind, learning_objective_id, learning_objectives(title, sort_order)")
      .eq("class_id", classId)
      .eq("subject_id", subjectId),
    supabase.from("material_views").select("material_id, viewed_at").eq("student_id", studentId),
    supabase
      .from("assignments")
      .select("id, title, kind, learning_objective_id, learning_objectives(title, sort_order)")
      .eq("class_id", classId)
      .eq("subject_id", subjectId),
  ]);

  const viewedByMaterial = new Map((views ?? []).map((v) => [v.material_id, v.viewed_at]));
  const materialRows = (materials ?? []).map((m) => {
    const lo = m.learning_objectives as unknown as { title: string; sort_order: number } | null;
    const row: HistoryMaterialRow = {
      id: m.id,
      title: m.title,
      kind: m.kind,
      viewed: viewedByMaterial.has(m.id),
      viewedAt: viewedByMaterial.get(m.id) ?? null,
    };
    return {
      learningObjectiveId: m.learning_objective_id,
      tpTitle: lo?.title ?? null,
      tpSortOrder: lo?.sort_order ?? null,
      item: row,
    };
  });
  const materialsViewedPercent =
    materialRows.length > 0
      ? Math.round((materialRows.filter((m) => m.item.viewed).length / materialRows.length) * 100)
      : 0;

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, submitted_at, score, status")
          .eq("student_id", studentId)
          .in("assignment_id", assignmentIds)
      : {
          data: [] as {
            assignment_id: string;
            submitted_at: string | null;
            score: number | null;
            status: string;
          }[],
        };

  const submissionByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));

  const tugasEntries: Parameters<typeof groupByTp<HistoryAssignmentRow>>[0] = [];
  const kuisEntries: Parameters<typeof groupByTp<HistoryAssignmentRow>>[0] = [];
  const tugasScores: number[] = [];
  const kuisScores: number[] = [];

  for (const a of assignments ?? []) {
    const sub = submissionByAssignment.get(a.id);
    const row: HistoryAssignmentRow = {
      id: a.id,
      title: a.title,
      submittedAt: sub?.submitted_at ?? null,
      score: sub?.score ?? null,
    };
    const lo = a.learning_objectives as unknown as { title: string; sort_order: number } | null;
    const entry = {
      learningObjectiveId: a.learning_objective_id,
      tpTitle: lo?.title ?? null,
      tpSortOrder: lo?.sort_order ?? null,
      item: row,
    };
    if (a.kind === "quiz") {
      kuisEntries.push(entry);
      if (row.score != null) kuisScores.push(row.score);
    } else {
      tugasEntries.push(entry);
      if (row.score != null) tugasScores.push(row.score);
    }
  }

  return {
    materialsByTp: groupByTp(materialRows),
    tugasByTp: groupByTp(tugasEntries),
    kuisByTp: groupByTp(kuisEntries),
    materialsViewedPercent,
    averageTugas:
      tugasScores.length > 0
        ? round2(tugasScores.reduce((a, b) => a + b, 0) / tugasScores.length)
        : null,
    averageKuis:
      kuisScores.length > 0
        ? round2(kuisScores.reduce((a, b) => a + b, 0) / kuisScores.length)
        : null,
  };
}

export function averageOfTpAverages(tpAverages: (number | null | undefined)[]): number | null {
  const values = tpAverages.filter((v): v is number => v != null);
  return values.length > 0 ? round2(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

export interface StudentTpGrade {
  tpId: string;
  tpTitle: string;
  average: number | null;
}

export interface StudentSubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectEmoji: string | null;
  subjectColor: string | null;
  overallAverage: number | null;
  isLocked: boolean;
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
  const visibleSubjectIds = visibleSubjects.map((s) => s.id);

  const [{ data: plans }, { data: assignments }, { data: locks }] = await Promise.all([
    visibleSubjectIds.length > 0
      ? supabase
          .from("curriculum_plans")
          .select("subject_id, learning_objectives(id, title, sort_order)")
          .eq("class_id", classId)
          .in("subject_id", visibleSubjectIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("assignments")
      .select("id, subject_id, learning_objective_id, learning_objectives(title, sort_order)")
      .eq("class_id", classId),
    visibleSubjectIds.length > 0
      ? supabase
          .from("gradebook_locks")
          .select("subject_id")
          .eq("class_id", classId)
          .in("subject_id", visibleSubjectIds)
      : Promise.resolve({ data: [] as { subject_id: string }[] }),
  ]);

  const lockedSubjectIds = new Set((locks ?? []).map((l) => l.subject_id));

  const finalGradeBySubject = new Map<string, number>();
  if (lockedSubjectIds.size > 0) {
    const { data: gradeRows } = await supabase
      .from("grades")
      .select("subject_id, score, created_at")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .in("subject_id", [...lockedSubjectIds])
      .order("created_at", { ascending: false });
    for (const g of gradeRows ?? []) {
      if (!finalGradeBySubject.has(g.subject_id)) finalGradeBySubject.set(g.subject_id, g.score);
    }
  }

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

  const tpScoresBySubject = new Map<
    string,
    Map<string, { title: string; sortOrder: number; scores: number[] }>
  >();

  for (const plan of plans ?? []) {
    const objectives =
      (plan.learning_objectives as unknown as
        { id: string; title: string; sort_order: number }[] | null) ?? [];
    const tpMap = tpScoresBySubject.get(plan.subject_id) ?? new Map();
    for (const objective of objectives) {
      if (!tpMap.has(objective.id)) {
        tpMap.set(objective.id, {
          title: objective.title,
          sortOrder: objective.sort_order,
          scores: [],
        });
      }
    }
    tpScoresBySubject.set(plan.subject_id, tpMap);
  }

  for (const sub of submissions ?? []) {
    if (sub.score == null) continue;
    const a = assignmentById.get(sub.assignment_id);
    if (!a) continue;

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
    const isLocked = lockedSubjectIds.has(s.id);
    const tpMap = tpScoresBySubject.get(s.id);
    const tpGrades: StudentTpGrade[] = tpMap
      ? [...tpMap.entries()]
          .map(([tpId, { title, sortOrder, scores: tpScores }]) => ({
            tpId,
            tpTitle: title,
            sortOrder,
            average:
              tpScores.length > 0
                ? round2(tpScores.reduce((a, b) => a + b, 0) / tpScores.length)
                : null,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(({ tpId, tpTitle, average }) => ({ tpId, tpTitle, average }))
      : [];

    return {
      subjectId: s.id,
      subjectName: s.name,
      subjectEmoji: s.emoji,
      subjectColor: s.color,
      overallAverage: isLocked
        ? (finalGradeBySubject.get(s.id) ?? null)
        : averageOfTpAverages(tpGrades.map((tp) => tp.average)),
      isLocked,
      tpGrades,
    };
  });
}

export interface GradedActivityRow {
  id: string;
  title: string;
  kind: "tugas" | "kuis";
  gradedAt: string | null;
  score: number;
}

export interface TpGradeDetail {
  tpId: string;
  tpTitle: string;
  average: number | null;
  activities: GradedActivityRow[];
}

export interface StudentSubjectGradeDetail {
  subjectId: string;
  subjectName: string;
  subjectEmoji: string | null;
  subjectColor: string | null;
  overallAverage: number | null;
  isLocked: boolean;
  tugasGradedCount: number;
  kuisGradedCount: number;
  totalActivityCount: number;
  highestScore: number | null;
  highestScoreCount: number;
  tpDetails: TpGradeDetail[];
}

export async function getStudentSubjectGradeDetail(
  studentId: string,
  classId: string,
  subjectId: string,
): Promise<StudentSubjectGradeDetail | null> {
  const supabase = await createClient();

  const [{ data: subject }, { data: plan }, { data: assignments }, { data: lock }] =
    await Promise.all([
      supabase.from("subjects").select("id, name, emoji, color").eq("id", subjectId).maybeSingle(),
      supabase
        .from("curriculum_plans")
        .select("id, learning_objectives(id, title, sort_order)")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .maybeSingle(),
      supabase
        .from("assignments")
        .select("id, title, kind, learning_objective_id, learning_objectives(title, sort_order)")
        .eq("class_id", classId)
        .eq("subject_id", subjectId),
      supabase
        .from("gradebook_locks")
        .select("locked_at")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .maybeSingle(),
    ]);

  if (!subject) return null;

  const isLocked = !!lock;
  let finalGrade: number | null = null;
  if (isLocked) {
    const { data: gradeRows } = await supabase
      .from("grades")
      .select("score, created_at")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(1);
    finalGrade = gradeRows?.[0]?.score ?? null;
  }

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, score, graded_at")
          .eq("student_id", studentId)
          .eq("status", "graded")
          .in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; score: number | null; graded_at: string | null }[] };

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));

  const tpMap = new Map<
    string,
    { title: string; sortOrder: number; activities: GradedActivityRow[] }
  >();
  const objectives =
    (plan?.learning_objectives as unknown as
      { id: string; title: string; sort_order: number }[] | null) ?? [];
  for (const o of objectives) {
    tpMap.set(o.id, { title: o.title, sortOrder: o.sort_order, activities: [] });
  }

  let tugasGradedCount = 0;
  let kuisGradedCount = 0;
  const allGradedScores: number[] = [];

  for (const sub of submissions ?? []) {
    if (sub.score == null) continue;
    const a = assignmentById.get(sub.assignment_id);
    if (!a) continue;

    allGradedScores.push(sub.score);
    const kind: "tugas" | "kuis" = a.kind === "quiz" ? "kuis" : "tugas";
    if (kind === "kuis") kuisGradedCount++;
    else tugasGradedCount++;

    if (a.learning_objective_id) {
      const lo = a.learning_objectives as unknown as { title: string; sort_order: number } | null;
      const entry = tpMap.get(a.learning_objective_id) ?? {
        title: lo?.title ?? "TP",
        sortOrder: lo?.sort_order ?? 0,
        activities: [] as GradedActivityRow[],
      };
      entry.activities.push({
        id: a.id,
        title: a.title,
        kind,
        gradedAt: sub.graded_at,
        score: sub.score,
      });
      tpMap.set(a.learning_objective_id, entry);
    }
  }

  const tpDetails: TpGradeDetail[] = [...tpMap.entries()]
    .map(([tpId, { title, sortOrder, activities }]) => {
      const scores = activities.map((a) => a.score);
      return {
        tpId,
        tpTitle: title,
        sortOrder,
        average:
          scores.length > 0 ? round2(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        activities: [...activities].sort((a, b) =>
          (b.gradedAt ?? "").localeCompare(a.gradedAt ?? ""),
        ),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ tpId, tpTitle, average, activities }) => ({ tpId, tpTitle, average, activities }));

  const highestScore = allGradedScores.length > 0 ? Math.max(...allGradedScores) : null;
  const highestScoreCount =
    highestScore != null ? allGradedScores.filter((s) => s === highestScore).length : 0;

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectEmoji: subject.emoji,
    subjectColor: subject.color,
    overallAverage: isLocked ? finalGrade : averageOfTpAverages(tpDetails.map((tp) => tp.average)),
    isLocked,
    tugasGradedCount,
    kuisGradedCount,
    totalActivityCount: assignmentIds.length,
    highestScore,
    highestScoreCount,
    tpDetails,
  };
}
