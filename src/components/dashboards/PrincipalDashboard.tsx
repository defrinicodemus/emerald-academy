"use client";

import { Card } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye } from "lucide-react";
import type { getPrincipalDashboardData } from "@/lib/data/dashboard";
import type { listTeachersWithStats } from "@/lib/data/people";

type Data = Awaited<ReturnType<typeof getPrincipalDashboardData>>;
type Teacher = Awaited<ReturnType<typeof listTeachersWithStats>>[number];

export function PrincipalDashboard({ data, teachers }: { data: Data; teachers: Teacher[] }) {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
          <Eye className="h-3.5 w-3.5" /> Mode Pemantauan
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Selamat datang, Bapak Kepala Sekolah</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">Ringkasan aktivitas LMS SD Inpres Nggodimeda hari ini.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Siswa" value={String(data.totalStudents)} hint={`${data.totalClasses} rombel`} />
        <Stat label="Total Guru" value={String(data.totalTeachers)} hint="Aktif mengajar" />
        <Stat label="Total Mapel" value={String(data.totalSubjects)} hint="Kurikulum aktif" />
        <Stat label="Total Kelas" value={String(data.totalClasses)} hint="Rombongan belajar" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Materi & Tugas per Mata Pelajaran</h2>
          <div className="mt-1 text-xs text-muted-foreground">Jumlah konten yang telah dibuat guru</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activity}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12 }} cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Kinerja Guru</h2>
          <div className="mt-4 space-y-3">
            {teachers.map((t) => (
              <div key={t.id} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.name}</div>
                  <span className="text-xs text-muted-foreground">{t.subject}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.materials} materi · {t.quizzes} tugas
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}
