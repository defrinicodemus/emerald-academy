"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, BookOpen, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { getStudentDashboardData } from "@/lib/data/dashboard";

type Data = Awaited<ReturnType<typeof getStudentDashboardData>>;

export function StudentDashboard({ data }: { data: Data }) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  const now = useMemo(() => new Date(), []);
  const dayLabel = now.toLocaleDateString("id-ID", { weekday: "long" });
  const dateLabel = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activityParts: string[] = [];
  if (data.pendingTugasCount > 0) {
    activityParts.push(`${data.pendingTugasCount} tugas perlu diselesaikan`);
  }
  if (data.pendingKuisCount > 0) {
    activityParts.push(`${data.pendingKuisCount} kuis menunggu dikerjakan`);
  }
  if (data.newMaterialsCount > 0) {
    activityParts.push(`${data.newMaterialsCount} materi baru tersedia`);
  }
  const hasActivity = activityParts.length > 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Halo, {firstName}! {hasActivity ? "👋" : "🌟"}
            </h1>
            {hasActivity ? (
              <>
                <p className="mt-2 text-sm opacity-90">Selamat belajar hari ini.</p>
                <p className="mt-1 max-w-md text-sm opacity-90">
                  Kamu memiliki {activityParts.join(", ")}.
                </p>
                <p className="mt-1 max-w-md text-sm opacity-90">
                  Ayo lanjutkan belajar dan capai targetmu hari ini!
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm opacity-90">
                  Hebat! Semua tugas dan kuis sudah selesai.
                </p>
                <p className="mt-1 max-w-md text-sm opacity-90">
                  Sekarang kamu bisa mempelajari materi baru atau menunggu aktivitas berikutnya.
                </p>
              </>
            )}
            <div className="mt-5 flex gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link href="/subjects">
                  Mulai Belajar <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm opacity-90">{dayLabel}</div>
            <div className="font-display text-lg font-bold">{dateLabel}</div>
          </div>
        </div>
      </Card>

      {/* Quick Info */}
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        <QuickInfoCard emoji="📚" value={data.materialsStudiedCount} label="Materi Dipelajari" />
        <QuickInfoCard emoji="📝" value={data.tugasCompletedCount} label="Tugas Diselesaikan" />
        <QuickInfoCard emoji="❓" value={data.kuisCompletedCount} label="Kuis Diselesaikan" />
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
          {/* Mobile: horizontal-style list, 3 subjects */}
          <div className="space-y-2 sm:hidden">
            {data.subjects.slice(0, 3).map((s) => {
              const countLabel = subjectCountLabel(s);
              return (
                <Link
                  href="/subjects"
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary hover:shadow-soft"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                    style={{ backgroundColor: `color-mix(in oklch, ${s.color} 20%, white)` }}
                  >
                    {s.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{s.name}</div>
                    {countLabel && (
                      <div className="text-xs text-muted-foreground">{countLabel}</div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          {/* Desktop/tablet: original icon-grid, each card gets a colored badge above it */}
          <div className="hidden gap-3 sm:grid sm:grid-cols-2 md:grid-cols-3">
            {data.subjects.slice(0, 6).map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5">
                <span
                  className="w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.code}
                </span>
                <Link
                  href="/subjects"
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
              </div>
            ))}
          </div>
        </Card>

        {/* Announcements: compact tap-through widget on mobile */}
        <Link
          href="/announcements"
          className="flex items-center gap-3 rounded-2xl bg-primary-soft/30 p-4 transition hover:bg-primary-soft/50 sm:hidden"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-primary shadow-soft">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Pengumuman Sekolah</div>
            <p className="truncate text-xs text-muted-foreground">
              {data.announcements[0]?.title ?? "Belum ada pengumuman"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        {/* Announcements: full card on desktop/tablet */}
        <Card className="hidden rounded-3xl border-0 p-6 shadow-soft sm:block">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Pengumuman</h2>
          </div>
          <div className="space-y-3">
            {data.announcements.map((a) => (
              <div key={a.id} className="rounded-2xl bg-primary-soft/30 p-4">
                <div className="text-xs font-medium text-primary">
                  {new Date(a.created_at).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="mt-1 font-semibold">{a.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
            <Link href="/announcements">
              Lihat Semua Pengumuman <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
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
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-xl">
                  📌
                </div>
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
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="nilai"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fill="url(#g1)"
                />
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

function subjectCountLabel(s: { materialCount: number; tugasCount: number; kuisCount: number }) {
  const parts: string[] = [];
  if (s.materialCount > 0) parts.push(`${s.materialCount} Materi`);
  if (s.tugasCount > 0) parts.push(`${s.tugasCount} Tugas`);
  if (s.kuisCount > 0) parts.push(`${s.kuisCount} Kuis`);
  return parts.length > 0 ? parts.join(" • ") : null;
}

function QuickInfoCard({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <Card className="aspect-square w-32 shrink-0 rounded-2xl border-0 p-4 shadow-soft md:aspect-auto md:w-auto md:p-5">
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center md:items-start md:text-left">
        <div className="text-2xl">{emoji}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}
