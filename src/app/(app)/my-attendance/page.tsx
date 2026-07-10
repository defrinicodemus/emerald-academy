import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/data/profile";
import { getStudentAttendance } from "@/lib/data/attendance";
import { MyAttendanceView } from "./MyAttendanceView";

export default async function MyAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subjects = await getStudentAttendance(user.id, user.classId ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🗓️"
        title="Presensi Saya"
        subtitle="Riwayat kehadiran kamu per mata pelajaran"
      />
      <MyAttendanceView subjects={subjects} />
    </div>
  );
}
