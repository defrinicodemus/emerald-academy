import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { getSubjectsExplorerData } from "@/lib/data/subjects";
import { SubjectsExplorer } from "./SubjectsExplorer";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getSubjectsExplorerData(user.classId ?? null);

  return <SubjectsExplorer {...data} />;
}
