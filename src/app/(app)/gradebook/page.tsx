import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getGradebookData } from "@/lib/data/gradebook";
import { GradebookManager } from "./GradebookManager";

export default async function GradebookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const combos = await getTeacherClassSubjects(user.id);
  const gradebookList = await Promise.all(
    combos.map((c) => getGradebookData(c.classId, c.subjectId)),
  );
  const gradebookByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, gradebookList[i]]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🏆"
        title="Buku Nilai"
        subtitle="Rekapitulasi nilai rapor per Tujuan Pembelajaran"
      />
      {combos.length === 0 ? (
        <Card className="rounded-3xl border-0 p-10 text-center shadow-soft">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Anda belum ditugaskan mengajar kelas/mata pelajaran manapun. Hubungi admin untuk
            penugasan lewat Master Kelas.
          </p>
        </Card>
      ) : (
        <GradebookManager combos={combos} gradebookByKey={gradebookByKey} />
      )}
    </div>
  );
}
