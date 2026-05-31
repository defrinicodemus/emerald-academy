import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { SUBJECTS } from "@/lib/mock-data";
import { FileText, Video, Image as ImageIcon, BookOpen, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/materials")({ component: MaterialsPage });

function MaterialsPage() {
  const { user } = useAuth();
  const { active } = useActiveClass();
  const readOnly = user?.role === "principal";

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📚" title="Materi Ajar" subtitle="Kelola materi pembelajaran" />
        <EmptyClassState message={readOnly
          ? "Daftar bahan ajar masih terkunci. Silakan pilih kelas aktif terlebih dahulu untuk meninjau materi pembelajaran."
          : "Sistem tidak dapat menentukan tujuan kelas untuk materi baru. Mohon pilih salah satu kelas Anda terlebih dahulu."} />
      </div>
    );
  }

  const items = [
    { i: FileText, t: "Bab 1 — Bilangan Pecahan", k: "PDF", subj: "Matematika" },
    { i: Video, t: "Video: Daur Hidup Kupu-kupu", k: "YouTube", subj: "IPA" },
    { i: BookOpen, t: "Cerita Rakyat Nusantara", k: "Teks", subj: "B. Indonesia" },
    { i: ImageIcon, t: "Pancasila & Lambangnya", k: "Gambar", subj: "PPKn" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title={`Materi Ajar — ${active}`}
        subtitle="PDF, video, teks, dan gambar pembelajaran"
        action={!readOnly && <Button className="rounded-xl"><Upload className="mr-2 h-4 w-4" /> Tambah Materi</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.slice(0, 6).map((s) => (
          <Card key={s.id} className="rounded-2xl border-0 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{s.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">5 materi</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Materi Terbaru</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((m, i) => (
            <Card key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/60 text-primary"><m.i className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.k} · {m.subj}</div>
                  <div className="mt-1 font-semibold">{m.t}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg">Buka</Button>
                    {!readOnly && <Button size="sm" variant="ghost" className="rounded-lg">Edit</Button>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
