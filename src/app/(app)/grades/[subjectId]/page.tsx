import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getStudentSubjectGradeDetail } from "@/lib/data/gradebook";
import { SubjectGradeDetailView } from "./SubjectGradeDetailView";

export default async function SubjectGradeDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const user = await requireRole(["student"]);
  if (!user.classId) redirect("/grades");

  const { subjectId } = await params;
  const detail = await getStudentSubjectGradeDetail(user.id, user.classId, subjectId);
  if (!detail) notFound();

  return <SubjectGradeDetailView detail={detail} />;
}
