"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/profile";

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
