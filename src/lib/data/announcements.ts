import { createClient } from "@/lib/supabase/server";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
}

export async function listAnnouncements(limit?: number): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select("id, title, body, category, created_at")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data ?? [];
}

export async function listAnnouncementsPage(
  page: number,
  pageSize: number,
): Promise<{ items: AnnouncementRow[]; totalCount: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("announcements")
    .select("id, title, body, category, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return { items: data ?? [], totalCount: count ?? 0 };
}

export async function getAnnouncementById(id: string): Promise<AnnouncementRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, category, created_at")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getNotificationsData(userId: string): Promise<{
  unreadCount: number;
  recent: AnnouncementRow[];
}> {
  const supabase = await createClient();
  const [{ data: profile }, recent] = await Promise.all([
    supabase.from("profiles").select("last_seen_announcements_at").eq("id", userId).single(),
    listAnnouncements(5),
  ]);

  const lastSeen = profile?.last_seen_announcements_at ?? new Date(0).toISOString();
  const { count } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .gt("created_at", lastSeen);

  return { unreadCount: count ?? 0, recent };
}
