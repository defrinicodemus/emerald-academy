import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getTeacherDetail } from "@/lib/data/teacher-monitoring";
import { TeacherDetailView } from "./TeacherDetailView";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  await requireRole(["principal"]);

  const { teacherId } = await params;
  const teacher = await getTeacherDetail(teacherId);
  if (!teacher) notFound();

  return <TeacherDetailView teacher={teacher} />;
}
