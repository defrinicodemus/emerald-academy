"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ExpandRegion } from "@/components/ExpandRegion";
import { ChevronDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizResultRow } from "@/lib/data/review";
import { QuizReviewDialog } from "./QuizReviewDialog";

const STATUS_LABEL: Record<string, string> = {
  belum: "Belum Mengerjakan",
  dikerjakan: "Sedang Mengerjakan",
  submitted: "Menunggu Koreksi",
  graded: "Selesai",
};

export function QuizResultsTab({ quizResults }: { quizResults: QuizResultRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="@container space-y-3">
      <h2 className="font-display text-base font-bold @sm:text-lg @md:text-xl">
        Daftar Hasil Kuis
      </h2>
      <Card className="border-0 bg-transparent p-0 shadow-none sm:rounded-md sm:bg-card sm:p-2 sm:shadow-soft">
        <div className="space-y-1">
          {quizResults.map((q) => (
            <QuizResultRowItem
              key={q.quizId}
              quiz={q}
              expanded={expandedId === q.quizId}
              onToggle={() => setExpandedId((cur) => (cur === q.quizId ? null : q.quizId))}
            />
          ))}
          {quizResults.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Belum ada kuis yang sudah diunggah ke siswa untuk kelas & mapel ini.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function QuizResultRowItem({
  quiz,
  expanded,
  onToggle,
}: {
  quiz: QuizResultRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const gradedCount = quiz.results.filter((r) => r.score != null).length;

  return (
    <div className="@container rounded-md border bg-card shadow-soft sm:shadow-none">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 p-2.5 text-left hover:bg-muted/40 sm:p-3"
      >
        <div className="hidden h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft/50 sm:grid">
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-semibold",
              expanded && "overflow-visible text-clip whitespace-normal",
            )}
          >
            {quiz.quizTitle}
          </div>
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

      <ExpandRegion expanded={expanded}>
        <div className="border-t p-2 sm:p-3">
          {/* Student table (mobile + desktop, same column rules) */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-120 table-fixed text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="border-r p-2 text-left">Nama</th>
                  <th className="w-20 border-r p-2 text-left">Nilai</th>
                  <th className="w-32 border-r p-2 text-left">Status</th>
                  <th className="w-24 p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {quiz.results.map((r) => (
                  <tr key={r.studentId} className="border-b last:border-0">
                    <td className="truncate border-r p-2 font-medium">{r.studentName}</td>
                    <td className="border-r p-2 text-muted-foreground">{r.score ?? "-"}</td>
                    <td className="border-r p-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <QuizReviewDialog
                        quizTitle={quiz.quizTitle}
                        assignmentId={quiz.quizId}
                        studentId={r.studentId}
                        studentName={r.studentName}
                        submittedAt={r.submittedAt}
                        score={r.score}
                        passingGrade={quiz.passingGrade}
                        disabled={!r.submissionId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {quiz.results.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
            )}
          </div>
        </div>
      </ExpandRegion>
    </div>
  );
}
