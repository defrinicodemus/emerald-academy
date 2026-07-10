"use client";

import { useState } from "react";
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
  sakit: "bg-amber-100 text-amber-700",
  izin: "bg-blue-100 text-blue-700",
  alfa: "bg-red-100 text-red-700",
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
  const tidakHadir = selected.sakitCount + selected.izinCount + selected.alfaCount;

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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-0 bg-muted/40 p-4">
          <div className="text-xs text-muted-foreground">🗓️ Persentase Kehadiran</div>
          <div className="mt-1 font-display text-2xl font-bold">{selected.percentHadir}%</div>
        </Card>
        <Card className="rounded-2xl border-0 bg-muted/40 p-4">
          <div className="text-xs text-muted-foreground">✅ Hadir</div>
          <div className="mt-1 font-display text-2xl font-bold">{selected.hadirCount}</div>
        </Card>
        <Card className="rounded-2xl border-0 bg-muted/40 p-4">
          <div className="text-xs text-muted-foreground">⚠️ Tidak Hadir</div>
          <div className="mt-1 font-display text-2xl font-bold">{tidakHadir}</div>
        </Card>
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
