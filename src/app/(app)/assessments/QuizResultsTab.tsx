"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizResultRow } from "@/lib/data/review";

const STATUS_LABEL: Record<string, string> = {
  belum: "Belum Mengerjakan",
  dikerjakan: "Sedang Mengerjakan",
  submitted: "Menunggu Koreksi",
  graded: "Selesai",
};

export function QuizResultsTab({ quizResults }: { quizResults: QuizResultRow[] }) {
  return (
    <Card className="rounded-3xl border-0 p-2 shadow-soft">
      <div className="space-y-1">
        {quizResults.map((q) => (
          <QuizResultRowItem key={q.quizId} quiz={q} />
        ))}
        {quizResults.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            Belum ada kuis yang sudah diunggah ke siswa untuk kelas & mapel ini.
          </p>
        )}
      </div>
    </Card>
  );
}

function QuizResultRowItem({ quiz }: { quiz: QuizResultRow }) {
  const [expanded, setExpanded] = useState(false);
  const gradedCount = quiz.results.filter((r) => r.score != null).length;

  return (
    <div className="rounded-2xl border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/40"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft/50">
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{quiz.quizTitle}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {gradedCount}/{quiz.results.length} siswa sudah dikoreksi otomatis
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-2 border-t p-4">
          {quiz.results.map((r) => (
            <div
              key={r.studentId}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="font-medium">{r.studentName}</div>
              <div className="flex items-center gap-2">
                {r.score != null && (
                  <span className="font-display text-lg font-bold text-primary">{r.score}</span>
                )}
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
            </div>
          ))}
          {quiz.results.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
          )}
        </div>
      )}
    </div>
  );
}
