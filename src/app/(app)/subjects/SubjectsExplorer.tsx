"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  BookOpen,
  Image as ImageIcon,
  ClipboardList,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { ContentRow, MaterialContentRow } from "@/lib/data/subjects";
import { markMaterialViewed } from "./actions";

const KIND_ICON: Record<string, LucideIcon> = {
  pdf: FileText,
  video: Video,
  text: BookOpen,
  image: ImageIcon,
};
const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  video: "YouTube",
  text: "Teks",
  image: "Gambar",
};

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
  assignmentsBySubject,
}: {
  subjects: SubjectRow[];
  materialsBySubject: Record<string, MaterialContentRow[]>;
  assignmentsBySubject: Record<string, ContentRow[]>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = subjects.find((s) => s.id === open);

  if (active) {
    const materials = materialsBySubject[active.id] ?? [];
    const assignments = assignmentsBySubject[active.id] ?? [];
    return (
      <div className="space-y-6">
        <PageHeader
          icon={active.emoji ?? "📚"}
          title={active.name}
          subtitle="Materi, tugas, dan kuis untuk pelajaran ini"
          action={
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(null)}>
              ← Kembali
            </Button>
          }
        />
        <Tabs defaultValue="materi">
          <TabsList className="rounded-2xl bg-muted p-1">
            <TabsTrigger value="materi" className="rounded-xl">
              📚 Materi
            </TabsTrigger>
            <TabsTrigger value="tugas" className="rounded-xl">
              📝 Tugas & Kuis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="materi" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
            {materials.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada materi.</p>
            )}
          </TabsContent>
          <TabsContent value="tugas" className="mt-4 space-y-3">
            {assignments.map((a) => (
              <Card
                key={a.id}
                className="flex flex-wrap items-center gap-4 rounded-3xl border-0 p-5 shadow-soft"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Tenggat: {a.due_at ? new Date(a.due_at).toLocaleDateString("id-ID") : "-"}
                  </div>
                </div>
                <Button size="lg" className="rounded-xl">
                  Mulai Kerjakan
                </Button>
              </Card>
            ))}
            {assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada tugas.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

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
          const assignmentCount = assignmentsBySubject[s.id]?.length ?? 0;
          return (
            <button
              key={s.id}
              onClick={() => setOpen(s.id)}
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
                {materialCount} materi · {assignmentCount} tugas
              </p>
              <div className="mt-4 inline-flex text-xs font-medium text-primary group-hover:underline">
                Buka pelajaran →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaterialCard({ material: m }: { material: MaterialContentRow }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const Icon = KIND_ICON[m.kind] ?? FileText;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !m.viewed) {
      startTransition(() => {
        markMaterialViewed(m.id);
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Card className="rounded-3xl border-0 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/60 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {m.viewed && (
            <span className="flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Check className="h-3 w-3" /> Sudah Dilihat
            </span>
          )}
        </div>
        <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {KIND_LABEL[m.kind] ?? m.kind}
        </div>
        <div className="mt-1 font-semibold">{m.title}</div>
        <DialogTrigger asChild>
          <Button className="mt-4 w-full rounded-xl">Buka</Button>
        </DialogTrigger>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.title}</DialogTitle>
        </DialogHeader>
        <MaterialContentView material={m} />
      </DialogContent>
    </Dialog>
  );
}

function MaterialContentView({ material: m }: { material: MaterialContentRow }) {
  if (m.kind === "text") {
    return (
      <p className="whitespace-pre-line rounded-xl bg-muted/40 p-4 text-sm">
        {m.content || "Belum ada isi materi."}
      </p>
    );
  }
  if (m.kind === "image" && m.url) {
    return <img src={m.url} alt={m.title} className="w-full rounded-xl object-cover" />;
  }
  if (m.kind === "video" && m.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe src={m.url} title={m.title} className="h-full w-full" allowFullScreen />
      </div>
    );
  }
  if (m.kind === "pdf" && m.url) {
    return (
      <div className="overflow-hidden rounded-xl border">
        <iframe src={m.url} title={m.title} className="h-96 w-full" />
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Konten belum tersedia.</p>;
}
