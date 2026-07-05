"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GradeRow {
  subjectName: string;
  score: number;
  period_month: string;
  teacher_comment: string | null;
}

export default function GradesPage() {
  const { user } = useAuth();
  const { active, activeClassId } = useActiveClass();
  const isStudent = user?.role === "student";
  const [rows, setRows] = useState<GradeRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      let query = supabase
        .from("grades")
        .select("subject_id, score, period_month, teacher_comment, subjects(name)");

      if (isStudent && user) {
        query = query.eq("student_id", user.id);
      } else if (activeClassId) {
        query = query.eq("class_id", activeClassId);
      } else {
        if (!cancelled) setRows([]);
        return;
      }

      const { data } = await query.order("period_month");
      if (cancelled) return;
      setRows(
        (data ?? []).map((g) => ({
          subjectName: (g.subjects as unknown as { name: string } | null)?.name ?? "",
          score: Number(g.score),
          period_month: g.period_month,
          teacher_comment: g.teacher_comment,
        })),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isStudent, user, activeClassId]);

  if (!isStudent && !active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📊" title="Laporan Nilai" subtitle="Rekap nilai per kelas" />
        <EmptyClassState message="Laporan nilai terkunci. Silakan tentukan kelas aktif Anda untuk mengunduh rekapitulasi nilai siswa." />
      </div>
    );
  }

  const latestMonth = rows.reduce((max, r) => (r.period_month > max ? r.period_month : max), "");
  const bySubjectMap = new Map<string, { sum: number; count: number }>();
  for (const r of rows.filter((r) => r.period_month === latestMonth)) {
    const acc = bySubjectMap.get(r.subjectName) ?? { sum: 0, count: 0 };
    acc.sum += r.score;
    acc.count += 1;
    bySubjectMap.set(r.subjectName, acc);
  }
  const bySubject = [...bySubjectMap.entries()].map(([name, { sum, count }]) => ({
    name: name.split(" ")[0],
    nilai: Math.round(sum / count),
  }));

  const byMonthMap = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const acc = byMonthMap.get(r.period_month) ?? { sum: 0, count: 0 };
    acc.sum += r.score;
    acc.count += 1;
    byMonthMap.set(r.period_month, acc);
  }
  const trend = [...byMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      name: new Date(month).toLocaleDateString("id-ID", { month: "short" }),
      nilai: Math.round(sum / count),
    }));

  const comments = isStudent
    ? [...rows]
        .filter((r) => r.teacher_comment)
        .sort((a, b) => b.period_month.localeCompare(a.period_month))
        .filter((r, i, arr) => arr.findIndex((x) => x.subjectName === r.subjectName) === i)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📊"
        title={isStudent ? "Rapor & Nilai Saya" : "Laporan Nilai Sekolah"}
        subtitle={isStudent ? "Pantau perkembangan belajarmu" : `Rekap nilai · ${active}`}
        action={
          !isStudent && (
            <Button className="rounded-xl">
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Nilai per Mata Pelajaran</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12 }} cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }} />
                <Bar dataKey="nilai" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Tren Nilai</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="t1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="nilai" stroke="var(--color-warning)" strokeWidth={3} fill="url(#t1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {isStudent && (
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Komentar Guru</h2>
          <div className="mt-4 space-y-3">
            {comments.map((c) => (
              <div key={c.subjectName} className="rounded-2xl bg-primary-soft/30 p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-primary">{c.subjectName}</div>
                <p className="mt-1 text-sm">{c.teacher_comment}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada komentar guru.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
