import { createClient } from "@/lib/supabase/server";

export interface ReviewAssignmentRow {
  id: string;
  title: string;
  kind: string;
  dueAt: string | null;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
}

export async function getReviewAssignments(
  classId: string,
  subjectId: string,
): Promise<ReviewAssignmentRow[]> {
  const supabase = await createClient();
  const [{ data: assignments }, { count: totalStudents }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, kind, due_at")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .neq("kind", "quiz")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("role", "student"),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } =
    assignmentIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, status")
          .in("assignment_id", assignmentIds)
      : { data: [] as { assignment_id: string; status: string }[] };

  const statsByAssignment = new Map<string, { submitted: number; graded: number }>();
  for (const s of submissions ?? []) {
    const stat = statsByAssignment.get(s.assignment_id) ?? { submitted: 0, graded: 0 };
    if (s.status === "submitted" || s.status === "graded") stat.submitted++;
    if (s.status === "graded") stat.graded++;
    statsByAssignment.set(s.assignment_id, stat);
  }

  return (assignments ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    dueAt: a.due_at,
    totalStudents: totalStudents ?? 0,
    submittedCount: statsByAssignment.get(a.id)?.submitted ?? 0,
    gradedCount: statsByAssignment.get(a.id)?.graded ?? 0,
  }));
}

export interface StudentSubmissionRow {
  studentId: string;
  studentName: string;
  avatar: string | null;
  submissionId: string | null;
  status: string;
  submittedAt: string | null;
  contentUrl: string | null;
  score: number | null;
  teacherComment: string | null;
}

export async function getAssignmentSubmissions(
  assignmentId: string,
  classId: string,
): Promise<StudentSubmissionRow[]> {
  const supabase = await createClient();
  const [{ data: students }, { data: submissions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_emoji")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("submissions")
      .select("id, student_id, status, submitted_at, content_url, score, teacher_comment")
      .eq("assignment_id", assignmentId),
  ]);

  const submissionByStudent = new Map((submissions ?? []).map((s) => [s.student_id, s]));

  return (students ?? []).map((st) => {
    const sub = submissionByStudent.get(st.id);
    return {
      studentId: st.id,
      studentName: st.full_name,
      avatar: st.avatar_emoji,
      submissionId: sub?.id ?? null,
      status: sub?.status ?? "belum",
      submittedAt: sub?.submitted_at ?? null,
      contentUrl: sub?.content_url ?? null,
      score: sub?.score ?? null,
      teacherComment: sub?.teacher_comment ?? null,
    };
  });
}

export interface QuizResultStudentRow {
  studentId: string;
  studentName: string;
  score: number | null;
  status: string;
}

export interface QuizResultRow {
  quizId: string;
  quizTitle: string;
  results: QuizResultStudentRow[];
}

export async function getQuizResults(classId: string, subjectId: string): Promise<QuizResultRow[]> {
  const supabase = await createClient();
  const [{ data: quizzes }, { data: students }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .eq("kind", "quiz")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name"),
  ]);

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const { data: submissions } =
    quizIds.length > 0
      ? await supabase
          .from("submissions")
          .select("assignment_id, student_id, score, status")
          .in("assignment_id", quizIds)
      : {
          data: [] as {
            assignment_id: string;
            student_id: string;
            score: number | null;
            status: string;
          }[],
        };

  const subByKey = new Map(
    (submissions ?? []).map((s) => [`${s.assignment_id}:${s.student_id}`, s]),
  );

  return (quizzes ?? []).map((q) => ({
    quizId: q.id,
    quizTitle: q.title,
    results: (students ?? []).map((st) => {
      const sub = subByKey.get(`${q.id}:${st.id}`);
      return {
        studentId: st.id,
        studentName: st.full_name,
        score: sub?.score ?? null,
        status: sub?.status ?? "belum",
      };
    }),
  }));
}
