"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/profile";

export async function gradeSubmission(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const submissionId = String(formData.get("submission_id") ?? "");
  const scoreRaw = String(formData.get("score") ?? "").trim();
  const comment = String(formData.get("teacher_comment") ?? "").trim();

  if (!submissionId) return { ok: false, message: "Submisi tidak valid." };

  const score = Number(scoreRaw);
  if (!scoreRaw || !Number.isFinite(score) || score < 0 || score > 100) {
    return { ok: false, message: "Nilai harus berupa angka 0-100." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("submissions")
    .select("assignment_id, assignments(class_id, subject_id)")
    .eq("id", submissionId)
    .single();
  if (!submission) return { ok: false, message: "Submisi tidak ditemukan." };

  const assignment = submission.assignments as unknown as {
    class_id: string;
    subject_id: string;
  } | null;
  if (assignment) {
    const { data: lock } = await supabase
      .from("gradebook_locks")
      .select("id")
      .eq("class_id", assignment.class_id)
      .eq("subject_id", assignment.subject_id)
      .maybeSingle();
    if (lock) {
      return {
        ok: false,
        message: "Buku nilai untuk kelas & mapel ini sudah dikunci, nilai tidak bisa diubah.",
      };
    }
  }

  const { error } = await supabase
    .from("submissions")
    .update({
      score,
      teacher_comment: comment || null,
      status: "graded",
      graded_at: new Date().toISOString(),
      graded_by: currentUser.id,
    })
    .eq("id", submissionId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/assessments");
  return { ok: true, message: "Nilai berhasil disimpan." };
}
