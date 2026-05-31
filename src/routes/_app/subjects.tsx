import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUBJECTS } from "@/lib/mock-data";
import { FileText, Video, BookOpen, Image as ImageIcon, ClipboardList } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/subjects")({
  component: SubjectsPage,
});

function SubjectsPage() {
  const [open, setOpen] = useState<string | null>(null);
  const active = SUBJECTS.find((s) => s.id === open);

  if (active) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={active.emoji}
          title={active.name}
          subtitle="Materi, tugas, dan kuis untuk pelajaran ini"
          action={<Button variant="outline" className="rounded-xl" onClick={() => setOpen(null)}>← Kembali</Button>}
        />
        <Tabs defaultValue="materi">
          <TabsList className="rounded-2xl bg-muted p-1">
            <TabsTrigger value="materi" className="rounded-xl">📚 Materi</TabsTrigger>
            <TabsTrigger value="tugas" className="rounded-xl">📝 Tugas & Kuis</TabsTrigger>
          </TabsList>
          <TabsContent value="materi" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: FileText, t: "Bab 1 — Pengenalan", k: "PDF" },
              { i: Video, t: "Video Penjelasan", k: "YouTube" },
              { i: BookOpen, t: "Catatan Guru", k: "Teks" },
              { i: ImageIcon, t: "Cerita Bergambar", k: "Gambar" },
              { i: FileText, t: "Ringkasan", k: "PDF" },
            ].map((m, i) => (
              <Card key={i} className="rounded-3xl border-0 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/60 text-primary"><m.i className="h-5 w-5" /></div>
                <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.k}</div>
                <div className="mt-1 font-semibold">{m.t}</div>
                <Button className="mt-4 w-full rounded-xl">Buka</Button>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="tugas" className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-wrap items-center gap-4 rounded-3xl border-0 p-5 shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary"><ClipboardList className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Tugas #{i} — Latihan Soal</div>
                  <div className="text-xs text-muted-foreground">Tenggat: {i + 2} hari lagi · Belum dikerjakan</div>
                </div>
                <Button size="lg" className="rounded-xl">Mulai Kerjakan</Button>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon="📚" title="Mata Pelajaran" subtitle="Pilih pelajaran untuk melihat materi dan tugas" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpen(s.id)}
            className="group rounded-3xl border-0 bg-card p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
          >
            <div
              className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
              style={{ backgroundColor: `color-mix(in oklch, ${s.color} 20%, white)` }}
            >
              {s.emoji}
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">{s.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">5 materi · 2 kuis aktif</p>
            <div className="mt-4 inline-flex text-xs font-medium text-primary group-hover:underline">Buka pelajaran →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
