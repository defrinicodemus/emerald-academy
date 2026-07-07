"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PendingRow {
  id: string;
  name: string;
  avatar: string | null;
  task: string;
  kind: string;
  subject: string;
}

const KIND_LABEL: Record<string, string> = {
  quiz: "Kuis",
  essay: "Esai",
  photo: "Gambar",
  audio: "Suara",
  text: "Teks",
};

export default function AssessmentsPage() {
  const { active, activeClassId } = useActiveClass();
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [counts, setCounts] = useState({ graded: 0, pending: 0, total: 0 });

  useEffect(() => {
    if (!activeClassId) {
      setPending([]);
      setCounts({ graded: 0, pending: 0, total: 0 });
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, kind, subjects(name)")
        .eq("class_id", activeClassId);
      const ids = (assignments ?? []).map((a) => a.id);
      if (ids.length === 0) {
        if (!cancelled) {
          setPending([]);
          setCounts({ graded: 0, pending: 0, total: 0 });
        }
        return;
      }

      const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id, status, assignment_id, profiles!submissions_student_id_fkey(full_name, avatar_emoji)")
        .in("assignment_id", ids);

      let graded = 0;
      let pendingCount = 0;
      const pendingRows: PendingRow[] = [];
      for (const s of submissions ?? []) {
        if (s.status === "graded") graded++;
        if (s.status === "submitted") {
          pendingCount++;
          const a = assignmentById.get(s.assignment_id);
          const profile = s.profiles as unknown as { full_name: string; avatar_emoji: string | null } | null;
          pendingRows.push({
            id: s.id,
            name: profile?.full_name ?? "-",
            avatar: profile?.avatar_emoji ?? null,
            task: a?.title ?? "-",
            kind: KIND_LABEL[a?.kind ?? ""] ?? a?.kind ?? "",
            subject: (a?.subjects as unknown as { name: string } | null)?.name ?? "",
          });
        }
      }

      if (!cancelled) {
        setPending(pendingRows);
        setCounts({ graded, pending: pendingCount, total: submissions?.length ?? 0 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeClassId]);

  if (!activeClassId) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📝" title="Ruang Penilaian" subtitle="Koreksi tugas & rekap nilai" />
        <EmptyClassState message="Daftar koreksi tugas dan rekap nilai masih terkunci. Silakan tentukan kelas aktif Anda terlebih dahulu." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📝"
        title={`Ruang Penilaian — ${active}`}
        subtitle="Penilaian otomatis dan manual"
        action={
          <Button className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export E-Rapor
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Sudah Dinilai", v: counts.graded },
          { l: "Menunggu Koreksi", v: counts.pending },
          { l: "Total Submisi", v: counts.total },
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
          {pending.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft/50 text-lg">
                {p.avatar ?? "🙂"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.subject} · {p.task}
                </div>
              </div>
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">{p.kind}</span>
              <Button className="rounded-xl">Nilai Sekarang</Button>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground">Tidak ada submisi yang menunggu koreksi.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
