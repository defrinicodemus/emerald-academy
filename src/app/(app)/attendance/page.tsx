import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getFilledMeetingNumbers } from "@/lib/data/attendance";
import { AttendanceManager } from "./AttendanceManager";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const combos = await getTeacherClassSubjects(user.id);
  const filledList = await Promise.all(
    combos.map((c) => getFilledMeetingNumbers(c.classId, c.subjectId)),
  );
  const filledMeetingsByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, filledList[i]]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🗓️"
        title="Presensi & Jurnal Mengajar"
        subtitle="Absensi siswa dan catatan harian per pertemuan"
      />
      {combos.length === 0 ? (
        <Card className="rounded-3xl border-0 p-10 text-center shadow-soft">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Anda belum ditugaskan mengajar kelas/mata pelajaran manapun. Hubungi admin untuk
            penugasan lewat Master Kelas.
          </p>
        </Card>
      ) : (
        <AttendanceManager combos={combos} filledMeetingsByKey={filledMeetingsByKey} />
      )}
    </div>
  );
}
