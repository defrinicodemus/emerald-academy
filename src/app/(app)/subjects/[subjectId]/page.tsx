import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getSubjectsExplorerData } from "@/lib/data/subjects";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "../BackButton";
import { SubjectDetailView } from "./SubjectDetailView";

const VALID_TABS = ["materi", "tugas", "kuis"] as const;

export default async function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole(["student"]);
  const { subjectId } = await params;
  const { tab } = await searchParams;

  const data = await getSubjectsExplorerData(user.classId ?? null, user.id);
  const subject = data.subjects.find((s) => s.id === subjectId);
  if (!subject) notFound();

  const initialTab = (VALID_TABS as readonly string[]).includes(tab ?? "")
    ? (tab as (typeof VALID_TABS)[number])
    : "materi";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={subject.emoji ?? "📚"}
        title={subject.name}
        subtitle="Materi, tugas, dan kuis untuk pelajaran ini"
        action={<BackButton href="/subjects" />}
      />
      <SubjectDetailView
        initialTab={initialTab}
        materials={data.materialsBySubject[subject.id] ?? []}
        tugas={data.tugasBySubject[subject.id] ?? []}
        kuis={data.kuisBySubject[subject.id] ?? []}
      />
    </div>
  );
}
