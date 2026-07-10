import { PageHeader } from "@/components/PageHeader";
import { getAcademicStructure } from "@/lib/data/academic";
import { ClassesManager } from "./ClassesManager";
import { SubjectsManager } from "./SubjectsManager";
import { YearsManager } from "./YearsManager";
import { PromoteClassesPanel } from "./PromoteClassesPanel";

export default async function AcademicPage() {
  const { classes, subjects, years } = await getAcademicStructure();

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🏛️"
        title="Struktur Akademik"
        subtitle="Kelas, mata pelajaran, dan tahun ajaran"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassesManager classes={classes} years={years} />
        <SubjectsManager subjects={subjects} />
      </div>
      <YearsManager years={years} />
      <PromoteClassesPanel classes={classes} years={years} />
    </div>
  );
}
