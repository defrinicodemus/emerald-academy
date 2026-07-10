"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/profile";
import { getGradebookData, getStudentHistory, type StudentHistoryData } from "@/lib/data/gradebook";

export async function lockAndCalculateGrades(
  classId: string,
  subjectId: string,
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();

  const { data: existingLock } = await supabase
    .from("gradebook_locks")
    .select("id")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .maybeSingle();
  if (existingLock) {
    return { ok: false, message: "Buku nilai untuk kelas & mapel ini sudah dikunci sebelumnya." };
  }

  const { data: klass } = await supabase
    .from("classes")
    .select("academic_year_id")
    .eq("id", classId)
    .single();
  if (!klass) return { ok: false, message: "Kelas tidak ditemukan." };

  const gradebook = await getGradebookData(classId, subjectId);
  if (gradebook.tpColumns.length === 0) {
    return { ok: false, message: "Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini." };
  }
  if (gradebook.students.length === 0) {
    return { ok: false, message: "Belum ada siswa di kelas ini." };
  }

  const periodMonth = new Date().toISOString().slice(0, 10);
  const rows = gradebook.students.map((st) => {
    const values = gradebook.tpColumns
      .map((tp) => st.tpAverages[tp.id])
      .filter((v): v is number => v != null);
    const finalScore =
      values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return {
      student_id: st.studentId,
      subject_id: subjectId,
      class_id: classId,
      academic_year_id: klass.academic_year_id,
      period_month: periodMonth,
      score: finalScore,
      created_by: currentUser.id,
    };
  });

  const { error: insertError } = await supabase.from("grades").insert(rows);
  if (insertError) return { ok: false, message: insertError.message };

  const { error: lockError } = await supabase.from("gradebook_locks").insert({
    class_id: classId,
    subject_id: subjectId,
    locked_by: currentUser.id,
    period_month: periodMonth,
  });
  if (lockError) return { ok: false, message: lockError.message };

  revalidatePath("/gradebook");
  return { ok: true, message: "Nilai berhasil dikunci dan dihitung untuk semua siswa." };
}

export async function unlockGradebook(
  classId: string,
  subjectId: string,
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();

  const { data: lock } = await supabase
    .from("gradebook_locks")
    .select("id, period_month")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .maybeSingle();
  if (!lock) return { ok: false, message: "Buku nilai ini belum dikunci." };

  const { error: deleteGradesError } = await supabase
    .from("grades")
    .delete()
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("period_month", lock.period_month);
  if (deleteGradesError) return { ok: false, message: deleteGradesError.message };

  const { error: deleteLockError } = await supabase
    .from("gradebook_locks")
    .delete()
    .eq("id", lock.id);
  if (deleteLockError) return { ok: false, message: deleteLockError.message };

  revalidatePath("/gradebook");
  return {
    ok: true,
    message:
      "Kunci buku nilai berhasil dibuka. Nilai Akhir sebelumnya telah dihapus — nilai tugas/kuis individual tetap tersimpan dan bisa dinilai ulang.",
  };
}

export async function fetchStudentHistory(
  studentId: string,
  classId: string,
  subjectId: string,
): Promise<StudentHistoryData> {
  return getStudentHistory(studentId, classId, subjectId);
}
