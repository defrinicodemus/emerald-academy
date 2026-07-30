import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getMaterialForStudent } from "@/lib/data/subjects";
import { markMaterialViewed } from "../../actions";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "../../BackButton";
import { MaterialContentView } from "./MaterialContentView";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const user = await requireRole(["student"]);
  const { materialId } = await params;

  const material = await getMaterialForStudent(materialId, user.id);
  if (!material) notFound();

  if (!material.viewed) {
    await markMaterialViewed(material.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title={material.title}
        subtitle={
          material.learningObjectiveTitle
            ? `Capaian: ${material.learningObjectiveTitle}`
            : undefined
        }
        action={<BackButton href={`/subjects/${material.subjectId}?tab=materi`} />}
      />
      <MaterialContentView material={material} />
    </div>
  );
}
