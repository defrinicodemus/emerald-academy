import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/assessments")({ component: AssessmentsPage });

function AssessmentsPage() {
  const { active } = useActiveClass();

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📝" title="Ruang Penilaian" subtitle="Koreksi tugas & rekap nilai" />
        <EmptyClassState message="Daftar koreksi tugas dan rekap nilai masih terkunci. Silakan tentukan kelas aktif Anda terlebih dahulu." />
      </div>
    );
  }

  const pending = [
    { name: "Ani Putri", task: "Esai Liburan", type: "Esai", subj: "B. Indonesia" },
    { name: "Dimas Pratama", task: "Foto Tumbuhan", type: "Gambar", subj: "IPA" },
    { name: "Citra Dewi", task: "Rekaman Pantun", type: "Suara", subj: "B. Indonesia" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📝"
        title={`Ruang Penilaian — ${active}`}
        subtitle="Penilaian otomatis dan manual"
        action={<Button className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Export E-Rapor</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Otomatis Selesai", v: "42", c: "success" },
          { l: "Menunggu Koreksi", v: "7", c: "warning" },
          { l: "Total Submisi", v: "63", c: "primary" },
        ].map((s, i) => (
          <Card key={i} className="rounded-3xl border-0 p-5 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="mt-1 font-display text-3xl font-bold">{s.v}</div>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Menunggu Koreksi Manual</h2>
        <div className="mt-4 space-y-3">
          {pending.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft/50 text-lg">🦊</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.subj} · {p.task}</div>
              </div>
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">{p.type}</span>
              <Button className="rounded-xl">Nilai Sekarang</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
