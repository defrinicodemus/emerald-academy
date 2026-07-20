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
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { RosterStudentRow } from "@/lib/data/roster";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

export function RosterManager({
  combos,
  rosterByKey,
}: {
  combos: TeacherClassSubject[];
  rosterByKey: Record<string, RosterStudentRow[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const roster = rosterByKey[selectedKey] ?? [];

  return (
    <div className="space-y-6">
      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <Label className="text-xs">Kelas & Mata Pelajaran</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger className="mt-1 w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {combos.map((c) => (
              <SelectItem
                key={comboKey(c.classId, c.subjectId)}
                value={comboKey(c.classId, c.subjectId)}
              >
                {c.className} · {c.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <h2 className="font-display text-base font-bold @sm:text-lg @md:text-xl">Daftar Siswa</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-120 text-sm">
            <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2 text-left @sm:p-3">Siswa</th>
                <th className="p-2 text-left @sm:p-3">NISN</th>
                <th className="p-2 text-left @sm:p-3">Materi Dilihat</th>
                <th className="p-2 text-left @sm:p-3">Tugas Terkumpul</th>
                <th className="p-2 text-left @sm:p-3">Kuis Dikerjakan</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.studentId} className="border-b last:border-0">
                  <td className="p-2 @sm:p-3">
                    <div className="flex items-center gap-1.5 @sm:gap-2">
                      <div className="hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-base sm:grid">
                        {s.avatar ?? "🙂"}
                      </div>
                      <span className="font-medium">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground @sm:p-3">{s.nisn ?? "-"}</td>
                  <td className="p-2 @sm:p-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium @sm:px-2.5 @sm:py-1 @sm:text-xs">
                      {s.materialsViewed}/{s.materialsTotal}
                      <span className="hidden sm:inline"> selesai</span>
                    </span>
                  </td>
                  <td className="p-2 @sm:p-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium @sm:px-2.5 @sm:py-1 @sm:text-xs">
                      {s.assignmentsSubmitted}/{s.assignmentsTotal}
                      <span className="hidden sm:inline"> selesai</span>
                    </span>
                  </td>
                  <td className="p-2 @sm:p-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium @sm:px-2.5 @sm:py-1 @sm:text-xs">
                      {s.quizzesCompleted}/{s.quizzesTotal}
                      <span className="hidden sm:inline"> selesai</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {roster.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
