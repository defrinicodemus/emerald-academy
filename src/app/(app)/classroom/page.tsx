import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth/guard";
import { getTeacherClassSubjects } from "@/lib/data/teaching";
import { getCurriculumPlan } from "@/lib/data/curriculum";
import {
  getClassroomMaterials,
  getClassroomAssignments,
  getClassroomQuizzes,
  getQuizQuestions,
} from "@/lib/data/classroom";
import { MaterialsTab } from "./MaterialsTab";
import { AssignmentsTab } from "./AssignmentsTab";
import { QuizzesTab } from "./QuizzesTab";

export default async function ClassroomPage() {
  const user = await requireRole(["teacher"]);

  const combos = await getTeacherClassSubjects(user.id);
  const [materialsList, assignmentsList, quizzesList, plansList] = await Promise.all([
    Promise.all(combos.map((c) => getClassroomMaterials(c.classId, c.subjectId))),
    Promise.all(combos.map((c) => getClassroomAssignments(c.classId, c.subjectId))),
    Promise.all(combos.map((c) => getClassroomQuizzes(c.classId, c.subjectId))),
    Promise.all(combos.map((c) => getCurriculumPlan(c.classId, c.subjectId))),
  ]);
  const materialsByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, materialsList[i]]),
  );
  const assignmentsByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, assignmentsList[i]]),
  );
  const quizzesByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, quizzesList[i]]),
  );
  const objectivesByKey = Object.fromEntries(
    combos.map((c, i) => [`${c.classId}:${c.subjectId}`, plansList[i].objectives]),
  );

  const allQuizzes = quizzesList.flat();
  const questionsList = await Promise.all(allQuizzes.map((q) => getQuizQuestions(q.id)));
  const questionsByQuizId = Object.fromEntries(allQuizzes.map((q, i) => [q.id, questionsList[i]]));

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🏫"
        title="Kelola Pembelajaran"
        subtitle="Materi, tugas, dan kuis untuk kelas & mapel yang Anda ajar"
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
        <Tabs defaultValue="materi">
          <TabsList className="scrollbar-hide max-w-full justify-start overflow-x-auto rounded-md">
            <TabsTrigger value="materi" className="shrink-0 rounded-md text-xs sm:text-sm">
              Materi & Modul Ajar
            </TabsTrigger>
            <TabsTrigger value="tugas" className="shrink-0 rounded-md text-xs sm:text-sm">
              Tugas & Proyek
            </TabsTrigger>
            <TabsTrigger value="kuis" className="shrink-0 rounded-md text-xs sm:text-sm">
              Kuis & Ujian
            </TabsTrigger>
          </TabsList>
          <TabsContent value="materi" className="mt-4">
            <MaterialsTab
              combos={combos}
              materialsByKey={materialsByKey}
              objectivesByKey={objectivesByKey}
            />
          </TabsContent>
          <TabsContent value="tugas" className="mt-4">
            <AssignmentsTab
              combos={combos}
              assignmentsByKey={assignmentsByKey}
              objectivesByKey={objectivesByKey}
            />
          </TabsContent>
          <TabsContent value="kuis" className="mt-4">
            <QuizzesTab
              combos={combos}
              quizzesByKey={quizzesByKey}
              questionsByQuizId={questionsByQuizId}
              objectivesByKey={objectivesByKey}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
