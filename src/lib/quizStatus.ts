export type QuizStatus = "draft" | "aktif" | "nonaktif" | "selesai";

export function computeQuizStatus(
  isPublished: boolean,
  isActive: boolean,
  dueAt: string | null,
): QuizStatus {
  if (!isPublished) return "draft";
  if (!isActive) return "nonaktif";
  if (dueAt && new Date(dueAt).getTime() < Date.now()) return "selesai";
  return "aktif";
}

export const QUIZ_STATUS_LABEL: Record<QuizStatus, string> = {
  draft: "DRAFT",
  aktif: "AKTIF",
  nonaktif: "NONAKTIF",
  selesai: "SELESAI",
};

export const QUIZ_STATUS_BADGE_CLASS: Record<QuizStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  aktif: "bg-emerald-100 text-emerald-700",
  nonaktif: "bg-zinc-200 text-zinc-700",
  selesai: "bg-blue-100 text-blue-700",
};
