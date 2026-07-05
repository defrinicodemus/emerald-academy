import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { getSubjectsExplorerData } from "@/lib/data/subjects";
import { SubjectsExplorer } from "./SubjectsExplorer";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("class_id").eq("id", user.id).single();
  const data = await getSubjectsExplorerData(profile?.class_id ?? null);

  return <SubjectsExplorer {...data} />;
}
