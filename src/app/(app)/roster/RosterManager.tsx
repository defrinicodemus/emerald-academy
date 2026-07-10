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
      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <Label>Kelas & Mata Pelajaran</Label>
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

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Siswa</th>
                <th className="p-3 text-left">NISN</th>
                <th className="p-3 text-left">Materi Dilihat</th>
                <th className="p-3 text-left">Tugas Terkumpul</th>
                <th className="p-3 text-left">Kuis Dikerjakan</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.studentId} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-base">
                        {s.avatar ?? "🙂"}
                      </div>
                      <span className="font-medium">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{s.nisn ?? "-"}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {s.materialsViewed}/{s.materialsTotal} selesai
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {s.assignmentsSubmitted}/{s.assignmentsTotal} selesai
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {s.quizzesCompleted}/{s.quizzesTotal} selesai
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
