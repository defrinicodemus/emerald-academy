import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/profile";
import { getStudentGrades } from "@/lib/data/gradebook";
import { StudentGradesView } from "./StudentGradesView";
import { SchoolGradesReport } from "./SchoolGradesReport";

export default async function GradesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "student") {
    const subjects = await getStudentGrades(user.id, user.classId ?? null);
    return <StudentGradesView subjects={subjects} />;
  }

  return <SchoolGradesReport />;
}
