import { createClient } from "@/lib/supabase/server";
import { appliesToGrade } from "@/lib/data/subjects";

export interface MonitoringClassRow {
  classId: string;
  className: string;
  studentCount: number;
  attendancePercent: number;
  tugasCompletionPercent: number;
  kuisCompletionPercent: number;
}

export interface MonitoringPembelajaranData {
  academicYearLabel: string;
  semester: "ganjil" | "genap";
  totalActiveClasses: number;
  averageAttendancePercent: number;
  tugasCompletionPercent: number;
  kuisCompletionPercent: number;
  classRows: MonitoringClassRow[];
}

export async function getMonitoringPembelajaranData(): Promise<MonitoringPembelajaranData | null> {
  const supabase = await createClient();

  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id, year_label, semester")
    .eq("is_active", true)
    .maybeSingle();

  if (!activeYear) return null;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("academic_year_id", activeYear.id)
    .order("grade_level");
  const classIds = (classes ?? []).map((c) => c.id);

  const [{ data: meetings }, { data: assignments }, { data: students }] = await Promise.all([
    classIds.length > 0
      ? supabase.from("class_meetings").select("id, class_id").in("class_id", classIds)
      : Promise.resolve({ data: [] as { id: string; class_id: string }[] }),
    classIds.length > 0
      ? supabase.from("assignments").select("id, class_id, kind").in("class_id", classIds)
      : Promise.resolve({ data: [] as { id: string; class_id: string; kind: string }[] }),
    classIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, class_id")
          .eq("role", "student")
          .in("class_id", classIds)
      : Promise.resolve({ data: [] as { id: string; class_id: string | null }[] }),
  ]);

  const classIdByMeeting = new Map((meetings ?? []).map((m) => [m.id, m.class_id]));
  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: attendanceRecords } =
    meetingIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("status, meeting_id")
          .in("meeting_id", meetingIds)
      : { data: [] as { status: string; meeting_id: string }[] };

  const studentCountByClass = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.class_id) continue;
    studentCountByClass.set(s.class_id, (studentCountByClass.get(s.class_id) ?? 0) + 1);
  }

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, status")
          .in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; status: string }[] };

  const submittedByAssignment = new Map<string, number>();
  for (const s of submissions ?? []) {
    if (s.status !== "submitted" && s.status !== "graded") continue;
    submittedByAssignment.set(
      s.assignment_id,
      (submittedByAssignment.get(s.assignment_id) ?? 0) + 1,
    );
  }

  // Per-class accumulators
  const attendanceByClass = new Map<string, { hadir: number; total: number }>();
  for (const r of attendanceRecords ?? []) {
    const classId = classIdByMeeting.get(r.meeting_id);
    if (!classId) continue;
    const acc = attendanceByClass.get(classId) ?? { hadir: 0, total: 0 };
    acc.total++;
    if (r.status === "hadir") acc.hadir++;
    attendanceByClass.set(classId, acc);
  }

  const tugasByClass = new Map<string, { expected: number; actual: number }>();
  const kuisByClass = new Map<string, { expected: number; actual: number }>();
  let tugasExpected = 0;
  let tugasActual = 0;
  let kuisExpected = 0;
  let kuisActual = 0;
  for (const a of assignments ?? []) {
    const expected = studentCountByClass.get(a.class_id) ?? 0;
    // Clamp per-assignment so a stale/mismatched submission (e.g. a student
    // record that no longer matches the assignment's class) can't inflate
    // the aggregate ratio past what that single assignment could contribute.
    const actual = Math.min(submittedByAssignment.get(a.id) ?? 0, expected);
    const byClass = a.kind === "quiz" ? kuisByClass : tugasByClass;
    const acc = byClass.get(a.class_id) ?? { expected: 0, actual: 0 };
    acc.expected += expected;
    acc.actual += actual;
    byClass.set(a.class_id, acc);
    if (a.kind === "quiz") {
      kuisExpected += expected;
      kuisActual += actual;
    } else {
      tugasExpected += expected;
      tugasActual += actual;
    }
  }

  function percentOf(actual: number, expected: number): number {
    return expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
  }

  const classRows: MonitoringClassRow[] = (classes ?? []).map((c) => {
    const attendance = attendanceByClass.get(c.id) ?? { hadir: 0, total: 0 };
    const tugas = tugasByClass.get(c.id) ?? { expected: 0, actual: 0 };
    const kuis = kuisByClass.get(c.id) ?? { expected: 0, actual: 0 };
    return {
      classId: c.id,
      className: c.name,
      studentCount: studentCountByClass.get(c.id) ?? 0,
      attendancePercent: percentOf(attendance.hadir, attendance.total),
      tugasCompletionPercent: percentOf(tugas.actual, tugas.expected),
      kuisCompletionPercent: percentOf(kuis.actual, kuis.expected),
    };
  });

  const hadirCount = (attendanceRecords ?? []).filter((r) => r.status === "hadir").length;
  const totalAttendance = (attendanceRecords ?? []).length;

  return {
    academicYearLabel: activeYear.year_label,
    semester: activeYear.semester,
    totalActiveClasses: classIds.length,
    averageAttendancePercent: percentOf(hadirCount, totalAttendance),
    tugasCompletionPercent: percentOf(tugasActual, tugasExpected),
    kuisCompletionPercent: percentOf(kuisActual, kuisExpected),
    classRows,
  };
}

export interface ClassDetailSubjectRow {
  subjectId: string;
  subjectName: string;
  materiCount: number;
  tugasCount: number;
  kuisCount: number;
}

export interface ClassDetailMaterialItem {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
}

export interface ClassDetailAssignmentItem {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
}

export interface ClassMonitoringDetail {
  classId: string;
  className: string;
  studentCount: number;
  academicYearLabel: string;
  semester: "ganjil" | "genap";
  attendancePercent: number;
  tugasCompletionPercent: number;
  kuisCompletionPercent: number;
  averageGradePercent: number;
  subjectRows: ClassDetailSubjectRow[];
  materialItems: ClassDetailMaterialItem[];
  tugasItems: ClassDetailAssignmentItem[];
  kuisItems: ClassDetailAssignmentItem[];
}

export async function getClassMonitoringDetail(
  classId: string,
): Promise<ClassMonitoringDetail | null> {
  const supabase = await createClient();

  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id, year_label, semester")
    .eq("is_active", true)
    .maybeSingle();
  if (!activeYear) return null;

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("id", classId)
    .eq("academic_year_id", activeYear.id)
    .maybeSingle();
  if (!klass) return null;

  const [
    { count: studentCount },
    { data: subjects },
    { data: meetings },
    { data: materials },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("role", "student"),
    supabase.from("subjects").select("id, name, min_grade, max_grade").order("name"),
    supabase.from("class_meetings").select("id").eq("class_id", classId),
    supabase.from("materials").select("id, subject_id, title, created_at").eq("class_id", classId),
    supabase
      .from("assignments")
      .select("id, subject_id, title, kind, created_at")
      .eq("class_id", classId),
  ]);

  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: attendanceRecords } =
    meetingIds.length > 0
      ? await supabase.from("attendance_records").select("status").in("meeting_id", meetingIds)
      : { data: [] as { status: string }[] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, status, score")
          .in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; status: string; score: number | null }[] };

  const submittedByAssignment = new Map<string, number>();
  const gradedScores: number[] = [];
  for (const s of submissions ?? []) {
    if (s.status === "submitted" || s.status === "graded") {
      submittedByAssignment.set(
        s.assignment_id,
        (submittedByAssignment.get(s.assignment_id) ?? 0) + 1,
      );
    }
    if (s.status === "graded" && s.score != null) {
      gradedScores.push(s.score);
    }
  }

  function percentOf(actual: number, expected: number): number {
    return expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
  }

  const expectedPerAssignment = studentCount ?? 0;
  const materialItems: ClassDetailMaterialItem[] = (materials ?? []).map((m) => ({
    id: m.id,
    subjectId: m.subject_id,
    title: m.title,
    createdAt: m.created_at,
  }));
  const tugasItems: ClassDetailAssignmentItem[] = [];
  const kuisItems: ClassDetailAssignmentItem[] = [];

  let tugasExpected = 0;
  let tugasActual = 0;
  let kuisExpected = 0;
  let kuisActual = 0;
  for (const a of assignments ?? []) {
    // Clamp per-assignment so a stale/mismatched submission can't inflate
    // the aggregate ratio past what that single assignment could contribute.
    const actual = Math.min(submittedByAssignment.get(a.id) ?? 0, expectedPerAssignment);
    const item = { id: a.id, subjectId: a.subject_id, title: a.title, createdAt: a.created_at };
    if (a.kind === "quiz") {
      kuisExpected += expectedPerAssignment;
      kuisActual += actual;
      kuisItems.push(item);
    } else {
      tugasExpected += expectedPerAssignment;
      tugasActual += actual;
      tugasItems.push(item);
    }
  }

  const hadirCount = (attendanceRecords ?? []).filter((r) => r.status === "hadir").length;
  const totalAttendance = (attendanceRecords ?? []).length;

  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(klass.grade_level, s.min_grade, s.max_grade),
  );
  const subjectRows: ClassDetailSubjectRow[] = visibleSubjects.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    materiCount: materialItems.filter((m) => m.subjectId === s.id).length,
    tugasCount: tugasItems.filter((t) => t.subjectId === s.id).length,
    kuisCount: kuisItems.filter((k) => k.subjectId === s.id).length,
  }));

  // Each graded submission's score is already on a 0-100 scale, so summing
  // scores and dividing by (count * 100) * 100 reduces to a plain average.
  const averageGradePercent =
    gradedScores.length > 0
      ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
      : 0;

  return {
    classId: klass.id,
    className: klass.name,
    studentCount: studentCount ?? 0,
    academicYearLabel: activeYear.year_label,
    semester: activeYear.semester,
    attendancePercent: percentOf(hadirCount, totalAttendance),
    tugasCompletionPercent: percentOf(tugasActual, tugasExpected),
    kuisCompletionPercent: percentOf(kuisActual, kuisExpected),
    averageGradePercent,
    subjectRows,
    materialItems,
    tugasItems,
    kuisItems,
  };
}
