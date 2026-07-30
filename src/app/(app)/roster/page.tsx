import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getClassRoster } from "@/lib/data/roster";
import { RosterManager } from "./RosterManager";

export default async function RosterPage() {
  const user = await requireRole(["teacher"]);

  const combos = await getTeacherClassSubjects(user.id);
  const rosterList = await Promise.all(combos.map((c) => getClassRoster(c.classId, c.subjectId)));
  const rosterByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, rosterList[i]]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon="👨‍👩‍👧‍👦"
        title="Kelola Siswa & Kelas"
        subtitle="Pantau progres dan status pengumpulan tugas siswa"
        rounded="blunt"
      />
      {combos.length === 0 ? (
        <Card className="rounded-md border-0 p-10 text-center shadow-soft">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Anda belum ditugaskan mengajar kelas/mata pelajaran manapun. Hubungi admin untuk
            penugasan lewat Master Kelas.
          </p>
        </Card>
      ) : (
        <RosterManager combos={combos} rosterByKey={rosterByKey} />
      )}
    </div>
  );
}
