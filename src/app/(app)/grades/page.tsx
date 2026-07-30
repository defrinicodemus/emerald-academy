import { requireRole } from "@/lib/auth/guard";
import { getStudentGrades } from "@/lib/data/gradebook";
import { getSchoolReportData } from "@/lib/data/schoolReport";
import { StudentGradesView } from "./StudentGradesView";
import { SchoolGradesReport } from "./SchoolGradesReport";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ yearId?: string }>;
}) {
  const user = await requireRole(["student", "principal"]);

  if (user.role === "student") {
    const subjects = await getStudentGrades(user.id, user.classId ?? null);
    return <StudentGradesView subjects={subjects} />;
  }

  const { yearId } = await searchParams;
  const data = await getSchoolReportData(yearId);
  return <SchoolGradesReport data={data} />;
}
