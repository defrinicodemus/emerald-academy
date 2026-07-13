import { createClient } from "@/lib/supabase/server";
import { appliesToGrade } from "@/lib/data/subjects";

export async function getStudentDashboardData(studentId: string, classId: string | null) {
  const supabase = await createClient();

  const [
    { data: announcements },
    { data: assignmentRows },
    { data: grades },
    { data: subjects },
    { data: materials },
    { data: klass },
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    classId
      ? supabase
          .from("assignments")
          .select("id, title, kind, subject_id, due_at, is_published, subjects(name)")
          .eq("class_id", classId)
          .eq("is_published", true)
          .order("due_at")
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("grades")
      .select("period_month, score")
      .eq("student_id", studentId)
      .order("period_month"),
    supabase
      .from("subjects")
      .select("id, code, name, emoji, color, min_grade, max_grade")
      .order("name"),
    classId
      ? supabase.from("materials").select("id, subject_id, created_at").eq("class_id", classId)
      : Promise.resolve({ data: [] as never[] }),
    classId
      ? supabase.from("classes").select("grade_level").eq("id", classId).single()
      : Promise.resolve({ data: null }),
  ]);

  const assignmentIds = (assignmentRows ?? []).map((a) => a.id);
  const [{ data: submissions }, { count: materialsStudiedCount }, { data: completedSubmissions }] =
    await Promise.all([
      assignmentIds.length > 0
        ? supabase
            .from("submissions")
            .select("assignment_id, status")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds)
        : Promise.resolve({ data: [] as { assignment_id: string; status: string }[] }),
      supabase
        .from("material_views")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId),
      supabase
        .from("submissions")
        .select("assignment_id, assignments(kind)")
        .eq("student_id", studentId)
        .in("status", ["submitted", "graded"]),
    ]);

  const statusByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s.status]));
  const isPending = (assignmentId: string) => {
    const status = statusByAssignment.get(assignmentId);
    return status == null || status === "belum" || status === "dikerjakan";
  };
  const pendingTugasCount = (assignmentRows ?? []).filter(
    (a) => a.kind !== "quiz" && isPending(a.id),
  ).length;
  const pendingKuisCount = (assignmentRows ?? []).filter(
    (a) => a.kind === "quiz" && isPending(a.id),
  ).length;

  let tugasCompletedCount = 0;
  let kuisCompletedCount = 0;
  for (const s of completedSubmissions ?? []) {
    const kind = (s.assignments as unknown as { kind: string } | null)?.kind;
    if (kind === "quiz") kuisCompletedCount++;
    else if (kind) tugasCompletedCount++;
  }

  const gradeLevel = klass?.grade_level ?? null;
  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(gradeLevel, s.min_grade, s.max_grade),
  );

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const newMaterialsCount = (materials ?? []).filter(
    (m) => new Date(m.created_at).getTime() >= sevenDaysAgo,
  ).length;

  const materialCountBySubject = new Map<string, number>();
  for (const m of materials ?? []) {
    materialCountBySubject.set(m.subject_id, (materialCountBySubject.get(m.subject_id) ?? 0) + 1);
  }
  const tugasCountBySubject = new Map<string, number>();
  const kuisCountBySubject = new Map<string, number>();
  for (const a of assignmentRows ?? []) {
    const map = a.kind === "quiz" ? kuisCountBySubject : tugasCountBySubject;
    map.set(a.subject_id, (map.get(a.subject_id) ?? 0) + 1);
  }
  const subjectsWithCounts = visibleSubjects.map((s) => ({
    ...s,
    materialCount: materialCountBySubject.get(s.id) ?? 0,
    tugasCount: tugasCountBySubject.get(s.id) ?? 0,
    kuisCount: kuisCountBySubject.get(s.id) ?? 0,
  }));

  const byMonth = new Map<string, { sum: number; count: number }>();
  for (const g of grades ?? []) {
    const acc = byMonth.get(g.period_month) ?? { sum: 0, count: 0 };
    acc.sum += Number(g.score);
    acc.count += 1;
    byMonth.set(g.period_month, acc);
  }
  const trend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      name: new Date(month).toLocaleDateString("id-ID", { month: "short" }),
      nilai: Math.round(sum / count),
    }));
  const average = trend.length
    ? Math.round(trend.reduce((s, t) => s + t.nilai, 0) / trend.length)
    : null;

  const assignments = (assignmentRows ?? []).slice(0, 5).map((a) => ({
    id: a.id,
    title: a.title,
    subject: (a.subjects as unknown as { name: string } | null)?.name ?? "",
    due: a.due_at ? new Date(a.due_at).toLocaleDateString("id-ID") : "-",
  }));

  return {
    announcements: announcements ?? [],
    assignments,
    average,
    trend,
    subjects: subjectsWithCounts,
    newMaterialsCount,
    pendingTugasCount,
    pendingKuisCount,
    materialsStudiedCount: materialsStudiedCount ?? 0,
    tugasCompletedCount,
    kuisCompletedCount,
  };
}

export async function getPrincipalDashboardData() {
  const supabase = await createClient();
  const [
    { data: profiles },
    { data: subjects },
    { data: classes },
    { data: materialsBySubject },
    { data: assignmentsBySubject },
  ] = await Promise.all([
    supabase.from("profiles").select("role"),
    supabase.from("subjects").select("id"),
    supabase.from("classes").select("id"),
    supabase.from("materials").select("subjects(name)"),
    supabase.from("assignments").select("subjects(name)"),
  ]);
  const counts = { student: 0, teacher: 0, principal: 0, admin: 0 };
  for (const row of profiles ?? []) counts[row.role as keyof typeof counts]++;

  const bySubject = new Map<string, number>();
  for (const row of materialsBySubject ?? []) {
    const name = (row.subjects as unknown as { name: string } | null)?.name;
    if (name) bySubject.set(name, (bySubject.get(name) ?? 0) + 1);
  }
  for (const row of assignmentsBySubject ?? []) {
    const name = (row.subjects as unknown as { name: string } | null)?.name;
    if (name) bySubject.set(name, (bySubject.get(name) ?? 0) + 1);
  }
  const activity = [...bySubject.entries()].map(([name, value]) => ({ name, value }));

  return {
    totalStudents: counts.student,
    totalTeachers: counts.teacher,
    totalSubjects: subjects?.length ?? 0,
    totalClasses: classes?.length ?? 0,
    activity,
  };
}

export async function getAdminDashboardData() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: classRows }, { data: studentClassRows }] = await Promise.all([
    supabase.from("profiles").select("role"),
    supabase.from("classes").select("id, name, grade_level").order("grade_level"),
    supabase.from("profiles").select("class_id").eq("role", "student"),
  ]);
  const counts = { student: 0, teacher: 0, principal: 0, admin: 0 };
  for (const row of profiles ?? []) counts[row.role as keyof typeof counts]++;
  const perClass = new Map<string, number>();
  for (const row of studentClassRows ?? []) {
    if (!row.class_id) continue;
    perClass.set(row.class_id, (perClass.get(row.class_id) ?? 0) + 1);
  }
  const studentsPerClass = (classRows ?? []).map((c) => ({
    name: c.name,
    siswa: perClass.get(c.id) ?? 0,
  }));

  return {
    totalStudents: counts.student,
    totalTeachers: counts.teacher,
    totalPrincipals: counts.principal,
    totalUsers: counts.student + counts.teacher + counts.principal + counts.admin,
    studentsPerClass,
  };
}
