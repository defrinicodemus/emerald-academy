import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/data/gradebook";

export interface SchoolReportYearOption {
  id: string;
  yearLabel: string;
  semester: "ganjil" | "genap";
  isActive: boolean;
}

export interface SchoolReportTeacherRow {
  teacherId: string;
  name: string;
  materiCount: number;
  tugasCount: number;
  kuisCount: number;
  presensiCount: number;
  totalActivity: number;
}

export interface SchoolReportClassRow {
  classId: string;
  className: string;
  studentCount: number;
  attendanceHadir: number;
  attendanceTotal: number;
  attendancePercent: number;
  tugasActual: number;
  tugasExpected: number;
  tugasCompletionPercent: number;
  kuisActual: number;
  kuisExpected: number;
  kuisCompletionPercent: number;
  averageGradePercent: number;
}

export interface SchoolReportData {
  yearOptions: SchoolReportYearOption[];
  selectedYearId: string;
  totalGuruAktif: number;
  totalSiswaAktif: number;
  materiPublishedCount: number;
  aktivitasPembelajaranCount: number;
  teacherRows: SchoolReportTeacherRow[];
  classRows: SchoolReportClassRow[];
}

export async function getSchoolReportData(
  requestedYearId?: string,
): Promise<SchoolReportData | null> {
  const supabase = await createClient();

  const { data: allYears } = await supabase
    .from("academic_years")
    .select("id, year_label, semester, is_active")
    .order("year_label", { ascending: false })
    .order("semester", { ascending: true });

  if (!allYears || allYears.length === 0) return null;

  const activeYear = allYears.find((y) => y.is_active) ?? allYears[0];
  const selectedYear = requestedYearId
    ? (allYears.find((y) => y.id === requestedYearId) ?? activeYear)
    : activeYear;

  const yearOptions: SchoolReportYearOption[] = allYears.map((y) => ({
    id: y.id,
    yearLabel: y.year_label,
    semester: y.semester,
    isActive: y.is_active,
  }));

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("academic_year_id", selectedYear.id)
    .order("grade_level");
  const classIds = (classes ?? []).map((c) => c.id);

  const [
    { data: students },
    { data: cts },
    { data: meetings },
    { data: materials },
    { data: assignments },
  ] = await Promise.all([
    classIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, class_id")
          .eq("role", "student")
          .in("class_id", classIds)
      : Promise.resolve({ data: [] as { id: string; class_id: string | null }[] }),
    classIds.length > 0
      ? supabase
          .from("class_teacher_subjects")
          .select("teacher_id, class_id")
          .in("class_id", classIds)
      : Promise.resolve({ data: [] as { teacher_id: string; class_id: string }[] }),
    classIds.length > 0
      ? supabase.from("class_meetings").select("id, class_id, teacher_id").in("class_id", classIds)
      : Promise.resolve({
          data: [] as { id: string; class_id: string; teacher_id: string | null }[],
        }),
    classIds.length > 0
      ? supabase
          .from("materials")
          .select("id, class_id, teacher_id, created_at")
          .in("class_id", classIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            class_id: string;
            teacher_id: string | null;
            created_at: string;
          }[],
        }),
    classIds.length > 0
      ? supabase
          .from("assignments")
          .select("id, class_id, teacher_id, kind, created_at")
          .in("class_id", classIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            class_id: string;
            teacher_id: string | null;
            kind: string;
            created_at: string;
          }[],
        }),
  ]);

  const meetingIds = (meetings ?? []).map((m) => m.id);
  const { data: attendanceRecords } =
    meetingIds.length > 0
      ? await supabase
          .from("attendance_records")
          .select("status, meeting_id")
          .in("meeting_id", meetingIds)
      : { data: [] as { status: string; meeting_id: string }[] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, status, score, student_id")
          .in("assignment_id", assignmentIds)
      : {
          data: [] as {
            assignment_id: string;
            status: string;
            score: number | null;
            student_id: string;
          }[],
        };

  const studentCountByClass = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.class_id) continue;
    studentCountByClass.set(s.class_id, (studentCountByClass.get(s.class_id) ?? 0) + 1);
  }

  const classIdByMeeting = new Map((meetings ?? []).map((m) => [m.id, m.class_id]));
  const attendanceByClass = new Map<string, { hadir: number; total: number }>();
  for (const r of attendanceRecords ?? []) {
    const classId = classIdByMeeting.get(r.meeting_id);
    if (!classId) continue;
    const acc = attendanceByClass.get(classId) ?? { hadir: 0, total: 0 };
    acc.total++;
    if (r.status === "hadir") acc.hadir++;
    attendanceByClass.set(classId, acc);
  }

  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
  const submittedByAssignment = new Map<string, number>();
  // Graded scores per class, split by kind and grouped per student — needed
  // for the two-level (per-student, then per-class) average grade formula.
  const tugasScoresByClassStudent = new Map<string, Map<string, number[]>>();
  const kuisScoresByClassStudent = new Map<string, Map<string, number[]>>();
  for (const s of submissions ?? []) {
    if (s.status === "submitted" || s.status === "graded") {
      submittedByAssignment.set(
        s.assignment_id,
        (submittedByAssignment.get(s.assignment_id) ?? 0) + 1,
      );
    }
    if (s.status === "graded" && s.score != null) {
      const a = assignmentById.get(s.assignment_id);
      if (a) {
        const store = a.kind === "quiz" ? kuisScoresByClassStudent : tugasScoresByClassStudent;
        const byStudent = store.get(a.class_id) ?? new Map<string, number[]>();
        const arr = byStudent.get(s.student_id) ?? [];
        arr.push(s.score);
        byStudent.set(s.student_id, arr);
        store.set(a.class_id, byStudent);
      }
    }
  }

  function average(values: number[]): number | null {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }

  function classAverageGrade(classId: string): number {
    const tugasByStudent = tugasScoresByClassStudent.get(classId) ?? new Map<string, number[]>();
    const kuisByStudent = kuisScoresByClassStudent.get(classId) ?? new Map<string, number[]>();
    const studentIds = new Set<string>([...tugasByStudent.keys(), ...kuisByStudent.keys()]);

    const studentFinals: number[] = [];
    for (const studentId of studentIds) {
      // Step 1: per-student final grade for tugas and for kuis.
      const tugasFinal = average(tugasByStudent.get(studentId) ?? []);
      const kuisFinal = average(kuisByStudent.get(studentId) ?? []);
      // Step 2: average the two components into the student's final grade.
      // A student missing one component (e.g. no kuis graded yet) is
      // averaged over whichever component(s) are actually available.
      const components = [tugasFinal, kuisFinal].filter((v): v is number => v != null);
      if (components.length === 0) continue;
      studentFinals.push(average(components)!);
    }

    // Step 3: class average is the mean of each student's final grade.
    const classAverage = average(studentFinals);
    return classAverage != null ? round2(classAverage) : 0;
  }

  function percentOf(actual: number, expected: number): number {
    return expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : 0;
  }

  const tugasByClass = new Map<string, { expected: number; actual: number }>();
  const kuisByClass = new Map<string, { expected: number; actual: number }>();
  for (const a of assignments ?? []) {
    const expected = studentCountByClass.get(a.class_id) ?? 0;
    // Clamp per-assignment so a stale/mismatched submission can't inflate
    // the aggregate ratio past what that single assignment could contribute.
    const actual = Math.min(submittedByAssignment.get(a.id) ?? 0, expected);
    const byClass = a.kind === "quiz" ? kuisByClass : tugasByClass;
    const acc = byClass.get(a.class_id) ?? { expected: 0, actual: 0 };
    acc.expected += expected;
    acc.actual += actual;
    byClass.set(a.class_id, acc);
  }

  const classRows: SchoolReportClassRow[] = (classes ?? []).map((c) => {
    const attendance = attendanceByClass.get(c.id) ?? { hadir: 0, total: 0 };
    const tugas = tugasByClass.get(c.id) ?? { expected: 0, actual: 0 };
    const kuis = kuisByClass.get(c.id) ?? { expected: 0, actual: 0 };
    return {
      classId: c.id,
      className: c.name,
      studentCount: studentCountByClass.get(c.id) ?? 0,
      attendanceHadir: attendance.hadir,
      attendanceTotal: attendance.total,
      attendancePercent: percentOf(attendance.hadir, attendance.total),
      tugasActual: tugas.actual,
      tugasExpected: tugas.expected,
      tugasCompletionPercent: percentOf(tugas.actual, tugas.expected),
      kuisActual: kuis.actual,
      kuisExpected: kuis.expected,
      kuisCompletionPercent: percentOf(kuis.actual, kuis.expected),
      averageGradePercent: classAverageGrade(c.id),
    };
  });

  const teacherIds = [...new Set((cts ?? []).map((c) => c.teacher_id))];
  const { data: teacherProfiles } =
    teacherIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", teacherIds)
      : { data: [] as { id: string; full_name: string }[] };

  const teacherRows: SchoolReportTeacherRow[] = (teacherProfiles ?? [])
    .map((t) => {
      const materiCount = (materials ?? []).filter((m) => m.teacher_id === t.id).length;
      const tugasCount = (assignments ?? []).filter(
        (a) => a.teacher_id === t.id && a.kind !== "quiz",
      ).length;
      const kuisCount = (assignments ?? []).filter(
        (a) => a.teacher_id === t.id && a.kind === "quiz",
      ).length;
      const presensiCount = (meetings ?? []).filter((m) => m.teacher_id === t.id).length;
      return {
        teacherId: t.id,
        name: t.full_name,
        materiCount,
        tugasCount,
        kuisCount,
        presensiCount,
        totalActivity: materiCount + tugasCount + kuisCount + presensiCount,
      };
    })
    .sort((a, b) => b.totalActivity - a.totalActivity);

  return {
    yearOptions,
    selectedYearId: selectedYear.id,
    totalGuruAktif: teacherIds.length,
    totalSiswaAktif: (students ?? []).length,
    materiPublishedCount: (materials ?? []).length,
    aktivitasPembelajaranCount: (assignments ?? []).length,
    teacherRows,
    classRows,
  };
}
