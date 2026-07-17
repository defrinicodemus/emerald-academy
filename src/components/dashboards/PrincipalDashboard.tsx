"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCategoryBadgeClass } from "@/lib/announcement-categories";
import type { PrincipalDashboardData, PrincipalTodayActivity } from "@/lib/data/dashboard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

export function PrincipalDashboard({ data }: { data: PrincipalDashboardData }) {
  const now = useMemo(() => new Date(), []);
  const dayLabel = now.toLocaleDateString("id-ID", { weekday: "long" });
  const dateLabel = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Dashboard Kepala Sekolah
            </h1>
            <p className="mt-2 max-w-lg text-sm opacity-90">
              Pantau aktivitas pembelajaran, kinerja guru, dan perkembangan siswa secara real-time.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{dayLabel}</div>
            <div className="font-display text-lg font-bold">{dateLabel}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon="🎓" label="Total Siswa" value={data.totalStudents} hint="Siswa terdaftar" />
        <Stat icon="👩‍🏫" label="Total Guru" value={data.totalTeachers} hint="Aktif mengajar" />
        <Stat icon="🏫" label="Total Kelas" value={data.totalClasses} hint="Rombongan belajar" />
        <TodayActivityCard activity={data.todayActivity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Aktivitas LMS Mingguan</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            Jumlah aktivitas pembelajaran 7 hari terakhir
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyActivity}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12 }}
                  cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }}
                />
                <Bar dataKey="total" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Ringkasan Cepat Sekolah</h2>
          <div className="mt-1 text-xs text-muted-foreground">Aktivitas bulan ini</div>
          <div className="mt-4 space-y-3">
            <SummaryRow
              icon="📘"
              label="Materi diunggah bulan ini"
              value={data.monthlySummary.materials}
            />
            <SummaryRow
              icon="📝"
              label="Tugas dibuat bulan ini"
              value={data.monthlySummary.assignments}
            />
            <SummaryRow
              icon="❓"
              label="Kuis dibuat bulan ini"
              value={data.monthlySummary.quizzes}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Kinerja Guru</h2>
          <div className="mt-1 text-xs text-muted-foreground">3 guru paling aktif</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 text-left">Guru</th>
                  <th className="pb-2 text-right">Materi</th>
                  <th className="pb-2 text-right">Tugas</th>
                  <th className="pb-2 text-right">Presensi</th>
                </tr>
              </thead>
              <tbody>
                {data.topTeachers.map((t, i) => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2.5 font-medium">
                      <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-primary-soft/60 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {t.name}
                    </td>
                    <td className="py-2.5 text-right">{t.materials}</td>
                    <td className="py-2.5 text-right">{t.assignments}</td>
                    <td className="py-2.5 text-right">{t.attendanceSessions}</td>
                  </tr>
                ))}
                {data.topTeachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Belum ada data aktivitas guru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Monitoring Pembelajaran</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Kelas Paling Aktif</span>
              <span className="truncate font-display text-sm font-bold">
                {data.monitoring.mostActiveClassName ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Mata Pelajaran Paling Aktif</span>
              <span className="truncate font-display text-sm font-bold">
                {data.monitoring.mostActiveSubjectName ?? "-"}
              </span>
            </div>
            <ProgressRow
              label="Penyelesaian Tugas Siswa"
              percent={data.monitoring.tugasCompletionPercent}
            />
            <ProgressRow
              label="Penyelesaian Kuis Siswa"
              percent={data.monitoring.kuisCompletionPercent}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Pengumuman Terbaru</h2>
          <div className="mt-4 space-y-3">
            {data.recentAnnouncements.map((a) => (
              <div key={a.id} className="rounded-2xl bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getCategoryBadgeClass(a.category)}`}
                  >
                    {a.category}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDate(a.created_at)}
                  </span>
                </div>
                <div className="mt-1.5 text-sm font-medium">{a.title}</div>
              </div>
            ))}
            {data.recentAnnouncements.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
            )}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
            <Link href="/announcements">Pengumuman Selengkapnya</Link>
          </Button>
        </Card>

        <Card className="rounded-3xl border-0 p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Aktivitas Terbaru</h2>
          <div className="mt-4">
            {data.recentActivity.map((item, i) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  {i < data.recentActivity.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <div className="text-sm">{item.text}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{icon}</span> {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function TodayActivityCard({ activity }: { activity: PrincipalTodayActivity }) {
  const total =
    activity.materialsUploaded +
    activity.assignmentsCreated +
    activity.quizzesCreated +
    activity.attendanceFilled +
    activity.tugasSubmitted +
    activity.kuisCompleted;

  const rows = [
    { label: "Materi diunggah", value: activity.materialsUploaded },
    { label: "Tugas dibuat", value: activity.assignmentsCreated },
    { label: "Kuis dibuat", value: activity.quizzesCreated },
    { label: "Presensi diisi", value: activity.attendanceFilled },
    { label: "Tugas dikumpulkan", value: activity.tugasSubmitted },
    { label: "Kuis diselesaikan", value: activity.kuisCompleted },
  ];

  return (
    <Card className="group relative rounded-3xl border-0 p-5 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>⚡</span> Aktivitas LMS Hari Ini
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{total}</div>
      <div className="mt-1 text-xs text-muted-foreground">Aktivitas Tercatat</div>

      <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 origin-top scale-95 rounded-2xl border bg-popover p-4 text-popover-foreground opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <div className="space-y-1.5 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft/60 text-base text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</div>
      <div className="shrink-0 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function ProgressRow({ label, percent }: { label: string; percent: number | null }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display font-bold">{percent != null ? `${percent}%` : "-"}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}
