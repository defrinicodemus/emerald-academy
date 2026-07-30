"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AssignmentContentRow,
  StudentQuizData,
  StudentQuizQuestion,
} from "@/lib/data/subjects";
import { fetchQuizForStudent, submitQuizAnswers } from "../../actions";

function DragDropAnswer({
  question,
  answer,
  onSelect,
}: {
  question: StudentQuizQuestion;
  answer: Record<string, string>;
  onSelect: (dragId: string, targetId: string) => void;
}) {
  const [selectedDragId, setSelectedDragId] = useState<string | null>(null);
  const matchedTargetIds = new Set(Object.values(answer));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {question.dragBlocks.map((b) => {
          const isMatched = !!answer[b.id];
          const isSelected = selectedDragId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedDragId(b.id)}
              className={cn(
                "w-full rounded-xl border p-2.5 text-left text-sm transition",
                isSelected && "border-primary bg-primary-soft/30",
                isMatched && !isSelected && "border-emerald-400 bg-emerald-50",
              )}
            >
              {b.text}
              {isMatched && (
                <span className="ml-1.5 text-xs text-emerald-600">
                  → {question.targetBlocks.find((t) => t.id === answer[b.id])?.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {question.targetBlocks.map((t) => {
          const isUsed = matchedTargetIds.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!selectedDragId}
              onClick={() => {
                if (selectedDragId) {
                  onSelect(selectedDragId, t.id);
                  setSelectedDragId(null);
                }
              }}
              className={cn(
                "w-full rounded-xl border p-2.5 text-left text-sm transition disabled:opacity-50",
                isUsed && "border-emerald-400 bg-emerald-50",
              )}
            >
              {t.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KuisDetailContent({ assignment: a }: { assignment: AssignmentContentRow }) {
  const [data, setData] = useState<StudentQuizData | null>(null);
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, "benar" | "salah">>({});
  const [ddAnswers, setDdAnswers] = useState<Record<string, Record<string, string>>>({});
  const [seqOrder, setSeqOrder] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const locked = a.status !== "graded" && a.quizStatus !== "aktif";

  useEffect(() => {
    if (locked) return;
    let cancelled = false;
    fetchQuizForStudent(a.id).then((result) => {
      if (cancelled || !result) return;
      setData(result);
      const initialSeq: Record<string, string[]> = {};
      for (const q of result.questions) {
        if (q.questionType === "sequence") initialSeq[q.id] = q.steps.map((s) => s.id);
      }
      setSeqOrder(initialSeq);
    });
    return () => {
      cancelled = true;
    };
  }, [a.id, locked]);

  function moveSeqStep(questionId: string, index: number, direction: "up" | "down") {
    setSeqOrder((prev) => {
      const order = prev[questionId] ? [...prev[questionId]] : [];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= order.length) return prev;
      [order[index], order[swapWith]] = [order[swapWith], order[index]];
      return { ...prev, [questionId]: order };
    });
  }

  function selectDragTarget(questionId: string, dragId: string, targetId: string) {
    setDdAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), [dragId]: targetId },
    }));
  }

  function handleSubmit() {
    if (!data) return;
    const payload = data.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: q.questionType === "multiple_choice" ? mcAnswers[q.id] : undefined,
      trueFalseAnswer: q.questionType === "true_false" ? tfAnswers[q.id] : undefined,
      dragDropAnswer: q.questionType === "drag_and_drop" ? ddAnswers[q.id] : undefined,
      sequenceAnswer: q.questionType === "sequence" ? seqOrder[q.id] : undefined,
    }));
    startTransition(async () => {
      const result = await submitQuizAnswers(a.id, payload);
      if (result.ok) {
        toast.success(result.message);
        setData((prev) =>
          prev ? { ...prev, alreadySubmitted: true, score: result.score ?? null } : prev,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  if (locked) {
    return (
      <div className="rounded-3xl border-0 bg-card p-6 shadow-soft">
        <div className="rounded-2xl bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {a.quizStatus === "nonaktif"
              ? "Kuis ini sedang dinonaktifkan oleh guru dan tidak bisa dikerjakan."
              : "Waktu pengerjaan kuis ini sudah berakhir."}
          </p>
        </div>
      </div>
    );
  }

  if (data?.alreadySubmitted) {
    return (
      <div className="rounded-3xl border-0 bg-card p-6 shadow-soft">
        <div className="rounded-2xl bg-primary-soft/40 p-6 text-center">
          <div className="text-3xl">🎉</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">
            ✨ Nilai: {data.score}/100
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Kuis ini sudah kamu selesaikan.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border-0 bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Memuat soal...</p>
      </div>
    );
  }

  const allAnswered = data.questions.every((q) => {
    if (q.questionType === "multiple_choice") return !!mcAnswers[q.id];
    if (q.questionType === "true_false") return !!tfAnswers[q.id];
    if (q.questionType === "drag_and_drop") {
      const answered = ddAnswers[q.id] ?? {};
      return q.dragBlocks.every((b) => answered[b.id]);
    }
    if (q.questionType === "sequence") return (seqOrder[q.id]?.length ?? 0) === q.steps.length;
    return false;
  });

  return (
    <div className="space-y-4 rounded-3xl border-0 bg-card p-6 shadow-soft">
      <p className="text-xs text-muted-foreground">
        {data.questions.length} Soal
        {data.timerMinutes ? ` · ⏱ Estimasi: ${data.timerMinutes} Menit` : ""}
      </p>
      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border p-4">
            <div className="font-medium">
              {i + 1}. {q.questionText}
            </div>

            {q.questionType === "multiple_choice" && (
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition",
                      mcAnswers[q.id] === o.id && "border-primary bg-primary-soft/30",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={mcAnswers[q.id] === o.id}
                      onChange={() => setMcAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            )}

            {q.questionType === "true_false" && (
              <div className="mt-3 flex gap-2">
                {(["benar", "salah"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTfAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    className={cn(
                      "flex-1 rounded-xl border p-2.5 text-sm font-medium transition",
                      tfAnswers[q.id] === v
                        ? "border-primary bg-primary-soft/30 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {v === "benar" ? "Benar" : "Salah"}
                  </button>
                ))}
              </div>
            )}

            {q.questionType === "drag_and_drop" && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ketuk satu blok kiri, lalu ketuk pasangannya di kanan.
                </p>
                <DragDropAnswer
                  question={q}
                  answer={ddAnswers[q.id] ?? {}}
                  onSelect={(dragId, targetId) => selectDragTarget(q.id, dragId, targetId)}
                />
              </div>
            )}

            {q.questionType === "sequence" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Urutkan langkah dengan tombol panah di bawah ini.
                </p>
                {(seqOrder[q.id] ?? []).map((stepId, idx) => {
                  const step = q.steps.find((s) => s.id === stepId);
                  if (!step) return null;
                  return (
                    <div
                      key={stepId}
                      className="flex items-center gap-2 rounded-xl border p-2.5 text-sm"
                    >
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1">{step.text}</span>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSeqStep(q.id, idx, "up")}
                          className="grid h-7 w-7 place-items-center rounded-lg border disabled:opacity-30"
                          aria-label="Pindah ke atas"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === (seqOrder[q.id]?.length ?? 0) - 1}
                          onClick={() => moveSeqStep(q.id, idx, "down")}
                          className="grid h-7 w-7 place-items-center rounded-lg border disabled:opacity-30"
                          aria-label="Pindah ke bawah"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button
        className="w-full rounded-xl"
        disabled={!allAnswered || isPending}
        onClick={handleSubmit}
      >
        {isPending ? "Mengirim..." : "Kirim Jawaban"}
      </Button>
    </div>
  );
}
