import { createClient } from "@/lib/supabase/server";

export type AssignmentStatus = "belum" | "dikerjakan" | "submitted" | "graded";

export interface MaterialContentRow {
  id: string;
  title: string;
  kind: string;
  url: string | null;
  content: string | null;
  viewed: boolean;
  learningObjectiveTitle: string | null;
  createdAt: string;
}

export interface AssignmentContentRow {
  id: string;
  title: string;
  kind: string;
  dueAt: string | null;
  learningObjectiveTitle: string | null;
  status: AssignmentStatus;
  score: number | null;
  teacherComment: string | null;
  submissionContent: string | null;
  questionCount: number;
  createdAt: string;
}

export function appliesToGrade(
  gradeLevel: number | null,
  minGrade: number | null,
  maxGrade: number | null,
) {
  if (gradeLevel == null) return true;
  if (minGrade != null && gradeLevel < minGrade) return false;
  if (maxGrade != null && gradeLevel > maxGrade) return false;
  return true;
}

export async function getSubjectsExplorerData(classId: string | null, studentId: string | null) {
  const supabase = await createClient();
  const [{ data: subjects }, { data: klass }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, code, name, emoji, color, min_grade, max_grade")
      .order("name"),
    classId
      ? supabase.from("classes").select("grade_level").eq("id", classId).single()
      : Promise.resolve({ data: null }),
  ]);
  const gradeLevel = klass?.grade_level ?? null;
  const visibleSubjects = (subjects ?? []).filter((s) =>
    appliesToGrade(gradeLevel, s.min_grade, s.max_grade),
  );

  const materialsBySubject: Record<string, MaterialContentRow[]> = {};
  const tugasBySubject: Record<string, AssignmentContentRow[]> = {};
  const kuisBySubject: Record<string, AssignmentContentRow[]> = {};

  if (classId) {
    const [{ data: materials }, { data: assignments }, { data: views }] = await Promise.all([
      supabase
        .from("materials")
        .select(
          "id, subject_id, title, kind, url, content, learning_objective_id, learning_objectives(title), created_at",
        )
        .eq("class_id", classId)
        .order("created_at", { ascending: false }),
      supabase
        .from("assignments")
        .select(
          "id, subject_id, title, kind, due_at, learning_objective_id, learning_objectives(title), created_at",
        )
        .eq("class_id", classId)
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      studentId
        ? supabase.from("material_views").select("material_id").eq("student_id", studentId)
        : Promise.resolve({ data: [] as { material_id: string }[] }),
    ]);

    const assignmentIds = (assignments ?? []).map((a) => a.id);
    const kuisIds = (assignments ?? []).filter((a) => a.kind === "quiz").map((a) => a.id);

    const [{ data: submissions }, { data: questionRows }] = await Promise.all([
      studentId && assignmentIds.length > 0
        ? supabase
            .from("submissions")
            .select("assignment_id, status, score, teacher_comment, content_url")
            .eq("student_id", studentId)
            .in("assignment_id", assignmentIds)
        : Promise.resolve({
            data: [] as {
              assignment_id: string;
              status: AssignmentStatus;
              score: number | null;
              teacher_comment: string | null;
              content_url: string | null;
            }[],
          }),
      kuisIds.length > 0
        ? supabase.from("quiz_questions").select("assignment_id").in("assignment_id", kuisIds)
        : Promise.resolve({ data: [] as { assignment_id: string }[] }),
    ]);

    const submissionByAssignment = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
    const questionCountByAssignment = new Map<string, number>();
    for (const q of questionRows ?? []) {
      questionCountByAssignment.set(
        q.assignment_id,
        (questionCountByAssignment.get(q.assignment_id) ?? 0) + 1,
      );
    }

    const viewedIds = new Set((views ?? []).map((v) => v.material_id));
    for (const m of materials ?? []) {
      (materialsBySubject[m.subject_id] ??= []).push({
        id: m.id,
        title: m.title,
        kind: m.kind,
        url: m.url,
        content: m.content,
        viewed: viewedIds.has(m.id),
        learningObjectiveTitle:
          (m.learning_objectives as unknown as { title: string } | null)?.title ?? null,
        createdAt: m.created_at,
      });
    }
    for (const a of assignments ?? []) {
      const sub = submissionByAssignment.get(a.id);
      const row: AssignmentContentRow = {
        id: a.id,
        title: a.title,
        kind: a.kind,
        dueAt: a.due_at,
        learningObjectiveTitle:
          (a.learning_objectives as unknown as { title: string } | null)?.title ?? null,
        status: sub?.status ?? "belum",
        score: sub?.score ?? null,
        teacherComment: sub?.teacher_comment ?? null,
        submissionContent: sub?.content_url ?? null,
        questionCount: questionCountByAssignment.get(a.id) ?? 0,
        createdAt: a.created_at,
      };
      const bucket = a.kind === "quiz" ? kuisBySubject : tugasBySubject;
      (bucket[a.subject_id] ??= []).push(row);
    }
  }

  return { subjects: visibleSubjects, materialsBySubject, tugasBySubject, kuisBySubject };
}

export interface StudentQuizOption {
  id: string;
  text: string;
}

export interface StudentQuizQuestion {
  id: string;
  questionText: string;
  questionType: "multiple_choice" | "short_answer";
  options: StudentQuizOption[];
}

export interface StudentQuizData {
  questions: StudentQuizQuestion[];
  alreadySubmitted: boolean;
  score: number | null;
}

export async function getQuizForStudent(
  assignmentId: string,
  studentId: string,
): Promise<StudentQuizData> {
  const supabase = await createClient();
  const [{ data: questions }, { data: submission }] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select(
        "id, question_text, question_type, sort_order, quiz_options(id, option_text, sort_order)",
      )
      .eq("assignment_id", assignmentId)
      .order("sort_order"),
    supabase
      .from("submissions")
      .select("status, score")
      .eq("assignment_id", assignmentId)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  const mapped: StudentQuizQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    options: (
      (q.quiz_options as unknown as { id: string; option_text: string; sort_order: number }[]) ?? []
    )
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ id: o.id, text: o.option_text })),
  }));

  return {
    questions: mapped,
    alreadySubmitted: submission?.status === "graded",
    score: submission?.score ?? null,
  };
}
