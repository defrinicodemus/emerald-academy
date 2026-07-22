"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GradebookStudentRow, HistoryTpGroup } from "@/lib/data/gradebook";
import type { StudentHistoryData } from "@/lib/data/gradebook";
import { fetchStudentHistory } from "./actions";

const FLUID_LABEL = "text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]";
const FLUID_BODY = "text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)]";
const FLUID_TITLE = "text-[clamp(1rem,0.875rem+0.45cqw,1.25rem)]";

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
      <DialogContent className="@container max-h-[80vh] w-full max-w-[75vw] overflow-y-auto rounded-md p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-[clamp(2.75rem,2.4rem+1.2cqw,3.5rem)] shrink-0 place-items-center rounded-full bg-primary-soft/50 text-[clamp(1.25rem,1.1rem+0.6cqw,1.5rem)]">
            {student.avatar ?? "🙂"}
          </div>
          <div>
            <div className={`font-display ${FLUID_TITLE} font-bold`}>
              Riwayat Belajar: {student.fullName}
            </div>
            <div className={`${FLUID_LABEL} text-muted-foreground`}>
              NISN: {student.nisn ?? "-"}
            </div>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Memuat riwayat...</p>}

        {!loading && data && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="rounded-md border-0 bg-muted/40 p-4">
                <div className={`${FLUID_LABEL} text-muted-foreground`}>📖 Progres Materi</div>
                <div className={`mt-1 font-display ${FLUID_TITLE} font-bold`}>
                  {data.materialsViewedPercent}% Dibaca
                </div>
              </Card>
              <Card className="rounded-md border-0 bg-muted/40 p-4">
                <div className={`${FLUID_LABEL} text-muted-foreground`}>🏆 Rata-rata Tugas</div>
                <div className={`mt-1 font-display ${FLUID_TITLE} font-bold`}>
                  {data.averageTugas ?? "-"} / 100
                </div>
              </Card>
              <Card className="rounded-md border-0 bg-muted/40 p-4">
                <div className={`${FLUID_LABEL} text-muted-foreground`}>🎮 Rata-rata Kuis</div>
                <div className={`mt-1 font-display ${FLUID_TITLE} font-bold`}>
                  {data.averageKuis ?? "-"} / 100
                </div>
              </Card>
            </div>

            <Tabs defaultValue="materi">
              <TabsList className={`rounded-md ${FLUID_BODY}`}>
                <TabsTrigger value="materi" className={`rounded-md ${FLUID_BODY}`}>
                  Materi
                </TabsTrigger>
                <TabsTrigger value="tugas" className={`rounded-md ${FLUID_BODY}`}>
                  Tugas
                </TabsTrigger>
                <TabsTrigger value="kuis" className={`rounded-md ${FLUID_BODY}`}>
                  Kuis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materi" className="mt-4">
                <div className="overflow-hidden rounded-md border">
                  <table className={`w-full table-fixed ${FLUID_LABEL}`}>
                    <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="border-r p-2 text-left">Nama Materi</th>
                        <th className="w-32 border-r p-2 text-left">Status</th>
                        <th className="w-36 p-2 text-left">Tanggal Dilihat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materials.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="border-r p-2 font-medium">{m.title}</td>
                          <td className="border-r p-2">
                            {m.viewed ? (
                              <span className="text-primary">Sudah Dilihat</span>
                            ) : (
                              <span className="text-muted-foreground">Belum Dilihat</span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">{formatDate(m.viewedAt)}</td>
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
                </div>
              </TabsContent>

              <TabsContent value="tugas" className="mt-4 space-y-4">
                {data.tugasByTp.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">Belum ada tugas.</p>
                )}
                {data.tugasByTp.map((group) => (
                  <TpAssignmentGroup
                    key={group.tpId}
                    group={group}
                    columnLabel="Nama Tugas"
                    dateLabel="Tanggal Kumpul"
                  />
                ))}
              </TabsContent>

              <TabsContent value="kuis" className="mt-4 space-y-4">
                {data.kuisByTp.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">Belum ada kuis.</p>
                )}
                {data.kuisByTp.map((group) => (
                  <TpAssignmentGroup
                    key={group.tpId}
                    group={group}
                    columnLabel="Nama Kuis"
                    dateLabel="Tanggal Dikerjakan"
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TpAssignmentGroup({
  group,
  columnLabel,
  dateLabel,
}: {
  group: HistoryTpGroup;
  columnLabel: string;
  dateLabel: string;
}) {
  return (
    <div>
      <div className={`mb-2 font-display ${FLUID_BODY} font-bold`}>{group.tpTitle}</div>
      <div className="overflow-hidden rounded-md border">
        <table className={`w-full table-fixed ${FLUID_LABEL}`}>
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="border-r p-2 text-left">{columnLabel}</th>
              <th className="w-36 border-r p-2 text-left">{dateLabel}</th>
              <th className="w-20 p-2 text-left">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {group.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="border-r p-2 font-medium">{item.title}</td>
                <td className="border-r p-2 text-muted-foreground">
                  {formatDate(item.submittedAt)}
                </td>
                <td className="p-2 font-semibold">{item.score ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
