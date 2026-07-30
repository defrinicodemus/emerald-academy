import { requireRole } from "@/lib/auth/guard";
import { getSubjectsExplorerData } from "@/lib/data/subjects";
import { SubjectsExplorer } from "./SubjectsExplorer";

export default async function SubjectsPage() {
  const user = await requireRole(["student"]);

  const data = await getSubjectsExplorerData(user.classId ?? null, user.id);

  return <SubjectsExplorer {...data} />;
}
