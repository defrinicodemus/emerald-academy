"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TeacherActivityKind, TeacherDetailData } from "@/lib/data/teacher-monitoring";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ModalTarget {
  classId: string;
  subjectId: string;
  gradeLevel: number;
  subjectName: string;
  kind: TeacherActivityKind;
}

const MODAL_CONFIG: Record<TeacherActivityKind, { title: string; col1: string; col2: string }> = {
  materi: { title: "Rincian Materi", col1: "Nama Materi", col2: "Tanggal Upload" },
  tugas: { title: "Rincian Tugas", col1: "Nama Tugas", col2: "Deadline" },
  kuis: { title: "Rincian Kuis", col1: "Nama Kuis", col2: "Tanggal Dibuat" },
  presensi: { title: "Rincian Presensi", col1: "Tanggal", col2: "Status Presensi" },
};

export function TeacherDetailView({ teacher }: { teacher: TeacherDetailData }) {
  const [modal, setModal] = useState<ModalTarget | null>(null);

  const modalRows = useMemo(() => {
    if (!modal) return [];
    const { classId, subjectId, kind } = modal;
    if (kind === "materi") {
      return teacher.materialItems
        .filter((m) => m.classId === classId && m.subjectId === subjectId)
        .map((m) => ({ id: m.id, col1: m.title, col2: formatDate(m.createdAt) }));
    }
    if (kind === "tugas") {
      return teacher.tugasItems
        .filter((t) => t.classId === classId && t.subjectId === subjectId)
        .map((t) => ({ id: t.id, col1: t.title, col2: t.dueAt ? formatDate(t.dueAt) : "-" }));
    }
    if (kind === "kuis") {
      return teacher.kuisItems
        .filter((k) => k.classId === classId && k.subjectId === subjectId)
        .map((k) => ({ id: k.id, col1: k.title, col2: formatDate(k.createdAt) }));
    }
    return teacher.meetingItems
      .filter((p) => p.classId === classId && p.subjectId === subjectId)
      .map((p) => ({ id: p.id, col1: formatDate(p.meetingDate), col2: "Sudah Diisi" }));
  }, [modal, teacher]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 gradient-primary p-8 text-primary-foreground shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl">
              {teacher.avatar ?? "👩‍🏫"}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">{teacher.name}</h1>
              <p className="mt-1 text-sm opacity-90">
                {teacher.subjectCount} Mata Pelajaran · {teacher.classCount} Kelas Diampu
              </p>
              <p className="mt-0.5 text-sm opacity-90">
                Total Aktivitas Semester Ini: {teacher.semesterActivityTotal}
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/teacher-monitoring">← Kembali ke Kinerja Guru</Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon="📘" label="Materi Diunggah" value={teacher.materialsUploaded} />
        <Stat icon="📝" label="Tugas Dibuat" value={teacher.assignmentsCreated} />
        <Stat icon="❓" label="Kuis Dibuat" value={teacher.quizzesCreated} />
        <Stat icon="🗓️" label="Presensi/Jurnal Mengajar Diisi" value={teacher.attendanceFilled} />
      </div>

      <Card className="rounded-3xl border-0 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold">Kelas & Mata Pelajaran yang Diampu</h2>
        <div className="mt-1 text-xs text-muted-foreground">
          Klik angka pada kolom aktivitas untuk melihat rincian
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3 text-right">Materi</th>
                <th className="px-4 py-3 text-right">Tugas</th>
                <th className="px-4 py-3 text-right">Kuis</th>
                <th className="px-4 py-3 text-right">Presensi/Jurnal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {teacher.classSubjectRows.map((row) => (
                <tr key={`${row.classId}-${row.subjectId}`}>
                  <td className="px-4 py-3 font-medium">{row.gradeLevel}</td>
                  <td className="px-4 py-3">{row.subjectName}</td>
                  <td className="px-1 py-1 text-right">
                    <ActivityCell
                      value={row.materiCount}
                      onClick={() =>
                        setModal({
                          classId: row.classId,
                          subjectId: row.subjectId,
                          gradeLevel: row.gradeLevel,
                          subjectName: row.subjectName,
                          kind: "materi",
                        })
                      }
                    />
                  </td>
                  <td className="px-1 py-1 text-right">
                    <ActivityCell
                      value={row.tugasCount}
                      onClick={() =>
                        setModal({
                          classId: row.classId,
                          subjectId: row.subjectId,
                          gradeLevel: row.gradeLevel,
                          subjectName: row.subjectName,
                          kind: "tugas",
                        })
                      }
                    />
                  </td>
                  <td className="px-1 py-1 text-right">
                    <ActivityCell
                      value={row.kuisCount}
                      onClick={() =>
                        setModal({
                          classId: row.classId,
                          subjectId: row.subjectId,
                          gradeLevel: row.gradeLevel,
                          subjectName: row.subjectName,
                          kind: "kuis",
                        })
                      }
                    />
                  </td>
                  <td className="px-1 py-1 text-right">
                    <ActivityCell
                      value={row.presensiCount}
                      onClick={() =>
                        setModal({
                          classId: row.classId,
                          subjectId: row.subjectId,
                          gradeLevel: row.gradeLevel,
                          subjectName: row.subjectName,
                          kind: "presensi",
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
              {teacher.classSubjectRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Guru ini belum ditugaskan mengajar kelas/mata pelajaran manapun.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={modal != null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-h-[85vh] w-[90vw] max-w-lg overflow-y-auto">
          {modal && (
            <>
              <DialogHeader>
                <DialogTitle>{MODAL_CONFIG[modal.kind].title}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Kelas {modal.gradeLevel} · {modal.subjectName}
                </p>
              </DialogHeader>
              <div className="mt-2 overflow-hidden rounded-2xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">{MODAL_CONFIG[modal.kind].col1}</th>
                      <th className="px-4 py-2.5">{MODAL_CONFIG[modal.kind].col2}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modalRows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 font-medium">{r.col1}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.col2}</td>
                      </tr>
                    ))}
                    {modalRows.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                          Belum ada aktivitas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityCell({ value, onClick }: { value: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-3 py-1.5 text-right font-display font-semibold text-primary transition hover:bg-primary-soft/50 hover:underline"
    >
      {value}
    </button>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Card className="rounded-3xl border-0 p-5 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft/60 text-lg text-primary">
        {icon}
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
    </Card>
  );
}
