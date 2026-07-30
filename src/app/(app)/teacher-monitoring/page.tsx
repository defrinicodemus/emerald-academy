import { requireRole } from "@/lib/auth/guard";
import { getTeacherMonitoringData } from "@/lib/data/teacher-monitoring";
import { TeacherMonitoringView } from "./TeacherMonitoringView";

export default async function TeacherMonitoringPage() {
  await requireRole(["principal"]);

  const data = await getTeacherMonitoringData();

  return <TeacherMonitoringView data={data} />;
}
