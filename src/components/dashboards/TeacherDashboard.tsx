"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useActiveClass, ClassPicker } from "@/components/ClassPicker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClipboardList, FileText, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TeacherClassSubject } from "@/lib/data/teaching";

interface MeetingAttendance {
  name: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
}

interface Stats {
  totalStudents: number;
  activeMaterials: number;
  ungraded: number;
  attendanceByMeeting: MeetingAttendance[];
}

export function TeacherDashboard({
  userName,
  schoolName,
  combos,
}: {
  userName: string;
  schoolName: string | null;
  combos: TeacherClassSubject[];
}) {
  const { active, activeClassId } = useActiveClass();
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const subjectsForActiveClass = useMemo(
    () => combos.filter((c) => c.className === active),
    [active, combos],
  );

  useEffect(() => {
    setSelectedSubjectId(subjectsForActiveClass[0]?.subjectId ?? null);
  }, [subjectsForActiveClass]);

  const now = useMemo(() => new Date(), []);
  const dayLabel = now.toLocaleDateString("id-ID", { weekday: "long" });
  const dateLabel = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const classLabel = active ? (/^kelas\b/i.test(active) ? active : `Kelas ${active}`) : null;

  const teachingLabel = useMemo(() => {
    if (active && classLabel) {
      const subjects = [
        ...new Set(combos.filter((c) => c.className === active).map((c) => c.subjectName)),
      ];
      return subjects.length > 0 ? `Guru ${subjects.join(" & ")} ${classLabel}` : classLabel;
    }
    const subjects = [...new Set(combos.map((c) => c.subjectName))];
    return subjects.length > 0 ? `Guru ${subjects.join(", ")}` : "Guru";
  }, [active, classLabel, combos]);

  useEffect(() => {
    if (!activeClassId) {
      setStats(null);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const [
        { count: totalStudents },
        { count: activeMaterials },
        { data: assignmentRows },
        { data: meetingRows },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("class_id", activeClassId)
          .eq("role", "student"),
        supabase
          .from("materials")
          .select("id", { count: "exact", head: true })
          .eq("class_id", activeClassId),
        supabase.from("assignments").select("id").eq("class_id", activeClassId),
        selectedSubjectId
          ? supabase
              .from("class_meetings")
              .select("id, meeting_number")
              .eq("class_id", activeClassId)
              .eq("subject_id", selectedSubjectId)
              .order("meeting_number")
          : Promise.resolve({
              data: [] as { id: string; meeting_number: number }[],
            }),
      ]);

      const assignmentIds = (assignmentRows ?? []).map((a) => a.id);
      let ungraded = 0;

      if (assignmentIds.length > 0) {
        const { data: submissions } = await supabase
          .from("submissions")
          .select("status")
          .in("assignment_id", assignmentIds);
        for (const s of submissions ?? []) {
          if (s.status === "submitted") ungraded++;
        }
      }

      const meetingIds = (meetingRows ?? []).map((m) => m.id);
      let attendanceByMeeting: MeetingAttendance[] = [];

      if (meetingIds.length > 0) {
        const { data: records } = await supabase
          .from("attendance_records")
          .select("meeting_id, status")
          .in("meeting_id", meetingIds);

        type Status = "hadir" | "sakit" | "izin" | "alfa";
        const isStatus = (v: string): v is Status =>
          v === "hadir" || v === "sakit" || v === "izin" || v === "alfa";

        const countsByMeetingId = new Map<string, Record<Status, number>>();
        for (const r of records ?? []) {
          const acc = countsByMeetingId.get(r.meeting_id) ?? {
            hadir: 0,
            sakit: 0,
            izin: 0,
            alfa: 0,
          };
          if (isStatus(r.status)) acc[r.status]++;
          countsByMeetingId.set(r.meeting_id, acc);
        }

        attendanceByMeeting = (meetingRows ?? [])
          .slice()
          .sort((a, b) => a.meeting_number - b.meeting_number)
          .map((m) => ({
            name: `Pertemuan ${m.meeting_number}`,
            ...(countsByMeetingId.get(m.id) ?? { hadir: 0, sakit: 0, izin: 0, alfa: 0 }),
          }))
          .slice(-10);
      }

      if (!cancelled) {
        setStats({
          totalStudents: totalStudents ?? 0,
          activeMaterials: activeMaterials ?? 0,
          ungraded,
          attendanceByMeeting,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeClassId, selectedSubjectId]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm opacity-90">Selamat Datang,</p>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{userName}</h1>
            <p className="mt-1 text-sm opacity-90">{teachingLabel}</p>
            {schoolName && <p className="text-sm opacity-90">{schoolName}</p>}
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{dayLabel}</div>
            <div className="font-display text-lg font-bold">{dateLabel}</div>
          </div>
        </div>
        <div className="mt-5">
          <ClassPicker />
        </div>
      </Card>

      {!active || !stats ? (
        <Card className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary-soft/20 p-10 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-warning" />
          <h2 className="mt-3 font-display text-xl font-bold">Belum memilih kelas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Beberapa data terkunci sampai Anda memilih kelas aktif. Gunakan pemilih kelas di atas
            atau di header.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat
              icon={Users}
              label="Total Siswa"
              value={String(stats.totalStudents)}
              hint={active}
              href="/roster"
            />
            <Stat
              icon={FileText}
              label="Materi Aktif"
              value={String(stats.activeMaterials)}
              hint="Total diunggah"
              href="/classroom"
            />
            <Stat
              icon={ClipboardList}
              label="Belum Dinilai"
              value={String(stats.ungraded)}
              hint="Menunggu koreksi"
              href="/assessments"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-3xl border-0 p-6 shadow-soft lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold">Grafik Kehadiran</h2>
                {subjectsForActiveClass.length > 1 ? (
                  <Select value={selectedSubjectId ?? ""} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsForActiveClass.map((c) => (
                        <SelectItem key={c.subjectId} value={c.subjectId}>
                          {c.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : subjectsForActiveClass.length === 1 ? (
                  <span className="text-xs text-muted-foreground">
                    {subjectsForActiveClass[0].subjectName}
                  </span>
                ) : null}
              </div>
              {stats.attendanceByMeeting.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Belum ada presensi yang diisi untuk kelas ini.
                </p>
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.attendanceByMeeting}>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        content={<AttendanceTooltip />}
                        cursor={{ fill: "var(--color-primary-soft)", opacity: 0.4 }}
                      />
                      <Bar dataKey="hadir" radius={[12, 12, 0, 0]} fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card className="rounded-3xl border-0 p-6 shadow-soft">
              <h2 className="font-display text-xl font-bold">Aksi Cepat</h2>
              <div className="mt-4 grid gap-2">
                <Button asChild className="h-12 justify-start rounded-xl text-base">
                  <Link href="/classroom">+ Tambah Materi</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-12 justify-start rounded-xl text-base"
                >
                  <Link href="/classroom">+ Buat Kuis</Link>
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function AttendanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: MeetingAttendance }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-md">
      <div className="mb-1.5 font-semibold">{label}</div>
      <div className="space-y-0.5">
        <div>Hadir: {d.hadir}</div>
        <div>Izin: {d.izin}</div>
        <div>Sakit: {d.sakit}</div>
        <div>Alfa: {d.alfa}</div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="rounded-3xl border-0 p-5 shadow-soft transition hover:shadow-glow">
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
    </Link>
  );
}
