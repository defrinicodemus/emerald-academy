import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import type { AssignmentContentRow, MaterialContentRow } from "@/lib/data/subjects";

interface SubjectRow {
  id: string;
  code: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

export function SubjectsExplorer({
  subjects,
  materialsBySubject,
  tugasBySubject,
  kuisBySubject,
}: {
  subjects: SubjectRow[];
  materialsBySubject: Record<string, MaterialContentRow[]>;
  tugasBySubject: Record<string, AssignmentContentRow[]>;
  kuisBySubject: Record<string, AssignmentContentRow[]>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title="Mata Pelajaran"
        subtitle="Pilih pelajaran untuk melihat materi dan tugas"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => {
          const materialCount = materialsBySubject[s.id]?.length ?? 0;
          const tugasCount = tugasBySubject[s.id]?.length ?? 0;
          const kuisCount = kuisBySubject[s.id]?.length ?? 0;
          return (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className="group rounded-3xl border-0 bg-card p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
                style={{
                  backgroundColor: `color-mix(in oklch, ${s.color ?? "oklch(0.7 0.1 150)"} 20%, white)`,
                }}
              >
                {s.emoji}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {materialCount} materi · {tugasCount} tugas · {kuisCount} kuis
              </p>
              <div className="mt-4 inline-flex text-xs font-medium text-primary group-hover:underline">
                Buka pelajaran →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
