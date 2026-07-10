"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { promoteClasses } from "../actions";

type ClassRow = {
  id: string;
  name: string;
  grade_level: number;
  academic_year_id: string;
};
type YearRow = { id: string; year_label: string; semester: string; is_active: boolean };

const NONE = "__none__";

export function PromoteClassesPanel({ classes, years }: { classes: ClassRow[]; years: YearRow[] }) {
  const [open, setOpen] = useState(false);
  const activeYear = years.find((y) => y.is_active) ?? years[0];
  const [sourceYearId, setSourceYearId] = useState(activeYear?.id ?? "");
  const [targetYearId, setTargetYearId] = useState("");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const sourceClasses = useMemo(
    () =>
      classes
        .filter((c) => c.academic_year_id === sourceYearId && c.grade_level <= 5)
        .sort((a, b) => a.grade_level - b.grade_level),
    [classes, sourceYearId],
  );
  const targetClasses = useMemo(
    () =>
      classes
        .filter((c) => c.academic_year_id === targetYearId)
        .sort((a, b) => a.grade_level - b.grade_level),
    [classes, targetYearId],
  );

  const usedTargets = new Set(Object.values(mappings).filter(Boolean));
  const selectedCount = Object.values(mappings).filter(Boolean).length;

  function handleYearChange(kind: "source" | "target", value: string) {
    setMappings({});
    if (kind === "source") setSourceYearId(value);
    else setTargetYearId(value);
  }

  function handleConfirm() {
    const payload = Object.entries(mappings)
      .filter(([, targetClassId]) => Boolean(targetClassId))
      .map(([sourceClassId, targetClassId]) => ({ sourceClassId, targetClassId }));

    startTransition(async () => {
      const result = await promoteClasses(payload);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setMappings({});
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="rounded-3xl border-0 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Kenaikan Kelas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pindahkan siswa & penugasan guru dari tahun ajaran lama ke kelas baru.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg">
              Naikkan Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kenaikan Kelas</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Dari Tahun Ajaran
                  </p>
                  <Select value={sourceYearId} onValueChange={(v) => handleYearChange("source", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.year_label} — {y.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Ke Tahun Ajaran</p>
                  <Select value={targetYearId} onValueChange={(v) => handleYearChange("target", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {years
                        .filter((y) => y.id !== sourceYearId)
                        .map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.year_label} — {y.semester}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceYearId && targetYearId && sourceClasses.length === 0 && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  Tidak ada kelas 1-5 di tahun ajaran asal.
                </p>
              )}
              {sourceYearId && targetYearId && targetClasses.length === 0 && (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  Tahun ajaran tujuan belum punya kelas. Buat dulu lewat &quot;+ Tambah Kelas&quot;
                  di atas.
                </p>
              )}

              {sourceYearId &&
                targetYearId &&
                sourceClasses.length > 0 &&
                targetClasses.length > 0 && (
                  <div className="space-y-2">
                    {sourceClasses.map((sc) => {
                      const chosen = mappings[sc.id] ?? "";
                      return (
                        <div
                          key={sc.id}
                          className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5"
                        >
                          <div className="flex-1 text-sm font-medium">
                            {sc.name}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              (Tingkat {sc.grade_level})
                            </span>
                          </div>
                          <Select
                            value={chosen || NONE}
                            onValueChange={(v) =>
                              setMappings((m) => ({ ...m, [sc.id]: v === NONE ? "" : v }))
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Tidak dipindahkan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Tidak dipindahkan</SelectItem>
                              {targetClasses
                                .filter((tc) => tc.id === chosen || !usedTargets.has(tc.id))
                                .map((tc) => (
                                  <SelectItem key={tc.id} value={tc.id}>
                                    {tc.name} (Tingkat {tc.grade_level})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}

              <p className="text-xs text-muted-foreground">
                Kelas 6 tidak ditampilkan di sini — siswa kelas 6 dianggap lulus, hapus akunnya
                lewat Manajemen User setelah tahun ajaran baru aktif.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full rounded-xl" disabled={selectedCount === 0 || isPending}>
                    Proses Kenaikan Kelas ({selectedCount} kelas)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Proses kenaikan kelas sekarang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua siswa dan penugasan guru di {selectedCount} kelas yang dipetakan akan
                      dipindahkan ke kelas tujuan. Aksi ini tidak bisa dibatalkan otomatis.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>Proses</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
