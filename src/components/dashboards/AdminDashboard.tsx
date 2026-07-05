"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, Database, Download } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { getAdminDashboardData } from "@/lib/data/dashboard";

type Data = Awaited<ReturnType<typeof getAdminDashboardData>>;

export function AdminDashboard({ data }: { data: Data }) {
  // Storage usage isn't tracked yet (no file-upload/Supabase Storage integration) —
  // shown for layout parity with the original design only.
  const used = 6.4;
  const total = 20;
  const pct = (used / total) * 100;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Panel Administrasi 🛠️</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">Kelola pengguna, struktur akademik, dan pengaturan sistem LMS.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Backup Database
          </Button>
          <Button variant="ghost" className="rounded-xl text-primary-foreground hover:bg-white/15">
            Import Siswa (Excel)
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Total Siswa" value={String(data.totalStudents)} />
        <Stat icon={GraduationCap} label="Total Guru" value={String(data.totalTeachers)} />
        <Stat icon={Building2} label="Kepala Sekolah" value={String(data.totalPrincipals)} />
        <Stat icon={Users} label="Total Pengguna" value={String(data.totalUsers)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Siswa per Kelas</h2>
          <div className="mt-1 text-xs text-muted-foreground">Distribusi jumlah siswa di setiap rombel</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.studentsPerClass}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12 }} cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }} />
                <Bar dataKey="siswa" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Penyimpanan</h2>
          </div>
          <div className="mt-6 text-center">
            <div className="font-display text-5xl font-bold">
              {used}
              <span className="text-xl text-muted-foreground"> / {total} GB</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Terpakai</div>
          </div>
          <Progress value={pct} className="mt-6 h-3" />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Sisa: {(total - used).toFixed(1)} GB</span>
            <span>{pct.toFixed(0)}% terpakai</span>
          </div>
          <Button className="mt-6 w-full rounded-xl">Kelola File</Button>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
