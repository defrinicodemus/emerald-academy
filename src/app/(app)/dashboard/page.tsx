import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import {
  getStudentDashboardData,
  getPrincipalDashboardData,
  getAdminDashboardData,
} from "@/lib/data/dashboard";
import { getSchool } from "@/lib/data/school";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { PrincipalDashboard } from "@/components/dashboards/PrincipalDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const metadata: Metadata = { title: "Beranda — LMS Nggodimeda" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    const data = await getStudentDashboardData(user.id, user.classId ?? null);
    return <StudentDashboard data={data} />;
  }

  if (user.role === "teacher") {
    const [school, combos] = await Promise.all([getSchool(), getTeacherClassSubjects(user.id)]);
    return (
      <TeacherDashboard userName={user.name} schoolName={school?.name ?? null} combos={combos} />
    );
  }

  if (user.role === "principal") {
    const data = await getPrincipalDashboardData();
    return <PrincipalDashboard data={data} />;
  }

  const data = await getAdminDashboardData();
  return <AdminDashboard data={data} />;
}
