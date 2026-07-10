import { createClient } from "@/lib/supabase/server";

export interface TeacherClassSubject {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export async function getTeacherClassSubjects(teacherId: string): Promise<TeacherClassSubject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_teacher_subjects")
    .select("class_id, subject_id, classes(name), subjects(name)")
    .eq("teacher_id", teacherId);

  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: (row.classes as unknown as { name: string } | null)?.name ?? "-",
      subjectId: row.subject_id,
      subjectName: (row.subjects as unknown as { name: string } | null)?.name ?? "-",
    }))
    .sort(
      (a, b) =>
        a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName),
    );
}

export async function listTeacherClasses(
  teacherId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_teacher_subjects")
    .select("class_id, classes(id, name)")
    .eq("teacher_id", teacherId);

  const byId = new Map<string, string>();
  for (const row of data ?? []) {
    const cls = row.classes as unknown as { id: string; name: string } | null;
    if (cls) byId.set(cls.id, cls.name);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
