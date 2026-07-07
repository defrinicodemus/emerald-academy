import { createClient } from "@/lib/supabase/server";

export async function listStudentsWithAvg() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, nisn, class_id, classes!profiles_class_id_fkey(name)")
    .eq("role", "student")
    .order("full_name");

  const { data: grades } = await supabase.from("grades").select("student_id, score");
  const avgByStudent = new Map<string, { sum: number; count: number }>();
  for (const g of grades ?? []) {
    const acc = avgByStudent.get(g.student_id) ?? { sum: 0, count: 0 };
    acc.sum += Number(g.score);
    acc.count += 1;
    avgByStudent.set(g.student_id, acc);
  }

  return (students ?? []).map((s) => {
    const acc = avgByStudent.get(s.id);
    return {
      id: s.id,
      name: s.full_name,
      nisn: s.nisn as string | null,
      classId: s.class_id as string | null,
      className: (s.classes as unknown as { name: string } | null)?.name ?? null,
      avg: acc ? Math.round(acc.sum / acc.count) : null,
    };
  });
}

export async function listTeachersWithStats() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, nip")
    .eq("role", "teacher")
    .order("full_name");

  const [{ data: cts }, { data: materials }, { data: assignments }] = await Promise.all([
    supabase.from("class_teacher_subjects").select("teacher_id, subjects(name)"),
    supabase.from("materials").select("teacher_id"),
    supabase.from("assignments").select("teacher_id"),
  ]);

  const subjectByTeacher = new Map<string, string>();
  for (const row of cts ?? []) {
    const subjName = (row.subjects as unknown as { name: string } | null)?.name;
    if (subjName && !subjectByTeacher.has(row.teacher_id))
      subjectByTeacher.set(row.teacher_id, subjName);
  }
  const countBy = (rows: { teacher_id: string | null }[] | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      if (!r.teacher_id) continue;
      m.set(r.teacher_id, (m.get(r.teacher_id) ?? 0) + 1);
    }
    return m;
  };
  const materialCount = countBy(materials);
  const assignmentCount = countBy(assignments);

  return (teachers ?? []).map((t) => ({
    id: t.id,
    name: t.full_name,
    nip: t.nip as string | null,
    subject: subjectByTeacher.get(t.id) ?? "-",
    materials: materialCount.get(t.id) ?? 0,
    quizzes: assignmentCount.get(t.id) ?? 0,
  }));
}

export async function getPrincipal() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, nip")
    .eq("role", "principal")
    .maybeSingle();
  return data;
}

export async function countUsersByRole() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role");
  const counts = { student: 0, teacher: 0, principal: 0, admin: 0 };
  for (const row of data ?? []) counts[row.role as keyof typeof counts]++;
  return counts;
}
