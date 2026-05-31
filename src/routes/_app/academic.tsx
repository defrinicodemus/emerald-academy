import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CLASSES, SUBJECTS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/academic")({ component: AcademicPage });

function AcademicPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="🏛️" title="Struktur Akademik" subtitle="Kelas, mata pelajaran, dan tahun ajaran" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Kelas</h2>
            <Button size="sm" className="rounded-lg">+ Tambah Kelas</Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CLASSES.map((c) => (
              <div key={c} className="rounded-2xl bg-primary-soft/30 px-4 py-3 text-sm font-semibold">{c}</div>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Mata Pelajaran</h2>
            <Button size="sm" className="rounded-lg">+ Tambah Mapel</Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SUBJECTS.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium">
                <span className="text-lg">{s.emoji}</span>{s.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Tahun Ajaran</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { y: "2024 / 2025", s: "Semester Genap", active: true },
            { y: "2024 / 2025", s: "Semester Ganjil", active: false },
            { y: "2023 / 2024", s: "Semester Genap", active: false },
          ].map((x, i) => (
            <Card key={i} className={`rounded-2xl border-0 p-4 shadow-soft ${x.active ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              <div className="font-display text-xl font-bold">{x.y}</div>
              <div className="mt-1 text-sm opacity-90">{x.s}</div>
              {x.active && <div className="mt-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-xs">Aktif</div>}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
