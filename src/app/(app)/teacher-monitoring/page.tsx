import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherMonitoringData } from "@/lib/data/teacher-monitoring";
import { TeacherMonitoringView } from "./TeacherMonitoringView";

export default async function TeacherMonitoringPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "principal") redirect("/dashboard");

  const data = await getTeacherMonitoringData();

  return <TeacherMonitoringView data={data} />;
}
