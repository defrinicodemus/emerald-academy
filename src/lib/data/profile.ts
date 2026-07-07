import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/lib/auth-context";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, nisn, nip, avatar_emoji, class_id, classes!profiles_class_id_fkey(name)")
    .eq("id", user.id)
    .single();
  if (error) console.error("getCurrentUser: profile fetch failed", error);
  if (!profile) return null;

  const cls = profile.classes as unknown as { name: string } | null;

  return {
    id: profile.id,
    name: profile.full_name,
    role: profile.role,
    nisn: profile.nisn ?? undefined,
    nip: profile.nip ?? undefined,
    classId: profile.class_id ?? undefined,
    className: cls?.name ?? undefined,
    avatar: profile.avatar_emoji ?? undefined,
  };
});
