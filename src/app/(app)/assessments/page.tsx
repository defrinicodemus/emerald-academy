import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/profile";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getReviewAssignments, getAssignmentSubmissions, getQuizResults } from "@/lib/data/review";
import { ReviewPageClient } from "./ReviewPageClient";

export default async function AssessmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const combos = await getTeacherClassSubjects(user.id);
  const [assignmentsList, quizResultsList] = await Promise.all([
    Promise.all(combos.map((c) => getReviewAssignments(c.classId, c.subjectId))),
    Promise.all(combos.map((c) => getQuizResults(c.classId, c.subjectId))),
  ]);

  const assignmentsByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, assignmentsList[i]]),
  );
  const quizResultsByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, quizResultsList[i]]),
  );

  const allAssignments = assignmentsList.flat();
  const submissionsList = await Promise.all(
    combos.flatMap((c, i) =>
      assignmentsList[i].map((a) => getAssignmentSubmissions(a.id, c.classId)),
    ),
  );
  const submissionsByAssignmentId = Object.fromEntries(
    allAssignments.map((a, i) => [a.id, submissionsList[i]]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📝"
        title="Ruang Periksa"
        subtitle="Periksa tugas manual dan pantau hasil kuis otomatis"
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
        <ReviewPageClient
          combos={combos}
          assignmentsByKey={assignmentsByKey}
          submissionsByAssignmentId={submissionsByAssignmentId}
          quizResultsByKey={quizResultsByKey}
        />
      )}
    </div>
  );
}
