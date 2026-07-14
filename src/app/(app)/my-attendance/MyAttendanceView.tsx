"use client";

import { useState } from "react";
import { Check, Calendar, Thermometer, X, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttendanceStatus, StudentSubjectAttendance } from "@/lib/data/attendance";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alfa",
};

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  izin: "bg-amber-100 text-amber-700",
  sakit: "bg-blue-100 text-blue-700",
  alfa: "bg-red-100 text-red-700",
};

const STATUS_TILE_TINT: Record<AttendanceStatus, { bg: string; badge: string; text: string }> = {
  hadir: {
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-700",
  },
  izin: { bg: "bg-amber-50", badge: "bg-amber-100 text-amber-600", text: "text-amber-700" },
  sakit: { bg: "bg-blue-50", badge: "bg-blue-100 text-blue-600", text: "text-blue-700" },
  alfa: { bg: "bg-red-50", badge: "bg-red-100 text-red-600", text: "text-red-700" },
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MyAttendanceView({ subjects }: { subjects: StudentSubjectAttendance[] }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.subjectId ?? "");

  if (subjects.length === 0) {
    return (
      <Card className="rounded-3xl border-0 p-10 text-center shadow-soft">
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Belum ada mata pelajaran yang terdaftar untuk kelasmu.
        </p>
      </Card>
    );
  }

  const selected = subjects.find((s) => s.subjectId === selectedSubjectId) ?? subjects[0];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <Label>Mata Pelajaran</Label>
        <Select value={selected.subjectId} onValueChange={setSelectedSubjectId}>
          <SelectTrigger className="mt-1 w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.subjectId} value={s.subjectId}>
                {s.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Mobile: percentage bar + 2x2 status grid */}
      <div className="space-y-3 md:hidden">
        <Card className="rounded-2xl border-0 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rata-rata Kehadiran</span>
            <span className="font-display text-lg font-bold text-emerald-600">
              {selected.percentHadir}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, selected.percentHadir))}%` }}
            />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <StatusTile
            icon={Check}
            value={selected.hadirCount}
            label="Hadir"
            tint={STATUS_TILE_TINT.hadir}
          />
          <StatusTile
            icon={Calendar}
            value={selected.izinCount}
            label="Izin"
            tint={STATUS_TILE_TINT.izin}
          />
          <StatusTile
            icon={Thermometer}
            value={selected.sakitCount}
            label="Sakit"
            tint={STATUS_TILE_TINT.sakit}
          />
          <StatusTile
            icon={X}
            value={selected.alfaCount}
            label="Alfa"
            tint={STATUS_TILE_TINT.alfa}
          />
        </div>
      </div>

      {/* Desktop: horizontal row of quick-info cards */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-3">
        <AttendancePercentCard percent={selected.percentHadir} />
        <QuickInfoCard
          emoji="✅"
          value={selected.hadirCount}
          label="Hadir"
          badgeClass={STATUS_BADGE.hadir}
        />
        <QuickInfoCard
          emoji="✋"
          value={selected.izinCount}
          label="Izin"
          badgeClass={STATUS_BADGE.izin}
        />
        <QuickInfoCard
          emoji="🤒"
          value={selected.sakitCount}
          label="Sakit"
          badgeClass={STATUS_BADGE.sakit}
        />
        <QuickInfoCard
          emoji="❌"
          value={selected.alfaCount}
          label="Alfa"
          badgeClass={STATUS_BADGE.alfa}
        />
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">
          Riwayat Presensi — {selected.subjectName}
        </h2>
        {selected.meetings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada presensi yang diisi untuk mata pelajaran ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Pertemuan</th>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {selected.meetings.map((m) => (
                  <tr key={m.meetingNumber} className="border-t">
                    <td className="p-3 font-medium">Pertemuan {m.meetingNumber}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(m.meetingDate)}</td>
                    <td className="p-3">
                      {m.status ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[m.status]}`}
                        >
                          {STATUS_LABEL[m.status]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tint: { bg: string; badge: string; text: string };
}) {
  return (
    <Card className={`rounded-2xl border-0 p-4 text-center shadow-soft ${tint.bg}`}>
      <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${tint.badge}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${tint.text}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function QuickInfoCard({
  emoji,
  value,
  label,
  badgeClass,
}: {
  emoji: string;
  value: number;
  label: string;
  badgeClass: string;
}) {
  return (
    <Card className="aspect-square w-32 shrink-0 rounded-2xl border-0 p-4 shadow-soft md:aspect-auto md:w-auto md:p-5">
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base ${badgeClass}`}
          >
            {emoji}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </div>
    </Card>
  );
}

function AttendancePercentCard({ percent }: { percent: number }) {
  return (
    <Card className="aspect-square w-32 shrink-0 rounded-2xl border-0 p-4 shadow-soft md:aspect-auto md:w-auto md:p-5">
      <div className="flex h-full flex-col justify-center gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft/60 text-base text-primary">
            🗓️
          </div>
          <span className="text-xs font-medium text-muted-foreground">Kehadiran</span>
        </div>
        <div className="font-display text-2xl font-bold">{percent}%</div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
