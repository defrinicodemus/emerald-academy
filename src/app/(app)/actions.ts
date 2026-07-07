"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function publishAnnouncement(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  if (!user || !school) return;

  await supabase.from("announcements").insert({
    school_id: school.id,
    author_id: user.id,
    title,
    body,
  });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
}

export async function saveSchoolSettings(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  if (!school) return;

  await supabase.from("schools").update({ name, address, phone }).eq("id", school.id);
  revalidatePath("/settings");
}

export async function createClass(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = Number(formData.get("grade_level"));
  const academicYearId = String(formData.get("academic_year_id") ?? "");
  if (!name || !gradeLevel || !academicYearId) return;

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  if (!school) return;

  await supabase.from("classes").insert({
    school_id: school.id,
    academic_year_id: academicYearId,
    name,
    grade_level: gradeLevel,
  });
  revalidatePath("/academic");
}

export async function updateClass(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = Number(formData.get("grade_level"));
  if (!id || !name || !gradeLevel) return;

  const supabase = await createClient();
  await supabase.from("classes").update({ name, grade_level: gradeLevel }).eq("id", id);
  revalidatePath("/academic");
}

export async function deleteClass(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const [
    { count: students },
    { count: materials },
    { count: assignments },
    { count: grades },
    { count: teacherAssignments },
    { count: announcements },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("class_id", id),
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("class_id", id),
    supabase.from("assignments").select("id", { count: "exact", head: true }).eq("class_id", id),
    supabase.from("grades").select("id", { count: "exact", head: true }).eq("class_id", id),
    supabase
      .from("class_teacher_subjects")
      .select("id", { count: "exact", head: true })
      .eq("class_id", id),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("target_class_id", id),
  ]);

  const blockers: string[] = [];
  if (students) blockers.push(`${students} siswa`);
  if (materials) blockers.push(`${materials} materi`);
  if (assignments) blockers.push(`${assignments} tugas`);
  if (grades) blockers.push(`${grades} nilai`);
  if (teacherAssignments) blockers.push(`${teacherAssignments} penugasan guru`);
  if (announcements) blockers.push(`${announcements} pengumuman`);

  if (blockers.length > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus — masih dipakai oleh ${blockers.join(", ")}.`,
    };
  }

  await supabase.from("classes").delete().eq("id", id);
  revalidatePath("/academic");
  return { ok: true, message: "Kelas berhasil dihapus." };
}

export async function deleteSubject(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const [
    { count: materials },
    { count: assignments },
    { count: grades },
    { count: assignedTeachers },
  ] = await Promise.all([
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("subject_id", id),
    supabase.from("assignments").select("id", { count: "exact", head: true }).eq("subject_id", id),
    supabase.from("grades").select("id", { count: "exact", head: true }).eq("subject_id", id),
    supabase
      .from("class_teacher_subjects")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", id),
  ]);

  const blockers: string[] = [];
  if (materials) blockers.push(`${materials} materi`);
  if (assignments) blockers.push(`${assignments} tugas`);
  if (grades) blockers.push(`${grades} nilai`);
  if (assignedTeachers) blockers.push(`${assignedTeachers} penugasan guru`);

  if (blockers.length > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus — masih dipakai oleh ${blockers.join(", ")}.`,
    };
  }

  await supabase.from("subjects").delete().eq("id", id);
  revalidatePath("/academic");
  return { ok: true, message: "Mata pelajaran berhasil dihapus." };
}

export async function deleteAcademicYear(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const { data: year } = await supabase
    .from("academic_years")
    .select("is_active")
    .eq("id", id)
    .single();
  if (year?.is_active) {
    return {
      ok: false,
      message:
        "Tidak bisa menghapus tahun ajaran yang sedang aktif. Aktifkan tahun ajaran lain dulu.",
    };
  }

  const { count: classes } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", id);

  if (classes) {
    return { ok: false, message: `Tidak bisa dihapus — masih dipakai oleh ${classes} kelas.` };
  }

  await supabase.from("academic_years").delete().eq("id", id);
  revalidatePath("/academic");
  return { ok: true, message: "Tahun ajaran berhasil dihapus." };
}

const SUBJECT_COLOR_PALETTE = [
  "oklch(0.78 0.14 50)",
  "oklch(0.7 0.14 195)",
  "oklch(0.7 0.16 25)",
  "oklch(0.65 0.18 145)",
  "oklch(0.72 0.12 280)",
  "oklch(0.72 0.16 330)",
];

export async function createSubject(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();
  if (!code || !name) return;

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  if (!school) return;

  const { count } = await supabase
    .from("subjects")
    .select("id", { count: "exact", head: true })
    .eq("school_id", school.id);
  const color = SUBJECT_COLOR_PALETTE[(count ?? 0) % SUBJECT_COLOR_PALETTE.length];

  await supabase.from("subjects").insert({
    school_id: school.id,
    code,
    name,
    emoji: emoji || null,
    color,
  });
  revalidatePath("/academic");
}

export async function updateSubject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("subjects")
    .update({ name, emoji: emoji || null })
    .eq("id", id);
  revalidatePath("/academic");
}

export async function setClassSubjectTeacher(formData: FormData) {
  const classId = String(formData.get("class_id") ?? "");
  const subjectId = String(formData.get("subject_id") ?? "");
  const teacherId = String(formData.get("teacher_id") ?? "");
  if (!classId || !subjectId) return;

  const supabase = await createClient();
  if (!teacherId) {
    await supabase
      .from("class_teacher_subjects")
      .delete()
      .eq("class_id", classId)
      .eq("subject_id", subjectId);
  } else {
    await supabase
      .from("class_teacher_subjects")
      .upsert(
        { class_id: classId, subject_id: subjectId, teacher_id: teacherId },
        { onConflict: "class_id,subject_id" },
      );
  }
  revalidatePath("/master-kelas");
}

export async function assignStudentToClass(formData: FormData) {
  const studentId = String(formData.get("student_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");
  if (!studentId) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ class_id: classId || null })
    .eq("id", studentId);
  revalidatePath("/master-kelas");
  revalidatePath("/users");
}

export async function createAcademicYear(formData: FormData) {
  const yearLabel = String(formData.get("year_label") ?? "").trim();
  const semester = String(formData.get("semester") ?? "");
  if (!yearLabel || (semester !== "ganjil" && semester !== "genap")) return;

  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  if (!school) return;

  await supabase
    .from("academic_years")
    .insert({ school_id: school.id, year_label: yearLabel, semester });
  revalidatePath("/academic");
}

export async function setActiveAcademicYear(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("school_id")
    .eq("id", id)
    .single();
  if (!year) return;

  await supabase
    .from("academic_years")
    .update({ is_active: false })
    .eq("school_id", year.school_id);
  await supabase.from("academic_years").update({ is_active: true }).eq("id", id);
  revalidatePath("/academic");
}

export async function approveRedemption(redemptionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: redemption } = await supabase
    .from("reward_redemptions")
    .select("id, student_id, cost")
    .eq("id", redemptionId)
    .single();
  if (!redemption) return;

  await supabase
    .from("reward_redemptions")
    .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: user?.id })
    .eq("id", redemptionId);

  await supabase.from("stars_ledger").insert({
    student_id: redemption.student_id,
    delta: -redemption.cost,
    reason: "Penukaran hadiah disetujui",
    created_by: user?.id,
  });

  revalidatePath("/gamification");
}

export async function rejectRedemption(redemptionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("reward_redemptions")
    .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: user?.id })
    .eq("id", redemptionId);
  revalidatePath("/gamification");
}

export async function redeemReward(rewardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: reward } = await supabase
    .from("rewards")
    .select("id, cost")
    .eq("id", rewardId)
    .single();
  if (!reward) return;

  await supabase.from("reward_redemptions").insert({
    student_id: user.id,
    reward_id: reward.id,
    cost: reward.cost,
    status: "pending",
  });
  revalidatePath("/rewards");
}
