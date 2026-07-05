import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/lib/auth-context";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, nisn, nip, avatar_emoji, class_id, classes(name)")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const cls = profile.classes as unknown as { name: string } | null;

  return {
    id: profile.id,
    name: profile.full_name,
    role: profile.role,
    nisn: profile.nisn ?? undefined,
    nip: profile.nip ?? undefined,
    className: cls?.name ?? undefined,
    avatar: profile.avatar_emoji ?? undefined,
  };
}
