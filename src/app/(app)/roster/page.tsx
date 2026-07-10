import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getClassRoster } from "@/lib/data/roster";
import { RosterManager } from "./RosterManager";

export default async function RosterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      />
      {combos.length === 0 ? (
        <Card className="rounded-3xl border-0 p-10 text-center shadow-soft">
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
