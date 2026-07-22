"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Eye, Lock, LockOpen } from "lucide-react";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { GradebookData, GradebookStudentRow } from "@/lib/data/gradebook";
import { lockAndCalculateGrades, unlockGradebook } from "./actions";
import { StudentHistoryDialog } from "./StudentHistoryDialog";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

export function GradebookManager({
  combos,
  gradebookByKey,
}: {
  combos: TeacherClassSubject[];
  gradebookByKey: Record<string, GradebookData>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const data = gradebookByKey[selectedKey];

  function handleExport() {
    const rows = data.students.map((st) => {
      const row: Record<string, string | number> = { "Nama Siswa": st.fullName };
      for (const tp of data.tpColumns) {
        row[`Nilai ${tp.title}`] = st.tpAverages[tp.id] ?? "-";
      }
      row["Nilai Akhir"] = st.finalGrade ?? "-";
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");
    XLSX.writeFile(
      workbook,
      `Buku-Nilai-${selectedCombo.className}-${selectedCombo.subjectName}.xlsx`,
    );
  }

  return (
    <div className="space-y-6">
      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full sm:w-80">
            <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
              Kelas & Mata Pelajaran
            </Label>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="mt-1 w-full text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {combos.map((c) => (
                  <SelectItem
                    key={comboKey(c.classId, c.subjectId)}
                    value={comboKey(c.classId, c.subjectId)}
                  >
                    {c.className} - {c.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-md bg-emerald-700 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] hover:bg-emerald-800"
            disabled={!data.isLocked}
            onClick={handleExport}
          >
            <Download className="mr-2 size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" /> Ekspor ke
            Excel
          </Button>
        </div>
      </Card>

      <GradebookTable
        data={data}
        classId={selectedCombo.classId}
        subjectId={selectedCombo.subjectId}
      />
    </div>
  );
}

function GradebookTable({
  data,
  classId,
  subjectId,
}: {
  data: GradebookData;
  classId: string;
  subjectId: string;
}) {
  const [historyStudent, setHistoryStudent] = useState<GradebookStudentRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLock() {
    startTransition(async () => {
      const result = await lockAndCalculateGrades(classId, subjectId);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function handleUnlock() {
    startTransition(async () => {
      const result = await unlockGradebook(classId, subjectId);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  // Nama Siswa fixed at 40%. The remaining 60% is split across TP columns +
  // Nilai Akhir + Riwayat, weighted by each column's minimum pixel need (Nilai
  // Akhir needs more room than a single TP score or the eye icon). The table's
  // own min-width is set to whatever width makes every shared column land
  // exactly at its floor; below that container width, the table can no longer
  // shrink and the wrapper's hidden-scrollbar overflow-x-auto takes over.
  const TP_FLOOR_PX = 64;
  const NILAI_FLOOR_PX = 128;
  const RIWAYAT_FLOOR_PX = 64;
  const totalFloorPx = data.tpColumns.length * TP_FLOOR_PX + NILAI_FLOOR_PX + RIWAYAT_FLOOR_PX;
  const tpSharePercent = (TP_FLOOR_PX / totalFloorPx) * 60;
  const nilaiSharePercent = (NILAI_FLOOR_PX / totalFloorPx) * 60;
  const riwayatSharePercent = (RIWAYAT_FLOOR_PX / totalFloorPx) * 60;
  const tableMinWidthPx = Math.round(totalFloorPx / 0.6);

  return (
    <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
      {data.tpColumns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada Tujuan Pembelajaran (TP) untuk kelas & mapel ini. Isi dulu lewat menu Kelola
          Kurikulum.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border scrollbar-hide">
            <table
              className="w-full table-fixed text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]"
              style={{ minWidth: `${tableMinWidthPx}px` }}
            >
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-[40%] border-r p-2 text-left">Nama Siswa</th>
                  {data.tpColumns.map((tp, i) => (
                    <th
                      key={tp.id}
                      className="border-r p-2 text-left"
                      style={{ width: `${tpSharePercent}%` }}
                      title={tp.title}
                    >
                      TP {i + 1}
                    </th>
                  ))}
                  <th
                    className="border-r whitespace-nowrap p-2 text-left"
                    style={{ width: `${nilaiSharePercent}%` }}
                  >
                    Nilai Akhir
                  </th>
                  <th className="p-2 text-left" style={{ width: `${riwayatSharePercent}%` }}>
                    Riwayat
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((st) => (
                  <tr key={st.studentId} className="border-b last:border-0">
                    <td className="border-r p-2">
                      <button
                        type="button"
                        onClick={() => setHistoryStudent(st)}
                        className="font-bold hover:underline"
                      >
                        {st.fullName}
                      </button>
                    </td>
                    {data.tpColumns.map((tp) => (
                      <td key={tp.id} className="border-r p-2">
                        {st.tpAverages[tp.id] ?? <span className="text-muted-foreground">-</span>}
                      </td>
                    ))}
                    <td className="border-r p-2">
                      {data.isLocked ? (
                        <span className="font-display text-[clamp(0.9375rem,0.85rem+0.3cqw,1.125rem)] font-bold text-primary">
                          {st.finalGrade ?? "-"}
                        </span>
                      ) : (
                        <span className="text-[clamp(0.625rem,0.58rem+0.2cqw,0.75rem)] text-muted-foreground">
                          Akan dihitung setelah dikunci
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-[clamp(1.75rem,1.6rem+0.6cqw,2rem)] rounded-md"
                        onClick={() => setHistoryStudent(st)}
                        aria-label="Lihat riwayat"
                      >
                        <Eye className="size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.students.length === 0 && (
                  <tr>
                    <td
                      colSpan={data.tpColumns.length + 3}
                      className="p-6 text-center text-sm text-muted-foreground"
                    >
                      Belum ada siswa di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            {data.isLocked ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-2.5 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] text-muted-foreground">
                  <Lock className="size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" /> Buku nilai
                  dikunci pada{" "}
                  {data.lockedAt &&
                    new Date(data.lockedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-md border-red-800 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] text-red-800 hover:bg-red-50"
                      disabled={isPending}
                    >
                      <LockOpen className="mr-2 size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" />{" "}
                      Buka Kunci
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Buka kunci buku nilai?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Nilai Akhir yang sudah dihitung untuk kelas & mapel ini akan dihapus. Anda
                        bisa menilai ulang tugas/kuis, lalu mengunci dan menghitung ulang nilai
                        akhir kapan saja.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUnlock}>Buka Kunci</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="rounded-md bg-red-800 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] text-white hover:bg-red-900"
                    disabled={isPending || data.students.length === 0}
                  >
                    <Lock className="mr-2 size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" /> Kunci &
                    Hitung Nilai
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kunci dan hitung nilai akhir sekarang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua nilai TP akan dihitung menjadi Nilai Akhir untuk seluruh siswa di kelas
                      ini, dan tidak akan bisa diubah lagi setelahnya. Pastikan semua tugas dan kuis
                      sudah dinilai sebelum mengunci.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLock}>Kunci & Hitung</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </>
      )}

      {historyStudent && (
        <StudentHistoryDialog
          student={historyStudent}
          classId={classId}
          subjectId={subjectId}
          onClose={() => setHistoryStudent(null)}
        />
      )}
    </Card>
  );
}
