import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { getStudentDashboardData, getPrincipalDashboardData, getAdminDashboardData } from "@/lib/data/dashboard";
import { listTeachersWithStats } from "@/lib/data/people";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { PrincipalDashboard } from "@/components/dashboards/PrincipalDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const metadata: Metadata = { title: "Beranda — LMS Nggodimeda" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("class_id").eq("id", user.id).single();
    const data = await getStudentDashboardData(user.id, profile?.class_id ?? null);
    return <StudentDashboard data={data} />;
  }

  if (user.role === "teacher") {
    return <TeacherDashboard />;
  }

  if (user.role === "principal") {
    const [data, teachers] = await Promise.all([getPrincipalDashboardData(), listTeachersWithStats()]);
    return <PrincipalDashboard data={data} teachers={teachers} />;
  }

  const data = await getAdminDashboardData();
  return <AdminDashboard data={data} />;
}
