import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useActiveClass, EmptyClassState } from "@/components/ClassPicker";
import { GRADE_TREND, SUBJECTS } from "@/lib/mock-data";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/grades")({ component: GradesPage });

function GradesPage() {
  const { user } = useAuth();
  const { active } = useActiveClass();

  if (user?.role !== "student" && !active) {
    return (
      <div className="space-y-6">
        <PageHeader icon="📊" title="Laporan Nilai" subtitle="Rekap nilai per kelas" />
        <EmptyClassState message="Laporan nilai terkunci. Silakan tentukan kelas aktif Anda untuk mengunduh rekapitulasi nilai siswa." />
      </div>
    );
  }

  const bySubject = SUBJECTS.map((s) => ({ name: s.name.split(" ")[0], nilai: 70 + Math.round(Math.random() * 25) }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📊"
        title={user?.role === "student" ? "Rapor & Nilai Saya" : "Laporan Nilai Sekolah"}
        subtitle={user?.role === "student" ? "Pantau perkembangan belajarmu" : `Rekap nilai · ${active}`}
        action={user?.role !== "student" && <Button className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>}
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
          <h2 className="font-display text-xl font-bold">Tren 6 Bulan</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GRADE_TREND}>
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

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Komentar Guru</h2>
        <div className="mt-4 space-y-3">
          {[
            { s: "Matematika", c: "Pemahaman pecahan sangat baik, terus berlatih soal cerita ya!" },
            { s: "IPA", c: "Aktif bertanya saat diskusi tumbuhan. Tingkatkan ketelitian saat pengamatan." },
            { s: "Bahasa Indonesia", c: "Ceritamu kreatif sekali! Lanjutkan kebiasaan membaca." },
          ].map((x, i) => (
            <div key={i} className="rounded-2xl bg-primary-soft/30 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">{x.s}</div>
              <p className="mt-1 text-sm">{x.c}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
