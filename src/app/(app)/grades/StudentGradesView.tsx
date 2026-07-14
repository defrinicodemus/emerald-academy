"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { StudentSubjectGrade } from "@/lib/data/gradebook";

export function StudentGradesView({ subjects }: { subjects: StudentSubjectGrade[] }) {
  const graded = subjects.filter(
    (s): s is StudentSubjectGrade & { overallAverage: number } => s.overallAverage != null,
  );
  const overallAverage =
    graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + s.overallAverage, 0) / graded.length)
      : null;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">🏆 Nilai Saya</h1>
            <p className="mt-2 max-w-md text-sm opacity-90">
              Pantau rata-rata nilai kamu di setiap mata pelajaran, lengkap dengan rincian per
              Tujuan Pembelajaran (TP).
            </p>
          </div>
          {overallAverage != null && (
            <div className="hidden text-right sm:block">
              <div className="text-sm opacity-90">Rata-rata Keseluruhan</div>
              <div className="font-display text-4xl font-bold">{overallAverage}</div>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        {subjects.map((s) => (
          <SubjectGradeCard key={s.subjectId} subject={s} />
        ))}
        {subjects.length === 0 && (
          <Card className="rounded-3xl border-0 p-10 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">
              Belum ada mata pelajaran yang terdaftar untuk kelasmu.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function SubjectGradeCard({ subject: s }: { subject: StudentSubjectGrade }) {
  const [expanded, setExpanded] = useState(false);
  const hasGrades = s.overallAverage != null;

  return (
    <Card className="rounded-3xl border-0 p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
          style={{
            backgroundColor: `color-mix(in oklch, ${s.subjectColor ?? "oklch(0.7 0.1 150)"} 20%, white)`,
          }}
        >
          {s.subjectEmoji ?? "📘"}
        </div>
        <div>
          <div className="font-display text-lg font-bold">{s.subjectName}</div>
          <div className="text-sm text-muted-foreground">
            {hasGrades ? `Rata-rata: ${s.overallAverage}` : "Belum ada nilai"}
          </div>
        </div>
      </div>

      {hasGrades && (
        <>
          {!expanded && (
            <p className="mt-3 text-xs text-muted-foreground">
              {s.tpGrades.length} TP Sudah Dinilai
            </p>
          )}

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-3 space-y-2 border-t pt-3">
                {s.tpGrades.map((tp) => (
                  <div key={tp.tpId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{tp.tpTitle}</span>
                    <span className="font-display font-bold">{tp.average}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? "▲ Sembunyikan" : "▼ Lihat Detail"}
          </button>
        </>
      )}
    </Card>
  );
}
