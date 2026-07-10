"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GradebookStudentRow } from "@/lib/data/gradebook";
import type { StudentHistoryData } from "@/lib/data/gradebook";
import { fetchStudentHistory } from "./actions";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function StudentHistoryDialog({
  student,
  classId,
  subjectId,
  onClose,
}: {
  student: GradebookStudentRow;
  classId: string;
  subjectId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStudentHistory(student.studentId, classId, subjectId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [student.studentId, classId, subjectId]);

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-4xl overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-2xl">
            {student.avatar ?? "🙂"}
          </div>
          <div>
            <div className="font-display text-lg font-bold">
              Riwayat Belajar: {student.fullName}
            </div>
            <div className="text-xs text-muted-foreground">NISN: {student.nisn ?? "-"}</div>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Memuat riwayat...</p>}

        {!loading && data && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-2xl border-0 bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">📖 Progres Materi</div>
                <div className="mt-1 font-display text-xl font-bold">
                  {data.materialsViewedPercent}% Dibaca
                </div>
              </Card>
              <Card className="rounded-2xl border-0 bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">🏆 Rata-rata Tugas</div>
                <div className="mt-1 font-display text-xl font-bold">
                  {data.averageTugas ?? "-"} / 100
                </div>
              </Card>
              <Card className="rounded-2xl border-0 bg-muted/40 p-4">
                <div className="text-xs text-muted-foreground">🎮 Rata-rata Kuis</div>
                <div className="mt-1 font-display text-xl font-bold">
                  {data.averageKuis ?? "-"} / 100
                </div>
              </Card>
            </div>

            <Tabs defaultValue="materi">
              <TabsList>
                <TabsTrigger value="materi">Materi</TabsTrigger>
                <TabsTrigger value="tugas">Tugas</TabsTrigger>
                <TabsTrigger value="kuis">Kuis</TabsTrigger>
              </TabsList>

              <TabsContent
                value="materi"
                className="mt-4 max-h-80 overflow-y-auto rounded-xl border"
              >
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Nama Materi</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Tanggal Dilihat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.materials.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="p-3">{m.title}</td>
                        <td className="p-3">
                          {m.viewed ? (
                            <span className="text-primary">Sudah Dilihat</span>
                          ) : (
                            <span className="text-muted-foreground">Belum Dilihat</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(m.viewedAt)}</td>
                      </tr>
                    ))}
                    {data.materials.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground">
                          Belum ada materi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent
                value="tugas"
                className="mt-4 max-h-80 overflow-y-auto rounded-xl border"
              >
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Nama Tugas</th>
                      <th className="p-3 text-left">Tanggal Kumpul</th>
                      <th className="p-3 text-left">Nilai Angka</th>
                      <th className="p-3 text-left">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tugas.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="p-3">{t.title}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(t.submittedAt)}</td>
                        <td className="p-3 font-semibold">{t.score ?? "-"}</td>
                        <td className="p-3 text-muted-foreground">{t.teacherComment ?? "-"}</td>
                      </tr>
                    ))}
                    {data.tugas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          Belum ada tugas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent value="kuis" className="mt-4 max-h-80 overflow-y-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Nama Kuis</th>
                      <th className="p-3 text-left">Tanggal Dikerjakan</th>
                      <th className="p-3 text-left">Nilai Angka</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.kuis.map((k) => (
                      <tr key={k.id} className="border-t">
                        <td className="p-3">{k.title}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(k.submittedAt)}</td>
                        <td className="p-3 font-semibold">{k.score ?? "-"}</td>
                      </tr>
                    ))}
                    {data.kuis.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground">
                          Belum ada kuis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
