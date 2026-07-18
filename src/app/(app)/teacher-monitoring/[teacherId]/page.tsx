import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherDetail } from "@/lib/data/teacher-monitoring";
import { TeacherDetailView } from "./TeacherDetailView";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "principal") redirect("/dashboard");

  const { teacherId } = await params;
  const teacher = await getTeacherDetail(teacherId);
  if (!teacher) notFound();

  return <TeacherDetailView teacher={teacher} />;
}
