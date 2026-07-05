"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { FileText, Video, Image as ImageIcon, BookOpen, Upload, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const KIND_ICON: Record<string, LucideIcon> = { pdf: FileText, video: Video, text: BookOpen, image: ImageIcon };
const KIND_LABEL: Record<string, string> = { pdf: "PDF", video: "YouTube", text: "Teks", image: "Gambar" };

interface MaterialRow {
  id: string;
  title: string;
  kind: string;
  subjectName: string;
}
interface SubjectRow {
  id: string;
  name: string;
  emoji: string | null;
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const { active, activeClassId } = useActiveClass();
  const readOnly = user?.role === "principal";
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [countBySubject, setCountBySubject] = useState<Record<string, number>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("subjects")
      .select("id, name, emoji")
      .order("name")
      .then(({ data }) => setSubjects(data ?? []));
  }, []);

  useEffect(() => {
    if (!activeClassId) {
      setItems([]);
      setCountBySubject({});
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("materials")
        .select("id, title, kind, subject_id, subjects(name)")
        .eq("class_id", activeClassId)
        .order("created_at", { ascending: false });
      if (cancelled) return;

      setItems(
        (data ?? []).map((m) => ({
          id: m.id,
          title: m.title,
          kind: m.kind,
          subjectName: (m.subjects as unknown as { name: string } | null)?.name ?? "",
        })),
      );
      const counts: Record<string, number> = {};
      for (const m of data ?? []) counts[m.subject_id] = (counts[m.subject_id] ?? 0) + 1;
      setCountBySubject(counts);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeClassId]);

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📚" title="Materi Ajar" subtitle="Kelola materi pembelajaran" />
        <EmptyClassState
          message={
            readOnly
              ? "Daftar bahan ajar masih terkunci. Silakan pilih kelas aktif terlebih dahulu untuk meninjau materi pembelajaran."
              : "Sistem tidak dapat menentukan tujuan kelas untuk materi baru. Mohon pilih salah satu kelas Anda terlebih dahulu."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title={`Materi Ajar — ${active}`}
        subtitle="PDF, video, teks, dan gambar pembelajaran"
        action={
          !readOnly && (
            <Button className="rounded-xl">
              <Upload className="mr-2 h-4 w-4" /> Tambah Materi
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Card key={s.id} className="rounded-2xl border-0 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{s.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{countBySubject[s.id] ?? 0} materi</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Materi Terbaru</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((m) => {
            const Icon = KIND_ICON[m.kind] ?? FileText;
            return (
              <Card key={m.id} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/60 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {KIND_LABEL[m.kind] ?? m.kind} · {m.subjectName}
                    </div>
                    <div className="mt-1 font-semibold">{m.title}</div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Buka
                      </Button>
                      {!readOnly && (
                        <Button size="sm" variant="ghost" className="rounded-lg">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada materi untuk kelas ini.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
