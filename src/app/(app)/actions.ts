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

  const { data: reward } = await supabase.from("rewards").select("id, cost").eq("id", rewardId).single();
  if (!reward) return;

  await supabase.from("reward_redemptions").insert({
    student_id: user.id,
    reward_id: reward.id,
    cost: reward.cost,
    status: "pending",
  });
  revalidatePath("/rewards");
}
