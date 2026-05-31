import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { PrincipalDashboard } from "@/components/dashboards/PrincipalDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — LMS Nggodimeda" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "teacher") return <TeacherDashboard />;
  if (user.role === "principal") return <PrincipalDashboard />;
  return <AdminDashboard />;
}
