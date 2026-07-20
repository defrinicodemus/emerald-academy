"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  BookOpen,
  Image as ImageIcon,
  HelpCircle,
  Presentation,
  Download,
  type LucideIcon,
} from "lucide-react";
import type {
  AssignmentContentRow,
  MaterialContentRow,
  StudentQuizData,
  StudentQuizQuestion,
} from "@/lib/data/subjects";
import {
  markMaterialViewed,
  submitAssignment,
  fetchQuizForStudent,
  submitQuizAnswers,
} from "./actions";
import { ExpandableCardList } from "./ExpandableCardList";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, LucideIcon> = {
  pdf: FileText,
  video: Video,
  text: BookOpen,
  image: ImageIcon,
  slideshow: Presentation,
};
const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  video: "YouTube",
  text: "Teks",
  image: "Gambar",
  slideshow: "Slideshow",
};

const TUGAS_STATUS_LABEL: Record<string, string> = {
  belum: "Belum Dikerjakan",
  dikerjakan: "Sedang Dikerjakan",
  submitted: "Sudah Dikirim",
  graded: "Selesai",
};
const TUGAS_STATUS_STYLE: Record<string, string> = {
  belum: "bg-red-100 text-red-700",
  dikerjakan: "bg-blue-100 text-blue-700",
  submitted: "bg-amber-100 text-amber-700",
  graded: "bg-emerald-100 text-emerald-700",
};
const TUGAS_STATUS_EMOJI: Record<string, string> = {
  belum: "🔴",
  dikerjakan: "🔵",
  submitted: "🟡",
  graded: "🟢",
};

const CARD_HEIGHT =
  "flex h-[188px] w-full flex-col justify-between rounded-3xl border-0 bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow";

function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return "-";
  const due = new Date(dueAt);
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  const time = due.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Hari ini, ${time}`;
  if (diffDays === 1) return `Besok, ${time}`;
  const sameYear = due.getFullYear() === now.getFullYear();
  return due.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
}

interface SubjectRow {
  id: string;
  code: string;
  name: string;
  emoji: string | null;
  color: string | null;
}

export function SubjectsExplorer({
  subjects,
  materialsBySubject,
  tugasBySubject,
  kuisBySubject,
}: {
  subjects: SubjectRow[];
  materialsBySubject: Record<string, MaterialContentRow[]>;
  tugasBySubject: Record<string, AssignmentContentRow[]>;
  kuisBySubject: Record<string, AssignmentContentRow[]>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = subjects.find((s) => s.id === open);

  if (active) {
    const materials = materialsBySubject[active.id] ?? [];
    const tugas = tugasBySubject[active.id] ?? [];
    const kuis = kuisBySubject[active.id] ?? [];
    return (
      <div className="space-y-6">
        <PageHeader
          icon={active.emoji ?? "📚"}
          title={active.name}
          subtitle="Materi, tugas, dan kuis untuk pelajaran ini"
          action={
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(null)}>
              ← Kembali
            </Button>
          }
        />
        <Tabs defaultValue="materi">
          <TabsList className="rounded-2xl bg-muted p-1">
            <TabsTrigger value="materi" className="rounded-xl">
              📚 Materi
            </TabsTrigger>
            <TabsTrigger value="tugas" className="rounded-xl">
              📝 Tugas
            </TabsTrigger>
            <TabsTrigger value="kuis" className="rounded-xl">
              ❓ Kuis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="materi" className="mt-4">
            <ExpandableCardList
              items={materials}
              keyOf={(m) => m.id}
              renderItem={(m) => <MaterialCard material={m} />}
              labelMore="🔽 Lihat Materi Lainnya"
              labelLess="🔼 Sembunyikan"
              emptyMessage="Belum ada materi."
            />
          </TabsContent>
          <TabsContent value="tugas" className="mt-4">
            <ExpandableCardList
              items={tugas}
              keyOf={(a) => a.id}
              renderItem={(a) => <TugasCard assignment={a} />}
              labelMore="🔽 Lihat Tugas Sebelumnya"
              labelLess="🔼 Sembunyikan"
              emptyMessage="Belum ada tugas."
            />
          </TabsContent>
          <TabsContent value="kuis" className="mt-4">
            <ExpandableCardList
              items={kuis}
              keyOf={(a) => a.id}
              renderItem={(a) => <KuisCard assignment={a} />}
              labelMore="🔽 Lihat Kuis Sebelumnya"
              labelLess="🔼 Sembunyikan"
              emptyMessage="Belum ada kuis."
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📚"
        title="Mata Pelajaran"
        subtitle="Pilih pelajaran untuk melihat materi dan tugas"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => {
          const materialCount = materialsBySubject[s.id]?.length ?? 0;
          const tugasCount = tugasBySubject[s.id]?.length ?? 0;
          const kuisCount = kuisBySubject[s.id]?.length ?? 0;
          return (
            <button
              key={s.id}
              onClick={() => setOpen(s.id)}
              className="group rounded-3xl border-0 bg-card p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
                style={{
                  backgroundColor: `color-mix(in oklch, ${s.color ?? "oklch(0.7 0.1 150)"} 20%, white)`,
                }}
              >
                {s.emoji}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {materialCount} materi · {tugasCount} tugas · {kuisCount} kuis
              </p>
              <div className="mt-4 inline-flex text-xs font-medium text-primary group-hover:underline">
                Buka pelajaran →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MaterialCard({ material: m }: { material: MaterialContentRow }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const Icon = KIND_ICON[m.kind] ?? FileText;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !m.viewed) {
      startTransition(() => {
        markMaterialViewed(m.id);
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={CARD_HEIGHT}>
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft/60 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  m.viewed ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {m.viewed ? "🟢 Sudah Dibaca" : "⚪ Belum Dibaca"}
              </span>
            </div>
            <div className="mt-3 line-clamp-2 font-semibold">{m.title}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {m.learningObjectiveTitle
              ? `Capaian: ${m.learningObjectiveTitle}`
              : (KIND_LABEL[m.kind] ?? m.kind)}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m.title}</DialogTitle>
          {m.learningObjectiveTitle && (
            <p className="text-xs text-muted-foreground">Capaian: {m.learningObjectiveTitle}</p>
          )}
        </DialogHeader>
        <MaterialContentView material={m} />
      </DialogContent>
    </Dialog>
  );
}

function MaterialContentView({ material: m }: { material: MaterialContentRow }) {
  if (m.kind === "text") {
    return m.content ? (
      <div
        className="rich-text-content rounded-xl bg-muted/40 p-4 text-sm"
        dangerouslySetInnerHTML={{ __html: m.content }}
      />
    ) : (
      <p className="rounded-xl bg-muted/40 p-4 text-sm">Belum ada isi materi.</p>
    );
  }
  if (m.kind === "image" && m.url) {
    return <img src={m.url} alt={m.title} className="w-full rounded-xl object-cover" />;
  }
  if (m.kind === "video" && m.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe src={m.url} title={m.title} className="h-full w-full" allowFullScreen />
      </div>
    );
  }
  if (m.kind === "slideshow" && m.url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe src={m.url} title={m.title} className="h-full w-full" allowFullScreen />
      </div>
    );
  }
  if (m.kind === "pdf" && m.url) {
    return (
      <div className="overflow-hidden rounded-xl border">
        <iframe src={m.url} title={m.title} className="h-[70vh] w-full" />
      </div>
    );
  }
  return <p className="text-sm text-muted-foreground">Konten belum tersedia.</p>;
}

function TugasCard({ assignment: a }: { assignment: AssignmentContentRow }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(a);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={CARD_HEIGHT}>
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="line-clamp-2 font-semibold">{local.title}</div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TUGAS_STATUS_STYLE[local.status]}`}
              >
                {TUGAS_STATUS_EMOJI[local.status]} {TUGAS_STATUS_LABEL[local.status]}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Tenggat: {formatDueDate(local.dueAt)}
            </div>
            {local.status === "submitted" && (
              <div className="mt-1 text-xs text-muted-foreground">Menunggu penilaian guru...</div>
            )}
          </div>
          <div>
            {local.status === "graded" && local.score != null ? (
              <div className="font-display text-sm font-bold text-primary">
                ✨ Nilai: {local.score}/100
              </div>
            ) : (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {local.learningObjectiveTitle ? `Capaian: ${local.learningObjectiveTitle}` : ""}
              </div>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-2xl overflow-y-auto">
        <TugasDetailContent assignment={local} onUpdate={setLocal} />
      </DialogContent>
    </Dialog>
  );
}

function TugasDetailContent({
  assignment: a,
  onUpdate,
}: {
  assignment: AssignmentContentRow;
  onUpdate: (a: AssignmentContentRow) => void;
}) {
  const [answer, setAnswer] = useState(a.submissionContent ?? "");
  const [isPending, startTransition] = useTransition();
  const locked = a.status === "graded";

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAssignment(a.id, answer);
      if (result.ok) {
        toast.success(result.message);
        onUpdate({ ...a, status: "submitted", submissionContent: answer.trim() });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{a.title}</DialogTitle>
        {a.learningObjectiveTitle && (
          <p className="text-xs text-muted-foreground">Capaian: {a.learningObjectiveTitle}</p>
        )}
      </DialogHeader>

      {a.description && (
        <div
          className="rich-text-content rounded-xl bg-muted/40 p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: a.description }}
        />
      )}

      {a.attachmentImageUrl && (
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Lampiran dari Guru
          </Label>
          <ul className="mt-1.5 space-y-1.5">
            <li className="rounded-lg border px-3 py-1.5 text-sm">
              <a
                href={a.attachmentImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.attachmentImageName ?? "Lampiran"}</span>
              </a>
            </li>
          </ul>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Tenggat: {formatDueDate(a.dueAt)}</div>

      {locked && a.score != null && (
        <div className="rounded-2xl bg-primary-soft/40 p-4">
          <div className="font-display text-2xl font-bold text-primary">
            ✨ Nilai: {a.score}/100
          </div>
          {a.teacherComment && (
            <div className="mt-3 rounded-xl bg-card p-3 text-sm">
              <div className="text-xs font-medium text-primary">💬 Catatan Motivasi dari Guru</div>
              <p className="mt-1 text-muted-foreground">{a.teacherComment}</p>
            </div>
          )}
        </div>
      )}

      {!locked && (
        <div className="space-y-2">
          <Label>Jawaban / Tautan Hasil Kerja Kamu</Label>
          <Textarea
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tulis jawabanmu di sini, atau tempel tautan foto/audio hasil kerjamu..."
          />
          <Button
            className="w-full rounded-xl"
            disabled={isPending || !answer.trim()}
            onClick={handleSubmit}
          >
            {isPending ? "Mengirim..." : a.status === "submitted" ? "Kirim Ulang" : "Kirim Tugas"}
          </Button>
          {a.status === "submitted" && (
            <p className="text-center text-xs text-muted-foreground">Menunggu penilaian guru...</p>
          )}
        </div>
      )}
    </div>
  );
}

function KuisCard({ assignment: a }: { assignment: AssignmentContentRow }) {
  const [open, setOpen] = useState(false);
  const done = a.status === "graded";

  let badgeLabel = "🔴 Belum Dikerjakan";
  let badgeClass = "bg-red-100 text-red-700";
  if (done) {
    badgeLabel = "🟢 Selesai";
    badgeClass = "bg-emerald-100 text-emerald-700";
  } else if (a.quizStatus === "nonaktif") {
    badgeLabel = "⚪ Nonaktif";
    badgeClass = "bg-zinc-200 text-zinc-700";
  } else if (a.quizStatus === "selesai") {
    badgeLabel = "🔵 Waktu Habis";
    badgeClass = "bg-blue-100 text-blue-700";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={CARD_HEIGHT}>
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft/60 text-primary">
                <HelpCircle className="h-5 w-5" />
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}
              >
                {badgeLabel}
              </span>
            </div>
            <div className="mt-3 line-clamp-2 font-semibold">{a.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">📝 {a.questionCount} Soal</div>
          </div>
          <div>
            {done && a.score != null ? (
              <div className="font-display text-sm font-bold text-primary">
                ✨ Nilai: {a.score}/100
              </div>
            ) : (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {a.learningObjectiveTitle ? `Capaian: ${a.learningObjectiveTitle}` : ""}
              </div>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-2xl overflow-y-auto">
        <KuisDetailContent assignment={a} />
      </DialogContent>
    </Dialog>
  );
}

function DragDropAnswer({
  question,
  answer,
  onSelect,
}: {
  question: StudentQuizQuestion;
  answer: Record<string, string>;
  onSelect: (dragId: string, targetId: string) => void;
}) {
  const [selectedDragId, setSelectedDragId] = useState<string | null>(null);
  const matchedTargetIds = new Set(Object.values(answer));

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {question.dragBlocks.map((b) => {
          const isMatched = !!answer[b.id];
          const isSelected = selectedDragId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedDragId(b.id)}
              className={cn(
                "w-full rounded-xl border p-2.5 text-left text-sm transition",
                isSelected && "border-primary bg-primary-soft/30",
                isMatched && !isSelected && "border-emerald-400 bg-emerald-50",
              )}
            >
              {b.text}
              {isMatched && (
                <span className="ml-1.5 text-xs text-emerald-600">
                  → {question.targetBlocks.find((t) => t.id === answer[b.id])?.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {question.targetBlocks.map((t) => {
          const isUsed = matchedTargetIds.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!selectedDragId}
              onClick={() => {
                if (selectedDragId) {
                  onSelect(selectedDragId, t.id);
                  setSelectedDragId(null);
                }
              }}
              className={cn(
                "w-full rounded-xl border p-2.5 text-left text-sm transition disabled:opacity-50",
                isUsed && "border-emerald-400 bg-emerald-50",
              )}
            >
              {t.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KuisDetailContent({ assignment: a }: { assignment: AssignmentContentRow }) {
  const [data, setData] = useState<StudentQuizData | null>(null);
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, "benar" | "salah">>({});
  const [ddAnswers, setDdAnswers] = useState<Record<string, Record<string, string>>>({});
  const [seqOrder, setSeqOrder] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const locked = a.status !== "graded" && a.quizStatus !== "aktif";

  useEffect(() => {
    if (locked) return;
    let cancelled = false;
    fetchQuizForStudent(a.id).then((result) => {
      if (cancelled || !result) return;
      setData(result);
      const initialSeq: Record<string, string[]> = {};
      for (const q of result.questions) {
        if (q.questionType === "sequence") initialSeq[q.id] = q.steps.map((s) => s.id);
      }
      setSeqOrder(initialSeq);
    });
    return () => {
      cancelled = true;
    };
  }, [a.id, locked]);

  function moveSeqStep(questionId: string, index: number, direction: "up" | "down") {
    setSeqOrder((prev) => {
      const order = prev[questionId] ? [...prev[questionId]] : [];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= order.length) return prev;
      [order[index], order[swapWith]] = [order[swapWith], order[index]];
      return { ...prev, [questionId]: order };
    });
  }

  function selectDragTarget(questionId: string, dragId: string, targetId: string) {
    setDdAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), [dragId]: targetId },
    }));
  }

  function handleSubmit() {
    if (!data) return;
    const payload = data.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: q.questionType === "multiple_choice" ? mcAnswers[q.id] : undefined,
      trueFalseAnswer: q.questionType === "true_false" ? tfAnswers[q.id] : undefined,
      dragDropAnswer: q.questionType === "drag_and_drop" ? ddAnswers[q.id] : undefined,
      sequenceAnswer: q.questionType === "sequence" ? seqOrder[q.id] : undefined,
    }));
    startTransition(async () => {
      const result = await submitQuizAnswers(a.id, payload);
      if (result.ok) {
        toast.success(result.message);
        setData((prev) =>
          prev ? { ...prev, alreadySubmitted: true, score: result.score ?? null } : prev,
        );
      } else {
        toast.error(result.message);
      }
    });
  }

  if (locked) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>{a.title}</DialogTitle>
        </DialogHeader>
        <div className="rounded-2xl bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {a.quizStatus === "nonaktif"
              ? "Kuis ini sedang dinonaktifkan oleh guru dan tidak bisa dikerjakan."
              : "Waktu pengerjaan kuis ini sudah berakhir."}
          </p>
        </div>
      </div>
    );
  }

  if (data?.alreadySubmitted) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>{a.title}</DialogTitle>
        </DialogHeader>
        <div className="rounded-2xl bg-primary-soft/40 p-6 text-center">
          <div className="text-3xl">🎉</div>
          <div className="mt-2 font-display text-2xl font-bold text-primary">
            ✨ Nilai: {data.score}/100
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Kuis ini sudah kamu selesaikan.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Memuat soal...</p>;
  }

  const allAnswered = data.questions.every((q) => {
    if (q.questionType === "multiple_choice") return !!mcAnswers[q.id];
    if (q.questionType === "true_false") return !!tfAnswers[q.id];
    if (q.questionType === "drag_and_drop") {
      const answered = ddAnswers[q.id] ?? {};
      return q.dragBlocks.every((b) => answered[b.id]);
    }
    if (q.questionType === "sequence") return (seqOrder[q.id]?.length ?? 0) === q.steps.length;
    return false;
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{a.title}</DialogTitle>
        <p className="text-xs text-muted-foreground">
          {data.questions.length} Soal
          {data.timerMinutes ? ` · ⏱ Estimasi: ${data.timerMinutes} Menit` : ""}
        </p>
      </DialogHeader>
      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border p-4">
            <div className="font-medium">
              {i + 1}. {q.questionText}
            </div>

            {q.questionType === "multiple_choice" && (
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition",
                      mcAnswers[q.id] === o.id && "border-primary bg-primary-soft/30",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={mcAnswers[q.id] === o.id}
                      onChange={() => setMcAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            )}

            {q.questionType === "true_false" && (
              <div className="mt-3 flex gap-2">
                {(["benar", "salah"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTfAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    className={cn(
                      "flex-1 rounded-xl border p-2.5 text-sm font-medium transition",
                      tfAnswers[q.id] === v
                        ? "border-primary bg-primary-soft/30 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {v === "benar" ? "Benar" : "Salah"}
                  </button>
                ))}
              </div>
            )}

            {q.questionType === "drag_and_drop" && (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ketuk satu blok kiri, lalu ketuk pasangannya di kanan.
                </p>
                <DragDropAnswer
                  question={q}
                  answer={ddAnswers[q.id] ?? {}}
                  onSelect={(dragId, targetId) => selectDragTarget(q.id, dragId, targetId)}
                />
              </div>
            )}

            {q.questionType === "sequence" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Urutkan langkah dengan tombol panah di bawah ini.
                </p>
                {(seqOrder[q.id] ?? []).map((stepId, idx) => {
                  const step = q.steps.find((s) => s.id === stepId);
                  if (!step) return null;
                  return (
                    <div
                      key={stepId}
                      className="flex items-center gap-2 rounded-xl border p-2.5 text-sm"
                    >
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft/50 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1">{step.text}</span>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSeqStep(q.id, idx, "up")}
                          className="grid h-7 w-7 place-items-center rounded-lg border disabled:opacity-30"
                          aria-label="Pindah ke atas"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === (seqOrder[q.id]?.length ?? 0) - 1}
                          onClick={() => moveSeqStep(q.id, idx, "down")}
                          className="grid h-7 w-7 place-items-center rounded-lg border disabled:opacity-30"
                          aria-label="Pindah ke bawah"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button
        className="w-full rounded-xl"
        disabled={!allAnswered || isPending}
        onClick={handleSubmit}
      >
        {isPending ? "Mengirim..." : "Kirim Jawaban"}
      </Button>
    </div>
  );
}
