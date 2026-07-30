"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/profile";
import { assertRole } from "@/lib/auth/guard";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getOrCreatePlanId(
  supabase: SupabaseClient,
  classId: string,
  subjectId: string,
  teacherId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("curriculum_plans")
    .select("id")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("curriculum_plans")
    .insert({ class_id: classId, subject_id: subjectId, teacher_id: teacherId })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}

export async function saveCurriculumPlan(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const cpText = String(formData.get("cp_text") ?? "").trim();
  if (!classId || !subjectId) {
    return { ok: false, message: "Kelas dan mata pelajaran wajib dipilih." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("curriculum_plans").upsert(
    {
      class_id: classId,
      subject_id: subjectId,
      teacher_id: currentUser.id,
      cp_text: cpText || null,
    },
    { onConflict: "class_id,subject_id" },
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/curriculum");
  return { ok: true, message: "Capaian Pembelajaran berhasil disimpan." };
}

export async function addLearningObjective(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!classId || !subjectId || !title) {
    return { ok: false, message: "Judul TP wajib diisi." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "teacher") {
    return { ok: false, message: "Tidak diizinkan." };
  }

  const supabase = await createClient();
  const planId = await getOrCreatePlanId(supabase, classId, subjectId, currentUser.id);
  if (!planId) return { ok: false, message: "Gagal menyiapkan dokumen ATP." };

  const { count } = await supabase
    .from("learning_objectives")
    .select("id", { count: "exact", head: true })
    .eq("curriculum_plan_id", planId);

  const { error } = await supabase
    .from("learning_objectives")
    .insert({ curriculum_plan_id: planId, title, sort_order: count ?? 0 });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/curriculum");
  return { ok: true, message: "Tujuan Pembelajaran berhasil ditambahkan." };
}

export async function updateLearningObjective(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  const roleError = assertRole(currentUser, ["teacher"]);
  if (roleError) return roleError;

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return { ok: false, message: "Judul TP wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.from("learning_objectives").update({ title }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/curriculum");
  return { ok: true, message: "Tujuan Pembelajaran berhasil diperbarui." };
}

export async function deleteLearningObjective(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  const roleError = assertRole(currentUser, ["teacher"]);
  if (roleError) return roleError;

  const supabase = await createClient();
  const { error } = await supabase.from("learning_objectives").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/curriculum");
  return { ok: true, message: "Tujuan Pembelajaran berhasil dihapus." };
}

export async function moveLearningObjective(
  id: string,
  direction: "up" | "down",
): Promise<{ ok: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  const roleError = assertRole(currentUser, ["teacher"]);
  if (roleError) return roleError;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("learning_objectives")
    .select("id, curriculum_plan_id")
    .eq("id", id)
    .single();
  if (!current) return { ok: false, message: "TP tidak ditemukan." };

  const { data: siblings } = await supabase
    .from("learning_objectives")
    .select("id, sort_order")
    .eq("curriculum_plan_id", current.curriculum_plan_id)
    .order("sort_order");
  if (!siblings) return { ok: false, message: "Gagal memuat urutan TP." };

  const idx = siblings.findIndex((s) => s.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) {
    return { ok: true, message: "Urutan tidak berubah." };
  }

  const a = siblings[idx];
  const b = siblings[swapIdx];
  await supabase.from("learning_objectives").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("learning_objectives").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/curriculum");
  return { ok: true, message: "Urutan TP diperbarui." };
}
