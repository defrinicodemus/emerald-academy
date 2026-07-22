"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherClassSubject } from "@/lib/data/teaching";
import type { AttendanceStatus, MeetingData } from "@/lib/data/attendance";
import { fetchMeetingData, saveMeeting } from "./actions";
import { AttendanceRecapDialog } from "./AttendanceRecapDialog";

function comboKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: "hadir", label: "Hadir", activeClass: "border-emerald-600 bg-emerald-600 text-white" },
  { value: "sakit", label: "Sakit", activeClass: "border-amber-500 bg-amber-500 text-white" },
  { value: "izin", label: "Izin", activeClass: "border-blue-500 bg-blue-500 text-white" },
  { value: "alfa", label: "Alfa", activeClass: "border-red-700 bg-red-700 text-white" },
];

const MEETING_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

function formatDayName(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLastInput(iso: string | null): string {
  if (!iso) return "Belum Melakukan Presensi.";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
  const timePart = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar",
  });
  return `Terakhir diperbarui: ${datePart} • ${timePart} WITA`;
}

export function AttendanceManager({
  combos,
  filledMeetingsByKey,
}: {
  combos: TeacherClassSubject[];
  filledMeetingsByKey: Record<string, number[]>;
}) {
  const [selectedKey, setSelectedKey] = useState(comboKey(combos[0].classId, combos[0].subjectId));
  const selectedCombo = combos.find((c) => comboKey(c.classId, c.subjectId) === selectedKey)!;
  const [filledMeetings, setFilledMeetings] = useState(filledMeetingsByKey[selectedKey] ?? []);
  const [meetingNumber, setMeetingNumber] = useState(1);

  useEffect(() => {
    setFilledMeetings(filledMeetingsByKey[selectedKey] ?? []);
  }, [selectedKey, filledMeetingsByKey]);

  useEffect(() => {
    setMeetingNumber(1);
  }, [selectedKey]);

  return (
    <div className="space-y-6">
      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
          Kelas & Mata Pelajaran
        </Label>
        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger className="mt-1 w-full text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:w-80">
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

        <Label className="mt-5 block text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
          Pertemuan
        </Label>
        <Select value={String(meetingNumber)} onValueChange={(v) => setMeetingNumber(Number(v))}>
          <SelectTrigger className="mt-1 w-full text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEETING_NUMBERS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                <span className="flex items-center gap-1.5">
                  Pertemuan {n}
                  {filledMeetings.includes(n) && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <MeetingForm
        key={`${selectedKey}:${meetingNumber}`}
        classId={selectedCombo.classId}
        subjectId={selectedCombo.subjectId}
        className={selectedCombo.className}
        subjectName={selectedCombo.subjectName}
        meetingNumber={meetingNumber}
        onSaved={(n) => setFilledMeetings((prev) => (prev.includes(n) ? prev : [...prev, n]))}
      />
    </div>
  );
}

function MeetingForm({
  classId,
  subjectId,
  className,
  subjectName,
  meetingNumber,
  onSaved,
}: {
  classId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  meetingNumber: number;
  onSaved: (meetingNumber: number) => void;
}) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showRecap, setShowRecap] = useState(false);

  const [meetingDate, setMeetingDate] = useState("");
  const [materialTaught, setMaterialTaught] = useState("");
  const [learningObjectiveId, setLearningObjectiveId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMeetingData(classId, subjectId, meetingNumber).then((result) => {
      if (cancelled) return;
      setData(result);
      setMeetingDate(result.meetingDate);
      setMaterialTaught(result.materialTaught);
      setLearningObjectiveId(result.learningObjectiveId);
      setNotes(result.notes);
      setStatusByStudent(Object.fromEntries(result.students.map((s) => [s.studentId, s.status])));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [classId, subjectId, meetingNumber]);

  function handleSave() {
    if (!data) return;
    startTransition(async () => {
      const result = await saveMeeting(classId, subjectId, meetingNumber, {
        meetingDate,
        materialTaught,
        learningObjectiveId,
        notes,
        attendance: data.students.map((s) => ({
          studentId: s.studentId,
          status: statusByStudent[s.studentId] ?? "hadir",
        })),
      });
      if (result.ok) {
        toast.success(result.message);
        onSaved(meetingNumber);
        setData((prev) =>
          prev ? { ...prev, lastInputAt: result.lastInputAt ?? new Date().toISOString() } : prev,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  if (loading || !data) {
    return (
      <Card className="rounded-md border-0 p-10 text-center shadow-soft">
        <p className="text-sm text-muted-foreground">Memuat Pertemuan {meetingNumber}...</p>
      </Card>
    );
  }

  return (
    <>
      <div className="@container rounded-md border border-dashed bg-muted/30 px-4 py-2.5 text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)] font-medium text-muted-foreground">
        {data.lastInputAt ? (
          <>🕒 {formatLastInput(data.lastInputAt)}</>
        ) : (
          <>Belum Melakukan Presensi.</>
        )}
      </div>

      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <h2 className="font-display text-[clamp(1rem,0.875rem+0.45cqw,1.25rem)] font-bold">
          Presensi — Pertemuan {meetingNumber}
        </h2>
        {data.students.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada siswa di kelas ini.</p>
        ) : (
          <>
            {/* Mobile: 2 kolom, keterangan berupa dropdown kecil */}
            <div className="mt-4 overflow-hidden rounded-md border sm:hidden">
              <table className="w-full table-fixed text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="border-r p-2 text-left">Nama</th>
                    <th className="w-24 p-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((st) => {
                    const current = statusByStudent[st.studentId] ?? "hadir";
                    const activeClass = STATUS_OPTIONS.find(
                      (o) => o.value === current,
                    )?.activeClass;
                    return (
                      <tr key={st.studentId} className="border-b last:border-0">
                        <td className="border-r p-2 font-bold">
                          <div className="overflow-x-auto whitespace-nowrap">{st.fullName}</div>
                        </td>
                        <td className="p-2">
                          <Select
                            value={current}
                            onValueChange={(v) =>
                              setStatusByStudent((prev) => ({
                                ...prev,
                                [st.studentId]: v as AttendanceStatus,
                              }))
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-full px-2 text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)] font-semibold",
                                activeClass,
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Desktop: 3 kolom, keterangan berupa tombol horizontal */}
            <div className="mt-4 hidden overflow-x-auto rounded-md border sm:block">
              <table className="w-full table-fixed text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="border-r p-2 text-left">Nama</th>
                    <th className="w-16 border-r p-2 text-left">NISN</th>
                    <th className="w-[clamp(11rem,8rem+15cqw,20rem)] p-2 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((st) => (
                    <tr key={st.studentId} className="border-b last:border-0">
                      <td className="border-r p-2 font-bold">
                        <div className="overflow-x-auto whitespace-nowrap">{st.fullName}</div>
                      </td>
                      <td className="border-r p-2 text-muted-foreground">{st.nisn ?? "-"}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1.5 sm:flex-nowrap">
                          {STATUS_OPTIONS.map((opt) => {
                            const active = (statusByStudent[st.studentId] ?? "hadir") === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setStatusByStudent((prev) => ({
                                    ...prev,
                                    [st.studentId]: opt.value,
                                  }))
                                }
                                className={`shrink-0 rounded-md border px-3 py-1.5 text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)] font-semibold transition ${
                                  active
                                    ? opt.activeClass
                                    : "border-border bg-background hover:bg-muted"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card className="@container rounded-md border-0 p-4 shadow-soft @sm:p-6">
        <h2 className="font-display text-[clamp(1rem,0.875rem+0.45cqw,1.25rem)] font-bold">
          Jurnal Mengajar
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">Hari/Tanggal</Label>
            <Input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="mt-1 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)]"
            />
            <p className="mt-1 text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)] text-muted-foreground">
              {formatDayName(meetingDate)}
            </p>
          </div>
          <div>
            <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
              Tautan TP (Tujuan Pembelajaran)
            </Label>
            <Select
              value={learningObjectiveId ?? "none"}
              onValueChange={(v) => setLearningObjectiveId(v === "none" ? null : v)}
            >
              <SelectTrigger className="mt-1 h-auto w-full whitespace-normal py-2 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] [&>span]:line-clamp-none [&>span]:whitespace-normal sm:h-9 sm:[&>span]:line-clamp-1 sm:[&>span]:whitespace-nowrap">
                <SelectValue placeholder="Pilih TP..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">- Tidak ditautkan -</SelectItem>
                {data.tpOptions.map((tp) => (
                  <SelectItem key={tp.id} value={tp.id}>
                    {tp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
              Materi yang Diajarkan
            </Label>
            <Input
              value={materialTaught}
              onChange={(e) => setMaterialTaught(e.target.value)}
              className="mt-1 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:hidden"
            />
            <Input
              value={materialTaught}
              onChange={(e) => setMaterialTaught(e.target.value)}
              placeholder="Contoh: IPAS Bab 1 - Mengidentifikasi Mata dan Telinga"
              className="mt-1 hidden text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:block"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[clamp(0.6875rem,0.65rem+0.2cqw,0.8125rem)]">
              Catatan Kejadian Kelas
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:hidden"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Contoh: Pembelajaran kondusif, namun Doni tidak membawa buku paket. Materi selesai tepat waktu."
              className="mt-1 hidden text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)] sm:block"
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col items-end gap-2">
        <Button
          className="rounded-md text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)]"
          disabled={isPending || data.students.length === 0}
          onClick={handleSave}
        >
          {isPending ? "Menyimpan..." : "Simpan Presensi & Jurnal Hari Ini"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-md text-[clamp(0.8125rem,0.76rem+0.22cqw,0.9375rem)]"
          onClick={() => setShowRecap(true)}
        >
          <ClipboardList className="mr-2 size-[clamp(0.875rem,0.8rem+0.4cqw,1.125rem)]" /> Rekap
          Presensi
        </Button>
      </div>

      {showRecap && (
        <AttendanceRecapDialog
          classId={classId}
          subjectId={subjectId}
          className={className}
          subjectName={subjectName}
          onClose={() => setShowRecap(false)}
        />
      )}
    </>
  );
}
