import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { getClassMonitoringDetail } from "@/lib/data/monitoring";
import { ClassDetailView } from "./ClassDetailView";

export default async function ClassMonitoringDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "principal") redirect("/dashboard");

  const { classId } = await params;
  const data = await getClassMonitoringDetail(classId);
  if (!data) notFound();

  return <ClassDetailView data={data} />;
}
