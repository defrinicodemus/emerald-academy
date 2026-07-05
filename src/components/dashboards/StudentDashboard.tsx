"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, Star, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { getStudentDashboardData } from "@/lib/data/dashboard";

type Data = Awaited<ReturnType<typeof getStudentDashboardData>>;

export function StudentDashboard({ data }: { data: Data }) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-sm opacity-80">Halo {user?.className} 👋</div>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
              Halo, {firstName}! Selamat belajar hari ini ✨
            </h1>
            <p className="mt-2 max-w-md text-sm opacity-90">
              Kamu punya {data.assignments.length} tugas aktif. Yuk semangat menyelesaikannya!
            </p>
            <div className="mt-5 flex gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link href="/subjects">
                  Mulai Belajar <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-xl text-primary-foreground hover:bg-white/15">
                <Link href="/rewards">Toko Bintang</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-white/15 px-6 py-5 text-center backdrop-blur">
            <div className="flex items-center justify-center gap-2 text-4xl font-bold">
              <Star className="h-7 w-7 fill-star text-star" /> {data.stars}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider opacity-90">Bintang Kamu</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tugas Aktif" value={String(data.assignments.length)} emoji="📝" />
        <StatCard label="Materi Baru" value={String(data.newMaterialsCount)} emoji="📚" />
        <StatCard label="Lencana" value={`${data.badgesEarned}/${data.badgesTotal}`} emoji="🏅" />
        <StatCard label="Rata-rata" value={data.average != null ? String(data.average) : "-"} emoji="📈" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subjects */}
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Mata Pelajaran Hari Ini</h2>
            <Link href="/subjects" className="text-xs font-medium text-primary hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {data.subjects.slice(0, 6).map((s) => (
              <Link
                href="/subjects"
                key={s.id}
                className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `color-mix(in oklch, ${s.color} 20%, white)` }}
                >
                  {s.emoji}
                </div>
                <div className="mt-3 font-semibold">{s.name}</div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Announcements */}
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Pengumuman</h2>
          </div>
          <div className="space-y-3">
            {data.announcements.map((a) => (
              <div key={a.id} className="rounded-2xl bg-primary-soft/30 p-4">
                <div className="text-xs font-medium text-primary">
                  {new Date(a.created_at).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div className="mt-1 font-semibold">{a.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Assignments + Trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Tugas Aktif</h2>
          </div>
          <div className="space-y-3">
            {data.assignments.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border p-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-xl">📌</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-primary">{a.subject}</div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground">Tenggat: {a.due}</div>
                </div>
                <Button className="rounded-xl">Mulai Kerjakan</Button>
              </div>
            ))}
            {data.assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada tugas aktif saat ini.</p>
            )}
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Progres Nilaiku</h2>
          <div className="mt-1 text-xs text-muted-foreground">Rata-rata bulanan</div>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide domain={[60, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="nilai" stroke="var(--color-primary)" strokeWidth={3} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target semester</span>
            <span className="font-semibold">85</span>
          </div>
          <Progress value={data.average ?? 0} className="mt-2 h-2" />
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-accent/40 p-3 text-xs">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Kerja bagus! Terus tingkatkan belajarmu.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/50 text-2xl">{emoji}</div>
      </div>
    </Card>
  );
}
