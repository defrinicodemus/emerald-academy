import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth/guard";
import { getStudentAttendance } from "@/lib/data/attendance";
import { MyAttendanceView } from "./MyAttendanceView";

export default async function MyAttendancePage() {
  const user = await requireRole(["student"]);

  const subjects = await getStudentAttendance(user.id, user.classId ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🗓️"
        title="Presensi Saya"
        subtitle="Pantau tingkat kehadiran dan kedisiplinan belajarmu di sini. Pertahankan konsistensimu untuk hasil terbaik."
      />
      <MyAttendanceView subjects={subjects} />
    </div>
  );
}
