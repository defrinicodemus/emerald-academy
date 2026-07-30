import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getAssignmentForStudent } from "@/lib/data/subjects";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "../../BackButton";
import { TugasDetailContent } from "./TugasDetailContent";

export default async function TugasDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await requireRole(["student"]);
  const { assignmentId } = await params;

  const assignment = await getAssignmentForStudent(assignmentId, user.id);
  if (!assignment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📝"
        title={assignment.title}
        subtitle={
          assignment.learningObjectiveTitle
            ? `Capaian: ${assignment.learningObjectiveTitle}`
            : undefined
        }
        action={<BackButton href={`/subjects/${assignment.subjectId}?tab=tugas`} />}
      />
      <TugasDetailContent assignment={assignment} />
    </div>
  );
}
