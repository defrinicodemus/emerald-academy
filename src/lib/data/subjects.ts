import { createClient } from "@/lib/supabase/server";

export interface ContentRow {
  id: string;
  title: string;
  kind: string;
  due_at?: string | null;
}

export async function getSubjectsExplorerData(classId: string | null) {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, code, name, emoji, color")
    .order("name");

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

  return { subjects: subjects ?? [], materialsBySubject, assignmentsBySubject };
}
