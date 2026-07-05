import { createClient } from "@/lib/supabase/server";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export async function listAnnouncements(limit?: number): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data ?? [];
}
