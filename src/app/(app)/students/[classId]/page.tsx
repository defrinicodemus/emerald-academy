import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getClassMonitoringDetail } from "@/lib/data/monitoring";
import { ClassDetailView } from "./ClassDetailView";

export default async function ClassMonitoringDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  await requireRole(["principal"]);

  const { classId } = await params;
  const data = await getClassMonitoringDetail(classId);
  if (!data) notFound();

  return <ClassDetailView data={data} />;
}
