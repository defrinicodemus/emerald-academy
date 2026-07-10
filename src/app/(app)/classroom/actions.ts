"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/data/profile";

const MATERIAL_KINDS = ["pdf", "video", "text", "image"];

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export async function createMaterial(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");

  if (!classId || !subjectId || !title) {
    return { ok: false, message: "Kelas, mata pelajaran, dan judul wajib diisi." };
  }
  if (!MATERIAL_KINDS.includes(kind)) {
    return { ok: false, message: "Jenis materi tidak valid." };
  }
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  let url: string | null = null;
  let content: string | null = null;

  if (kind === "text") {
    content = String(formData.get("content") ?? "").trim();
    if (!content) return { ok: false, message: "Isi materi teks wajib diisi." };
  } else if (kind === "video") {
    const rawUrl = String(formData.get("url") ?? "").trim();
    const videoId = extractYoutubeId(rawUrl);
    if (!videoId) return { ok: false, message: "Tautan YouTube tidak valid." };
    url = `https://www.youtube.com/embed/${videoId}`;
  } else {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, message: "Pilih file untuk diunggah." };

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${classId}/${subjectId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("learning-materials")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) return { ok: false, message: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from("learning-materials").getPublicUrl(path);
    url = publicUrl;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    class_id: classId,
    subject_id: subjectId,
    teacher_id: currentUser.id,
    title,
    kind,
    url,
    content,
    learning_objective_id: learningObjectiveId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Materi berhasil ditambahkan." };
}

export async function updateMaterial(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");
  if (!id || !title) return { ok: false, message: "Judul wajib diisi." };
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({ title, learning_objective_id: learningObjectiveId })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Materi berhasil diperbarui." };
}

export async function deleteMaterial(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Materi berhasil dihapus." };
}

const ASSIGNMENT_KINDS = ["essay", "photo", "audio", "text"];

export async function createAssignment(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");

  if (!classId || !subjectId || !title) {
    return { ok: false, message: "Kelas, mata pelajaran, dan judul wajib diisi." };
  }
  if (!ASSIGNMENT_KINDS.includes(kind)) {
    return { ok: false, message: "Jenis tugas tidak valid." };
  }
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    subject_id: subjectId,
    teacher_id: currentUser.id,
    title,
    kind,
    description: description || null,
    due_at: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
    learning_objective_id: learningObjectiveId,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Tugas berhasil ditambahkan." };
}

export async function updateAssignment(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");
  if (!id || !title) return { ok: false, message: "Judul wajib diisi." };
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({
      title,
      description: description || null,
      due_at: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
      learning_objective_id: learningObjectiveId,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Tugas berhasil diperbarui." };
}

export async function deleteAssignment(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", id);
  if (count) {
    return {
      ok: false,
      message: `Tidak bisa dihapus — sudah ada ${count} submisi siswa untuk tugas ini.`,
    };
  }

  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Tugas berhasil dihapus." };
}

export async function createQuiz(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");

  if (!classId || !subjectId || !title) {
    return { ok: false, message: "Kelas, mata pelajaran, dan judul wajib diisi." };
  }
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    subject_id: subjectId,
    teacher_id: currentUser.id,
    title,
    kind: "quiz",
    description: description || null,
    due_at: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
    learning_objective_id: learningObjectiveId,
    is_published: false,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Kuis berhasil dibuat sebagai draf." };
}

export async function publishQuiz(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", id);
  if (!count) {
    return { ok: false, message: "Tambahkan minimal 1 soal sebelum mengunggah kuis." };
  }

  const { error } = await supabase.from("assignments").update({ is_published: true }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Kuis berhasil diunggah dan sekarang bisa dikerjakan siswa." };
}

export async function updateQuiz(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueAtRaw = String(formData.get("due_at") ?? "").trim();
  const learningObjectiveId = String(formData.get("learning_objective_id") ?? "");
  if (!id || !title) return { ok: false, message: "Judul wajib diisi." };
  if (!learningObjectiveId) {
    return { ok: false, message: "Tujuan Pembelajaran (TP) wajib dipilih." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({
      title,
      description: description || null,
      due_at: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
      learning_objective_id: learningObjectiveId,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Kuis berhasil diperbarui." };
}

export async function deleteQuiz(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", id);
  if (count) {
    return {
      ok: false,
      message: `Tidak bisa dihapus — sudah ada ${count} submisi siswa untuk kuis ini.`,
    };
  }

  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Kuis berhasil dihapus." };
}

const QUESTION_TYPES = ["multiple_choice", "short_answer"];

export async function addQuizQuestion(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const questionText = String(formData.get("question_text") ?? "").trim();
  const questionType = String(formData.get("question_type") ?? "");

  if (!assignmentId || !questionText) {
    return { ok: false, message: "Pertanyaan wajib diisi." };
  }
  if (!QUESTION_TYPES.includes(questionType)) {
    return { ok: false, message: "Tipe soal tidak valid." };
  }

  const supabase = await createClient();

  let correctAnswerText: string | null = null;
  let options: { text: string; isCorrect: boolean }[] = [];

  if (questionType === "short_answer") {
    correctAnswerText = String(formData.get("correct_answer_text") ?? "").trim();
    if (!correctAnswerText) {
      return { ok: false, message: "Jawaban benar wajib diisi untuk soal isian singkat." };
    }
  } else {
    const optionTexts = formData.getAll("option_text").map((v) => String(v).trim());
    const correctIndex = Number(formData.get("correct_index") ?? -1);
    const filledCount = optionTexts.filter((t) => t.length > 0).length;
    if (filledCount < 2) {
      return { ok: false, message: "Pilihan ganda wajib punya minimal 2 opsi." };
    }
    if (correctIndex < 0 || correctIndex >= optionTexts.length || !optionTexts[correctIndex]) {
      return { ok: false, message: "Pilih salah satu opsi sebagai jawaban benar." };
    }
    options = optionTexts
      .map((text, i) => ({ text, isCorrect: i === correctIndex }))
      .filter((o) => o.text.length > 0);
  }

  const { count } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("assignment_id", assignmentId);

  const { data: question, error } = await supabase
    .from("quiz_questions")
    .insert({
      assignment_id: assignmentId,
      question_text: questionText,
      question_type: questionType,
      correct_answer_text: correctAnswerText,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  if (options.length > 0) {
    const { error: optionsError } = await supabase.from("quiz_options").insert(
      options.map((o, i) => ({
        question_id: question.id,
        option_text: o.text,
        is_correct: o.isCorrect,
        sort_order: i,
      })),
    );
    if (optionsError) return { ok: false, message: optionsError.message };
  }

  revalidatePath("/classroom");
  return { ok: true, message: "Soal berhasil ditambahkan." };
}

export async function updateQuizQuestion(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const id = String(formData.get("id") ?? "");
  const questionText = String(formData.get("question_text") ?? "").trim();
  if (!id || !questionText) return { ok: false, message: "Pertanyaan wajib diisi." };

  const update: { question_text: string; correct_answer_text?: string | null } = {
    question_text: questionText,
  };
  if (formData.has("correct_answer_text")) {
    update.correct_answer_text = String(formData.get("correct_answer_text") ?? "").trim() || null;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").update(update).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Soal berhasil diperbarui." };
}

export async function deleteQuizQuestion(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/classroom");
  return { ok: true, message: "Soal berhasil dihapus." };
}

export async function moveQuizQuestion(
  id: string,
  direction: "up" | "down",
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("quiz_questions")
    .select("id, assignment_id")
    .eq("id", id)
    .single();
  if (!current) return { ok: false, message: "Soal tidak ditemukan." };

  const { data: siblings } = await supabase
    .from("quiz_questions")
    .select("id, sort_order")
    .eq("assignment_id", current.assignment_id)
    .order("sort_order");
  if (!siblings) return { ok: false, message: "Gagal memuat urutan soal." };

  const idx = siblings.findIndex((s) => s.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) {
    return { ok: true, message: "Urutan tidak berubah." };
  }

  const a = siblings[idx];
  const b = siblings[swapIdx];
  await supabase.from("quiz_questions").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("quiz_questions").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/classroom");
  return { ok: true, message: "Urutan soal diperbarui." };
}
