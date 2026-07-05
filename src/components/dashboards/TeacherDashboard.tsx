"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useActiveClass, ClassPicker } from "@/components/ClassPicker";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, FileText, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface Stats {
  totalStudents: number;
  activeMaterials: number;
  ungraded: number;
  submissionsToday: number;
  weekly: { name: string; value: number }[];
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const { active, activeClassId } = useActiveClass();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!activeClassId) {
      setStats(null);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const [{ count: totalStudents }, { count: activeMaterials }, { data: assignmentRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("class_id", activeClassId)
          .eq("role", "student"),
        supabase.from("materials").select("id", { count: "exact", head: true }).eq("class_id", activeClassId),
        supabase.from("assignments").select("id").eq("class_id", activeClassId),
      ]);

      const ids = (assignmentRows ?? []).map((a) => a.id);
      let ungraded = 0;
      let submissionsToday = 0;
      const byDay = new Map<string, number>();

      if (ids.length > 0) {
        const { data: submissions } = await supabase
          .from("submissions")
          .select("status, submitted_at")
          .in("assignment_id", ids);

        const today = new Date().toDateString();
        const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        for (const s of submissions ?? []) {
          if (s.status === "submitted") ungraded++;
          if (!s.submitted_at) continue;
          const d = new Date(s.submitted_at);
          if (d.toDateString() === today) submissionsToday++;
          const label = dayNames[d.getDay()];
          byDay.set(label, (byDay.get(label) ?? 0) + 1);
        }
      }
      const weekly = ["Sen", "Sel", "Rab", "Kam", "Jum"].map((name) => ({ name, value: byDay.get(name) ?? 0 }));

      if (!cancelled) {
        setStats({
          totalStudents: totalStudents ?? 0,
          activeMaterials: activeMaterials ?? 0,
          ungraded,
          submissionsToday,
          weekly,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeClassId]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Selamat mengajar, {user?.name} 👩‍🏫</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">
          Pilih kelas aktif untuk mulai membuat materi, kuis, dan menilai pekerjaan siswa.
        </p>
        <div className="mt-5">
          <ClassPicker />
        </div>
      </Card>

      {!active || !stats ? (
        <Card className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary-soft/20 p-10 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-3 font-display text-xl font-bold">Belum memilih kelas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Beberapa data terkunci sampai Anda memilih kelas aktif. Gunakan pemilih kelas di atas atau di header.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat icon={Users} label="Total Siswa" value={String(stats.totalStudents)} hint={active} />
            <Stat icon={FileText} label="Materi Aktif" value={String(stats.activeMaterials)} hint="Total diunggah" />
            <Stat icon={ClipboardList} label="Belum Dinilai" value={String(stats.ungraded)} hint="Menunggu koreksi" />
            <Stat icon={ClipboardList} label="Submisi Hari Ini" value={String(stats.submissionsToday)} hint="Lihat detail" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
              <h2 className="font-display text-xl font-bold">Submisi Tugas Minggu Ini</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekly}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 12 }} cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="rounded-3xl border-0 p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold">Aksi Cepat</h2>
              <div className="mt-4 grid gap-2">
                <Button className="h-12 justify-start rounded-xl text-base">+ Tambah Materi</Button>
                <Button variant="secondary" className="h-12 justify-start rounded-xl text-base">
                  + Buat Kuis
                </Button>
                <Button variant="outline" className="h-12 justify-start rounded-xl text-base">
                  Beri Bintang Bonus
                </Button>
                <Button variant="outline" className="h-12 justify-start rounded-xl text-base">
                  Buat Pengumuman
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft/50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
