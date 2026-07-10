import { createClient } from "@/lib/supabase/server";

export type MaterialKind = "pdf" | "video" | "text" | "image";

export interface MaterialRow {
  id: string;
  title: string;
  kind: MaterialKind;
  url: string | null;
  content: string | null;
  learningObjectiveId: string | null;
  learningObjectiveTitle: string | null;
  createdAt: string;
}

export async function getClassroomMaterials(
  classId: string,
  subjectId: string,
): Promise<MaterialRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select(
      "id, title, kind, url, content, learning_objective_id, learning_objectives(title), created_at",
    )
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    kind: m.kind,
    url: m.url,
    content: m.content,
    learningObjectiveId: m.learning_objective_id,
    learningObjectiveTitle:
      (m.learning_objectives as unknown as { title: string } | null)?.title ?? null,
    createdAt: m.created_at,
  }));
}

export type AssignmentKind = "essay" | "photo" | "audio" | "text";

export interface AssignmentRow {
  id: string;
  title: string;
  kind: AssignmentKind;
  description: string | null;
  dueAt: string | null;
  learningObjectiveId: string | null;
  learningObjectiveTitle: string | null;
  createdAt: string;
}

export async function getClassroomAssignments(
  classId: string,
  subjectId: string,
): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select(
      "id, title, kind, description, due_at, learning_objective_id, learning_objectives(title), created_at",
    )
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .neq("kind", "quiz")
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    description: a.description,
    dueAt: a.due_at,
    learningObjectiveId: a.learning_objective_id,
    learningObjectiveTitle:
      (a.learning_objectives as unknown as { title: string } | null)?.title ?? null,
    createdAt: a.created_at,
  }));
}

export interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  learningObjectiveId: string | null;
  learningObjectiveTitle: string | null;
  createdAt: string;
  questionCount: number;
  isPublished: boolean;
}

export async function getClassroomQuizzes(classId: string, subjectId: string): Promise<QuizRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select(
      "id, title, description, due_at, learning_objective_id, learning_objectives(title), created_at, is_published, quiz_questions(count)",
    )
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("kind", "quiz")
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueAt: a.due_at,
    learningObjectiveId: a.learning_objective_id,
    learningObjectiveTitle:
      (a.learning_objectives as unknown as { title: string } | null)?.title ?? null,
    createdAt: a.created_at,
    questionCount: (a.quiz_questions as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    isPublished: a.is_published,
  }));
}

export type QuestionType = "multiple_choice" | "short_answer";

export interface QuizOptionRow {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionRow {
  id: string;
  questionText: string;
  questionType: QuestionType;
  correctAnswerText: string | null;
  sortOrder: number;
  options: QuizOptionRow[];
}

export async function getQuizQuestions(assignmentId: string): Promise<QuizQuestionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_questions")
    .select(
      "id, question_text, question_type, correct_answer_text, sort_order, quiz_options(id, option_text, is_correct, sort_order)",
    )
    .eq("assignment_id", assignmentId)
    .order("sort_order");

  return (data ?? []).map((q) => ({
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    correctAnswerText: q.correct_answer_text,
    sortOrder: q.sort_order,
    options: (
      (q.quiz_options as unknown as
        { id: string; option_text: string; is_correct: boolean; sort_order: number }[] | null) ?? []
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ id: o.id, text: o.option_text, isCorrect: o.is_correct })),
  }));
}
