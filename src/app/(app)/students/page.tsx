"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface StudentRow {
  id: string;
  name: string;
  nisn: string | null;
  avatar: string | null;
  avg: number | null;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const { active, activeClassId } = useActiveClass();
  const readOnly = user?.role === "principal";
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeClassId) {
      setStudents([]);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, nisn, avatar_emoji")
        .eq("class_id", activeClassId)
        .eq("role", "student")
        .order("full_name");

      const ids = (profiles ?? []).map((p) => p.id);
      const { data: grades } = ids.length
        ? await supabase.from("grades").select("student_id, score").in("student_id", ids)
        : { data: [] as { student_id: string; score: number }[] };

      const avgByStudent = new Map<string, { sum: number; count: number }>();
      for (const g of grades ?? []) {
        const acc = avgByStudent.get(g.student_id) ?? { sum: 0, count: 0 };
        acc.sum += Number(g.score);
        acc.count += 1;
        avgByStudent.set(g.student_id, acc);
      }

      if (!cancelled) {
        setStudents(
          (profiles ?? []).map((p) => {
            const acc = avgByStudent.get(p.id);
            return {
              id: p.id,
              name: p.full_name,
              nisn: p.nisn,
              avatar: p.avatar_emoji,
              avg: acc ? Math.round(acc.sum / acc.count) : null,
            };
          }),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeClassId]);

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="👨‍🎓" title="Siswa" subtitle="Daftar siswa per kelas" />
        <EmptyClassState
          message={
            readOnly
              ? "Data kelas tidak dapat dimuat. Silakan pilih kelas terlebih dahulu pada menu bagian atas halaman untuk memantau aktivitas siswa."
              : "Data siswa tidak dapat ditampilkan. Silakan pilih kelas terlebih dahulu pada menu di bagian atas halaman."
          }
        />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    `${s.name} ${s.nisn ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon="👨‍🎓"
        title={`Siswa ${active}`}
        subtitle={`${students.length} siswa terdaftar`}
        action={!readOnly && <Button className="rounded-xl">+ Tambah Siswa</Button>}
      />
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau NISN..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Rata-rata</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft/50 text-lg">
                        {s.avatar ?? "🙂"}
                      </div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.nisn ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold">{s.avg ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="rounded-lg">
                      Lihat
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Belum ada siswa di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
