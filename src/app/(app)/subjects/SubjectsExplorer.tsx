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
  type LucideIcon,
} from "lucide-react";
import type {
  AssignmentContentRow,
  MaterialContentRow,
  StudentQuizData,
} from "@/lib/data/subjects";
import {
  markMaterialViewed,
  submitAssignment,
  fetchQuizForStudent,
  submitQuizAnswers,
} from "./actions";
import { ExpandableCardList } from "./ExpandableCardList";

const KIND_ICON: Record<string, LucideIcon> = {
  pdf: FileText,
  video: Video,
  text: BookOpen,
  image: ImageIcon,
};
const KIND_LABEL: Record<string, string> = {
  pdf: "PDF",
  video: "YouTube",
  text: "Teks",
  image: "Gambar",
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
    return (
      <p className="whitespace-pre-line rounded-xl bg-muted/40 p-4 text-sm">
        {m.content || "Belum ada isi materi."}
      </p>
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
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  done ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {done ? "🟢 Selesai" : "🔴 Belum Mulai"}
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

function KuisDetailContent({ assignment: a }: { assignment: AssignmentContentRow }) {
  const [data, setData] = useState<StudentQuizData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchQuizForStudent(a.id).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [a.id]);

  function handleSubmit() {
    if (!data) return;
    const payload = data.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: q.questionType === "multiple_choice" ? answers[q.id] : undefined,
      shortAnswerText: q.questionType === "short_answer" ? answers[q.id] : undefined,
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

  if (!data) {
    return <p className="text-sm text-muted-foreground">Memuat soal...</p>;
  }

  if (data.alreadySubmitted) {
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

  const allAnswered = data.questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{a.title}</DialogTitle>
        <p className="text-xs text-muted-foreground">{data.questions.length} Soal</p>
      </DialogHeader>
      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border p-4">
            <div className="font-medium">
              {i + 1}. {q.questionText}
            </div>
            {q.questionType === "multiple_choice" ? (
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition ${
                      answers[q.id] === o.id ? "border-primary bg-primary-soft/30" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Jawabanmu..."
              />
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
