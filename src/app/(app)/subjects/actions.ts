"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/profile";
import { getQuizForStudent, type StudentQuizData } from "@/lib/data/subjects";

export async function markMaterialViewed(materialId: string): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "student") return;

  const supabase = await createClient();
  await supabase
    .from("material_views")
    .upsert(
      { material_id: materialId, student_id: currentUser.id },
      { onConflict: "material_id,student_id", ignoreDuplicates: true },
    );

  revalidatePath("/subjects");
}

export async function submitAssignment(
  assignmentId: string,
  content: string,
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "student") {
    return { ok: false, message: "Tidak diizinkan." };
  }
  if (!content.trim()) {
    return { ok: false, message: "Jawaban tidak boleh kosong." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("submissions")
    .select("status")
    .eq("assignment_id", assignmentId)
    .eq("student_id", currentUser.id)
    .maybeSingle();

  if (existing?.status === "graded") {
    return { ok: false, message: "Tugas ini sudah dinilai dan tidak bisa diubah lagi." };
  }

  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: currentUser.id,
      content_url: content.trim(),
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/subjects");
  return { ok: true, message: "Tugas berhasil dikirim!" };
}

export async function fetchQuizForStudent(assignmentId: string): Promise<StudentQuizData | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "student") return null;
  return getQuizForStudent(assignmentId, currentUser.id);
}

interface QuizAnswerInput {
  questionId: string;
  selectedOptionId?: string;
  shortAnswerText?: string;
}

export async function submitQuizAnswers(
  assignmentId: string,
  answers: QuizAnswerInput[],
): Promise<{ ok: boolean; message: string; score?: number }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "student") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("submissions")
    .select("status")
    .eq("assignment_id", assignmentId)
    .eq("student_id", currentUser.id)
    .maybeSingle();
  if (existing?.status === "graded") {
    return { ok: false, message: "Kuis ini sudah pernah kamu kerjakan." };
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question_type, correct_answer_text, quiz_options(id, is_correct)")
    .eq("assignment_id", assignmentId);

  if (!questions || questions.length === 0) {
    return { ok: false, message: "Soal tidak ditemukan." };
  }

  let correctCount = 0;
  for (const q of questions) {
    const ans = answers.find((a) => a.questionId === q.id);
    if (!ans) continue;
    if (q.question_type === "multiple_choice") {
      const options = q.quiz_options as unknown as { id: string; is_correct: boolean }[];
      const correctOption = options.find((o) => o.is_correct);
      if (correctOption && ans.selectedOptionId === correctOption.id) correctCount++;
    } else if (q.correct_answer_text) {
      if (
        (ans.shortAnswerText ?? "").trim().toLowerCase() ===
        q.correct_answer_text.trim().toLowerCase()
      ) {
        correctCount++;
      }
    }
  }
  const score = Math.round((correctCount / questions.length) * 100);
  const now = new Date().toISOString();

  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: currentUser.id,
      status: "graded",
      score,
      submitted_at: now,
      graded_at: now,
    },
    { onConflict: "assignment_id,student_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/subjects");
  return { ok: true, message: "Kuis berhasil dikumpulkan!", score };
}
